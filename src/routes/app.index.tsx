import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { APPS, type AppDef, fmtSeconds } from "@/lib/apps-catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Lock, Play, Pause, Square, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";

type TimerRow = {
  id: string;
  app_key: string;
  app_name: string;
  limit_seconds: number;
  used_seconds: number;
  reset_date: string;
};

type NightSettings = {
  enabled: boolean;
  start_hour: number;
  end_hour: number;
  distracting_apps: string[];
  allowed_during_lock: string[];
};

export const Route = createFileRoute("/app/")({
  component: AppsFolder,
});

function isNightNow(s: NightSettings) {
  if (!s.enabled) return false;
  const h = new Date().getHours();
  const { start_hour, end_hour } = s;
  return start_hour < end_hour
    ? h >= start_hour && h < end_hour
    : h >= start_hour || h < end_hour;
}

function AppsFolder() {
  const { user } = useAuth();
  const [timers, setTimers] = useState<TimerRow[]>([]);
  const [night, setNight] = useState<NightSettings | null>(null);
  const [setupApp, setSetupApp] = useState<AppDef | null>(null);
  const [openApp, setOpenApp] = useState<AppDef | null>(null);
  const [setupMinutes, setSetupMinutes] = useState(2);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  async function load() {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: t }, { data: n }] = await Promise.all([
      supabase.from("app_timers").select("*").eq("user_id", user.id),
      supabase.from("night_lock_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    // reset any timers whose date is not today
    const rows = (t ?? []) as TimerRow[];
    const stale = rows.filter((r) => r.reset_date !== today);
    if (stale.length) {
      await supabase
        .from("app_timers")
        .update({ used_seconds: 0, reset_date: today })
        .in(
          "id",
          stale.map((r) => r.id),
        );
      stale.forEach((r) => {
        r.used_seconds = 0;
        r.reset_date = today;
      });
    }
    setTimers(rows);
    if (!n) {
      const { data: created } = await supabase
        .from("night_lock_settings")
        .insert({ user_id: user.id })
        .select()
        .single();
      setNight(created as NightSettings);
    } else {
      setNight(n as NightSettings);
    }
  }

  const timerByKey = useMemo(
    () => Object.fromEntries(timers.map((t) => [t.app_key, t])),
    [timers],
  );

  function isBlockedByNight(app: AppDef) {
    if (!night) return false;
    if (!isNightNow(night)) return false;
    if (!night.distracting_apps.includes(app.key)) return false;
    return !night.allowed_during_lock.includes(app.key);
  }

  function isBlockedByTimer(app: AppDef) {
    const t = timerByKey[app.key];
    if (!t) return false;
    return t.used_seconds >= t.limit_seconds;
  }

  async function handleAppClick(app: AppDef) {
    if (isBlockedByNight(app)) {
      toast.error(`🌙 Night Lock active — ${app.name} is blocked until morning.`);
      return;
    }
    const t = timerByKey[app.key];
    if (!t) {
      setSetupMinutes(2);
      setSetupApp(app);
      return;
    }
    if (t.used_seconds >= t.limit_seconds) {
      toast.error(`⛔ ${app.name} is blocked. You can open tomorrow.`);
      return;
    }
    setOpenApp(app);
  }

  async function setLimit() {
    if (!user || !setupApp) return;
    const limit = Math.max(30, Math.round(setupMinutes * 60));
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("app_timers")
      .upsert(
        {
          user_id: user.id,
          app_key: setupApp.key,
          app_name: setupApp.name,
          limit_seconds: limit,
          used_seconds: 0,
          reset_date: today,
        },
        { onConflict: "user_id,app_key" },
      )
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setTimers((prev) => {
      const others = prev.filter((p) => p.app_key !== setupApp.key);
      return [...others, data as TimerRow];
    });
    toast.success(`Timer set: ${setupMinutes} min for ${setupApp.name}. Tap Open when ready.`);
    setSetupApp(null);
  }

  async function removeTimer(app: AppDef) {
    if (!user) return;
    await supabase
      .from("app_timers")
      .delete()
      .eq("user_id", user.id)
      .eq("app_key", app.key);
    setTimers((prev) => prev.filter((p) => p.app_key !== app.key));
    toast.success(`Removed timer for ${app.name}`);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl text-foreground">Your Apps</h1>
        <p className="text-sm text-muted-foreground">
          Tap an app to use it. New apps need a daily timer first.
        </p>
      </header>

      {night && isNightNow(night) && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-night p-4 text-white">
          <Lock className="mt-0.5 h-5 w-5" />
          <div className="text-sm">
            <div className="font-semibold">Night Lock is active</div>
            <div className="opacity-85">
              Distracting apps are blocked until {night.end_hour}:00. Notifications muted.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {APPS.map((app) => {
          const t = timerByKey[app.key];
          const blockedNight = isBlockedByNight(app);
          const blockedTimer = isBlockedByTimer(app);
          const blocked = blockedNight || blockedTimer;
          const hasTimer = !!t;
          return (
            <div key={app.key} className="group relative">
              <div
                className={`relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br ${app.color} p-3 text-white shadow-soft ${
                  blocked ? "opacity-60" : ""
                }`}
              >
                <div className="text-4xl">{app.emoji}</div>
                <div className="text-xs font-semibold">{app.name}</div>
                {hasTimer && !blocked && (
                  <div className="text-[10px] opacity-90 tabular-nums">
                    {fmtSeconds(Math.max(0, t.limit_seconds - t.used_seconds))} left
                  </div>
                )}
                {blocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/55 backdrop-blur-sm text-center px-2">
                    <Lock className="h-7 w-7" />
                    <div className="mt-1 text-[11px] font-semibold leading-tight">
                      {blockedNight ? "Night Lock" : "Timer completed"}
                    </div>
                    {blockedTimer && !blockedNight && (
                      <div className="text-[10px] opacity-90 leading-tight">Come tomorrow</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-[11px] px-2"
                  onClick={() => {
                    setSetupMinutes(t ? Math.max(1, Math.round(t.limit_seconds / 60)) : 2);
                    setSetupApp(app);
                  }}
                  disabled={blockedNight || blockedTimer}
                >
                  <Timer className="h-3 w-3" />
                  <span className="ml-1">{hasTimer ? "Edit" : "Timer"}</span>
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 rounded-full text-[11px] px-2"
                  onClick={() => handleAppClick(app)}
                  disabled={blocked}
                >
                  <Play className="h-3 w-3" />
                  <span className="ml-1">{blockedTimer ? "Blocked" : "Open"}</span>
                </Button>
              </div>

              {t && (
                <div className="mt-1 text-center text-[10px] text-muted-foreground tabular-nums">
                  {fmtSeconds(t.used_seconds)} / {fmtSeconds(t.limit_seconds)}
                </div>
              )}

              {t && !blockedTimer && (
                <button
                  onClick={() => removeTimer(app)}
                  title="Remove timer"
                  className="absolute -top-2 -right-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-destructive shadow group-hover:flex"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Set timer dialog */}
      <Dialog open={!!setupApp} onOpenChange={(o) => !o && setSetupApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Set timer for {setupApp?.name} {setupApp?.emoji}
            </DialogTitle>
            <DialogDescription>
              Once today's limit is reached, this app will be blocked until tomorrow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-3 text-center font-display text-5xl text-primary">
              {setupMinutes} min
            </div>
            <Slider
              value={[setupMinutes]}
              onValueChange={(v) => setSetupMinutes(v[0])}
              min={1}
              max={120}
              step={1}
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>1 min</span>
              <span>120 min</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupApp(null)}>
              Cancel
            </Button>
            <Button onClick={setLimit}>Save timer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open app session */}
      {openApp && (
        <AppSessionDialog
          app={openApp}
          timer={timerByKey[openApp.key]}
          onClose={() => setOpenApp(null)}
          onTick={(usedSeconds) => {
            setTimers((prev) =>
              prev.map((p) =>
                p.app_key === openApp.key ? { ...p, used_seconds: usedSeconds } : p,
              ),
            );
          }}
        />
      )}
    </div>
  );
}

function AppSessionDialog({
  app,
  timer,
  onClose,
  onTick,
}: {
  app: AppDef;
  timer: TimerRow | undefined;
  onClose: () => void;
  onTick: (usedSeconds: number) => void;
}) {
  const { user } = useAuth();
  const [running, setRunning] = useState(true);
  const [used, setUsed] = useState(timer?.used_seconds ?? 0);
  const startedAt = useRef<Date>(new Date());
  const sessionStart = useRef<number>(used);
  const externalWindow = useRef<Window | null>(null);
  const opened = useRef(false);

  const limit = timer?.limit_seconds ?? 0;
  const remaining = Math.max(0, limit - used);
  const expired = used >= limit;

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    try {
      externalWindow.current = window.open(app.url, `focusflow_${app.key}`);
      if (!externalWindow.current) {
        toast.error("Popup blocked — please allow popups for Focus Flow.");
      } else {
        toast.success(`Opened ${app.name}. Timer is running.`);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running || expired) return;
    const id = window.setInterval(() => {
      setUsed((u) => {
        const next = u + 1;
        onTick(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, expired, onTick]);

  useEffect(() => {
    if (!expired) return;
    setRunning(false);
    if (externalWindow.current && !externalWindow.current.closed) {
      try {
        externalWindow.current.close();
      } catch {
        // ignore
      }
    }
    toast.error(`⛔ ${app.name} is blocked. You can open tomorrow.`);
  }, [expired, app.name]);

  async function persist() {
    if (!user) return;
    const sessionDuration = used - sessionStart.current;
    await supabase
      .from("app_timers")
      .update({ used_seconds: used, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("app_key", app.key);
    if (sessionDuration > 0) {
      await supabase.from("usage_sessions").insert({
        user_id: user.id,
        app_key: app.key,
        app_name: app.name,
        duration_seconds: sessionDuration,
        started_at: startedAt.current.toISOString(),
        ended_at: new Date().toISOString(),
      });
    }
  }

  async function handleClose() {
    if (externalWindow.current && !externalWindow.current.closed) {
      try {
        externalWindow.current.close();
      } catch {
        // ignore
      }
    }
    await persist();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className={`bg-gradient-to-br ${app.color} p-8 text-center text-white`}>
          <div className="text-6xl">{app.emoji}</div>
          <div className="mt-2 font-display text-3xl">{app.name}</div>
          {!expired ? (
            <>
              <div className="mt-6 font-display text-7xl tabular-nums">
                {fmtSeconds(remaining)}
              </div>
              <div className="text-xs opacity-85">
                remaining — {app.name} is open in a new tab
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="mt-6">
              <Lock className="mx-auto h-12 w-12" />
              <div className="mt-3 font-display text-2xl">App is blocked</div>
              <div className="mt-1 text-sm opacity-90">
                You can open {app.name} tomorrow.
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-2 bg-background p-4">
          {!expired ? (
            <>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={() => setRunning((r) => !r)}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="ml-1">{running ? "Pause" : "Resume"}</span>
              </Button>
              <Button size="lg" className="rounded-full" onClick={handleClose}>
                <Square className="h-4 w-4" />
                <span className="ml-1">Stop & save</span>
              </Button>
            </>
          ) : (
            <Button size="lg" className="rounded-full" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
