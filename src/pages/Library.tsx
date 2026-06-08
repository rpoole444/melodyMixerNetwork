import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { api, AudioFileRecord, PlaylistRecord } from "@/lib/api";
import { filterAudioLibrary, formatAudioDuration, LibraryFilters } from "@/lib/audioLibrary";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const initialFilters: LibraryFilters = {
  search: "",
  kind: "track",
  genre: "all",
  artist: "all",
  ownership: "all",
  explicit: "all",
  duration: "all",
  sort: "artist",
};

const Library = () => {
  const { user } = useUser();
  const router = useRouter();
  const [audioFiles, setAudioFiles] = useState<AudioFileRecord[]>([]);
  const [editableShows, setEditableShows] = useState<PlaylistRecord[]>([]);
  const [selectedShowId, setSelectedShowId] = useState("new");
  const [filters, setFilters] = useState(initialFilters);
  const [visibleCount, setVisibleCount] = useState(24);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadLibrary = async () => {
      setMessage("Loading the station library...");
      try {
        const [nextAudioFiles, shows] = await Promise.all([api.listAudioFiles(), api.listMyShows()]);
        setAudioFiles(nextAudioFiles);
        setEditableShows(shows.filter((show) => ["draft", "needs_edits"].includes(show.status)));
        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load the station library.");
      }
    };

    loadLibrary();
  }, [user]);

  const genres = useMemo(
    () => Array.from(new Set(audioFiles.map((audioFile) => audioFile.genre || "Uncategorized"))).sort(),
    [audioFiles],
  );
  const artists = useMemo(
    () => Array.from(new Set(audioFiles.map((audioFile) => audioFile.artist || "Unknown Artist"))).sort(),
    [audioFiles],
  );
  const filteredAudio = useMemo(() => filterAudioLibrary(audioFiles, filters), [audioFiles, filters]);

  const updateFilter = (key: keyof LibraryFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setVisibleCount(24);
  };

  const addToShow = (audioFile: AudioFileRecord) => {
    const query = selectedShowId === "new"
      ? { audioFileId: audioFile.id }
      : { showId: selectedShowId, audioFileId: audioFile.id };
    router.push({ pathname: "/CreateShow", query });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Station Library" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {!user ? (
          <section className="rounded-md border border-amber-300/40 bg-amber-950/30 p-6">
            <h1 className="text-3xl font-semibold">Sign in to browse station audio.</h1>
            <p className="mt-2 text-zinc-300">The library is shared among approved Alpine Groove Guide hosts.</p>
          </section>
        ) : (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Shared Crates</p>
                <h1 className="mt-3 text-4xl font-semibold">Station Library</h1>
                <p className="mt-3 max-w-3xl text-zinc-300">Browse music and host audio uploaded by the station team. Shared means every approved host can reuse it; only the uploader can change its metadata.</p>
              </div>
              <label className="block min-w-64 text-sm font-medium text-zinc-200">
                Add selections to
                <select
                  value={selectedShowId}
                  onChange={(event) => setSelectedShowId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-amber-300"
                >
                  <option value="new">A new show</option>
                  {editableShows.map((show) => <option key={show.id} value={show.id}>{show.name} · {show.status.replace("_", " ")}</option>)}
                </select>
              </label>
            </div>

            <section className="mt-8 rounded-md border border-white/10 bg-zinc-900">
              <div className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-2 xl:grid-cols-4">
                <input
                  value={filters.search}
                  onChange={(event) => updateFilter("search", event.target.value)}
                  placeholder="Search title, artist, album, host..."
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300 md:col-span-2"
                />
                <select value={filters.kind} onChange={(event) => updateFilter("kind", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="all">All audio types</option>
                  <option value="track">Music tracks</option>
                  <option value="host_break">Host breaks</option>
                  <option value="full_show">Complete shows</option>
                </select>
                <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="artist">Artist, then title</option>
                  <option value="title">Title A–Z</option>
                  <option value="newest">Newest uploads</option>
                  <option value="duration">Shortest first</option>
                </select>
                <select value={filters.artist} onChange={(event) => updateFilter("artist", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="all">All artists</option>
                  {artists.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
                </select>
                <select value={filters.genre} onChange={(event) => updateFilter("genre", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="all">All genres</option>
                  {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
                </select>
                <select value={filters.duration} onChange={(event) => updateFilter("duration", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="all">Any length</option>
                  <option value="short">Under 3 minutes</option>
                  <option value="medium">3–7 minutes</option>
                  <option value="long">Over 7 minutes</option>
                </select>
                <select value={filters.ownership} onChange={(event) => updateFilter("ownership", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="all">Everyone&apos;s uploads</option>
                  <option value="mine">Uploaded by me</option>
                  <option value="station">Uploaded by other hosts</option>
                </select>
                <select value={filters.explicit} onChange={(event) => updateFilter("explicit", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white">
                  <option value="all">Any content rating</option>
                  <option value="clean">No explicit flag</option>
                  <option value="explicit">Explicit only</option>
                </select>
                <button type="button" onClick={() => setFilters(initialFilters)} className="rounded-md border border-white/15 px-3 py-3 font-semibold text-white hover:border-amber-300">
                  Clear Filters
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm text-zinc-400">
                <span>{filteredAudio.length} matching item{filteredAudio.length === 1 ? "" : "s"}</span>
                <span>{audioFiles.filter((audioFile) => audioFile.owned_by_current_user).length} uploaded by you</span>
              </div>

              {message && <p className="p-5 text-amber-100">{message}</p>}
              {!message && filteredAudio.length === 0 && <p className="p-5 text-zinc-400">No station audio matches those filters.</p>}
              <div className="divide-y divide-white/10">
                {filteredAudio.slice(0, visibleCount).map((audioFile, index) => (
                  <article key={audioFile.id} className="grid gap-4 p-4 md:grid-cols-[48px_1fr_auto] md:items-start">
                    <span className="font-mono text-sm text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{audioFile.title || audioFile.name}</h2>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">{audioFile.visibility.replace("_", " ")}</span>
                        {audioFile.explicit && <span className="rounded-full bg-red-400/15 px-2 py-1 text-xs text-red-200">Explicit</span>}
                        {audioFile.owned_by_current_user && <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs text-amber-100">Your upload</span>}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{audioFile.artist || "Unknown Artist"}{audioFile.album ? ` · ${audioFile.album}` : ""}</p>
                      <p className="mt-1 text-xs text-zinc-500">{audioFile.genre || "Uncategorized"} · {formatAudioDuration(audioFile.duration)} · uploaded by {audioFile.owner_name || "Station host"}</p>
                      <details className="mt-3 rounded-md border border-white/10 bg-zinc-950 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-amber-100">See more and listen</summary>
                        {audioFile.notes && <p className="mt-3 text-sm text-zinc-300">{audioFile.notes}</p>}
                        <p className="mt-2 break-all text-xs text-zinc-600">{audioFile.name}</p>
                        {audioFile.url && <audio controls preload="none" src={audioFile.url} className="mt-3 w-full" />}
                      </details>
                    </div>
                    <button type="button" onClick={() => addToShow(audioFile)} className="rounded-md bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-200">
                      Add to Show
                    </button>
                  </article>
                ))}
              </div>
              {visibleCount < filteredAudio.length && (
                <div className="border-t border-white/10 p-5 text-center">
                  <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white hover:border-amber-300">
                    See More
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default Library;
