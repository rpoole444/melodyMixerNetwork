import Link from "next/link";
import Header from "@/components/Header";
import LoginComponent from "@/components/LoginComponent";
import { useUser } from "@/contexts/UserContext";
import { api, PlaylistRecord } from "@/lib/api";
import { formatStationDateTime } from "@/lib/stationTime";
import { useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import BrandMark from "@/components/BrandMark";

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
      <main className="relative min-h-screen overflow-hidden bg-ink text-cream">
        <div className="hf-record-grooves pointer-events-none absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(21,18,15,0.96)_25%,rgba(21,18,15,0.76)),url('/record-room.jpg')] bg-cover bg-center" />
        <div className="relative min-h-screen">
          <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <BrandMark href="/listen" />
              <p className="hf-kicker mt-12">{BRAND.tagline}</p>
              <h1 className="mt-4 max-w-3xl font-display text-6xl leading-[0.92] tracking-[-0.035em] text-cream sm:text-7xl">
                Radio with fingerprints on it.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/70">
                A studio for musicians, selectors, bandleaders, and deep listeners to build thoughtful shows by hand. {BRAND.attribution}.
              </p>
              <Link href="/listen" className="hf-button-secondary mt-8">Listen to Human Frequency</Link>
            </section>
            <LoginComponent />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hf-shell">
      <Header title="Studio Dashboard" />
      <section className="relative overflow-hidden border-b border-paper/10 bg-[url('/record-room.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,18,15,0.98),rgba(21,18,15,0.68))]" />
        <div className="relative">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
            <p className="hf-kicker">On the desk</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-5xl text-cream">Good to hear you, {user.hostName || user.firstName}.</h1>
                <p className="mt-3 max-w-2xl text-paper/65">
                  Shape the next Human Frequency transmission, from first track to final host break.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/CreateShow" className="hf-button-primary">
                  Create Show
                </Link>
                <Link href="/Library" className="hf-button-secondary">
                  Library
                </Link>
                <Link href="/UserProfile" className="hf-button-secondary">
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {dashboardMessage && <p className="rounded-xl border border-signal/40 bg-signal/10 p-3 text-sm text-[#ffd5c9] sm:col-span-3 lg:col-span-1">{dashboardMessage}</p>}
          {statCards.map((card) => (
            <article key={card.label} className="hf-panel p-5">
              <p className="text-sm text-paper/50">{card.label}</p>
              <p className="mt-2 font-display text-4xl text-cream">{card.value}</p>
              <p className="mt-1 text-sm text-signal">{card.detail}</p>
            </article>
          ))}
        </div>

        <div className="hf-panel">
          <div className="border-b border-paper/10 p-5">
            <h2 className="text-xl font-semibold">Today&apos;s Programming</h2>
            <p className="mt-1 text-sm text-paper/50">Scheduled shows from the Rails station queue.</p>
          </div>
          <div className="divide-y divide-white/10">
            {scheduledShows.length === 0 ? (
              <p className="p-5 text-sm text-paper/50">No scheduled shows yet.</p>
            ) : (
              scheduledShows.map((show) => (
              <div key={show.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-4 p-5">
                <span className="font-mono text-sm text-paper/50">{formatStationDateTime(show.scheduled_at, false)}</span>
                <span className="font-medium text-white">{show.name}</span>
                <span className="rounded-full border border-signal/40 px-3 py-1 text-xs text-[#ffd5c9]">{show.status}</span>
              </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
