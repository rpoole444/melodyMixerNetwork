import { describe, expect, it } from "vitest";
import { formatFileSize, validateAudioFile } from "./audioValidation";

const audioFile = (overrides: Partial<File> = {}) =>
  ({
    name: "show.mp3",
    size: 10 * 1024 * 1024,
    type: "audio/mpeg",
    ...overrides,
  }) as File;

describe("validateAudioFile", () => {
  it("accepts supported browser audio MIME types", () => {
    expect(validateAudioFile(audioFile())).toBe("");
  });

  it("accepts supported extensions when the browser omits the MIME type", () => {
    expect(validateAudioFile(audioFile({ name: "show.FLAC", type: "" }))).toBe("");
  });

  it("rejects non-audio files", () => {
    expect(validateAudioFile(audioFile({ name: "lineup.pdf", type: "application/pdf" }))).toContain("Choose an MP3");
  });

  it("rejects files over 500 MB", () => {
    expect(validateAudioFile(audioFile({ size: 500 * 1024 * 1024 + 1 }))).toContain("over 500 MB");
  });
});

describe("formatFileSize", () => {
  it("formats small and large audio files clearly", () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(125 * 1024 * 1024)).toBe("125 MB");
  });
});
