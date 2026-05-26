"use client";

import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { api, ShowInput, TrackInput } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";

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

const CreateShow = () => {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioChunks = useRef<Blob[]>([]);

  const [tracks, setTracks] = useState<TrackInput[]>([]);
  const [draftTrack, setDraftTrack] = useState<DraftTrack>(emptyTrack);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [showTitle, setShowTitle] = useState("");
  const [showDescription, setShowDescription] = useState("");
  const [status, setStatus] = useState<ShowInput["status"]>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("");
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

  const totalTracks = tracks.length;
  const readyTracks = tracks.filter((track) => track.title && track.artist).length;
  const hostName = user?.hostName || api.demoUser.hostName;

  const showPayload: ShowInput = useMemo(
    () => ({
      title: showTitle,
      description: showDescription,
      hostName,
      status,
      scheduledAt,
      tracks,
    }),
    [showTitle, showDescription, hostName, status, scheduledAt, tracks],
  );

  const handleDraftChange = (field: keyof DraftTrack, value: string) => {
    setDraftTrack((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setTrackFile(file);
    setDraftTrack((current) => ({ ...current, fileName: file.name, fileUrl: URL.createObjectURL(file) }));
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

  const addTrack = () => {
    if (!draftTrack.title.trim() || !draftTrack.artist.trim()) {
      setMessage("Track title and artist are required.");
      return;
    }

    const kind: TrackInput["kind"] = audioBlob ? "recording" : trackFile ? "upload" : "metadata";
    const fileUrl = recordedAudioURL || draftTrack.fileUrl;

    setTracks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: draftTrack.title,
        artist: draftTrack.artist,
        album: draftTrack.album,
        length: draftTrack.length,
        details: draftTrack.details,
        fileName: draftTrack.fileName || (audioBlob ? `${draftTrack.title}.webm` : undefined),
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

  const removeTrack = (id: string) => {
    setTracks((current) => current.filter((track) => track.id !== id));
  };

  const saveShow = async () => {
    if (!showTitle.trim()) {
      setMessage("Show title is required.");
      return;
    }

    if (tracks.length === 0) {
      setMessage("Add at least one track or voice segment before saving.");
      return;
    }

    try {
      await api.createShow(showPayload);
      setMessage("Show sent to backend.");
    } catch {
      window.localStorage.setItem("melody:lastShowDraft", JSON.stringify(showPayload));
      setMessage("Backend playlist endpoint is not available yet, so this show was saved locally as the expected payload.");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Create Show" />
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Show Builder</p>
          <h1 className="mt-3 text-4xl font-semibold">Assemble a complete radio block.</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Add music, recorded host breaks, show notes, and scheduling metadata. Save will call the backend when the playlist endpoint exists and falls back to local draft storage today.
          </p>

          <section className="mt-8 rounded-md border border-white/10 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Show Details</h2>
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
                Air Date
                <input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
              </label>
              <label className="block text-sm font-medium text-zinc-200 md:col-span-2" htmlFor="showDescription">
                Show Description
                <textarea id="showDescription" value={showDescription} onChange={(e) => setShowDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300" />
              </label>
            </div>
          </section>

          <section className="mt-6 rounded-md border border-white/10 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Add Track or Host Break</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["title", "Track Title"],
                ["artist", "Artist or Speaker"],
                ["album", "Album or Segment"],
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
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
                {trackFile ? trackFile.name : "Attach Audio"}
              </button>
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-red-300">
                {isRecording ? "Stop Recording" : "Record Break"}
              </button>
              <button type="button" onClick={addTrack} className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
                Add to Rundown
              </button>
            </div>

            {recordedAudioURL && <audio controls src={recordedAudioURL} className="mt-4 w-full" />}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-white/10 bg-zinc-900 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-400">Tracks</p>
                <p className="mt-1 text-3xl font-semibold">{totalTracks}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Ready</p>
                <p className="mt-1 text-3xl font-semibold">{readyTracks}</p>
              </div>
            </div>
            {message && <p className="mt-5 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100">{message}</p>}
            <button type="button" onClick={saveShow} className="mt-5 w-full rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
              Save Show
            </button>
          </section>

          <section className="rounded-md border border-white/10 bg-zinc-900">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-xl font-semibold">Rundown</h2>
            </div>
            <div className="divide-y divide-white/10">
              {tracks.length === 0 ? (
                <p className="p-5 text-sm text-zinc-400">No tracks added yet.</p>
              ) : (
                tracks.map((track, index) => (
                  <article key={track.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">#{index + 1} {track.kind}</p>
                        <h3 className="mt-1 font-semibold">{track.title}</h3>
                        <p className="text-sm text-zinc-400">{track.artist} {track.length && `- ${track.length}`}</p>
                      </div>
                      <button type="button" onClick={() => removeTrack(track.id)} className="rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-red-300">
                        Remove
                      </button>
                    </div>
                    {track.fileUrl && <audio controls src={track.fileUrl} className="mt-4 w-full" />}
                    {track.details && <p className="mt-3 text-sm text-zinc-300">{track.details}</p>}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-white/10 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Backend Payload</h2>
            <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-300">
              {JSON.stringify(showPayload, null, 2)}
            </pre>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default CreateShow;
