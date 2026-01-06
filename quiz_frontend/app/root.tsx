import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";

import "./tailwind.css";
import { AppHeader, Toast } from "./components/ui";
import { getFlashMessage, getUserFromSession } from "./lib/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Student Entrance Test Platform" },
    { name: "description", content: "Take quizzes, track attempts, and view results." },
  ];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Root loader: provides authenticated user (if any) and flash message for toast UI. */
  const user = await getUserFromSession(request);
  const { message, setCookie } = await getFlashMessage(request);

  return json(
    { user, flash: message },
    setCookie
      ? {
          headers: {
            "Set-Cookie": setCookie,
          },
        }
      : undefined
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <AppHeader user={data.user} />
      <Toast flash={data.flash ?? undefined} />
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-500/10 to-slate-50 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-sm text-slate-600">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Student Entrance Test Platform</div>
            <div>Support: contact@school.example</div>
          </div>
        </div>
      </footer>
    </>
  );
}
