import { ShowPlayoutItem } from "@/lib/showPlayout";
import { useEffect, useRef, useState } from "react";

type ShowSequencePlayerProps = {
  items: ShowPlayoutItem[];
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

const ShowSequencePlayer = ({ items }: ShowSequencePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentItem = items[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [items]);

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;
    audioRef.current.play().catch(() => setIsPlaying(false));
  }, [currentIndex, isPlaying]);

  if (!currentItem) {
    return (
      <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
        A continuous preview is unavailable until the lineup has playable audio.
      </p>
    );
  }

  const selectItem = (index: number, play: boolean) => {
    setCurrentIndex(index);
    setIsPlaying(play);
  };

  const handleEnded = () => {
    if (currentIndex < items.length - 1) {
      selectItem(currentIndex + 1, true);
    } else {
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-signal/25 bg-signal/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9a82]">Continuous show preview</p>
          <p className="mt-1 font-semibold text-white">{currentItem.title}</p>
          <p className="text-sm text-paper/50">
            Item {currentIndex + 1} of {items.length}
            {currentItem.artist ? ` · ${currentItem.artist}` : ""}
            {" · "}{formatTime(currentItem.startOffsetSeconds)}–{formatTime(currentItem.endOffsetSeconds)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => selectItem(Math.max(0, currentIndex - 1), isPlaying)}
            disabled={currentIndex === 0}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => selectItem(Math.min(items.length - 1, currentIndex + 1), isPlaying)}
            disabled={currentIndex === items.length - 1}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={currentItem.audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        className="mt-4 w-full"
      />
      <p className="mt-2 text-xs text-paper/35">When an item ends, the next one starts automatically in lineup order.</p>
    </section>
  );
};

export default ShowSequencePlayer;
