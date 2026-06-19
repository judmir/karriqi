import {
  fileExtensionForSpeechMime,
  replaceSpeechRecordingExtension,
} from "@/lib/rehab/speech-recorder-utils";

export const SPEECH_WAVEFORM_BAR_COUNT = 120;
const MIN_TRIM_SECONDS = 0.25;

export type SpeechAudioMetadata = {
  durationSeconds: number;
  peaks: number[];
};

export function formatSpeechTimePrecise(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const centiseconds = Math.floor((safe % 1) * 100);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")},${centiseconds.toString().padStart(2, "0")}`;
}

export function clampTrimRange(
  start: number,
  end: number,
  durationSeconds: number,
): { start: number; end: number } {
  if (durationSeconds <= MIN_TRIM_SECONDS) {
    return { start: 0, end: durationSeconds };
  }

  let nextStart = Math.max(0, Math.min(start, durationSeconds - MIN_TRIM_SECONDS));
  let nextEnd = Math.max(nextStart + MIN_TRIM_SECONDS, Math.min(end, durationSeconds));

  if (nextEnd - nextStart < MIN_TRIM_SECONDS) {
    nextEnd = Math.min(durationSeconds, nextStart + MIN_TRIM_SECONDS);
    nextStart = Math.max(0, nextEnd - MIN_TRIM_SECONDS);
  }

  return { start: nextStart, end: nextEnd };
}

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ??
    null
  );
}

export async function decodeSpeechAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const AudioCtor = getAudioContextCtor();
  if (!AudioCtor) {
    throw new Error("Audio decoding is not supported in this browser.");
  }

  const context = new AudioCtor();
  try {
    return await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close().catch(() => {});
  }
}

export function peaksFromAudioBuffer(
  buffer: AudioBuffer,
  barCount = SPEECH_WAVEFORM_BAR_COUNT,
): number[] {
  const channelData = buffer.getChannelData(0);
  if (channelData.length === 0) {
    return Array.from({ length: barCount }, () => 0.08);
  }

  const samplesPerBar = Math.max(1, Math.floor(channelData.length / barCount));
  const peaks: number[] = [];

  for (let index = 0; index < barCount; index += 1) {
    const start = index * samplesPerBar;
    const end = Math.min(start + samplesPerBar, channelData.length);
    let peak = 0;
    for (let sample = start; sample < end; sample += 1) {
      peak = Math.max(peak, Math.abs(channelData[sample] ?? 0));
    }
    peaks.push(peak);
  }

  const max = Math.max(...peaks, 0.001);
  return peaks.map((value) => Math.min(1, value / max));
}

export async function loadSpeechAudioMetadata(
  blob: Blob,
  barCount = SPEECH_WAVEFORM_BAR_COUNT,
): Promise<SpeechAudioMetadata> {
  const buffer = await decodeSpeechAudioBlob(blob);
  return {
    durationSeconds: buffer.duration,
    peaks: peaksFromAudioBuffer(buffer, barCount),
  };
}

function sliceAudioBuffer(
  source: AudioBuffer,
  startSeconds: number,
  endSeconds: number,
): AudioBuffer {
  const AudioCtor = getAudioContextCtor();
  if (!AudioCtor) {
    throw new Error("Audio trimming is not supported in this browser.");
  }

  const startSample = Math.floor(startSeconds * source.sampleRate);
  const endSample = Math.floor(endSeconds * source.sampleRate);
  const length = Math.max(1, endSample - startSample);
  const trimmed = new AudioCtor({ sampleRate: source.sampleRate }).createBuffer(
    source.numberOfChannels,
    length,
    source.sampleRate,
  );

  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    const data = source.getChannelData(channel);
    trimmed.copyToChannel(data.subarray(startSample, endSample), channel);
  }

  return trimmed;
}

/** Fast PCM export — avoids MediaRecorder real-time re-encode during trim. */
export function encodeAudioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const sampleCount = buffer.length;
  const dataSize = sampleCount * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < sampleCount; index += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      const sample = buffer.getChannelData(channel)[index] ?? 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        offset,
        clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export async function trimSpeechAudioBlob(
  blob: Blob,
  startSeconds: number,
  endSeconds: number,
  decodedBuffer?: AudioBuffer,
): Promise<{ blob: Blob; durationSeconds: number; mimeType: string }> {
  const decoded = decodedBuffer ?? (await decodeSpeechAudioBlob(blob));
  const { start, end } = clampTrimRange(
    startSeconds,
    endSeconds,
    decoded.duration,
  );

  if (start <= 0.01 && end >= decoded.duration - 0.01) {
    return {
      blob,
      durationSeconds: decoded.duration,
      mimeType: blob.type || "audio/webm",
    };
  }

  const trimmedBuffer = sliceAudioBuffer(decoded, start, end);
  return {
    blob: encodeAudioBufferToWavBlob(trimmedBuffer),
    durationSeconds: trimmedBuffer.duration,
    mimeType: "audio/wav",
  };
}

export async function fetchSpeechAudioBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load recording.");
  }
  return response.blob();
}
