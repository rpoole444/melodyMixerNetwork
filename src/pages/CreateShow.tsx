"use client";

import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { api, AudioFileRecord, PlaylistRecord, ShowInput, TrackInput } from "@/lib/api";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DraftTrack = Omit<TrackInput, "id" | "kind"> & {
  album: string;
};

const emptyTrack: DraftTrack = {
  title: "",
  artist: "",
  album: "",
  length: "",
  details: "",
  fileName: "",
  fileUrl: "",
};

const libraryKindLabels: Record<string, string> = {
  track: "Tracks",
  host_break: "Host Breaks",
  full_show: "Full Shows",
};

const audioAccept = "audio/*,.mp3,.m4a,.wav,.aiff,.aif,.flac,.ogg,.webm";

const secondsToInput = (seconds?: number) => (seconds && seconds > 0 ? String(Math.round(seconds)) : "");

const inferMetadataFromFilename = (fileName: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[_]+/g, " ").trim();
  const [artist, ...titleParts] = baseName.split(/\s+-\s+/);

  if (titleParts.length > 0) {
    return {
      title: titleParts.join(" - ").trim(),
      artist: artist.trim(),
    };
  }

  return { title: baseName, artist: "" };
};

const readAudioDuration = (file: File) => {
  return new Promise<number | undefined>((resolve) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);

    audio.preload = "metadata";
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : undefined);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(undefined);
    };
  });
};

