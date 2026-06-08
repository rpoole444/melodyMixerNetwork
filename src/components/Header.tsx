import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";

type HeaderProps = {
  title?: string;
};

const menuItems = [
  { name: "Dashboard", link: "/", adminOnly: false },
  { name: "Listen", link: "/AlpineGrooveGuide", adminOnly: false },
  { name: "Host Profile", link: "/UserProfile", adminOnly: false },
  { name: "Station Library", link: "/Library", adminOnly: false },
  { name: "Create Show", link: "/CreateShow", adminOnly: false },
  { name: "Station Review", link: "/StationReview", adminOnly: true },
  { name: "Programming Clock", link: "/ProgrammingClock", adminOnly: true },
  { name: "Host Team", link: "/HostInvites", adminOnly: true },
  { name: "Register Host", link: "/Registration", adminOnly: false },
];

const Header = ({ title = "Melody Mixer Network" }: HeaderProps) => {
  const router = useRouter();
  const { user, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/95 text-white backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <button
          onClick={() => router.back()}
          className="min-h-11 rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-amber-300 hover:text-white"
          type="button"
        >
          Back
        </button>

        <Link href="/" className="min-w-0 flex-1 text-center">
          <p className="hidden text-xs uppercase tracking-[0.3em] text-amber-300 sm:block">Radio Operations</p>
          <h1 className="truncate text-base font-semibold sm:text-xl">{title}</h1>
        </Link>

        <div className="relative flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:border-red-300 hover:text-white sm:block"
            >
              Sign Out
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="min-h-11 rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-200"
            type="button"
          >
            Menu
          </button>
          {isMenuOpen && (
            <nav className="absolute right-0 top-14 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-white/10 bg-zinc-900 shadow-2xl">
              {menuItems
                .filter((item) => !item.adminOnly || user?.role === "admin")
                .map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className="block min-h-12 px-4 py-3 text-sm text-zinc-100 hover:bg-zinc-800"
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
                  className="block w-full px-4 py-3 text-left text-sm text-zinc-100 hover:bg-zinc-800 sm:hidden"
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
