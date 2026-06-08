import { AudioFileRecord, TrackInput } from "@/lib/api";

export type LibraryFilters = {
  search: string;
  kind: string;
  genre: string;
  artist: string;
  ownership: string;
  explicit: string;
  duration: string;
  sort: string;
};

export const filterAudioLibrary = (audioFiles: AudioFileRecord[], filters: LibraryFilters) => {
  const search = filters.search.trim().toLowerCase();

  return audioFiles
    .filter((audioFile) => {
      if (filters.kind !== "all" && audioFile.kind !== filters.kind) return false;
      if (filters.genre !== "all" && (audioFile.genre || "Uncategorized") !== filters.genre) return false;
      if (filters.artist !== "all" && (audioFile.artist || "Unknown Artist") !== filters.artist) return false;
      if (filters.ownership === "mine" && !audioFile.owned_by_current_user) return false;
      if (filters.ownership === "station" && audioFile.owned_by_current_user) return false;
      if (filters.explicit === "clean" && audioFile.explicit) return false;
      if (filters.explicit === "explicit" && !audioFile.explicit) return false;
      if (filters.duration === "short" && (audioFile.duration || 0) >= 180) return false;
      if (filters.duration === "medium" && ((audioFile.duration || 0) < 180 || (audioFile.duration || 0) > 420)) return false;
      if (filters.duration === "long" && (audioFile.duration || 0) <= 420) return false;
      if (!search) return true;

      return [audioFile.title, audioFile.name, audioFile.artist, audioFile.album, audioFile.genre, audioFile.owner_name, audioFile.notes]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    })
    .sort((left, right) => {
      if (filters.sort === "newest") return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
      if (filters.sort === "duration") return (left.duration || 0) - (right.duration || 0);
      if (filters.sort === "title") return (left.title || left.name).localeCompare(right.title || right.name);

      const artistCompare = (left.artist || "").localeCompare(right.artist || "");
      return artistCompare || (left.title || left.name).localeCompare(right.title || right.name);
    });
};

export const audioFileToTrack = (audioFile: AudioFileRecord): TrackInput => ({
  id: crypto.randomUUID(),
  audioFileId: audioFile.id,
  title: audioFile.title || audioFile.name,
  artist: audioFile.artist || "Unknown Artist",
  album: audioFile.album || "Single",
  length: audioFile.duration && audioFile.duration > 0 ? String(Math.round(audioFile.duration)) : "",
  details: audioFile.notes,
  fileName: audioFile.name,
  fileUrl: audioFile.url,
  kind: "upload",
});

export const formatAudioDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return "Length needed";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};
