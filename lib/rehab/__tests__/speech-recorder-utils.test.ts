import { describe, expect, it } from "vitest";

import {
  computeSpeechAmplitude,
  consolidateSpeechRecorderChunks,
  fileExtensionForSpeechMime,
  formatSpeechDuration,
  pushWaveformSample,
  speechRecordingDownloadFileName,
  SPEECH_RECORDER_WAVEFORM_CAPACITY,
} from "@/lib/rehab/speech-recorder-utils";

describe("formatSpeechDuration", () => {
  it("formats minutes and seconds for short clips", () => {
    expect(formatSpeechDuration(0)).toBe("0:00");
    expect(formatSpeechDuration(75)).toBe("1:15");
  });

  it("formats hours for long sessions", () => {
    expect(formatSpeechDuration(54 * 60 + 12)).toBe("54:12");
    expect(formatSpeechDuration(3_661)).toBe("1:01:01");
  });
});

describe("fileExtensionForSpeechMime", () => {
  it("maps common mime types", () => {
    expect(fileExtensionForSpeechMime("audio/wav")).toBe("wav");
    expect(fileExtensionForSpeechMime("audio/mp4")).toBe("m4a");
    expect(fileExtensionForSpeechMime("audio/ogg")).toBe("ogg");
    expect(fileExtensionForSpeechMime("audio/webm")).toBe("webm");
  });
});

describe("speechRecordingDownloadFileName", () => {
  it("always uses an mp4 extension", () => {
    expect(speechRecordingDownloadFileName("speech-2026-06-26-0955.webm")).toBe(
      "speech-2026-06-26-0955.mp4",
    );
    expect(speechRecordingDownloadFileName("recording.m4a")).toBe("recording.mp4");
  });
});

describe("consolidateSpeechRecorderChunks", () => {
  it("merges many small chunks into fewer blob parts", () => {
    const chunks = Array.from({ length: 120 }, (_, index) =>
      new Blob([`chunk-${index}`], { type: "audio/webm" }),
    );

    const consolidated = consolidateSpeechRecorderChunks(chunks, "audio/webm", 8);

    expect(consolidated.length).toBeLessThanOrEqual(8);
    const originalSize = new Blob(chunks, { type: "audio/webm" }).size;
    const consolidatedSize = new Blob(consolidated, { type: "audio/webm" }).size;
    expect(consolidatedSize).toBe(originalSize);
  });

  it("leaves small chunk lists unchanged", () => {
    const chunks = [new Blob(["a"], { type: "audio/webm" })];
    expect(consolidateSpeechRecorderChunks(chunks, "audio/webm")).toEqual(chunks);
  });
});

describe("computeSpeechAmplitude", () => {
  it("returns higher values for louder waveforms", () => {
    const quiet = new Uint8Array(128).fill(128);
    const loud = new Uint8Array(128);
    loud[0] = 255;
    loud[1] = 0;

    expect(computeSpeechAmplitude(quiet)).toBeLessThan(
      computeSpeechAmplitude(loud),
    );
  });
});

describe("pushWaveformSample", () => {
  it("caps history to the configured capacity", () => {
    let samples: number[] = [];
    for (let index = 0; index < SPEECH_RECORDER_WAVEFORM_CAPACITY + 5; index += 1) {
      samples = pushWaveformSample(samples, index / 100);
    }
    expect(samples).toHaveLength(SPEECH_RECORDER_WAVEFORM_CAPACITY);
    expect(samples.at(-1)).toBe((SPEECH_RECORDER_WAVEFORM_CAPACITY + 4) / 100);
  });
});
