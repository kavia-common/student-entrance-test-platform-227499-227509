import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge, Card, CardHeader, Container } from "~/components/ui";
import { Api } from "~/lib/api.server";
import { getUserFromSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Result detail • Student Entrance Test" }];

// PUBLIC_INTERFACE
export async function loader({ request, params }: LoaderFunctionArgs) {
  /** Result detail loader: requires auth and fetches a single result. */
  const user = await getUserFromSession(request);
  if (!user) return redirect(`/login?redirectTo=${encodeURIComponent(`/results/${params.resultId || ""}`)}`);

  const resultId = params.resultId;
  if (!resultId) throw new Response("resultId required", { status: 400 });

  const { result } = await Api.getResult(request, resultId);
  return json({ result });
}

export default function ResultDetailRoute() {
  const { result } = useLoaderData<typeof loader>();

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Result</h1>
          <p className="mt-1 text-sm text-slate-600">
            Attempt <span className="font-medium text-slate-900">{result.attemptId}</span> • Quiz{" "}
            <span className="font-medium text-slate-900">{result.quizId}</span>
          </p>
        </div>
        <Link to="/results" className="text-sm font-medium text-blue-700 hover:underline">
          Back to results
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Score summary" subtitle="Overall performance for this attempt" />
            <div className="px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={result.passed ? "success" : "danger"}>{result.passed ? "Passed" : "Not passed"}</Badge>
                <Badge tone="neutral">{Math.round(result.percent)}%</Badge>
                <Badge tone="warning">Grade {result.grade}</Badge>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Points</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {result.earnedPoints} <span className="text-slate-500">/ {result.totalPoints}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-600">
                Created at: <span className="font-medium text-slate-900">{new Date(result.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardHeader title="Per-question breakdown" subtitle="Correct answer vs your selection" />
            <div className="divide-y divide-slate-200">
              {result.breakdown.map((b, idx) => (
                <div key={`${b.questionId}_${idx}`} className="px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm text-slate-500">Question</div>
                      <div className="mt-1 font-semibold text-slate-900">{b.questionId}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={b.isCorrect ? "success" : "danger"}>{b.isCorrect ? "Correct" : "Incorrect"}</Badge>
                      <Badge tone="neutral">
                        {b.earnedPoints}/{b.points} pt
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-slate-500">Your selection</div>
                      <div className="mt-1 font-medium text-slate-900">{b.selectedOptionId ?? "—"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-slate-500">Correct option</div>
                      <div className="mt-1 font-medium text-slate-900">{b.correctOptionId}</div>
                    </div>
                  </div>
                </div>
              ))}
              {result.breakdown.length === 0 ? (
                <div className="px-6 py-6 text-sm text-slate-600">No breakdown available.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
