import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, LayoutDashboard, CalendarDays, Scale, User, LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "@/lib/health";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tracker", label: "Daily Tracker", icon: CalendarDays },
  { to: "/weight", label: "Weight Progress", icon: Scale },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const name = profile?.full_name?.trim() || "Your account";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Brand />
        <div className="mt-6 flex-1">{navLinks}</div>
        <div className="border-t border-sidebar-border pt-4">
          <p className="truncate px-3 text-sm font-medium">{name}</p>
          <Button variant="ghost" className="mt-2 w-full justify-start gap-3" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div
        className={cn(
          "border-b border-border bg-card px-4 py-3 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <p className="mb-2 truncate px-3 text-sm font-medium">{name}</p>
        {navLinks}
      </div>

      <main className="px-4 py-6 md:ml-64 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Activity className="h-4 w-4" />
      </span>
      <span className="text-lg font-semibold tracking-tight">HealthTrack</span>
    </div>
  );
}
