import Link from "next/link";
import Header from "@/components/Header";
import LoginComponent from "@/components/LoginComponent";
import { useUser } from "@/contexts/UserContext";
import { api, PlaylistRecord } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

export default function Home() {
  const { user } = useUser();
  const [shows, setShows] = useState<PlaylistRecord[]>([]);
  const [dashboardMessage, setDashboardMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      setDashboardMessage("Loading station data...");

      try {
        const nextShows = user.role === "admin" ? await api.listStationShows() : await api.listMyShows();
        setShows(nextShows);
        setDashboardMessage("");
      } catch (error) {
        setDashboardMessage(error instanceof Error ? error.message : "Could not load station data.");
      }
    };

    loadDashboard();
  }, [user]);

  const scheduledShows = useMemo(
    () =>
      shows
        .filter((show) => show.scheduled_at)
        .sort((a, b) => new Date(a.scheduled_at || "").getTime() - new Date(b.scheduled_at || "").getTime()),
    [shows],
  );

  const statCards = useMemo(() => {
    const totalDuration = shows.reduce((sum, show) => sum + show.songs.reduce((songSum, song) => songSum + (song.duration || 0), 0), 0);

    return [
      { label: "Draft Shows", value: String(shows.filter((show) => show.status === "draft").length), detail: "Saved by this host" },
      { label: "Station Queue", value: String(shows.filter((show) => ["submitted", "ready", "scheduled"].includes(show.status)).length), detail: "Submitted, ready, or scheduled" },
      { label: "Programmed Audio", value: formatDuration(totalDuration), detail: "Lineup duration in Rails" },
    ];
  }, [shows]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[url('/record-room.jpg')] bg-cover bg-center text-white">
        <div className="min-h-screen bg-zinc-950/70">
          <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Melody Mixer Network</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
                Build, schedule, and manage radio shows from one host desk.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200">
                Sign in with a Rails account to upload audio, build shows, submit them for review, and prepare stream packages for Alpine Groove Guide.
              </p>
            </section>
            <LoginComponent />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Melody Mixer Network" />
      <section className="border-b border-white/10 bg-[url('/record-room.jpg')] bg-cover bg-center">
        <div className="bg-zinc-950/75">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Station Dashboard</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-semibold">Welcome back, {user.hostName}</h1>
                <p className="mt-3 max-w-2xl text-zinc-200">
                  Keep your host profile current, stage new shows, and move approved programming toward a 24/7 Alpine Groove Guide stream.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/CreateShow" className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
                  Create Show
                </Link>
                <Link href="/UserProfile" className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {dashboardMessage && <p className="rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100 sm:col-span-3 lg:col-span-1">{dashboardMessage}</p>}
          {statCards.map((card) => (
            <article key={card.label} className="rounded-md border border-white/10 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-sm text-amber-200">{card.detail}</p>
            </article>
          ))}
        </div>

        <div className="rounded-md border border-white/10 bg-zinc-900">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-semibold">Today&apos;s Programming</h2>
            <p className="mt-1 text-sm text-zinc-400">Scheduled shows from the Rails station queue.</p>
          </div>
          <div className="divide-y divide-white/10">
            {scheduledShows.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400">No scheduled shows yet.</p>
            ) : (
              scheduledShows.map((show) => (
              <div key={show.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-4 p-5">
                <span className="font-mono text-sm text-zinc-400">{new Date(show.scheduled_at || "").toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                <span className="font-medium text-white">{show.name}</span>
                <span className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100">{show.status}</span>
              </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
