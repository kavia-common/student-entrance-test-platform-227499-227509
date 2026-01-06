import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Container, classNames } from "~/components/ui";
import type { QuestionPublic, SubmittedAnswer } from "~/lib/api.server";
import { Api, ApiClientError } from "~/lib/api.server";
import { getUserFromSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Attempt • Student Entrance Test" }];

type LoaderData = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  timeLimitSeconds: number | null;
  questions: QuestionPublic[];
};

const submitSchema = z.object({
  attemptId: z.string().min(1),
  // answers[] as JSON string
  answersJson: z.string().min(2),
});

type ActionData =
  | {
      formError?: string;
    }
  | undefined;

// PUBLIC_INTERFACE
export async function loader({ request, params }: LoaderFunctionArgs) {
  /** Attempt loader: requires auth, then fetch quiz and questions by quizId inferred from attempt via start flow. */
  const attemptId = params.attemptId;
  if (!attemptId) throw new Response("attemptId required", { status: 400 });

  // Backend spec doesn't provide attempt lookup; attemptId is needed only for submission.
  // We infer quizId by requiring it to be passed as query param when navigating, but our start flow redirects directly.
  // So instead, we re-start by reading quizId from hidden form field? Not available.
  // Pragmatic approach: store quizId in URL query on redirect from start route.
  // If absent, show a helpful error.
  const url = new URL(request.url);
  const quizId = url.searchParams.get("quizId");

  const user = await getUserFromSession(request);
  if (!user) return redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);

  if (!quizId) {
    throw json(
      { message: "Missing quizId for attempt. Please start the attempt from the quiz detail page again." },
      { status: 400 }
    );
  }

  const [{ quiz }, { questions }] = await Promise.all([Api.getQuiz(request, quizId), Api.listQuestions(request, quizId)]);

  return json<LoaderData>({
    attemptId,
    quizId,
    quizTitle: quiz.title,
    timeLimitSeconds: quiz.timeLimitSeconds ?? null,
    questions,
  });
}

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Attempt submit action: validate answers and submit to backend for scoring. */
  const formData = await request.formData();
  const attemptId = String(formData.get("attemptId") || "");
  const answersJson = String(formData.get("answersJson") || "");

  const parsed = submitSchema.safeParse({ attemptId, answersJson });
  if (!parsed.success) {
    return json<ActionData>({ formError: "Please answer at least one question before submitting." }, { status: 400 });
  }

  let answers: SubmittedAnswer[];
  try {
    answers = JSON.parse(parsed.data.answersJson) as SubmittedAnswer[];
    if (!Array.isArray(answers)) throw new Error("bad");
  } catch {
    return json<ActionData>({ formError: "Invalid answers payload." }, { status: 400 });
  }

  try {
    const { result } = await Api.submitResult(request, { attemptId: parsed.data.attemptId, answers });
    return redirect(`/results/${result.id}`);
  } catch (e) {
    const msg = e instanceof ApiClientError ? e.message : "Submission failed";
    return json<ActionData>({ formError: msg }, { status: 400 });
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AttemptRoute() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  const initialRemaining = useMemo(() => {
    return data.timeLimitSeconds ?? null;
  }, [data.timeLimitSeconds]);

  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) return;

    const t = setInterval(() => setRemaining((r) => (r === null ? null : Math.max(0, r - 1))), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  // Auto-submit when timer reaches zero (best-effort UX)
  const shouldAutoSubmit = remaining === 0 && data.timeLimitSeconds !== null;

  const submittedAnswers: SubmittedAnswer[] = Object.entries(answers)
    .filter(([, selectedOptionId]) => Boolean(selectedOptionId))
    .map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Attempt: {data.quizTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">Select one option per question, then submit for scoring.</p>
        </div>
        <div className="flex items-center gap-2">
          {data.timeLimitSeconds ? (
            <Badge tone={remaining !== null && remaining <= 60 ? "danger" : "neutral"}>
              Time left: {remaining === null ? "—" : formatTime(remaining)}
            </Badge>
          ) : (
            <Badge tone="neutral">No timer</Badge>
          )}
          <Badge tone="warning">{submittedAnswers.length}/{data.questions.length} answered</Badge>
        </div>
      </div>

      <Form method="post" className="space-y-4">
        <input type="hidden" name="attemptId" value={data.attemptId} />
        <input type="hidden" name="answersJson" value={JSON.stringify(submittedAnswers)} />

        {data.questions.map((q, idx) => (
          <Card key={q.id}>
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">Question {idx + 1}</div>
                  <div className="mt-1 text-base font-semibold text-slate-900">{q.prompt}</div>
                </div>
                <Badge tone="neutral">{q.points ?? 1} pt</Badge>
              </div>

              <div className="mt-4 grid gap-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={classNames(
                        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                        selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt.id}
                        checked={selected}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span className="text-slate-800">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}

        {actionData?.formError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionData.formError}</div>
        ) : null}

        <div className="sticky bottom-4 mt-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              {shouldAutoSubmit ? "Time is up. Submit now." : "Review your selections and submit when ready."}
            </div>
            <Button type="submit" variant="primary" disabled={busy || submittedAnswers.length === 0}>
              {busy ? "Submitting..." : "Submit attempt"}
            </Button>
          </div>
        </div>
      </Form>
    </Container>
  );
}
