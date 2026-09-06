import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-flow px-4">
      <div className="max-w-md text-center text-primary-foreground">
        <h1 className="font-display text-8xl">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm opacity-80">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-primary transition-transform hover:scale-105"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Focus Flow — Take back your attention" },
      {
        name: "description",
        content:
          "Set time limits on social media, track usage in real reports, and lock distracting apps at night.",
      },
      { name: "author", content: "Focus Flow" },
      { property: "og:title", content: "Focus Flow — Take back your attention" },
      { property: "og:description", content: "Focus Flow helps you manage app usage with customizable timers and a night lock feature." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Focus Flow — Take back your attention" },
      { name: "description", content: "Focus Flow helps you manage app usage with customizable timers and a night lock feature." },
      { name: "twitter:description", content: "Focus Flow helps you manage app usage with customizable timers and a night lock feature." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d6bbe7f3-f501-4ece-afbb-472ad945952f/id-preview-fa4e4c12--2929304d-ec9d-4b0e-8f7a-96f5271abeff.lovable.app-1776761518864.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d6bbe7f3-f501-4ece-afbb-472ad945952f/id-preview-fa4e4c12--2929304d-ec9d-4b0e-8f7a-96f5271abeff.lovable.app-1776761518864.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  );
}
