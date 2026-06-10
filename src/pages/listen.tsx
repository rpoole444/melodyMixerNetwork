import Header from "@/components/Header";
import { api, PlaylistRecord } from "@/lib/api";
import { formatStationDateTime, STATION_TIME_LABEL } from "@/lib/stationTime";
import { useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";

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

const HumanFrequencyListen = () => {
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
    setMessage("Tuning the Human Frequency schedule...");

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
    <main className="hf-shell">
      <Header title="Listen" />
      <section className="relative overflow-hidden border-b border-paper/10 bg-[url('/record-room.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,18,15,0.98),rgba(21,18,15,0.58))]" />
        <div className="hf-record-grooves pointer-events-none absolute -right-20 -top-44 h-[38rem] w-[38rem] rounded-full opacity-80" />
        <div className="relative">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="hf-kicker">{BRAND.tagline}</p>
              <h1 className="mt-4 font-display text-6xl leading-none text-cream sm:text-7xl">{BRAND.name}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/70">
                Shows assembled by human musicians and music lovers, with room for context, surprise, local voices, and records worth turning over.
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-cobalt">{BRAND.attribution}</p>
            </div>
            <section className="hf-panel p-6">
              <p className="hf-kicker">Live signal</p>
              <h2 className="mt-3 font-display text-3xl">{currentShow?.name || "The signal is warming up"}</h2>
              <p className="mt-2 text-sm text-paper/50">{currentShow ? `Hosted by ${currentShow.host_name}` : "The live player comes online with the broadcast stream."}</p>
              {STREAM_URL ? (
                <audio controls src={STREAM_URL} className="mt-5 w-full" />
              ) : (
                <div className="hf-notice mt-5">
                  Live streaming is the next broadcast milestone. The published schedule is already available below.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-ink-soft p-5">
            <p className="text-sm text-paper/50">Now Playing</p>
            <h2 className="mt-2 text-2xl font-semibold">{currentShow?.name || "No scheduled show is live"}</h2>
            {currentShow && (
              <>
                <p className="mt-2 text-paper/70">{currentShow.description}</p>
                <p className="mt-3 text-sm text-paper/50">
                  {formatStationDateTime(currentShow.scheduled_at)} - {formatDuration(showDurationSeconds(currentShow))}
                </p>
              </>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-ink-soft p-5">
            <p className="text-sm text-paper/50">Up Next</p>
            <h2 className="mt-2 text-2xl font-semibold">{nextShow?.name || "No upcoming show scheduled"}</h2>
            {nextShow && (
              <p className="mt-3 text-sm text-paper/50">
                {formatStationDateTime(nextShow.scheduled_at)} - {nextShow.host_name}
              </p>
            )}
          </section>
        </aside>

        <section className="rounded-xl border border-white/10 bg-ink-soft">
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Station Schedule</h2>
              <p className="mt-1 text-sm text-paper/50">Scheduled shows approved by station admins. All times are {STATION_TIME_LABEL}.</p>
            </div>
            <button type="button" onClick={loadSchedule} className="w-fit rounded-xl border border-white/15 px-4 py-3 font-semibold text-white hover:border-signal">
              Refresh
            </button>
          </div>
          {message && <p className="m-5 rounded-xl border border-signal/40 bg-signal/10 p-3 text-sm text-[#ffd5c9]">{message}</p>}
          {!message && upcomingShows.length === 0 && <p className="p-5 text-sm text-paper/50">No public schedule yet.</p>}
          <div className="divide-y divide-white/10">
            {upcomingShows.map((show) => (
              <article key={show.id} className="grid gap-4 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-center">
                <div>
                  <p className="font-mono text-sm text-[#ff9a82]">{formatStationDateTime(show.scheduled_at, false)}</p>
                  <p className="text-xs text-paper/35">{new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", month: "short", day: "numeric" }).format(new Date(show.scheduled_at || ""))}</p>
                </div>
                <div>
                  <h3 className="font-semibold">{show.name}</h3>
                  <p className="mt-1 text-sm text-paper/50">{show.host_name}</p>
                </div>
                <span className="text-sm text-paper/50">{formatDuration(showDurationSeconds(show))}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default HumanFrequencyListen;
