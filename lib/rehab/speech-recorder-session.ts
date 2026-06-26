import {
  computeSpeechAmplitude,
  consolidateSpeechRecorderChunks,
  preferredSpeechMimeType,
  pushWaveformSample,
  resetAudioSessionType,
  setAudioSessionType,
  SILENT_KEEPALIVE_AUDIO_URI,
  SPEECH_RECORDER_TIMESLICE_MS,
  SPEECH_RECORDER_WAVEFORM_CAPACITY,
} from "@/lib/rehab/speech-recorder-utils";

export type SpeechRecorderSessionState = "idle" | "recording" | "stopping";

export type SpeechRecorderSessionCallbacks = {
  onStateChange?: (state: SpeechRecorderSessionState) => void;
  onElapsed?: (seconds: number) => void;
  onAmplitude?: (value: number) => void;
  onWaveform?: (samples: number[]) => void;
  onComplete?: (result: { blob: Blob; durationSeconds: number }) => void;
  onError?: (message: string) => void;
};

const METER_INTERVAL_MS = 50;
const RECORDER_HEALTH_GRACE_MS = 3_000;
const CHUNK_CONSOLIDATE_INTERVAL_MS = 60_000;

export class SpeechRecorderSession {
  private callbacks: SpeechRecorderSessionCallbacks;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private startedAt: number | null = null;
  private elapsedTimer: number | null = null;
  private mediaSessionTimer: number | null = null;
  private healthTimer: number | null = null;
  private consolidateTimer: number | null = null;
  private meterTimer: number | null = null;
  private audioContext: AudioContext | null = null;
  private meterAnalyser: AnalyserNode | null = null;
  private keepAliveAudio: HTMLAudioElement | null = null;
  private keepAliveOscillator: OscillatorNode | null = null;
  private waveformSamples: number[] = [];
  private state: SpeechRecorderSessionState = "idle";
  private userStopRequested = false;
  private pendingStart = false;
  private visibilityHandler: (() => void) | null = null;
  private pageHideHandler: (() => void) | null = null;

  constructor(callbacks: SpeechRecorderSessionCallbacks = {}) {
    this.callbacks = callbacks;
  }

  getState(): SpeechRecorderSessionState {
    return this.state;
  }

  getElapsedSeconds(): number {
    if (this.startedAt === null) {
      return 0;
    }
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  getWaveformSamples(): number[] {
    return this.waveformSamples;
  }

  async start(): Promise<void> {
    if (this.state !== "idle") {
      return;
    }

    this.userStopRequested = false;
    this.pendingStart = true;
    this.chunks = [];
    this.waveformSamples = [];

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (!this.pendingStart) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
        return;
      }

      // iOS Safari: set play-and-record AFTER getUserMedia so mic + background audio stay active.
      setAudioSessionType("play-and-record");
      // Meter pipeline is sync; never await HTMLMediaElement.play() here — after
      // getUserMedia the user-gesture chain is broken and Safari can hang forever.
      this.initAudioMeter(this.stream);

      const mimeType = preferredSpeechMimeType();
      this.recorder = new MediaRecorder(
        this.stream,
        mimeType ? { mimeType } : undefined,
      );

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.recorder.onstop = () => {
        void this.handleRecorderStop();
      };

      this.recorder.onerror = () => {
        this.callbacks.onError?.("Recording was interrupted.");
      };

      this.startedAt = Date.now();
      this.setState("recording");
      this.callbacks.onElapsed?.(0);
      this.recorder.start(SPEECH_RECORDER_TIMESLICE_MS);
      this.startMeter();
      this.startElapsedTimer();
      this.startChunkConsolidation();
      this.configureMediaSession();
      this.attachLifecycleHandlers();
      void this.activateKeepAliveAudio();
      void this.resumeAudioPipeline();
      this.pendingStart = false;
    } catch (error) {
      this.pendingStart = false;
      await this.cleanup();
      this.setState("idle");
      const message =
        error instanceof Error
          ? error.message
          : "Microphone access was not available.";
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  stop(): void {
    if (this.state !== "recording" || !this.recorder) {
      return;
    }
    this.userStopRequested = true;
    this.setState("stopping");
    if (this.recorder.state === "recording") {
      this.recorder.stop();
    }
  }

  cancelPendingStart(): void {
    this.pendingStart = false;
  }

  async dispose(): Promise<void> {
    this.userStopRequested = true;
    if (this.recorder?.state === "recording") {
      this.recorder.stop();
    }
    await this.cleanup();
    this.setState("idle");
  }

  private setState(next: SpeechRecorderSessionState) {
    this.state = next;
    this.callbacks.onStateChange?.(next);
  }

  /** Waveform meter + silent oscillator — must not await play/resume (Safari hang). */
  private initAudioMeter(stream: MediaStream) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    const context = new AudioCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const source = context.createMediaStreamSource(stream);
    const silentGain = context.createGain();
    silentGain.gain.value = 0.0001;
    source.connect(analyser);
    source.connect(silentGain);
    silentGain.connect(context.destination);

    const oscillator = context.createOscillator();
    const oscillatorGain = context.createGain();
    oscillatorGain.gain.value = 0.0001;
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(context.destination);
    oscillator.start();

    void context.resume().catch(() => {});

    this.audioContext = context;
    this.meterAnalyser = analyser;
    this.keepAliveOscillator = oscillator;
  }

