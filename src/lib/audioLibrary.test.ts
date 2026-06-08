import { describe, expect, it } from "vitest";
import { AudioFileRecord } from "./api";
import { filterAudioLibrary } from "./audioLibrary";

const audioFile = (overrides: Partial<AudioFileRecord>): AudioFileRecord => ({
  id: 1,
  name: "track.mp3",
  title: "Track",
  artist: "Artist",
  size: 100,
  s3_key: "track.mp3",
  url: "track.mp3",
  kind: "track",
  visibility: "shared",
  ...overrides,
});

const baseFilters = {
  search: "",
  kind: "all",
  genre: "all",
  artist: "all",
  ownership: "all",
  explicit: "all",
  duration: "all",
  sort: "artist",
};

describe("filterAudioLibrary", () => {
  it("searches station metadata and uploader names", () => {
    const result = filterAudioLibrary([
      audioFile({ id: 1, title: "Blue Hour", owner_name: "Night Selector" }),
      audioFile({ id: 2, title: "Morning Song", owner_name: "Day Host" }),
    ], { ...baseFilters, search: "night selector" });

    expect(result.map((item) => item.title)).toEqual(["Blue Hour"]);
  });

  it("combines ownership, genre, and duration filters", () => {
    const result = filterAudioLibrary([
      audioFile({ id: 1, genre: "Jazz", duration: 150, owned_by_current_user: true }),
      audioFile({ id: 2, genre: "Jazz", duration: 300, owned_by_current_user: true }),
      audioFile({ id: 3, genre: "Soul", duration: 150, owned_by_current_user: true }),
    ], { ...baseFilters, ownership: "mine", genre: "Jazz", duration: "short" });

    expect(result.map((item) => item.id)).toEqual([1]);
  });
});
