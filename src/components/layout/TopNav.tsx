import { Link, useNavigate } from "@tanstack/react-router";
import { Search, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { StreakChip } from "@/components/StreakChip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
          <Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link>
          <Link to="/my-learning" className="hover:text-foreground transition-colors">My Learning</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <StreakChip />
          <Button variant="ghost" size="icon" onClick={() => nav({ to: "/search" })} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hidden md:inline-flex">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
                    {(user.email ?? "?")[0].toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav({ to: "/profile" })}>
                  <UserIcon className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/my-learning" })}>My Learning</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/certificates" })}>Certificates</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/achievements" })}>Achievements</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/leaderboard" })}>Leaderboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/settings" })}>Settings</DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => nav({ to: "/admin" })}>
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Admin
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); nav({ to: "/" }); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => nav({ to: "/login" })} className="hidden sm:inline-flex">Log in</Button>
              <Button onClick={() => nav({ to: "/signup" })} className="bg-gradient-primary">Sign up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
