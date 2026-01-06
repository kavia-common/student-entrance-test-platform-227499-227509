import { Outlet } from "@remix-run/react";

// PUBLIC_INTERFACE
export default function QuizzesLayoutRoute() {
  /** Quizzes layout route provides an outlet for list + detail routes. */
  return <Outlet />;
}
