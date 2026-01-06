import { Outlet } from "@remix-run/react";

// PUBLIC_INTERFACE
export default function ResultsLayoutRoute() {
  /** Results layout route provides an outlet for history + detail routes. */
  return <Outlet />;
}
