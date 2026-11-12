import { PROFILE } from "@/content/portfolio";

/** The GitHub link under the identity chip. */
export function ProfileLinks() {
  return (
    <p className="pointer-events-auto mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8.5px] tracking-[0.14em] uppercase sm:text-[10px] sm:tracking-[0.2em]">
      <a
        href={`https://github.com/${PROFILE.github}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#d6c6ab] transition-colors hover:text-[#ffd9a8]"
      >
        GitHub ↗
      </a>
    </p>
  );
}
