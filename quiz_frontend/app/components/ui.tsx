import type { PropsWithChildren } from "react";
import { Link, NavLink } from "@remix-run/react";

export function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function Container({ children }: PropsWithChildren) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

export function Card({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <div
      className={classNames(
        "rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-200 px-6 py-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  name,
  value,
  className,
}: PropsWithChildren<{
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}>) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes =
    size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm";
  const variants: Record<string, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
    secondary:
      "bg-amber-500 text-slate-900 hover:bg-amber-400 focus:ring-amber-500",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      className={classNames(base, sizes, variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={classNames(
          "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:border-blue-400 focus:ring-blue-200",
          "focus:ring-2"
        )}
      />
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "success" | "warning" | "danger" }>) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-amber-100 text-amber-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
  };
  return <span className={classNames("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function AppHeader({
  user,
}: {
  user?: { id: string; email: string; role: string };
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-sm" aria-hidden />
            <div>
              <div className="text-sm font-semibold text-slate-900">Entrance Test</div>
              <div className="text-xs text-slate-500">Ocean Professional</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/quizzes"
              className={({ isActive }) =>
                classNames(
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                )
              }
            >
              Quizzes
            </NavLink>
            <NavLink
              to="/results"
              className={({ isActive }) =>
                classNames(
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                )
              }
            >
              Results
            </NavLink>

            <div className="ml-2 flex items-center gap-2">
              {user ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      classNames(
                        "rounded-xl px-3 py-2 text-sm font-medium transition",
                        isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                      )
                    }
                    title={user.email}
                  >
                    Profile
                  </NavLink>
                  <form method="post" action="/logout">
                    <Button variant="ghost" size="sm">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="secondary" size="sm">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </Container>
    </header>
  );
}

export function Toast({ flash }: { flash?: { type: "success" | "error" | "info"; message: string } }) {
  if (!flash) return null;

  const tone =
    flash.type === "success"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : flash.type === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-30 px-4">
      <div className="mx-auto max-w-2xl">
        <div className={classNames("pointer-events-auto rounded-2xl border px-4 py-3 shadow-sm", tone)}>
          <div className="text-sm font-medium">{flash.message}</div>
        </div>
      </div>
    </div>
  );
}
