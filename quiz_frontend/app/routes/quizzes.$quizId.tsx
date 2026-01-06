import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation } from "@remix-run/react";
import { Badge, Button, Card, CardHeader, Container } from "~/components/ui";
import { Api, ApiClientError } from "~/lib/api.server";
import { flashMessage, getUserFromSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Quiz detail • Student Entrance Test" }];

// PUBLIC_INTERFACE
export async function loader({ request, params }: LoaderFunctionArgs) {
  /** Quiz detail loader: fetch quiz information. */
  const quizId = params.quizId;
  if (!quizId) throw new Response("quizId required", { status: 400 });

  const { quiz } = await Api.getQuiz(request, quizId);
  const user = await getUserFromSession(request);

  return json({ quiz, user });
}

// PUBLIC_INTERFACE
export async function action({ request, params }: ActionFunctionArgs) {
  /** Start attempt action: requires authentication, then creates attempt and redirects to take flow. */
  const quizId = params.quizId;
  if (!quizId) throw new Response("quizId required", { status: 400 });

  const user = await getUserFromSession(request);
  if (!user) {
    return redirect(`/login?redirectTo=${encodeURIComponent(`/quizzes/${quizId}`)}`);
  }

  try {
    const { attempt } = await Api.startAttempt(request, quizId);
    return redirect(`/attempts/${attempt.id}?quizId=${encodeURIComponent(quizId)}`);
  } catch (e) {
    const msg = e instanceof ApiClientError ? e.message : "Unable to start attempt";
    const flashCookie = await flashMessage(request, { type: "error", message: msg });
    return redirect(`/quizzes/${quizId}`, { headers: { "Set-Cookie": flashCookie } });
  }
}

export default function QuizDetailRoute() {
  const { quiz, user } = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <Container>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader title={quiz.title} subtitle={quiz.description || "No description provided."} />
            <div className="px-6 py-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{quiz.timeLimitSeconds ? `${Math.round((quiz.timeLimitSeconds ?? 0) / 60)} min timer` : "No timer"}</Badge>
                <Badge tone="warning">Passing {quiz.passingPercent ?? 60}%</Badge>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Form method="post">
                  <Button type="submit" variant="primary" disabled={busy}>
                    {busy ? "Starting..." : "Start attempt"}
                  </Button>
                </Form>
                <Link to="/quizzes">
                  <Button variant="ghost">Back to catalog</Button>
                </Link>
              </div>

              {!user ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  You’re not logged in. You can view quiz details, but you need an account to start an attempt.
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader title="Tips" subtitle="Make the most of your attempt" />
            <div className="space-y-3 px-6 py-6 text-sm text-slate-700">
              <div>• Read each prompt carefully before selecting an answer.</div>
              <div>• Keep an eye on the timer and pace yourself.</div>
              <div>• Submit when ready—your results will be saved automatically.</div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
