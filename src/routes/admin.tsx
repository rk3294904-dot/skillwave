import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, BookOpen, FolderTree, Users, Award, MessagesSquare, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNav } from "@/components/layout/MobileNav";

const tabs = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/certificates", label: "Certificates", icon: Award },
  { to: "/admin/reviews", label: "Reviews", icon: MessagesSquare },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — SkillWave" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (!loading) {
      if (!user) nav({ to: "/login" });
      else if (!isAdmin) nav({ to: "/" });
    }
  }, [user, isAdmin, loading, nav]);

  if (loading || !isAdmin) return <div className="p-10">Checking access…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <div className="container mx-auto px-4 py-6 flex-1 pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="rounded-xl border border-border bg-card p-2 h-fit lg:sticky lg:top-20">
            <ul className="space-y-1">
              {tabs.map((t) => {
                const active = t.exact ? path === t.to : path.startsWith(t.to);
                return (
                  <li key={t.to}>
                    <Link to={t.to} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-gradient-primary text-primary-foreground" : "hover:bg-accent"}`}>
                      <t.icon className="h-4 w-4" />{t.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div><Outlet /></div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
