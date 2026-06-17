import {
  computeSpeechAmplitude,
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

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

export class SpeechRecorderSession {
  private callbacks: SpeechRecorderSessionCallbacks;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private startedAt: number | null = null;
  private elapsedTimer: number | null = null;
  private mediaSessionTimer: number | null = null;
  private healthTimer: number | null = null;
  private audioContext: AudioContext | null = null;
  private keepAliveAudio: HTMLAudioElement | null = null;
  private keepAliveOscillator: OscillatorNode | null = null;
  private rafId: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private waveformSamples: number[] = [];
  private state: SpeechRecorderSessionState = "idle";
  private userStopRequested = false;
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
    this.chunks = [];
    this.waveformSamples = [];
    this.setState("recording");

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // iOS Safari: set play-and-record AFTER getUserMedia so mic + background audio stay active.
      setAudioSessionType("play-and-record");
      await this.startKeepAlive(this.stream);

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
      this.callbacks.onElapsed?.(0);
      this.recorder.start(SPEECH_RECORDER_TIMESLICE_MS);
      this.startMeter(this.stream);
      this.startElapsedTimer();
      this.configureMediaSession();
      await this.requestWakeLock();
      this.attachLifecycleHandlers();
    } catch (error) {
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

  private async startKeepAlive(stream: MediaStream) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    const context = new AudioCtor();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
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

    await context.resume().catch(() => {});

    this.audioContext = context;
    this.keepAliveOscillator = oscillator;

    const audio = new Audio(SILENT_KEEPALIVE_AUDIO_URI);
    audio.loop = true;
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    await audio.play().catch(() => {});
    this.keepAliveAudio = audio;
  }

  private startMeter(stream: MediaStream) {
    if (!this.audioContext) {
      return;
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
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
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
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
      if (this.state !== "recording") {
        return;
      }
      void this.audioContext?.resume().catch(() => {});
      void this.keepAliveAudio?.play().catch(() => {});
      if (this.recorder && this.recorder.state === "inactive") {
        this.callbacks.onError?.("Recording paused when the device locked. Tap stop to save what was captured.");
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

  private async requestWakeLock() {
    const wakeLockApi = (navigator as WakeLockNavigator).wakeLock;
    if (!wakeLockApi) {
      return;
    }
    try {
      this.wakeLock = await wakeLockApi.request("screen");
      this.wakeLock.addEventListener("release", () => {
        this.wakeLock = null;
      });
    } catch {
      // Wake lock is best-effort; recording can continue when the user locks manually.
    }
  }

  private async releaseWakeLock() {
    await this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
  }

  private attachLifecycleHandlers() {
    this.visibilityHandler = () => {
      if (document.visibilityState === "visible" && this.state === "recording") {
        void this.audioContext?.resume().catch(() => {});
        void this.keepAliveAudio?.play().catch(() => {});
        void this.requestWakeLock();
        this.callbacks.onElapsed?.(this.getElapsedSeconds());
        return;
      }
      if (document.visibilityState === "hidden" && this.state === "recording") {
        void this.audioContext?.resume().catch(() => {});
        void this.keepAliveAudio?.play().catch(() => {});
      }
    };
    this.pageHideHandler = () => {
      if (this.state === "recording") {
        void this.audioContext?.resume().catch(() => {});
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
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
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
    await this.releaseWakeLock();

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
    const blob = new Blob(this.chunks, { type: mimeType });
    this.chunks = [];
    this.startedAt = null;

    await this.cleanup();
    this.setState("idle");

    if (blob.size > 0) {
      this.callbacks.onComplete?.({ blob, durationSeconds });
    } else if (!wasUserStop) {
      this.callbacks.onError?.("Recording stopped unexpectedly.");
    }
  }
}
