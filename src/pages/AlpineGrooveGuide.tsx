import Header from "@/components/Header";
import { api, PlaylistRecord } from "@/lib/api";
import { formatStationDateTime, STATION_TIME_LABEL } from "@/lib/stationTime";
import { useEffect, useMemo, useState } from "react";

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "";

const showDurationSeconds = (show: PlaylistRecord) => {
  const songDuration = show.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  if (songDuration > 0) return songDuration;
  return show.full_show_audio_file?.duration || 0;
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const isPlayingNow = (show: PlaylistRecord, now: Date) => {
  if (!show.scheduled_at) return false;
  const startsAt = new Date(show.scheduled_at);
  const endsAt = new Date(startsAt.getTime() + showDurationSeconds(show) * 1000);
  return startsAt <= now && now < endsAt;
};

const AlpineGrooveGuide = () => {
  const [shows, setShows] = useState<PlaylistRecord[]>([]);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const loadSchedule = async () => {
    setMessage("Loading Alpine Groove Guide schedule...");

    try {
      const nextShows = await api.listPublicSchedule();
      setShows(nextShows);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the public station schedule.");
    }
  };

  const orderedShows = useMemo(
    () => [...shows].sort((a, b) => new Date(a.scheduled_at || "").getTime() - new Date(b.scheduled_at || "").getTime()),
    [shows],
  );

  const currentShow = orderedShows.find((show) => isPlayingNow(show, now));
  const nextShow = orderedShows.find((show) => show.scheduled_at && new Date(show.scheduled_at) > now);
  const upcomingShows = orderedShows.filter((show) => show.scheduled_at && new Date(show.scheduled_at) >= now).slice(0, 8);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Alpine Groove Guide" />
      <section className="border-b border-white/10 bg-[url('/record-room.jpg')] bg-cover bg-center">
        <div className="bg-zinc-950/75">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Listener Station</p>
              <h1 className="mt-3 text-5xl font-semibold">Alpine Groove Guide</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-200">
                Local shows, curated host blocks, and community-made music programming from the Melody Mixer Network.
              </p>
            </div>
            <section className="rounded-md border border-white/10 bg-zinc-950/85 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Live Stream</p>
              <h2 className="mt-3 text-2xl font-semibold">{currentShow?.name || "Station stream coming online"}</h2>
              <p className="mt-2 text-sm text-zinc-400">{currentShow ? `Hosted by ${currentShow.host_name}` : "Set NEXT_PUBLIC_STREAM_URL when the broadcast provider is connected."}</p>
              {STREAM_URL ? (
                <audio controls src={STREAM_URL} className="mt-5 w-full" />
              ) : (
                <div className="mt-5 rounded-md border border-amber-300/40 bg-amber-950/40 p-4 text-sm text-amber-100">
                  Stream provider is not connected yet. This player will use the provider stream URL once selected.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-white/10 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Now Playing</p>
            <h2 className="mt-2 text-2xl font-semibold">{currentShow?.name || "No scheduled show is live"}</h2>
            {currentShow && (
              <>
                <p className="mt-2 text-zinc-300">{currentShow.description}</p>
                <p className="mt-3 text-sm text-zinc-400">
                  {formatStationDateTime(currentShow.scheduled_at)} - {formatDuration(showDurationSeconds(currentShow))}
                </p>
              </>
            )}
          </section>

          <section className="rounded-md border border-white/10 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Up Next</p>
            <h2 className="mt-2 text-2xl font-semibold">{nextShow?.name || "No upcoming show scheduled"}</h2>
            {nextShow && (
              <p className="mt-3 text-sm text-zinc-400">
                {formatStationDateTime(nextShow.scheduled_at)} - {nextShow.host_name}
              </p>
            )}
          </section>
        </aside>

        <section className="rounded-md border border-white/10 bg-zinc-900">
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Station Schedule</h2>
              <p className="mt-1 text-sm text-zinc-400">Scheduled shows approved by station admins. All times are {STATION_TIME_LABEL}.</p>
            </div>
            <button type="button" onClick={loadSchedule} className="w-fit rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
              Refresh
            </button>
          </div>
          {message && <p className="m-5 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100">{message}</p>}
          {!message && upcomingShows.length === 0 && <p className="p-5 text-sm text-zinc-400">No public schedule yet.</p>}
          <div className="divide-y divide-white/10">
            {upcomingShows.map((show) => (
              <article key={show.id} className="grid gap-4 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-center">
                <div>
                  <p className="font-mono text-sm text-amber-200">{formatStationDateTime(show.scheduled_at, false)}</p>
                  <p className="text-xs text-zinc-500">{new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", month: "short", day: "numeric" }).format(new Date(show.scheduled_at || ""))}</p>
                </div>
                <div>
                  <h3 className="font-semibold">{show.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{show.host_name}</p>
                </div>
                <span className="text-sm text-zinc-400">{formatDuration(showDurationSeconds(show))}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default AlpineGrooveGuide;
