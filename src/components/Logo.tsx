import logo from "@/assets/logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ className = "", showText = false }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="SkillWave home">
      <img src={logo} alt="SkillWave" width={140} height={40} className="h-9 w-auto" />
      {showText && <span className="sr-only">SkillWave</span>}
    </Link>
  );
}
