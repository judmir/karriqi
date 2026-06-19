export const SPEECH_RECORDER_TIMESLICE_MS = 1_000;
export const SPEECH_RECORDER_WAVEFORM_CAPACITY = 48;

/** Minimal silent WAV (~100 ms) to keep iOS audio session active in the background. */
export const SILENT_KEEPALIVE_AUDIO_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export function preferredSpeechMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

export function fileExtensionForSpeechMime(mimeType: string): string {
  if (mimeType.includes("wav")) {
    return "wav";
  }
  if (mimeType.includes("mp4")) {
    return "m4a";
  }
  if (mimeType.includes("ogg")) {
    return "ogg";
  }
  return "webm";
}

export function replaceSpeechRecordingExtension(
  path: string,
  mimeType: string,
): string {
  const extension = fileExtensionForSpeechMime(mimeType);
  return path.replace(/\.[^./]+$/, `.${extension}`);
}

export function formatSpeechDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function computeSpeechAmplitude(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const value = (data[i] - 128) / 128;
    sum += value * value;
  }
  const rms = Math.sqrt(sum / data.length);
  return Math.min(1, rms * 2.6);
}

export function pushWaveformSample(
  samples: number[],
  value: number,
  capacity = SPEECH_RECORDER_WAVEFORM_CAPACITY,
): number[] {
  const next = [...samples, value];
  if (next.length <= capacity) {
    return next;
  }
  return next.slice(next.length - capacity);
}

type AudioSessionNavigator = Navigator & {
  audioSession?: {
    type: string;
  };
};

export function setAudioSessionType(type: string): void {
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session) {
    session.type = type;
  }
}

export function resetAudioSessionType(): void {
  setAudioSessionType("playback");
  setAudioSessionType("auto");
}
