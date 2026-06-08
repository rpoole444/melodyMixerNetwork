import Header from "@/components/Header";
import ShowSequencePlayer from "@/components/ShowSequencePlayer";
import { useUser } from "@/contexts/UserContext";
import { api, PlaylistRecord } from "@/lib/api";
import { buildShowPlayout } from "@/lib/showPlayout";
import { formatStationDateTime, stationInputToIso, STATION_TIME_LABEL } from "@/lib/stationTime";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const statusLabels: Record<PlaylistRecord["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_edits: "Needs Edits",
  rejected: "Rejected",
  ready: "Ready",
  scheduled: "Scheduled",
  aired: "Aired",
};

const streamTargets = [
  { value: "local_stream", label: "Provider-ready export" },
  { value: "icecast", label: "Icecast / Liquidsoap" },
  { value: "azuracast", label: "AzuraCast AutoDJ" },
  { value: "live365", label: "Live365 handoff" },
  { value: "radio_co", label: "Radio.co handoff" },
];

const formatDuration = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
};

const formatTrackDuration = (seconds = 0) => {
  if (seconds <= 0) return "Missing duration";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const showDurationSeconds = (show: PlaylistRecord) => show.songs.reduce((total, song) => total + (song.duration || 0), 0);

const showReadinessIssues = (show: PlaylistRecord) => {
  if (show.full_show_audio_file?.url) return [];

  const issues: string[] = [];
  if (show.songs.length === 0) {
    issues.push("Add a full-show file or at least one lineup track.");
    return issues;
  }

  const missingAudioCount = show.songs.filter((song) => !song.file_url && !song.audio_file?.url).length;
  const missingDurationCount = show.songs.filter((song) => !song.duration || song.duration <= 0).length;

  if (missingAudioCount > 0) issues.push(`${missingAudioCount} lineup item${missingAudioCount === 1 ? "" : "s"} missing audio.`);
  if (missingDurationCount > 0) issues.push(`${missingDurationCount} lineup item${missingDurationCount === 1 ? "" : "s"} missing duration.`);

  return issues;
};

const StationReview = () => {
  const { user } = useUser();
  const [shows, setShows] = useState<PlaylistRecord[]>([]);
  const [message, setMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [streamTarget, setStreamTarget] = useState("local_stream");
  const [scheduleById, setScheduleById] = useState<Record<number, string>>({});
  const [reviewNotesById, setReviewNotesById] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;

    loadShows();
  }, [user?.role]);

  const filteredShows = useMemo(() => {
    if (selectedStatus === "all") return shows;
    return shows.filter((show) => show.status === selectedStatus);
  }, [shows, selectedStatus]);

  const loadShows = async () => {
    setMessage("Loading submitted shows...");

    try {
      const nextShows = await api.listStationShows();
      setShows(nextShows);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load station review queue.");
    }
  };

  const updateShow = (nextShow: PlaylistRecord) => {
    setShows((current) => current.map((show) => (show.id === nextShow.id ? nextShow : show)));
  };

  const markReady = async (show: PlaylistRecord) => {
    const issues = showReadinessIssues(show);
    if (issues.length > 0) {
      setMessage(`Send ${show.name} back for edits before marking ready: ${issues.join(" ")}`);
      return;
    }

    setBusyId(show.id);
    try {
      updateShow(await api.markShowReady(show.id));
      setMessage(`${show.name} is ready for scheduling.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not mark show ready.");
    } finally {
      setBusyId(null);
    }
  };

  const requestChanges = async (show: PlaylistRecord) => {
    const reviewNotes = reviewNotesById[show.id]?.trim();
    if (!reviewNotes) {
      setMessage("Add review notes before sending a show back for edits.");
      return;
    }

    setBusyId(show.id);
    try {
      updateShow(await api.requestShowChanges(show.id, reviewNotes));
      setMessage(`${show.name} was returned to the host for edits.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request changes.");
    } finally {
      setBusyId(null);
    }
  };

  const reopenForEdits = async (show: PlaylistRecord) => {
    const reviewNotes = reviewNotesById[show.id]?.trim();
    if (!reviewNotes) {
      setMessage("Add review notes before reopening a scheduled or queued show.");
      return;
    }

    setBusyId(show.id);
    try {
      updateShow(await api.reopenShowForEdits(show.id, reviewNotes));
      setMessage(`${show.name} was reopened for host edits. Its schedule and stream package were cleared.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reopen show for edits.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectShow = async (show: PlaylistRecord) => {
    const reviewNotes = reviewNotesById[show.id]?.trim();
    if (!reviewNotes) {
      setMessage("Add review notes before rejecting a show.");
      return;
    }

    setBusyId(show.id);
    try {
      updateShow(await api.rejectShow(show.id, reviewNotes));
      setMessage(`${show.name} was rejected.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reject show.");
    } finally {
      setBusyId(null);
    }
  };

  const scheduleShow = async (show: PlaylistRecord) => {
    const issues = showReadinessIssues(show);
    if (issues.length > 0) {
      setMessage(`Resolve show readiness issues before scheduling: ${issues.join(" ")}`);
      return;
    }

    const scheduledAt = scheduleById[show.id];
    if (!scheduledAt) {
      setMessage("Choose an air date and time before scheduling.");
      return;
    }

    setBusyId(show.id);
    try {
      updateShow(await api.scheduleShow(show.id, stationInputToIso(scheduledAt)));
      setMessage(`${show.name} is scheduled.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not schedule show.");
    } finally {
      setBusyId(null);
    }
  };

  const deliverShow = async (show: PlaylistRecord) => {
    const issues = showReadinessIssues(show);
    if (issues.length > 0) {
      setMessage(`Resolve show readiness issues before queueing a stream package: ${issues.join(" ")}`);
      return;
    }

    setBusyId(show.id);
    try {
      const nextShow = await api.deliverShow(show.id, streamTarget);
      updateShow(nextShow);
      setMessage(`${show.name} stream package is ready: ${nextShow.delivery_reference}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not queue show for delivery.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Station Review" />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {user?.role !== "admin" ? (
          <div className="rounded-md border border-amber-300/40 bg-amber-950/30 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Admin Area</p>
            <h1 className="mt-3 text-3xl font-semibold">Station Review is for admins only.</h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Hosts can create and submit shows. Admins review submitted shows, schedule airtime, and queue shows for streaming.
            </p>
          </div>
        ) : (
        <>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Station Queue</p>
            <h1 className="mt-3 text-4xl font-semibold">Review, schedule, and queue local shows.</h1>
            <p className="mt-3 max-w-3xl text-zinc-300">
              Artists submit shows from the show builder. Station operators review the lineup, mark the show ready, schedule an air time, and queue it for a streaming target.
            </p>
          </div>
          <button type="button" onClick={loadShows} className="w-fit rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
            Refresh Queue
          </button>
          <Link href="/ProgrammingClock" className="w-fit rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
            Programming Clock
          </Link>
        </div>

        <section className="mt-8 grid gap-4 rounded-md border border-white/10 bg-zinc-900 p-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-200" htmlFor="statusFilter">
            Filter Queue
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
            >
              <option value="all">All station shows</option>
              <option value="submitted">Submitted</option>
              <option value="needs_edits">Needs Edits</option>
              <option value="rejected">Rejected</option>
              <option value="ready">Ready</option>
              <option value="scheduled">Scheduled</option>
              <option value="aired">Aired</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-200" htmlFor="streamTarget">
            Stream Target
            <select
              id="streamTarget"
              value={streamTarget}
              onChange={(event) => setStreamTarget(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
            >
              {streamTargets.map((target) => (
                <option key={target.value} value={target.value}>{target.label}</option>
              ))}
            </select>
          </label>
        </section>

        {message && <p className="mt-6 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100">{message}</p>}

        <section className="mt-6 grid gap-5">
          {filteredShows.length === 0 && !message && (
            <p className="rounded-md border border-white/10 bg-zinc-900 p-5 text-zinc-400">No shows are in this queue yet.</p>
          )}

          {filteredShows.map((show) => (
            <article key={show.id} className="rounded-md border border-white/10 bg-zinc-900">
              <div className="grid gap-5 border-b border-white/10 p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">{statusLabels[show.status]} - {show.delivery_status}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{show.name}</h2>
                  <p className="mt-2 text-zinc-300">{show.description}</p>
                  <p className="mt-2 text-sm text-zinc-400">Host: {show.host_name}</p>
                  {show.review_notes && (
                    <p className="mt-3 rounded-md border border-amber-300/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
                      Review note: {show.review_notes}
                    </p>
                  )}
                  {show.delivery_reference && (
                    <p className="mt-3 rounded-md border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">
                      Stream package: {show.delivery_reference}
                    </p>
                  )}
                  {showReadinessIssues(show).length > 0 && (
                    <div className="mt-3 rounded-md border border-red-300/30 bg-red-950/30 px-3 py-2 text-sm text-red-100">
                      <p className="font-semibold">Not ready to schedule or stream yet.</p>
                      <ul className="mt-1 list-disc pl-5">
                        {showReadinessIssues(show).map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    onClick={() => markReady(show)}
                    disabled={busyId === show.id || show.status !== "submitted" || showReadinessIssues(show).length > 0}
                    className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mark Ready
                  </button>
                  <button
                    type="button"
                    onClick={() => requestChanges(show)}
                    disabled={busyId === show.id || show.status !== "submitted"}
                    className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Needs Edits
                  </button>
                  <button
                    type="button"
                    onClick={() => reopenForEdits(show)}
                    disabled={busyId === show.id || !(["ready", "scheduled", "aired"].includes(show.status) || show.delivery_status === "queued")}
                    className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reopen for Edits
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectShow(show)}
                    disabled={busyId === show.id || show.status !== "submitted"}
                    className="rounded-md border border-red-300/40 px-4 py-3 font-semibold text-red-100 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => scheduleShow(show)}
                    disabled={busyId === show.id || !["ready", "scheduled"].includes(show.status) || showReadinessIssues(show).length > 0}
                    className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => deliverShow(show)}
                    disabled={busyId === show.id || show.status !== "scheduled" || showReadinessIssues(show).length > 0}
                    className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Queue Stream Package
                  </button>
                </div>
              </div>

              {show.delivery_manifest?.reference && (
                <section className="border-b border-white/10 p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border border-white/10 bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Target</p>
                      <p className="mt-1 font-semibold">{show.delivery_manifest.target}</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Assets</p>
                      <p className="mt-1 font-semibold">{show.delivery_manifest.assets?.length || 0}</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Duration</p>
                      <p className="mt-1 font-semibold">{formatDuration(show.delivery_manifest.show?.total_duration_seconds || 0)}</p>
                    </div>
                  </div>
                  {show.delivery_manifest.provider?.name && (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="rounded-md border border-white/10 bg-zinc-950 p-4">
                        <p className="text-sm text-zinc-400">Provider</p>
                        <p className="mt-1 font-semibold">{show.delivery_manifest.provider.name}</p>
                      </div>
                      <div className="rounded-md border border-white/10 bg-zinc-950 p-4">
                        <p className="text-sm text-zinc-400">Handoff Mode</p>
                        <p className="mt-1 font-semibold">{show.delivery_manifest.provider.mode?.replace("_", " ")}</p>
                      </div>
                      <div className="rounded-md border border-white/10 bg-zinc-950 p-4">
                        <p className="text-sm text-zinc-400">AzuraCast Playlist</p>
                        <p className="mt-1 font-semibold">{show.delivery_manifest.provider.recommended_playlist || "Not set"}</p>
                      </div>
                    </div>
                  )}
                  <details className="mt-4 rounded-md border border-white/10 bg-zinc-950 p-4">
                    <summary className="cursor-pointer font-semibold">Stream Export Manifest</summary>
                    <pre className="mt-4 max-h-72 overflow-auto text-xs text-zinc-300">
                      {JSON.stringify(show.delivery_manifest, null, 2)}
                    </pre>
                  </details>
                </section>
              )}

              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <h3 className="text-lg font-semibold">Show Lineup</h3>
                  <p className="mt-1 text-sm text-zinc-400">Estimated length: {formatDuration(showDurationSeconds(show))}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 ${show.contains_explicit_content ? "bg-red-400/15 text-red-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                      {show.contains_explicit_content ? "Explicit content" : "No explicit content reported"}
                    </span>
                    {show.confirmations_recorded_at && <span className="rounded-full bg-amber-300/15 px-2 py-1 text-amber-100">Host confirmations recorded</span>}
                  </div>
                  <ShowSequencePlayer items={buildShowPlayout(show)} />
                  <div className="mt-4 grid gap-3">
                    {show.songs.length === 0 ? (
                      <p className="rounded-md border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-400">No lineup items. This may be a full-show upload.</p>
                    ) : (
                      show.songs.map((song) => {
                        const audioUrl = song.audio_file?.url || song.file_url;
                        return (
                        <article key={song.id} className="rounded-md border border-white/10 bg-zinc-950 p-4">
                          <div className="grid grid-cols-[42px_1fr_auto] items-start gap-3">
                            <span className="font-mono text-sm text-zinc-500">#{song.position}</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-white">{song.name}</p>
                              <p className="mt-1 text-sm text-zinc-400">{song.artist} · {song.album}</p>
                              {song.file_name && <p className="mt-1 truncate text-xs text-zinc-600">{song.file_name}</p>}
                            </div>
                            <div className="text-right">
                              <p className={`font-mono text-sm ${song.duration > 0 ? "text-amber-200" : "text-red-200"}`}>{formatTrackDuration(song.duration)}</p>
                              {!audioUrl && <p className="mt-1 text-xs text-red-200">Missing audio</p>}
                            </div>
                          </div>
                          {audioUrl && (
                            <details className="mt-3 rounded-md border border-white/10 bg-zinc-900 p-3">
                              <summary className="cursor-pointer text-sm font-semibold text-amber-100">Listen to this item</summary>
                              <audio controls preload="none" src={audioUrl} className="mt-3 w-full" />
                            </details>
                          )}
                        </article>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-5 block text-sm font-medium text-zinc-200" htmlFor={`review-${show.id}`}>
                    Admin Review Notes
                    <textarea
                      id={`review-${show.id}`}
                      value={reviewNotesById[show.id] || ""}
                      onChange={(event) => setReviewNotesById((current) => ({ ...current, [show.id]: event.target.value }))}
                      rows={4}
                      placeholder="Notes for the host if this needs edits or is rejected."
                      className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-200" htmlFor={`schedule-${show.id}`}>
                    Air Date and Time ({STATION_TIME_LABEL})
                    <input
                      id={`schedule-${show.id}`}
                      type="datetime-local"
                      value={scheduleById[show.id] || ""}
                      onChange={(event) => setScheduleById((current) => ({ ...current, [show.id]: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                    />
                  </label>
                  {show.scheduled_at && <p className="mt-3 text-sm text-zinc-400">Scheduled: {formatStationDateTime(show.scheduled_at)}</p>}
                  {show.full_show_audio_file?.url && (
                    <div className="mt-5">
                      <p className="mb-2 text-sm font-medium text-zinc-200">Full Show Audio</p>
                      <audio controls src={show.full_show_audio_file.url} className="w-full" />
                    </div>
                  )}
                  {show.delivery_target && <p className="mt-3 text-sm text-zinc-400">Delivery target: {show.delivery_target}</p>}
                  {show.delivered_at && <p className="mt-2 text-sm text-zinc-400">Queued: {new Date(show.delivered_at).toLocaleString()}</p>}
                </div>
              </div>
            </article>
          ))}
        </section>
        </>
        )}
      </section>
    </main>
  );
};

export default StationReview;
