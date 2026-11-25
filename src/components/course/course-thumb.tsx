import { BarChart3, Brain, Code2, Database, Palette, GitBranch, LineChart, Megaphone, Smartphone, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const palettes = [
  ["#ff69b4", "#9b3dd6"],
  ["#d63384", "#ff9a5a"],
  ["#7c3aed", "#ff69b4"],
  ["#1e1233", "#d63384"],
  ["#0f766e", "#7c3aed"],
  ["#db2777", "#4f46e5"],
];

const iconFor = (key: string) => {
  const k = key.toLowerCase();
  if (/\b(ai|ml)\b|machine|artificial/.test(k)) return Brain;
  if (k.includes("data") || k.includes("sql")) return Database;
  if (k.includes("mobile") || k.includes("flutter") || k.includes("android")) return Smartphone;
  if (/design|\bui\b|ux/.test(k)) return Palette;
  if (k.includes("git") || k.includes("devops")) return GitBranch;
  if (k.includes("python")) return Terminal;
  if (k.includes("market")) return Megaphone;
  if (k.includes("analy")) return LineChart;
  if (k.includes("career") || k.includes("interview")) return BarChart3;
  if (k.includes("web") || k.includes("java") || k.includes("react")) return Code2;
  return Sparkles;
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Course thumbnail: uses the uploaded image, otherwise a branded generated cover. */
export function CourseThumb({
  title,
  thumbnail,
  category,
  className,
  size = "md",
}: {
  title: string;
  thumbnail?: string | null;
  category?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={thumbnail} alt="" className={cn("aspect-video w-full object-cover", className)} loading="lazy" />
    );
  }
  const [a, b] = palettes[hash(title) % palettes.length]!;
  const Icon = iconFor(`${category ?? ""} ${title}`);
  return (
    <div
      className={cn("relative aspect-video w-full overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden
    >
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="absolute -right-6 -bottom-8 rounded-full bg-white/10 p-10">
        <Icon className={cn("text-white/80", size === "lg" ? "h-28 w-28" : size === "sm" ? "h-10 w-10" : "h-16 w-16")} strokeWidth={1.4} />
      </div>
      {size !== "sm" ? (
        <div className="absolute inset-x-0 top-0 p-4">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">She Learn</span>
          <p className={cn("mt-1 line-clamp-2 max-w-[75%] font-bold leading-tight text-white", size === "lg" ? "text-2xl" : "text-base")}>
            {title}
          </p>
        </div>
      ) : null}
    </div>
  );
}
