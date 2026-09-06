import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, BarChart3, Moon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-flow text-primary-foreground">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link to="/" className="font-display text-3xl">
          Focus Flow
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-full px-4 py-2 text-sm hover:bg-white/10"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-primary transition-transform hover:scale-105"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center md:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Reclaim your time, one timer at a time
        </div>
        <h1 className="font-display text-5xl leading-[0.95] md:text-7xl lg:text-8xl">
          Focus on what matters.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base opacity-85 md:text-lg">
          Set time limits on social media, track usage in real reports, and lock
          distracting apps at night.
        </p>
        <div className="mt-10">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-base font-medium text-primary shadow-soft transition-transform hover:scale-105"
          >
            Start focusing
          </Link>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="Apps Folder"
            body="Quick access to social and games — with timers."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Session Reports"
            body="See exactly how long you used each app."
          />
          <FeatureCard
            icon={<Moon className="h-6 w-6" />}
            title="Night Lock"
            body="Block distracting apps during sleeping hours."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 text-left">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        {icon}
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-1 text-sm opacity-85">{body}</p>
    </div>
  );
}
