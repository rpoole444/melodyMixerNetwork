import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import BrandMark from "@/components/BrandMark";

type HeaderProps = {
  title?: string;
};

const menuItems = [
  { name: "Dashboard", link: "/", adminOnly: false },
  { name: "Listen", link: "/listen", adminOnly: false },
  { name: "Host Profile", link: "/UserProfile", adminOnly: false },
  { name: "Station Library", link: "/Library", adminOnly: false },
  { name: "Create Show", link: "/CreateShow", adminOnly: false },
  { name: "Station Review", link: "/StationReview", adminOnly: true },
  { name: "Programming Clock", link: "/ProgrammingClock", adminOnly: true },
  { name: "Host Team", link: "/HostInvites", adminOnly: true },
  { name: "Register Host", link: "/Registration", adminOnly: false },
];

const Header = ({ title }: HeaderProps) => {
  const router = useRouter();
  const { user, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-paper/10 bg-ink/95 text-cream backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.75rem] w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6">
        <button
          onClick={() => router.back()}
          className="hidden min-h-11 rounded-full border border-paper/15 px-4 py-2 text-sm font-semibold text-paper/70 hover:border-signal hover:text-cream sm:block"
          type="button"
        >
          Back
        </button>

        <div className="min-w-0 flex-1">
          <BrandMark compact={Boolean(title)} />
          {title && <p className="mt-1 truncate pl-[3.25rem] text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cobalt sm:text-xs">{title}</p>}
        </div>

        <div className="relative flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-full border border-paper/15 px-4 py-2 text-sm font-semibold text-paper/70 hover:border-red-300 hover:text-white sm:block"
            >
              Sign Out
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="min-h-11 rounded-full bg-signal px-5 py-2 text-sm font-bold text-ink hover:bg-[#ff7658]"
            type="button"
          >
            Menu
          </button>
          {isMenuOpen && (
            <nav className="absolute right-0 top-14 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-paper/10 bg-ink-soft p-2 shadow-2xl">
              {menuItems
                .filter((item) => !item.adminOnly || user?.role === "admin")
                .map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`block min-h-12 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    router.pathname === item.link ? "bg-signal text-ink" : "text-cream hover:bg-paper/10"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-cream hover:bg-paper/10 sm:hidden"
                >
                  Sign Out
                </button>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
