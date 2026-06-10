import Link from "next/link";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { ApiUser, PlaylistRecord, api } from "@/lib/api";
import { formatStationDateTime } from "@/lib/stationTime";
import { FormEvent, useEffect, useMemo, useState } from "react";

const emptyProfile: ApiUser = {
  hostName: "",
  description: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "host",
  profileImage: "/hostpic.jpg",
};

const showStatusCopy: Record<PlaylistRecord["status"], string> = {
  draft: "Still editable by you.",
  submitted: "Sent to admin for review.",
  needs_edits: "Admin requested changes.",
  rejected: "Not accepted for station programming.",
  ready: "Approved by admin.",
  scheduled: "Assigned an air time.",
  aired: "Already broadcast.",
};

const showStatusOrder: PlaylistRecord["status"][] = ["needs_edits", "draft", "submitted", "ready", "scheduled", "aired", "rejected"];

const UserProfile = () => {
  const { user, updateUser, error } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ApiUser>(user || emptyProfile);
  const [shows, setShows] = useState<PlaylistRecord[]>([]);
  const [showsMessage, setShowsMessage] = useState("");

  useEffect(() => {
    setDraft(user || emptyProfile);
  }, [user]);

  useEffect(() => {
    loadMyShows();
  }, []);

  const groupedShows = useMemo(() => {
    return shows.reduce<Record<string, PlaylistRecord[]>>((groups, show) => {
      groups[show.status] ||= [];
      groups[show.status].push(show);
      return groups;
    }, {});
  }, [shows]);

  const loadMyShows = async () => {
    setShowsMessage("Loading your saved shows...");

    try {
      const nextShows = await api.listMyShows();
      setShows(nextShows);
      setShowsMessage("");
    } catch (err) {
      setShowsMessage(
        err instanceof Error && err.message === "Not Authorized"
          ? "Sign in with your Rails account to see saved drafts and submitted shows."
          : "Could not load your shows from Rails.",
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateUser(draft);
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-ink text-white">
      <Header title="Host Profile" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hf-kicker">Human Frequency host</p>
            <h1 className="mt-3 text-5xl">{draft.hostName}</h1>
            <p className="mt-3 max-w-2xl text-paper/70">{draft.description}</p>
          </div>
          <Link href="/CreateShow" className="w-fit rounded-xl bg-signal px-4 py-3 font-semibold text-ink hover:bg-[#ff7658]">
            Create New Show
          </Link>
        </div>

        {error && <p className="mb-6 rounded-xl border border-signal/40 bg-signal/10 p-3 text-[#ffd5c9]">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-xl border border-white/10 bg-ink-soft p-6">
            <div className="flex flex-col gap-5 sm:flex-row lg:flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.profileImage || "/hostpic.jpg"}
                alt={`${draft.hostName} profile`}
                width={220}
                height={220}
                className="aspect-square rounded-xl object-cover"
              />
              <div>
                <h2 className="text-2xl font-semibold">{draft.firstName} {draft.lastName}</h2>
                <p className="mt-2 text-paper/70">{draft.email}</p>
                <p className="text-paper/70">{draft.phone || "No phone number"}</p>
                <button
                  onClick={() => setIsEditing((editing) => !editing)}
                  className="mt-5 rounded-xl border border-white/15 px-4 py-3 font-semibold text-white hover:border-signal"
                  type="button"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-ink-soft p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                {[
                  ["hostName", "Host Name"],
                  ["firstName", "First Name"],
                  ["lastName", "Last Name"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                ].map(([name, label]) => (
                  <label key={name} className="block text-sm font-medium text-paper/80" htmlFor={name}>
                    {label}
                    <input
                      id={name}
                      name={name}
                      value={draft[name as keyof ApiUser] || ""}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal"
                    />
                  </label>
                ))}
                <label className="block text-sm font-medium text-paper/80 md:col-span-2" htmlFor="description">
                  Description
                  <textarea
                    id="description"
                    name="description"
                    value={draft.description}
                    onChange={handleChange}
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal"
                  />
                </label>
                <button className="rounded-xl bg-signal px-4 py-3 font-semibold text-ink hover:bg-[#ff7658] md:col-span-2" type="submit">
                  Save Profile
                </button>
              </form>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">My Shows</h2>
                    <p className="mt-1 text-sm text-paper/50">Drafts, submitted shows, and scheduled shows saved to Rails.</p>
                  </div>
                  <button type="button" onClick={loadMyShows} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-paper/80 hover:border-signal">
                    Refresh
                  </button>
                </div>

                {showsMessage && <p className="rounded-xl border border-signal/40 bg-signal/10 p-3 text-sm text-[#ffd5c9]">{showsMessage}</p>}
                {!showsMessage && shows.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-ink p-5">
                    <h3 className="font-semibold">No saved shows yet.</h3>
                    <p className="mt-2 text-sm text-paper/50">Save a draft or submit a show from Create Show, then it will appear here.</p>
                    <Link href="/CreateShow" className="mt-4 inline-block rounded-xl bg-signal px-4 py-3 font-semibold text-ink hover:bg-[#ff7658]">
                      Create Show
                    </Link>
                  </div>
                )}

                <div className="space-y-5">
                  {showStatusOrder
                    .filter((status) => groupedShows[status]?.length)
                    .map((status) => (
                      <section key={status} className="rounded-xl border border-white/10 bg-ink">
                        <div className="border-b border-white/10 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-signal">{status}</p>
                          <p className="mt-1 text-sm text-paper/50">{showStatusCopy[status]}</p>
                        </div>
                        <div className="divide-y divide-white/10">
                          {groupedShows[status].map((show) => (
                            <article key={show.id} className="p-4">
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <div>
                                  <h3 className="font-semibold">{show.name}</h3>
                                  <p className="mt-1 text-sm text-paper/50">{show.description || "No show notes"}</p>
                                  {show.review_notes && <p className="mt-2 rounded-xl border border-signal/30 bg-signal/30 p-3 text-sm text-[#ffd5c9]">Admin note: {show.review_notes}</p>}
                                  <p className="mt-2 text-sm text-paper/35">
                                    {show.songs.length} lineup item{show.songs.length === 1 ? "" : "s"}
                                    {show.full_show_audio_file ? " + full show file" : ""}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="inline-block rounded-full border border-signal/40 px-3 py-1 text-xs text-[#ffd5c9]">{show.status}</span>
                                  {show.scheduled_at && <p className="mt-2 text-xs text-paper/50">{formatStationDateTime(show.scheduled_at)}</p>}
                                  {["draft", "needs_edits"].includes(show.status) && (
                                    <Link
                                      href={`/CreateShow?showId=${show.id}`}
                                      className="mt-3 inline-block rounded-xl bg-signal px-3 py-2 text-sm font-semibold text-ink hover:bg-[#ff7658]"
                                    >
                                      Edit Draft
                                    </Link>
                                  )}
                                </div>
                              </div>
                              {show.full_show_audio_file?.url && <audio controls src={show.full_show_audio_file.url} className="mt-4 w-full" />}
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

export default UserProfile;
