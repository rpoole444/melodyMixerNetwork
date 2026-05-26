import Link from "next/link";
import Header from "@/components/Header";
import LoginComponent from "@/components/LoginComponent";
import { useUser } from "@/contexts/UserContext";

const statCards = [
  { label: "Draft Shows", value: "3", detail: "2 need track review" },
  { label: "Ready Blocks", value: "7", detail: "14.5 hours programmed" },
  { label: "Host Assets", value: "28", detail: "music, voice, bumpers" },
];

const upcoming = [
  { time: "08:00", show: "Morning Blend", status: "Ready" },
  { time: "11:30", show: "Local Artist Lunch", status: "Needs Intro" },
  { time: "18:00", show: "Denver After Dark", status: "Draft" },
];

export default function Home() {
  const { user } = useUser();

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
                The frontend is ready to work as a polished station console today, with the Rails API contract separated so the backend can take over auth, profiles, audio, and playlist persistence.
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
                  Keep your host profile current, stage new shows, and hand structured playlist requirements to the backend when it is ready.
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
            <p className="mt-1 text-sm text-zinc-400">Local frontend data now, backend schedule data later.</p>
          </div>
          <div className="divide-y divide-white/10">
            {upcoming.map((item) => (
              <div key={item.show} className="grid grid-cols-[80px_1fr_auto] items-center gap-4 p-5">
                <span className="font-mono text-sm text-zinc-400">{item.time}</span>
                <span className="font-medium text-white">{item.show}</span>
                <span className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