const CreateShow = () => {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullShowInputRef = useRef<HTMLInputElement>(null);
  const audioChunks = useRef<Blob[]>([]);

  const [editingShowId, setEditingShowId] = useState<number | null>(null);
  const [existingFullShowName, setExistingFullShowName] = useState("");
  const [tracks, setTracks] = useState<TrackInput[]>([]);
  const [libraryTracks, setLibraryTracks] = useState<AudioFileRecord[]>([]);
  const [draftTrack, setDraftTrack] = useState<DraftTrack>(emptyTrack);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [fullShowFile, setFullShowFile] = useState<File | null>(null);
  const [showTitle, setShowTitle] = useState("");
  const [showDescription, setShowDescription] = useState("");
  const [status, setStatus] = useState<ShowInput["status"]>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("");
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  const [isSavingShow, setIsSavingShow] = useState(false);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [libraryStatus, setLibraryStatus] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryKind, setLibraryKind] = useState("all");
  const [libraryVisibility, setLibraryVisibility] = useState("all");
  const [editingAudioId, setEditingAudioId] = useState<number | null>(null);
  const [audioMetadataDrafts, setAudioMetadataDrafts] = useState<Record<number, DraftTrack & { genre: string }>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioURL, setRecordedAudioURL] = useState("");

  useEffect(() => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    setRecordedAudioURL(url);

    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  useEffect(() => {
    loadLibraryTracks();
  }, []);

  const totalTracks = tracks.length;
  const readyTracks = tracks.filter((track) => track.title && track.artist).length;
  const hostName = user?.hostName || "";

  const showPayload: ShowInput = useMemo(
    () => ({
      title: showTitle,
      description: showDescription,
      hostName,
      status,
      scheduledAt,
      fullShowFile,
      tracks,
    }),
    [showTitle, showDescription, hostName, status, scheduledAt, fullShowFile, tracks],
  );

  const backendPreview = useMemo(
    () => ({
      playlist: {
        name: showTitle,
        description: showDescription,
        host_name: hostName,
        status,
        scheduled_at: scheduledAt,
        full_show_file: fullShowFile?.name,
        songs: tracks.map((track) => ({
          name: track.title,
          artist: track.artist,
          album: track.album || track.details || "Single",
          duration: track.length || "0",
          file_url: track.fileUrl,
          file_name: track.fileName,
          audio_file_id: track.audioFileId,
        })),
      },
    }),
    [showTitle, showDescription, hostName, status, scheduledAt, fullShowFile, tracks],
  );

  const filteredLibraryTracks = useMemo(() => {
    const search = librarySearch.trim().toLowerCase();

    return libraryTracks
      .filter((audioFile) => {
        if (libraryKind !== "all" && audioFile.kind !== libraryKind) return false;
        if (libraryVisibility !== "all" && audioFile.visibility !== libraryVisibility) return false;
        if (!search) return true;

        return [audioFile.title, audioFile.name, audioFile.artist, audioFile.album, audioFile.genre]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search));
      })
      .sort((a, b) => {
        const artistCompare = (a.artist || "").localeCompare(b.artist || "");
        if (artistCompare !== 0) return artistCompare;
        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      });
  }, [libraryTracks, libraryKind, librarySearch, libraryVisibility]);

  const groupedLibraryTracks = useMemo(() => {
    return filteredLibraryTracks.reduce<Record<string, AudioFileRecord[]>>((groups, audioFile) => {
      const key = libraryKindLabels[audioFile.kind] || "Other Audio";
      groups[key] ||= [];
      groups[key].push(audioFile);
      return groups;
    }, {});
  }, [filteredLibraryTracks]);

  const loadLibraryTracks = async () => {
    setLibraryStatus("Loading station library...");

    try {
      const audioFiles = await api.listAudioFiles();
      setLibraryTracks(audioFiles);
      setLibraryStatus("");
    } catch (error) {
      setLibraryStatus(
        error instanceof Error && error.message === "Not Authorized"
          ? "Sign in with a real Rails account, not demo mode, to browse and upload station library audio."
          : "The Rails backend is not reachable. Make sure it is running on port 3001.",
      );
    }
  };

  const hydrateShow = useCallback((show: PlaylistRecord) => {
    setEditingShowId(show.id);
    setShowTitle(show.name || "");
    setShowDescription(show.description || "");
    setStatus(["draft", "submitted", "ready", "scheduled"].includes(show.status) ? (show.status as ShowInput["status"]) : "draft");
    setScheduledAt(show.scheduled_at ? show.scheduled_at.slice(0, 16) : "");
    setFullShowFile(null);
    setExistingFullShowName(show.full_show_audio_file?.name || "");
    setTracks(
      [...show.songs]
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((song) => ({
          id: String(song.id || crypto.randomUUID()),
          audioFileId: song.audio_file_id,
          title: song.name || "",
          artist: song.artist || "",
          album: song.album || "",
          length: song.duration ? String(song.duration) : secondsToInput(song.audio_file?.duration),
          fileName: song.file_name || song.audio_file?.name,
          fileUrl: song.audio_file?.url || song.file_url,
          kind: song.audio_file_id ? "upload" : "metadata",
        })),
    );
  }, []);

  const loadShowDraft = useCallback(
    async (showId: number) => {
      setMessage("Loading saved show draft...");

      try {
        const show = await api.getShow(showId);
        hydrateShow(show);
        setMessage(show.status === "draft" ? "Draft loaded. Make your changes, then save again." : "Show loaded. Submitted shows can be reviewed here, but changes should stay in draft flow.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load this show.");
      }
    },
    [hydrateShow],
  );

  useEffect(() => {
    if (!router.isReady) return;

    const showId = Number(router.query.showId);
    if (!showId || showId === editingShowId) return;

    loadShowDraft(showId);
  }, [router.isReady, router.query.showId, editingShowId, loadShowDraft]);

  const handleDraftChange = (field: keyof DraftTrack, value: string) => {
    setDraftTrack((current) => ({ ...current, [field]: value }));
  };

  const openTrackPicker = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const openFullShowPicker = () => {
    if (fullShowInputRef.current) fullShowInputRef.current.value = "";
    fullShowInputRef.current?.click();
  };

  const handleFileChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setTrackFile(file);
    const inferred = inferMetadataFromFilename(file.name);
    const duration = await readAudioDuration(file);

    setDraftTrack((current) => ({
      ...current,
      title: current.title || inferred.title,
      artist: current.artist || inferred.artist,
      length: current.length || secondsToInput(duration),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    }));
  };

  const handleFullShowFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setFullShowFile(file);
    setExistingFullShowName("");
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    audioChunks.current = [];
    recorder.start();
    setIsRecording(true);

    recorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    };
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
  };

  const addTrack = async () => {
    if (!draftTrack.title.trim() || !draftTrack.artist.trim()) {
      setMessage("Track title and artist are required.");
      return;
    }

    const kind: TrackInput["kind"] = audioBlob ? "recording" : trackFile ? "upload" : "metadata";
    let audioFile: AudioFileRecord | null = null;
    let fileUrl = recordedAudioURL || draftTrack.fileUrl;
    let fileName = draftTrack.fileName || (audioBlob ? `${draftTrack.title}.webm` : undefined);

    if (trackFile || audioBlob) {
      setIsUploadingTrack(true);
      setMessage("Uploading audio to Rails...");

      try {
        const uploadFile = trackFile || new File([audioBlob as Blob], `${draftTrack.title || "host-break"}.webm`, { type: "audio/webm" });
        const duration = Number(draftTrack.length) || (await readAudioDuration(uploadFile)) || undefined;
        audioFile = await api.uploadAudioFile({
          title: draftTrack.title,
          artist: draftTrack.artist,
          album: draftTrack.album,
          duration,
          notes: draftTrack.details,
          kind: audioBlob ? "host_break" : "track",
          visibility: "private",
          file: uploadFile,
        });
        fileUrl = audioFile.url;
        fileName = audioFile.name;
        if (!draftTrack.length && audioFile.duration) {
          setDraftTrack((current) => ({ ...current, length: secondsToInput(audioFile?.duration) }));
        }
        setLibraryTracks((current) => [audioFile as AudioFileRecord, ...current]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Audio upload failed.");
        setIsUploadingTrack(false);
        return;
      } finally {
        setIsUploadingTrack(false);
      }
    }

    setTracks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        audioFileId: audioFile?.id,
        title: draftTrack.title,
        artist: draftTrack.artist,
        album: draftTrack.album,
        length: draftTrack.length || secondsToInput(audioFile?.duration),
        details: draftTrack.details,
        fileName,
        fileUrl,
        kind,
      },
    ]);
    setDraftTrack(emptyTrack);
    setTrackFile(null);
    setAudioBlob(null);
    setRecordedAudioURL("");
    setMessage("");
  };

  const addLibraryTrack = (audioFile: AudioFileRecord) => {
    setTracks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        audioFileId: audioFile.id,
        title: audioFile.title || audioFile.name,
        artist: audioFile.artist || "Unknown Artist",
        album: audioFile.album || "Single",
        length: secondsToInput(audioFile.duration),
        details: audioFile.notes,
        fileName: audioFile.name,
        fileUrl: audioFile.url,
        kind: "upload",
      },
    ]);
  };

  const removeTrack = (id: string) => {
    setTracks((current) => current.filter((track) => track.id !== id));
  };

  const moveTrack = (id: string, direction: "up" | "down") => {
    setTracks((current) => {
      const index = current.findIndex((track) => track.id === id);
      if (index === -1) return current;

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const nextTracks = [...current];
      [nextTracks[index], nextTracks[nextIndex]] = [nextTracks[nextIndex], nextTracks[index]];
      return nextTracks;
    });
  };

  const updateLineupTrack = (id: string, updates: Partial<TrackInput>) => {
    setTracks((current) => current.map((track) => (track.id === id ? { ...track, ...updates } : track)));
  };

  const startAudioMetadataEdit = (audioFile: AudioFileRecord) => {
    setEditingAudioId(audioFile.id);
    setAudioMetadataDrafts((current) => ({
      ...current,
      [audioFile.id]: {
        title: audioFile.title || audioFile.name,
        artist: audioFile.artist || "",
        album: audioFile.album || "",
        length: secondsToInput(audioFile.duration),
        details: audioFile.notes || "",
        genre: audioFile.genre || "",
        fileName: audioFile.name,
        fileUrl: audioFile.url,
      },
    }));
  };

  const updateAudioMetadataDraft = (audioFileId: number, field: keyof (DraftTrack & { genre: string }), value: string) => {
    setAudioMetadataDrafts((current) => ({
      ...current,
      [audioFileId]: {
        ...(current[audioFileId] || { ...emptyTrack, genre: "" }),
        [field]: value,
      },
    }));
  };

  const saveAudioMetadata = async (audioFileId: number) => {
    const draft = audioMetadataDrafts[audioFileId];
    if (!draft) return;

    setMessage("Updating track metadata...");

    try {
      const updatedAudioFile = await api.updateAudioFileMetadata(audioFileId, {
        title: draft.title,
        artist: draft.artist,
        album: draft.album,
        genre: draft.genre,
        duration: Number(draft.length) || 0,
        notes: draft.details,
      });

      setLibraryTracks((current) => current.map((audioFile) => (audioFile.id === audioFileId ? updatedAudioFile : audioFile)));
      setTracks((current) =>
        current.map((track) =>
          track.audioFileId === audioFileId
            ? {
                ...track,
                title: updatedAudioFile.title || track.title,
                artist: updatedAudioFile.artist || track.artist,
                album: updatedAudioFile.album || track.album,
                length: secondsToInput(updatedAudioFile.duration) || track.length,
                details: updatedAudioFile.notes || track.details,
              }
            : track,
        ),
      );
      setEditingAudioId(null);
      setMessage("Track metadata updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update track metadata.");
    }
  };

  const saveLineupTrackToLibrary = async (track: TrackInput) => {
    if (!track.audioFileId) return;

    setMessage("Updating library metadata from lineup...");

    try {
      const updatedAudioFile = await api.updateAudioFileMetadata(track.audioFileId, {
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: Number(track.length) || 0,
        notes: track.details,
      });

      setLibraryTracks((current) => current.map((audioFile) => (audioFile.id === track.audioFileId ? updatedAudioFile : audioFile)));
      setMessage("Library metadata updated from lineup.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update library metadata.");
    }
  };

  const saveShow = async (nextStatus: ShowInput["status"] = "draft") => {
    if (!showTitle.trim()) {
      setMessage("Show title is required.");
      return;
    }

    if (tracks.length === 0 && !fullShowFile && !existingFullShowName) {
      setMessage("Add at least one track, voice segment, or full-show upload before saving.");
      return;
    }

    setIsSavingShow(true);
    const isEditing = Boolean(editingShowId);
    setMessage(nextStatus === "submitted" ? "Submitting show to Rails..." : isEditing ? "Updating show draft in Rails..." : "Saving show draft to Rails...");

    try {
      const savedShow = editingShowId
        ? await api.updateShow(editingShowId, { ...showPayload, status: nextStatus })
        : await api.createShow({ ...showPayload, status: nextStatus });
      hydrateShow(savedShow);
      if (!editingShowId) {
        router.replace(`/CreateShow?showId=${savedShow.id}`, undefined, { shallow: true });
      }
      setStatus(nextStatus);
      setMessage(nextStatus === "submitted" ? "Show submitted for station review. You can track it from Host Profile." : "Show draft saved to Rails. You can find it under Host Profile > My Shows.");
    } catch (error) {
      window.localStorage.setItem("melody:lastShowDraft", JSON.stringify({ ...showPayload, status: nextStatus }));
      setMessage(error instanceof Error ? `${error.message} Draft saved locally.` : "Show save failed. Draft saved locally.");
    } finally {
      setIsSavingShow(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Create Show" />
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        {!user ? (
          <div className="rounded-md border border-amber-300/40 bg-amber-950/30 p-6 lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Host Access Required</p>
            <h1 className="mt-3 text-3xl font-semibold">Sign in before building a show.</h1>
            <p className="mt-3 max-w-2xl text-zinc-300">Shows, uploads, drafts, and stream packages are now tied to Rails accounts.</p>
          </div>
        ) : (
        <>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Create Show</p>
          <h1 className="mt-3 text-4xl font-semibold">{editingShowId ? "Edit your saved show." : "Prepare a show for the station."}</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Start with the show title and notes. Then upload one complete show file, build the show from songs and host breaks, or do both.
          </p>

          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Show Info", "Name the show and set the air status."],
              ["2", "Audio", "Upload a full show or add songs and breaks."],
              ["3", "Lineup", "Review the final order before saving."],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-md border border-white/10 bg-zinc-900 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Step {step}</p>
                <h2 className="mt-2 text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-zinc-400">{copy}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-md border border-white/10 bg-zinc-900 p-5">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Step 1</p>
              <h2 className="mt-2 text-xl font-semibold">Show Info</h2>
              <p className="mt-1 text-sm text-zinc-400">These details identify the show in your library and in the station schedule.</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-200" htmlFor="hostName">
                Host
                <input id="hostName" value={hostName} disabled className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-zinc-400" />
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="status">
                Status
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShowInput["status"])}
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="showTitle">
                Show Title
                <input id="showTitle" value={showTitle} onChange={(e) => setShowTitle(e.target.value)} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="scheduledAt">
                Air Date and Time
                <input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
              </label>
              <label className="block text-sm font-medium text-zinc-200 md:col-span-2" htmlFor="showDescription">
                Show Notes
                <textarea id="showDescription" value={showDescription} onChange={(e) => setShowDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
              </label>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-zinc-200">Option A: Upload Complete Show</p>
                <div className="mt-2 flex flex-col gap-3 rounded-md border border-zinc-700 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-zinc-300">{fullShowFile ? fullShowFile.name : existingFullShowName ? `Current full show: ${existingFullShowName}` : "Use this when the show is already mixed into one audio file."}</span>
                  <input ref={fullShowInputRef} type="file" accept={audioAccept} className="hidden" onChange={(e) => handleFullShowFileChange(e.target.files)} />
                  <button type="button" onClick={openFullShowPicker} className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
                    Select Full Show
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-md border border-white/10 bg-zinc-900 p-5">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Step 2</p>
              <h2 className="mt-2 text-xl font-semibold">Option B: Add Songs and Host Breaks</h2>
              <p className="mt-1 text-sm text-zinc-400">Add a new song, a station ID, an intro, an interview clip, or a recorded voice break to the show lineup.</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["title", "Song or Segment Title"],
                ["artist", "Artist, Band, or Speaker"],
                ["album", "Album, Project, or Segment Type"],
                ["length", "Length"],
              ].map(([field, label]) => (
                <label key={field} className="block text-sm font-medium text-zinc-200" htmlFor={field}>
                  {label}
                  <input id={field} value={draftTrack[field as keyof DraftTrack] || ""} onChange={(e) => handleDraftChange(field as keyof DraftTrack, e.target.value)} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
                </label>
              ))}
              <label className="block text-sm font-medium text-zinc-200 md:col-span-2" htmlFor="details">
                Notes
                <textarea id="details" value={draftTrack.details} onChange={(e) => handleDraftChange("details", e.target.value)} rows={3} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <input ref={fileInputRef} type="file" accept={audioAccept} className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
              <button type="button" onClick={openTrackPicker} className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
                {trackFile ? trackFile.name : "Attach Audio"}
              </button>
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-red-300">
                {isRecording ? "Stop Recording" : "Record Break"}
              </button>
              <button type="button" onClick={addTrack} disabled={isUploadingTrack} className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70">
                {isUploadingTrack ? "Uploading" : "Add to Lineup"}
              </button>
            </div>

            {recordedAudioURL && <audio controls src={recordedAudioURL} className="mt-4 w-full" />}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-white/10 bg-zinc-900 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-400">Lineup Items</p>
                <p className="mt-1 text-3xl font-semibold">{totalTracks}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Named Items</p>
                <p className="mt-1 text-3xl font-semibold">{readyTracks}</p>
              </div>
            </div>
            {message && <p className="mt-5 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100">{message}</p>}
            <button type="button" onClick={() => saveShow("draft")} disabled={isSavingShow} className="mt-5 w-full rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70">
              {isSavingShow ? "Saving" : "Save Draft"}
            </button>
            <button type="button" onClick={() => saveShow("submitted")} disabled={isSavingShow} className="mt-3 w-full rounded-md border border-amber-300 px-4 py-3 font-semibold text-amber-100 hover:bg-amber-300 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-70">
              Submit Show
            </button>
          </section>

          <section className="rounded-md border border-white/10 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-semibold">Station Library</h2>
                <p className="mt-1 text-sm text-zinc-400">Find audio already uploaded by you or shared with the station.</p>
              </div>
              <button type="button" onClick={loadLibraryTracks} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300">
                Refresh
              </button>
            </div>
            <div className="grid gap-3 border-b border-white/10 p-5">
              <input
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search title, artist, album, or genre"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={libraryKind}
                  onChange={(e) => setLibraryKind(e.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
                >
                  <option value="all">All audio types</option>
                  <option value="track">Tracks</option>
                  <option value="host_break">Host breaks</option>
                  <option value="full_show">Full shows</option>
                </select>
                <select
                  value={libraryVisibility}
                  onChange={(e) => setLibraryVisibility(e.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
                >
                  <option value="all">All visibility</option>
                  <option value="shared">Shared station library</option>
                  <option value="private">My private uploads</option>
                  <option value="pending_review">Pending review</option>
                </select>
              </div>
            </div>
            {libraryStatus && <p className="p-5 text-sm text-amber-100">{libraryStatus}</p>}
            {!libraryStatus && libraryTracks.length === 0 && <p className="p-5 text-sm text-zinc-400">No library tracks yet.</p>}
            {!libraryStatus && libraryTracks.length > 0 && filteredLibraryTracks.length === 0 && <p className="p-5 text-sm text-zinc-400">No audio matches these filters.</p>}
            <div className="max-h-96 overflow-auto">
              {Object.entries(groupedLibraryTracks).map(([groupName, audioFiles]) => (
                <div key={groupName} className="border-b border-white/10 last:border-b-0">
                  <div className="sticky top-0 bg-zinc-900 px-5 py-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">{groupName}</h3>
                  </div>
                  <div className="divide-y divide-white/10">
                    {audioFiles.map((audioFile) => (
                      <article key={audioFile.id} className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">{audioFile.visibility} {audioFile.genre && `- ${audioFile.genre}`}</p>
                            <h3 className="mt-1 font-semibold">{audioFile.title || audioFile.name}</h3>
                            <p className="text-sm text-zinc-400">
                              {audioFile.artist || "Unknown Artist"} {audioFile.album && `- ${audioFile.album}`} {audioFile.duration ? `- ${audioFile.duration}s` : "- missing duration"}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => startAudioMetadataEdit(audioFile)} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300">
                              Edit
                            </button>
                            <button type="button" onClick={() => addLibraryTrack(audioFile)} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300">
                              Add to Lineup
                            </button>
                          </div>
                        </div>
                        {editingAudioId === audioFile.id && (
                          <div className="mt-4 rounded-md border border-white/10 bg-zinc-950 p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {[
                                ["title", "Title"],
                                ["artist", "Artist"],
                                ["album", "Album / Segment"],
                                ["genre", "Genre"],
                                ["length", "Duration in seconds"],
                              ].map(([field, label]) => (
                                <label key={field} className="block text-sm font-medium text-zinc-200" htmlFor={`audio-${audioFile.id}-${field}`}>
                                  {label}
                                  <input
                                    id={`audio-${audioFile.id}-${field}`}
                                    value={audioMetadataDrafts[audioFile.id]?.[field as keyof (DraftTrack & { genre: string })] || ""}
                                    onChange={(event) => updateAudioMetadataDraft(audioFile.id, field as keyof (DraftTrack & { genre: string }), event.target.value)}
                                    className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-amber-300"
                                  />
                                </label>
                              ))}
                              <label className="block text-sm font-medium text-zinc-200 sm:col-span-2" htmlFor={`audio-${audioFile.id}-notes`}>
                                Notes
                                <textarea
                                  id={`audio-${audioFile.id}-notes`}
                                  value={audioMetadataDrafts[audioFile.id]?.details || ""}
                                  onChange={(event) => updateAudioMetadataDraft(audioFile.id, "details", event.target.value)}
                                  rows={2}
                                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-amber-300"
                                />
                              </label>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button type="button" onClick={() => saveAudioMetadata(audioFile.id)} className="rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-200">
                                Save Metadata
                              </button>
                              <button type="button" onClick={() => setEditingAudioId(null)} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {audioFile.url && <audio controls src={audioFile.url} className="mt-4 w-full" />}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-white/10 bg-zinc-900">
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Step 3</p>
              <h2 className="mt-2 text-xl font-semibold">Show Lineup</h2>
              <p className="mt-1 text-sm text-zinc-400">This is the order the show will be saved in.</p>
            </div>
            <div className="divide-y divide-white/10">
              {tracks.length === 0 ? (
                <p className="p-5 text-sm text-zinc-400">No songs or breaks added yet.</p>
              ) : (
                tracks.map((track, index) => (
                  <article key={track.id} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setExpandedTrackId((current) => (current === track.id ? null : track.id))}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">#{index + 1} {track.kind}</p>
                        <h3 className="mt-1 truncate font-semibold">{track.title}</h3>
                        <p className="truncate text-sm text-zinc-400">{track.artist} {track.length && `- ${track.length}`}</p>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => moveTrack(track.id, "up")} disabled={index === 0} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
                          Up
                        </button>
                        <button type="button" onClick={() => moveTrack(track.id, "down")} disabled={index === tracks.length - 1} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
                          Down
                        </button>
                        <button type="button" onClick={() => removeTrack(track.id)} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-red-300">
                          Remove
                        </button>
                      </div>
                    </div>
                    {expandedTrackId === track.id && (
                      <div className="mt-4 rounded-md border border-white/10 bg-zinc-950 p-4">
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          {[
                            ["title", "Title"],
                            ["artist", "Artist"],
                            ["album", "Album / Segment"],
                            ["length", "Duration in seconds"],
                          ].map(([field, label]) => (
                            <label key={field} className="block font-medium text-zinc-200" htmlFor={`lineup-${track.id}-${field}`}>
                              {label}
                              <input
                                id={`lineup-${track.id}-${field}`}
                                value={track[field as keyof TrackInput] || ""}
                                onChange={(event) => updateLineupTrack(track.id, { [field]: event.target.value })}
                                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-amber-300"
                              />
                            </label>
                          ))}
                          <label className="block font-medium text-zinc-200 sm:col-span-2" htmlFor={`lineup-${track.id}-details`}>
                            Notes
                            <textarea
                              id={`lineup-${track.id}-details`}
                              value={track.details || ""}
                              onChange={(event) => updateLineupTrack(track.id, { details: event.target.value })}
                              rows={2}
                              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-amber-300"
                            />
                          </label>
                          <div className="sm:col-span-2">
                            <p className="text-zinc-500">Audio File</p>
                            <p className="mt-1 text-zinc-200">{track.fileName || "No file attached"}</p>
                          </div>
                        </div>
                        {track.audioFileId && (
                          <button
                            type="button"
                            onClick={() => saveLineupTrackToLibrary(track)}
                            className="mt-3 rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300"
                          >
                            Save to Library Metadata
                          </button>
                        )}
                        {track.fileUrl && <audio controls src={track.fileUrl} className="mt-4 w-full" />}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          <details className="rounded-md border border-white/10 bg-zinc-900 p-5">
            <summary className="cursor-pointer text-xl font-semibold">Developer Preview</summary>
            <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-300">
              {JSON.stringify(backendPreview, null, 2)}
            </pre>
          </details>
        </aside>
        </>
        )}
      </section>
    </main>
  );
};

export default CreateShow;
