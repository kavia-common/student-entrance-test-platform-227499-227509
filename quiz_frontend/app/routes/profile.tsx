import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Badge, Card, CardHeader, Container } from "~/components/ui";
import { Api, ApiClientError } from "~/lib/api.server";
import { getUserFromSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Profile • Student Entrance Test" }];

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Profile loader: fetch /auth/me to validate token and show current user. */
  const sessionUser = await getUserFromSession(request);
  if (!sessionUser) return redirect("/login?redirectTo=/profile");

  try {
    const { user } = await Api.me(request);
    return json({ user });
  } catch (e) {
    // Token may be invalid/expired; bounce to login
    if (e instanceof ApiClientError && e.status === 401) {
      return redirect("/login?redirectTo=/profile");
    }
    throw e;
  }
}

export default function ProfileRoute() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Container>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader title="Your profile" subtitle="Account details and role" />
          <div className="px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-slate-500">Email</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">User</Badge>
                <Badge tone="warning">{user.role}</Badge>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Tip: Your authentication is stored securely in an httpOnly cookie session.
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
