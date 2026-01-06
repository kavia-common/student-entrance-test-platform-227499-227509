import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge, Card, Container } from "~/components/ui";
import { Api } from "~/lib/api.server";

export const meta: MetaFunction = () => [{ title: "Quizzes • Student Entrance Test" }];

// PUBLIC_INTERFACE
export async function loader({ request }: LoaderFunctionArgs) {
  /** Quiz catalog loader: fetch published quizzes. */
  const { quizzes } = await Api.listQuizzes(request, true);
  return json({ quizzes });
}

export default function QuizzesIndexRoute() {
  const { quizzes } = useLoaderData<typeof loader>();

  return (
    <Container>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quiz catalog</h1>
          <p className="mt-1 text-sm text-slate-600">Select a quiz to view details and start an attempt.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No published quizzes yet.
          </div>
        ) : (
          quizzes.map((q) => (
            <Link key={q.id} to={`/quizzes/${q.id}`} className="group">
              <Card className="h-full">
                <div className="px-6 py-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition">
                      {q.title}
                    </h2>
                    <Badge tone="neutral">{q.timeLimitSeconds ? `${Math.round(q.timeLimitSeconds / 60)} min` : "No timer"}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{q.description || "No description."}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Badge tone="warning">Passing {q.passingPercent ?? 60}%</Badge>
                    {q.published ? <Badge tone="neutral">Published</Badge> : null}
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
