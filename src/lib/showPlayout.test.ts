import { describe, expect, it } from "vitest";
import { PlaylistRecord } from "./api";
import { buildShowPlayout } from "./showPlayout";

const show = (overrides: Partial<PlaylistRecord> = {}): PlaylistRecord => ({
  id: 1,
  user_id: 1,
  name: "Late Night Set",
  description: "",
  host_name: "DJ Test",
  status: "submitted",
  delivery_status: "not_sent",
  songs: [],
  ...overrides,
});

describe("buildShowPlayout", () => {
  it("sorts lineup items and calculates continuous timeline offsets", () => {
    const result = buildShowPlayout(show({
      songs: [
        { id: 2, name: "Song", artist: "Band", album: "Record", duration: 180, position: 2, file_url: "song.mp3" },
        { id: 1, name: "Intro", artist: "Host", album: "Break", duration: 30, position: 1, file_url: "intro.mp3" },
      ],
    }));

    expect(result.map((item) => item.title)).toEqual(["Intro", "Song"]);
    expect(result.map((item) => [item.startOffsetSeconds, item.endOffsetSeconds])).toEqual([[0, 30], [30, 210]]);
  });

  it("uses one item for an uploaded full show", () => {
    const result = buildShowPlayout(show({
      full_show_audio_file: { id: 9, name: "master.mp3", url: "master.mp3", duration: 3600 },
    }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: "Late Night Set", startOffsetSeconds: 0, endOffsetSeconds: 3600 });
  });
});