  /** iOS background keep-alive — fire-and-forget; must not block MediaRecorder.start. */
  private activateKeepAliveAudio() {
    if (this.keepAliveAudio) {
      return;
    }

    const audio = new Audio(SILENT_KEEPALIVE_AUDIO_URI);
    audio.loop = true;
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    this.keepAliveAudio = audio;
    void audio.play().catch(() => {});
  }

  private startMeter() {
    if (!this.meterAnalyser) {
      return;
    }

    const analyser = this.meterAnalyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    this.meterTimer = window.setInterval(() => {
      if (this.state !== "recording") {
        return;
      }
      analyser.getByteTimeDomainData(data);
      const amplitude = computeSpeechAmplitude(data);
      this.callbacks.onAmplitude?.(amplitude);
      this.waveformSamples = pushWaveformSample(
        this.waveformSamples,
        Math.max(0.08, amplitude),
        SPEECH_RECORDER_WAVEFORM_CAPACITY,
      );
      this.callbacks.onWaveform?.(this.waveformSamples);
    }, METER_INTERVAL_MS);
  }

  private startChunkConsolidation() {
    this.clearChunkConsolidationTimer();
    this.consolidateTimer = window.setInterval(() => {
      if (this.state !== "recording" || this.chunks.length < 120) {
        return;
      }
      const mimeType =
        this.recorder?.mimeType || preferredSpeechMimeType() || "audio/webm";
      this.chunks = consolidateSpeechRecorderChunks(this.chunks, mimeType);
    }, CHUNK_CONSOLIDATE_INTERVAL_MS);
  }

  private clearChunkConsolidationTimer() {
    if (this.consolidateTimer !== null) {
      window.clearInterval(this.consolidateTimer);
      this.consolidateTimer = null;
    }
  }

  private startElapsedTimer() {
    this.clearElapsedTimer();
    this.elapsedTimer = window.setInterval(() => {
      if (this.startedAt === null || this.state !== "recording") {
        return;
      }
      const elapsed = this.getElapsedSeconds();
      this.callbacks.onElapsed?.(elapsed);
      this.updateMediaSessionPosition(elapsed);
    }, 250);

    this.healthTimer = window.setInterval(() => {
      if (this.state !== "recording" || this.startedAt === null) {
        return;
      }
      void this.resumeAudioPipeline();
      const recordingAgeMs = Date.now() - this.startedAt;
      if (
        recordingAgeMs >= RECORDER_HEALTH_GRACE_MS &&
        this.recorder &&
        this.recorder.state === "inactive"
      ) {
        this.callbacks.onError?.(
          "Recording paused when the device locked. Tap stop to save what was captured.",
        );
        this.userStopRequested = true;
        void this.handleRecorderStop();
      }
    }, 2_000);
  }

