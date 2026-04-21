import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { APP_BY_KEY, fmtSeconds } from "@/lib/apps-catalog";
import { BarChart3 } from "lucide-react";

type Session = {
  id: string;
  app_key: string;
  app_name: string;
  duration_seconds: number;
  started_at: string;
};

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data } = await supabase
        .from("usage_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("started_at", since.toISOString())
        .order("started_at", { ascending: false });
      setSessions((data ?? []) as Session[]);
      setLoading(false);
    })();
  }, [user]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotals = useMemo(() => {
    const map: Record<string, { name: string; secs: number }> = {};
    sessions
      .filter((s) => s.started_at.slice(0, 10) === todayKey)
      .forEach((s) => {
        const cur = map[s.app_key] ?? { name: s.app_name, secs: 0 };
        cur.secs += s.duration_seconds;
        map[s.app_key] = cur;
      });
    return Object.entries(map).sort((a, b) => b[1].secs - a[1].secs);
  }, [sessions, todayKey]);

  const totalToday = todayTotals.reduce((acc, [, v]) => acc + v.secs, 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl text-foreground">Session Reports</h1>
        <p className="text-sm text-muted-foreground">
          See exactly how long you used each app.
        </p>
      </header>

      <div className="mb-6 rounded-3xl bg-flow p-6 text-primary-foreground shadow-soft">
        <div className="text-xs uppercase tracking-wider opacity-80">
          Today's screen time
        </div>
        <div className="mt-1 font-display text-6xl">{fmtSeconds(totalToday)}</div>
        <div className="mt-1 text-sm opacity-85">
          {todayTotals.length} app{todayTotals.length === 1 ? "" : "s"} used today
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-2xl text-foreground">By app — today</h2>
        {todayTotals.length === 0 ? (
          <EmptyState
            text={loading ? "Loading…" : "No sessions today yet. Open an app to start tracking."}
          />
        ) : (
          <div className="space-y-2">
            {todayTotals.map(([key, v]) => {
              const app = APP_BY_KEY[key];
              const pct = totalToday ? (v.secs / totalToday) * 100 : 0;
              return (
                <div key={key} className="rounded-2xl bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{app?.emoji ?? "📱"}</div>
                      <div className="font-medium">{v.name}</div>
                    </div>
                    <div className="font-mono text-sm tabular-nums">
                      {fmtSeconds(v.secs)}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl text-foreground">Recent sessions</h2>
        {sessions.length === 0 ? (
          <EmptyState text="Your last 7 days of sessions will appear here." />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            {sessions.slice(0, 30).map((s) => {
              const app = APP_BY_KEY[s.app_key];
              const d = new Date(s.started_at);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{app?.emoji ?? "📱"}</div>
                    <div>
                      <div className="text-sm font-medium">{s.app_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-sm tabular-nums">
                    {fmtSeconds(s.duration_seconds)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-sm">
      <BarChart3 className="h-8 w-8 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
