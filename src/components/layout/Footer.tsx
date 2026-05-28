import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border/60 mt-24">
      <div className="container mx-auto px-4 py-10 grid gap-6 md:grid-cols-4 text-sm">
        <div>
          <Logo className="mb-3" />
          <p className="text-muted-foreground">Learn in-demand skills from world-class instructors.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Explore</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/search">Search</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Company</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground pb-6">© {new Date().getFullYear()} SkillWave</div>
    </footer>
  );
}
