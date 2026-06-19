import { describe, expect, it } from "vitest";

import {
  computeSpeechAmplitude,
  fileExtensionForSpeechMime,
  formatSpeechDuration,
  pushWaveformSample,
  SPEECH_RECORDER_WAVEFORM_CAPACITY,
} from "@/lib/rehab/speech-recorder-utils";

describe("formatSpeechDuration", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatSpeechDuration(98)).toBe("1:38");
    expect(formatSpeechDuration(5)).toBe("0:05");
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
