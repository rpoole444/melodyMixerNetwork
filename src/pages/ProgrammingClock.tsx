import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { api, PlaylistRecord } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateTimeInput = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toDateInput(date)}T${hours}:${minutes}`;
};

const formatClockTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const showDurationSeconds = (show: PlaylistRecord) => {
  const manifestDuration = show.delivery_manifest?.show?.total_duration_seconds;
  if (manifestDuration && manifestDuration > 0) return manifestDuration;

  const songDuration = show.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  if (songDuration > 0) return songDuration;

  return show.full_show_audio_file ? 3600 : 0;
};

const sameLocalDay = (value: string | undefined, day: string) => {
  if (!value) return false;
  return toDateInput(new Date(value)) === day;
};

const startOfDay = (day: string) => new Date(`${day}T00:00`);

const ProgrammingClock = () => {
  const { user } = useUser();
  const [shows, setShows] = useState<PlaylistRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState(toDateInput(new Date()));
  const [message, setMessage] = useState("");
  const [scheduleById, setScheduleById] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadShows();
  }, [user?.role]);

  const loadShows = async () => {
    setMessage("Loading programming clock...");

    try {
      const nextShows = await api.listStationShows();
      setShows(nextShows);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load station programming.");
    }
  };

  const scheduledShows = useMemo(
    () =>
      shows
        .filter((show) => sameLocalDay(show.scheduled_at, selectedDay))
        .sort((a, b) => new Date(a.scheduled_at || "").getTime() - new Date(b.scheduled_at || "").getTime()),
    [shows, selectedDay],
  );

  const readyShows = useMemo(
    () => shows.filter((show) => show.status === "ready" || (show.status === "scheduled" && !show.scheduled_at)),
    [shows],
  );

  const clockItems = useMemo(() => {
    const dayStart = startOfDay(selectedDay).getTime();

    return scheduledShows.map((show) => {
      const startsAt = new Date(show.scheduled_at || "");
      const duration = showDurationSeconds(show);
      const startMinutes = Math.max(0, Math.round((startsAt.getTime() - dayStart) / 60000));
      const endMinutes = Math.min(1440, startMinutes + Math.max(15, Math.ceil(duration / 60)));

      return {
        show,
        startsAt,
        duration,
        startMinutes,
        endMinutes,
      };
    });
  }, [scheduledShows, selectedDay]);

  const coverageSeconds = clockItems.reduce((sum, item) => sum + Math.max(0, item.endMinutes - item.startMinutes) * 60, 0);
  const coveragePercent = Math.min(100, Math.round((coverageSeconds / 86400) * 100));
  const queuedCount = scheduledShows.filter((show) => show.delivery_status === "queued").length;

  const gaps = useMemo(() => {
    const nextGaps: Array<{ start: number; end: number }> = [];
    let cursor = 0;

    clockItems.forEach((item) => {
      if (item.startMinutes > cursor) {
        nextGaps.push({ start: cursor, end: item.startMinutes });
      }
      cursor = Math.max(cursor, item.endMinutes);
    });

    if (cursor < 1440) {
      nextGaps.push({ start: cursor, end: 1440 });
    }

    return nextGaps.filter((gap) => gap.end - gap.start >= 15);
  }, [clockItems]);

  const scheduleShow = async (show: PlaylistRecord) => {
    const scheduledAt = scheduleById[show.id];
    if (!scheduledAt) {
      setMessage("Choose a time before adding this show to the clock.");
      return;
    }

    setBusyId(show.id);
    try {
      const nextShow = await api.scheduleShow(show.id, scheduledAt);
      setShows((current) => current.map((item) => (item.id === nextShow.id ? nextShow : item)));
      setScheduleById((current) => ({ ...current, [show.id]: "" }));
      setMessage(`${show.name} was placed on the ${selectedDay} clock.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not schedule this show.");
    } finally {
      setBusyId(null);
    }
  };

  const minuteLabel = (minutes: number) => {
    const date = startOfDay(selectedDay);
    date.setMinutes(minutes);
    return formatClockTime(date);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Programming Clock" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {user?.role !== "admin" ? (
          <div className="rounded-md border border-amber-300/40 bg-amber-950/30 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Admin Area</p>
            <h1 className="mt-3 text-3xl font-semibold">Programming Clock is for station admins.</h1>
            <p className="mt-3 max-w-2xl text-zinc-300">Hosts submit shows. Admins arrange approved shows into a broadcast day.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Alpine Groove Guide</p>
                <h1 className="mt-3 text-4xl font-semibold">Build a 24-hour programming day.</h1>
                <p className="mt-3 max-w-3xl text-zinc-300">
                  Use approved shows to fill the station clock, check gaps, and confirm which scheduled shows already have stream packages.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="text-sm font-medium text-zinc-200" htmlFor="programming-day">
                  Broadcast Day
                  <input
                    id="programming-day"
                    type="date"
                    value={selectedDay}
                    onChange={(event) => setSelectedDay(event.target.value)}
                    className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                  />
                </label>
                <button type="button" onClick={loadShows} className="self-end rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
                  Refresh
                </button>
              </div>
            </div>

            {message && <p className="mt-6 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100">{message}</p>}

            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-md border border-white/10 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Coverage</p>
                <p className="mt-2 text-3xl font-semibold">{coveragePercent}%</p>
                <p className="mt-1 text-sm text-amber-200">{formatDuration(coverageSeconds)} programmed</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Scheduled Shows</p>
                <p className="mt-2 text-3xl font-semibold">{scheduledShows.length}</p>
                <p className="mt-1 text-sm text-amber-200">on this day</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Stream Packages</p>
                <p className="mt-2 text-3xl font-semibold">{queuedCount}</p>
                <p className="mt-1 text-sm text-amber-200">queued for provider handoff</p>
              </div>
              <div className="rounded-md border border-white/10 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Open Gaps</p>
                <p className="mt-2 text-3xl font-semibold">{gaps.length}</p>
                <p className="mt-1 text-sm text-amber-200">15+ minute openings</p>
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-md border border-white/10 bg-zinc-900">
                <div className="border-b border-white/10 p-5">
                  <h2 className="text-xl font-semibold">24-Hour Clock</h2>
                  <p className="mt-1 text-sm text-zinc-400">Shows are positioned by scheduled start time and estimated duration.</p>
                </div>
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid min-h-20 grid-cols-[80px_1fr] border-b border-white/10 last:border-b-0">
                      <div className="border-r border-white/10 p-3 font-mono text-sm text-zinc-500">{String(hour).padStart(2, "0")}:00</div>
                      <div className="relative p-3" />
                    </div>
                  ))}
                  <div className="pointer-events-none absolute left-[80px] right-0 top-0 h-full">
                    {clockItems.map((item) => (
                      <div
                        key={item.show.id}
                        className="absolute left-3 right-3 overflow-hidden rounded-md border border-amber-300/40 bg-amber-300/15 p-3"
                        style={{
                          top: `${(item.startMinutes / 1440) * 100}%`,
                          height: `${Math.max(4, ((item.endMinutes - item.startMinutes) / 1440) * 100)}%`,
                        }}
                      >
                        <p className="truncate text-sm font-semibold text-white">{item.show.name}</p>
                        <p className="truncate text-xs text-amber-100">
                          {formatClockTime(item.startsAt)} - {formatDuration(item.duration)} - {item.show.delivery_status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <section className="rounded-md border border-white/10 bg-zinc-900">
                  <div className="border-b border-white/10 p-5">
                    <h2 className="text-xl font-semibold">Ready To Place</h2>
                    <p className="mt-1 text-sm text-zinc-400">Approved shows that need a broadcast slot.</p>
                  </div>
                  <div className="divide-y divide-white/10">
                    {readyShows.length === 0 ? (
                      <p className="p-5 text-sm text-zinc-400">No ready unscheduled shows.</p>
                    ) : (
                      readyShows.map((show) => (
                        <article key={show.id} className="p-5">
                          <h3 className="font-semibold">{show.name}</h3>
                          <p className="mt-1 text-sm text-zinc-400">{show.host_name} - {formatDuration(showDurationSeconds(show))}</p>
                          <div className="mt-4 grid gap-3">
                            <input
                              type="datetime-local"
                              value={scheduleById[show.id] || ""}
                              min={`${selectedDay}T00:00`}
                              max={`${selectedDay}T23:59`}
                              onChange={(event) => setScheduleById((current) => ({ ...current, [show.id]: event.target.value }))}
                              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                            />
                            <button
                              type="button"
                              onClick={() => scheduleShow(show)}
                              disabled={busyId === show.id}
                              className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
                            >
                              Place On Clock
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-md border border-white/10 bg-zinc-900">
                  <div className="border-b border-white/10 p-5">
                    <h2 className="text-xl font-semibold">Gaps</h2>
                    <p className="mt-1 text-sm text-zinc-400">Open space left in this broadcast day.</p>
                  </div>
                  <div className="divide-y divide-white/10">
                    {gaps.length === 0 ? (
                      <p className="p-5 text-sm text-zinc-400">No 15+ minute gaps.</p>
                    ) : (
                      gaps.map((gap) => (
                        <div key={`${gap.start}-${gap.end}`} className="p-4">
                          <p className="font-medium">{minuteLabel(gap.start)} - {minuteLabel(gap.end)}</p>
                          <p className="text-sm text-zinc-400">{formatDuration((gap.end - gap.start) * 60)} open</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default ProgrammingClock;
