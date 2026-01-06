import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import { z } from "zod";
import { Button, Card, CardHeader, Container, Input } from "~/components/ui";
import { Api, ApiClientError } from "~/lib/api.server";
import { flashMessage, setAuthSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Login • Student Entrance Test" }];

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type ActionData =
  | {
      fieldErrors?: { email?: string; password?: string };
      formError?: string;
    }
  | undefined;

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Login action: verify credentials and store token in session. */
  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") || "/quizzes");

  const parsed = schema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return json<ActionData>(
      {
        fieldErrors: {
          email: flat.email?.[0],
          password: flat.password?.[0],
        },
      },
      { status: 400 }
    );
  }

  try {
    const auth = await Api.login(request, parsed.data);
    const setCookie = await setAuthSession(request, { token: auth.token, user: auth.user });
    const flashCookie = await flashMessage(request, { type: "success", message: "Logged in successfully." });

    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": [setCookie, flashCookie],
      },
    });
  } catch (e) {
    const msg = e instanceof ApiClientError ? e.message : "Login failed";
    return json<ActionData>({ formError: msg }, { status: 401 });
  }
}

export default function LoginRoute() {
  const data = useActionData<typeof action>();
  const nav = useNavigation();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/quizzes";
  const busy = nav.state !== "idle";

  return (
    <Container>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader title="Welcome back" subtitle="Log in to continue" />
          <div className="px-6 py-6">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                error={data?.fieldErrors?.email}
                placeholder="student@example.com"
              />
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                error={data?.fieldErrors?.password}
              />

              {data?.formError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{data.formError}</div> : null}

              <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </Form>

            <div className="mt-4 text-center text-sm text-slate-600">
              New here?{" "}
              <Link className="font-medium text-blue-700 hover:underline" to="/register">
                Create an account
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
