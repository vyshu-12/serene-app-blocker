import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { APPS } from "@/lib/apps-catalog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Moon, BellOff } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  user_id: string;
  enabled: boolean;
  start_hour: number;
  end_hour: number;
  mute_notifications: boolean;
  distracting_apps: string[];
  allowed_during_lock: string[];
};

export const Route = createFileRoute("/app/night")({
  component: NightLockPage,
});

function fmtHour(h: number) {
  const am = h < 12;
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${am ? "AM" : "PM"}`;
}

function NightLockPage() {
  const { user } = useAuth();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let { data } = await supabase
        .from("night_lock_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) {
        const { data: created } = await supabase
          .from("night_lock_settings")
          .insert({ user_id: user.id })
          .select()
          .single();
        data = created;
      }
      setS(data as Settings);
    })();
  }, [user]);

  if (!s) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  function toggleAllowed(key: string) {
    setS((prev) => {
      if (!prev) return prev;
      const has = prev.allowed_during_lock.includes(key);
      return {
        ...prev,
        allowed_during_lock: has
          ? prev.allowed_during_lock.filter((k) => k !== key)
          : [...prev.allowed_during_lock, key],
      };
    });
  }

  function toggleDistracting(key: string) {
    setS((prev) => {
      if (!prev) return prev;
      const has = prev.distracting_apps.includes(key);
      return {
        ...prev,
        distracting_apps: has
          ? prev.distracting_apps.filter((k) => k !== key)
          : [...prev.distracting_apps, key],
      };
    });
  }

  async function save() {
    if (!user || !s) return;
    setSaving(true);
    const { error } = await supabase
      .from("night_lock_settings")
      .update({
        enabled: s.enabled,
        start_hour: s.start_hour,
        end_hour: s.end_hour,
        mute_notifications: s.mute_notifications,
        distracting_apps: s.distracting_apps,
        allowed_during_lock: s.allowed_during_lock,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Night Lock saved");
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl text-foreground">Night Lock</h1>
        <p className="text-sm text-muted-foreground">
          Block distracting apps and mute notifications during your sleep hours.
        </p>
      </header>

      <div className="mb-6 overflow-hidden rounded-3xl bg-night p-6 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <Moon className="h-6 w-6" />
          <div className="flex-1">
            <div className="font-display text-2xl">Lock window</div>
            <div className="text-sm opacity-85">
              {fmtHour(s.start_hour)} → {fmtHour(s.end_hour)}
            </div>
          </div>
          <Switch
            checked={s.enabled}
            onCheckedChange={(v) => setS({ ...s, enabled: v })}
          />
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-2 flex justify-between text-xs uppercase tracking-wider opacity-80">
              <span>Start</span>
              <span>{fmtHour(s.start_hour)}</span>
            </div>
            <Slider
              value={[s.start_hour]}
              onValueChange={(v) => setS({ ...s, start_hour: v[0] })}
              min={0}
              max={23}
              step={1}
            />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs uppercase tracking-wider opacity-80">
              <span>End</span>
              <span>{fmtHour(s.end_hour)}</span>
            </div>
            <Slider
              value={[s.end_hour]}
              onValueChange={(v) => setS({ ...s, end_hour: v[0] })}
              min={0}
              max={23}
              step={1}
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <BellOff className="h-5 w-5" />
            <div className="flex-1 text-sm">
              <div className="font-medium">Mute notifications</div>
              <div className="text-xs opacity-80">
                Silence pings from distracting apps overnight.
              </div>
            </div>
            <Switch
              checked={s.mute_notifications}
              onCheckedChange={(v) => setS({ ...s, mute_notifications: v })}
            />
          </div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-1 font-display text-2xl text-foreground">Distracting apps</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          These get blocked during the lock window.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {APPS.map((a) => {
            const on = s.distracting_apps.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggleDistracting(a.key)}
                className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm transition-colors ${
                  on
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="flex-1 font-medium">{a.name}</span>
                {on && <span className="text-xs text-primary">●</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 font-display text-2xl text-foreground">
          Allow during lock
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Override: these distracting apps stay open between {fmtHour(s.start_hour)} and{" "}
          {fmtHour(s.end_hour)} (notifications stay muted).
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {APPS.filter((a) => s.distracting_apps.includes(a.key)).map((a) => {
            const on = s.allowed_during_lock.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggleAllowed(a.key)}
                className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm transition-colors ${
                  on ? "border-accent bg-accent/40" : "border-border bg-card"
                }`}
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="flex-1 font-medium">{a.name}</span>
                {on && <span className="text-xs">✓</span>}
              </button>
            );
          })}
          {s.distracting_apps.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              No distracting apps selected.
            </p>
          )}
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          size="lg"
          className="rounded-full shadow-soft"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Night Lock"}
        </Button>
      </div>
    </div>
  );
}
