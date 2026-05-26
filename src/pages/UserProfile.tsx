import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { ApiUser, api } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";

const savedShows = [
  { id: 1, title: "Jazz Nights", tracks: 12, status: "Ready" },
  { id: 2, title: "Classic Rock Hour", tracks: 9, status: "Draft" },
  { id: 3, title: "Hip Hop Beats", tracks: 15, status: "Scheduled" },
];

const UserProfile = () => {
  const { user, updateUser, error } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ApiUser>(user || api.demoUser);

  useEffect(() => {
    setDraft(user || api.demoUser);
  }, [user]);

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
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Host Profile" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Host Profile</p>
            <h1 className="mt-3 text-4xl font-semibold">{draft.hostName}</h1>
            <p className="mt-3 max-w-2xl text-zinc-300">{draft.description}</p>
          </div>
          <Link href="/CreateShow" className="w-fit rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
            Create New Show
          </Link>
        </div>

        {error && <p className="mb-6 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-amber-100">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-md border border-white/10 bg-zinc-900 p-6">
            <div className="flex flex-col gap-5 sm:flex-row lg:flex-col">
              <Image
                src={draft.profileImage || "/hostpic.jpg"}
                alt={`${draft.hostName} profile`}
                width={220}
                height={220}
                className="aspect-square rounded-md object-cover"
              />
              <div>
                <h2 className="text-2xl font-semibold">{draft.firstName} {draft.lastName}</h2>
                <p className="mt-2 text-zinc-300">{draft.email}</p>
                <p className="text-zinc-300">{draft.phone || "No phone number"}</p>
                <button
                  onClick={() => setIsEditing((editing) => !editing)}
                  className="mt-5 rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300"
                  type="button"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-white/10 bg-zinc-900 p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                {[
                  ["hostName", "Host Name"],
                  ["firstName", "First Name"],
                  ["lastName", "Last Name"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                ].map(([name, label]) => (
                  <label key={name} className="block text-sm font-medium text-zinc-200" htmlFor={name}>
                    {label}
                    <input
                      id={name}
                      name={name}
                      value={draft[name as keyof ApiUser] || ""}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                    />
                  </label>
                ))}
                <label className="block text-sm font-medium text-zinc-200 md:col-span-2" htmlFor="description">
                  Description
                  <textarea
                    id="description"
                    name="description"
                    value={draft.description}
                    onChange={handleChange}
                    rows={5}
                    className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                  />
                </label>
                <button className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 md:col-span-2" type="submit">
                  Save Profile
                </button>
              </form>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Show Library</h2>
                  <span className="text-sm text-zinc-400">{savedShows.length} shows</span>
                </div>
                <div className="divide-y divide-white/10">
                  {savedShows.map((show) => (
                    <div key={show.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                      <div>
                        <h3 className="font-semibold">{show.title}</h3>
                        <p className="text-sm text-zinc-400">{show.tracks} tracks prepared</p>
                      </div>
                      <span className="h-fit rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100">{show.status}</span>
                    </div>
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
