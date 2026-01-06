import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge, Button, Card, CardHeader, Container } from "~/components/ui";
import { getUserFromSession } from "~/lib/session.server";

export const meta: MetaFunction = () => {
  return [{ title: "Home • Student Entrance Test" }];
};

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Landing page loader: show whether user is logged in. */
  const user = await getUserFromSession(request);
  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Container>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Badge tone="neutral">Ocean Professional</Badge>
              <Badge tone="warning">Blue + Amber</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Prepare with timed entrance quizzes
            </h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Choose a quiz, answer questions with a timer, submit your attempt, and review results with per-question breakdown.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/quizzes">
                <Button variant="primary">Browse quizzes</Button>
              </Link>
              <Link to="/results">
                <Button variant="ghost">View results</Button>
              </Link>
              {!user ? (
                <Link to="/register">
                  <Button variant="secondary">Create account</Button>
                </Link>
              ) : null}
            </div>

            {user ? (
              <p className="mt-6 text-sm text-slate-600">
                Signed in as <span className="font-medium text-slate-900">{user.email}</span>.
              </p>
            ) : (
              <p className="mt-6 text-sm text-slate-600">
                Sign in to start attempts and save your history.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="How it works" subtitle="Quick steps to complete an attempt" />
            <div className="space-y-4 px-6 py-6">
              <div>
                <div className="text-sm font-semibold text-slate-900">1) Pick a quiz</div>
                <div className="mt-1 text-sm text-slate-600">Open the catalog and review time limits and passing %.</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">2) Answer questions</div>
                <div className="mt-1 text-sm text-slate-600">Select answers and track your remaining time.</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">3) Submit & review</div>
                <div className="mt-1 text-sm text-slate-600">Get a score, grade, and per-question breakdown.</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
