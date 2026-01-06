import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge, Card, Container } from "~/components/ui";
import { Api } from "~/lib/api.server";
import { getUserFromSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Results • Student Entrance Test" }];

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Results history loader: requires auth and lists results for current user. */
  const user = await getUserFromSession(request);
  if (!user) return redirect("/login?redirectTo=/results");

  const { results } = await Api.listMyResults(request);
  return json({ results });
}

export default function ResultsIndexRoute() {
  const { results } = useLoaderData<typeof loader>();

  return (
    <Container>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Your results</h1>
        <p className="mt-1 text-sm text-slate-600">Review past attempts and open a result to see details.</p>
      </div>

      <div className="mt-6 grid gap-4">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No results yet. Start a quiz from the{" "}
            <Link className="font-medium text-blue-700 hover:underline" to="/quizzes">
              catalog
            </Link>
            .
          </div>
        ) : (
          results
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((r) => (
              <Link key={r.id} to={`/results/${r.id}`} className="group">
                <Card>
                  <div className="px-6 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Result ID</div>
                        <div className="mt-1 font-semibold text-slate-900 group-hover:text-blue-700 transition">
                          {r.id}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={r.passed ? "success" : "danger"}>{r.passed ? "Passed" : "Not passed"}</Badge>
                        <Badge tone="neutral">{Math.round(r.percent)}%</Badge>
                        <Badge tone="warning">Grade {r.grade}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      Score: <span className="font-medium text-slate-900">{r.earnedPoints}</span> / {r.totalPoints} • Quiz:{" "}
                      <span className="font-medium text-slate-900">{r.quizId}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
        )}
      </div>
    </Container>
  );
}
