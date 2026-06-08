import { PlaylistRecord } from "@/lib/api";

export type ShowPlayoutItem = {
  id: string;
  position: number;
  title: string;
  artist?: string;
  audioUrl: string;
  durationSeconds: number;
  startOffsetSeconds: number;
  endOffsetSeconds: number;
};

export const buildShowPlayout = (show: PlaylistRecord): ShowPlayoutItem[] => {
  if (show.full_show_audio_file?.url) {
    const durationSeconds = show.full_show_audio_file.duration || 0;
    return [{
      id: `full-show-${show.full_show_audio_file.id}`,
      position: 1,
      title: show.name,
      artist: show.host_name,
      audioUrl: show.full_show_audio_file.url,
      durationSeconds,
      startOffsetSeconds: 0,
      endOffsetSeconds: durationSeconds,
    }];
  }

  let elapsedSeconds = 0;

  return [...show.songs]
    .sort((left, right) => left.position - right.position)
    .flatMap((song) => {
      const audioUrl = song.audio_file?.url || song.file_url;
      if (!audioUrl) return [];

      const durationSeconds = song.duration || song.audio_file?.duration || 0;
      const item = {
        id: `song-${song.id}`,
        position: song.position,
        title: song.name,
        artist: song.artist,
        audioUrl,
        durationSeconds,
        startOffsetSeconds: elapsedSeconds,
        endOffsetSeconds: elapsedSeconds + durationSeconds,
      };
      elapsedSeconds = item.endOffsetSeconds;
      return [item];
    });
};
