import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`} aria-label="SkillWave home">
      <span
        aria-hidden
        className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground font-extrabold text-lg shadow-glow"
      >
        S
      </span>
      <span className="font-extrabold text-xl tracking-tight leading-none">
        <span className="bg-gradient-primary bg-clip-text text-transparent">Skill</span>
        <span className="text-foreground">Wave</span>
      </span>
    </Link>
  );
}
