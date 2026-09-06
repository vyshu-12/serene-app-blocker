import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Folder, BarChart3, Moon, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV = [
  { to: "/app", label: "Apps", icon: Folder },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/night", label: "Night Lock", icon: Moon },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.02_295)] to-[oklch(0.93_0.05_320)]">
      <header className="bg-flow text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link to="/app" className="font-display text-2xl">
            Focus Flow
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-3 pb-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-1 items-center justify-center gap-2 rounded-t-xl px-4 py-3 text-sm transition-colors ${
                  active
                    ? "bg-background text-foreground font-semibold"
                    : "text-primary-foreground/85 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
