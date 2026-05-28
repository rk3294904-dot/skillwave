import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Search, GraduationCap, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/search", label: "Search", icon: Search },
  { to: "/my-learning", label: "Learning", icon: GraduationCap },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur safe-pb">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <li key={to}>
              <Link to={to} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
