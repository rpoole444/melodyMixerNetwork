const MAX_AUDIO_BYTES = 500 * 1024 * 1024;
const AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "m4a", "aac", "ogg", "oga", "webm", "mp4"];

export const validateAudioFile = (file: File) => {
  if (file.size > MAX_AUDIO_BYTES) return "That audio file is over 500 MB. Export a smaller file and try again.";

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!file.type.startsWith("audio/") && !AUDIO_EXTENSIONS.includes(extension)) {
    return "Choose an MP3, WAV, FLAC, M4A, AAC, OGG, or WebM audio file.";
  }

  return "";
};

export const formatFileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
