import { Code2, PlayCircle, Search } from "lucide-react";
import type { SheetRow } from "@/server/sheet";

const link = "inline-flex items-center gap-1 text-accent hover:underline";

export function SolutionLinks({ problem }: { problem: SheetRow["problem"] }) {
  const searchUrl = `https://www.youtube.com/@codestorywithMIK/search?query=${encodeURIComponent(problem.videoSearchQuery)}`;

  return (
    <span className="flex items-center gap-3 font-mono text-xs whitespace-nowrap">
      {problem.videoUrl ? (
        <a href={problem.videoUrl} target="_blank" rel="noopener noreferrer" className={link} aria-label={`Video solution for ${problem.title}`}>
          <PlayCircle aria-hidden className="size-3.5" /> Video
        </a>
      ) : (
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className={link} aria-label={`Search videos for ${problem.title}`}>
          <Search aria-hidden className="size-3.5" /> Search
        </a>
      )}
      <a href={problem.codeUrl} target="_blank" rel="noopener noreferrer" className={link} aria-label={`Code solution for ${problem.title}`}>
        <Code2 aria-hidden className="size-3.5" /> Code
      </a>
    </span>
  );
}
