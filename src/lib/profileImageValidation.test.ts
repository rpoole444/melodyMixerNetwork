import { describe, expect, it } from "vitest";
import { MAX_PROFILE_IMAGE_SIZE, validateProfileImage } from "./profileImageValidation";

const imageFile = (overrides: Partial<File> = {}) =>
  ({
    name: "profile.jpg",
    size: 2 * 1024 * 1024,
    type: "image/jpeg",
    ...overrides,
  }) as File;

describe("validateProfileImage", () => {
  it("accepts JPG, PNG, and WebP images", () => {
    expect(validateProfileImage(imageFile())).toBe("");
    expect(validateProfileImage(imageFile({ type: "image/png" }))).toBe("");
    expect(validateProfileImage(imageFile({ type: "image/webp" }))).toBe("");
  });

  it("rejects unsupported file types", () => {
    expect(validateProfileImage(imageFile({ type: "image/gif" }))).toContain("JPG, PNG, or WebP");
  });

  it("rejects images over 10 MB", () => {
    expect(validateProfileImage(imageFile({ size: MAX_PROFILE_IMAGE_SIZE + 1 }))).toContain("smaller than 10 MB");
  });
});
