import Link from "next/link";
import { BRAND } from "@/lib/brand";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
};

const SignalMark = () => (
  <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" />
    <path
      d="M10 32h8l4-11 7 24 7-31 7 25 4-7h7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BrandMark = ({ compact = false, href = "/" }: BrandMarkProps) => (
  <Link href={href} className="group inline-flex min-w-0 items-center gap-3 text-left" aria-label={`${BRAND.name} home`}>
    <span className="h-10 w-10 shrink-0 text-signal transition-transform duration-300 group-hover:rotate-3">
      <SignalMark />
    </span>
    <span className="min-w-0">
      <span className="block truncate font-display text-xl leading-none tracking-[-0.02em] text-cream sm:text-2xl">
        {BRAND.name}
      </span>
      {!compact && (
        <span className="mt-1 hidden text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-paper/55 sm:block">
          {BRAND.attribution}
        </span>
      )}
    </span>
  </Link>
);

export default BrandMark;
