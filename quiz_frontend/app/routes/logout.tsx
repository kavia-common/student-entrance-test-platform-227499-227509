import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { ApiClientError, Api } from "~/lib/api.server";
import { clearAuthSession, flashMessage } from "~/lib/session.server";

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Logout action: revoke token on backend (best-effort) and clear local session. */
  try {
    await Api.logout(request);
  } catch (e) {
    // backend logout failure shouldn't prevent local logout
    if (!(e instanceof ApiClientError)) {
      // ignore
    }
  }

  const setCookie = await clearAuthSession(request);
  const flashCookie = await flashMessage(request, { type: "info", message: "You have been logged out." });

  return redirect("/", {
    headers: {
      "Set-Cookie": [setCookie, flashCookie],
    },
  });
}
