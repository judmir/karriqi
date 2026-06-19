import { describe, expect, it } from "vitest";

import {
  clampTrimRange,
  encodeAudioBufferToWavBlob,
  formatSpeechTimePrecise,
} from "@/lib/rehab/speech-audio-utils";

describe("formatSpeechTimePrecise", () => {
  it("formats minutes, seconds, and centiseconds", () => {
    expect(formatSpeechTimePrecise(0)).toBe("00:00,00");
    expect(formatSpeechTimePrecise(13.456)).toBe("00:13,45");
    expect(formatSpeechTimePrecise(75.2)).toBe("01:15,20");
  });
});

describe("clampTrimRange", () => {
  it("keeps at least a quarter-second selection", () => {
    expect(clampTrimRange(0, 13, 13)).toEqual({ start: 0, end: 13 });
    expect(clampTrimRange(12.9, 13, 13)).toEqual({
      start: 12.75,
      end: 13,
    });
  });
});

describe("encodeAudioBufferToWavBlob", () => {
  it("writes a wav header and pcm payload", () => {
    const buffer = {
      numberOfChannels: 1,
      sampleRate: 16_000,
      length: 4,
      getChannelData: () => Float32Array.from([0, 0.5, -0.5, 0.25]),
    } as AudioBuffer;

    const blob = encodeAudioBufferToWavBlob(buffer);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(44 + 4 * 2);
  });
});
