import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