  private clearElapsedTimer() {
    if (this.elapsedTimer !== null) {
      window.clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
    if (this.healthTimer !== null) {
      window.clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    this.clearChunkConsolidationTimer();
  }

  private configureMediaSession() {
    if (!("mediaSession" in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Voice recording",
      artist: "Karriqi",
      artwork: [
        {
          src: "/icons/karriqi-pwa-logo-192.png",
          sizes: "192x192",
          type: "image/png",
        },
      ],
    });
    navigator.mediaSession.playbackState = "playing";
    navigator.mediaSession.setActionHandler("stop", () => {
      this.stop();
    });
    this.updateMediaSessionPosition(0);

    this.mediaSessionTimer = window.setInterval(() => {
      if (this.state !== "recording") {
        return;
      }
      this.updateMediaSessionPosition(this.getElapsedSeconds());
    }, 1_000);
  }

  private updateMediaSessionPosition(elapsed: number) {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) {
      return;
    }
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(elapsed + 60, 60),
        playbackRate: 1,
        position: elapsed,
      });
    } catch {
      // Some browsers reject position updates while recording.
    }
  }

  private clearMediaSession() {
    if (this.mediaSessionTimer !== null) {
      window.clearInterval(this.mediaSessionTimer);
      this.mediaSessionTimer = null;
    }
    if (!("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.setActionHandler("stop", null);
    navigator.mediaSession.playbackState = "none";
    navigator.mediaSession.metadata = null;
  }

  private async resumeAudioPipeline() {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume().catch(() => {});
    }
    if (this.keepAliveAudio?.paused) {
      await this.keepAliveAudio.play().catch(() => {});
    }
  }

  private attachLifecycleHandlers() {
    this.visibilityHandler = () => {
      if (this.state !== "recording") {
        return;
      }
      void this.resumeAudioPipeline();
      if (document.visibilityState === "visible") {
        this.callbacks.onElapsed?.(this.getElapsedSeconds());
      }
    };
    this.pageHideHandler = () => {
      if (this.state === "recording") {
        void this.resumeAudioPipeline();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("pagehide", this.pageHideHandler);
  }

  private detachLifecycleHandlers() {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.pageHideHandler) {
      window.removeEventListener("pagehide", this.pageHideHandler);
      this.pageHideHandler = null;
    }
  }

  private stopMeter() {
    if (this.meterTimer !== null) {
      window.clearInterval(this.meterTimer);
      this.meterTimer = null;
    }
    this.meterAnalyser = null;
    this.callbacks.onAmplitude?.(0);
  }

  private stopStreamTracks() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private async cleanup() {
    this.clearElapsedTimer();
    this.stopMeter();
    this.detachLifecycleHandlers();
    this.clearMediaSession();

    if (this.keepAliveOscillator) {
      try {
        this.keepAliveOscillator.stop();
      } catch {
        // Already stopped.
      }
      this.keepAliveOscillator.disconnect();
      this.keepAliveOscillator = null;
    }

    if (this.keepAliveAudio) {
      this.keepAliveAudio.pause();
      this.keepAliveAudio.src = "";
      this.keepAliveAudio = null;
    }

    if (this.audioContext) {
      await this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.stopStreamTracks();
    resetAudioSessionType();
    this.recorder = null;
  }

  private async handleRecorderStop() {
    const wasUserStop = this.userStopRequested;
    const mimeType =
      this.recorder?.mimeType || preferredSpeechMimeType() || "audio/webm";
    const durationSeconds =
      this.startedAt === null
        ? 0
        : Math.max(0, (Date.now() - this.startedAt) / 1000);
    this.chunks = consolidateSpeechRecorderChunks(this.chunks, mimeType);
    const blob = new Blob(this.chunks, { type: mimeType });
    this.chunks = [];
    this.startedAt = null;

    await this.cleanup();
    this.setState("idle");

    if (blob.size > 0) {
      this.callbacks.onComplete?.({ blob, durationSeconds });
    } else if (!wasUserStop) {
      this.callbacks.onError?.("Recording stopped unexpectedly.");
    } else {
      this.callbacks.onError?.(
        "No audio was captured. Try again with the screen awake, or record shorter sessions.",
      );
    }
  }
}
