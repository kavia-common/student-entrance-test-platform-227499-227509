import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { Button, Card, CardHeader, Container, Input } from "~/components/ui";
import { Api, ApiClientError } from "~/lib/api.server";
import { flashMessage, setAuthSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Register • Student Entrance Test" }];

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ActionData =
  | {
      fieldErrors?: { email?: string; password?: string };
      formError?: string;
    }
  | undefined;

// PUBLIC_INTERFACE
export async function action({ request }: ActionFunctionArgs) {
  /** Register action: create user via backend and store token in session. */
  const formData = await request.formData();
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
    const auth = await Api.register(request, parsed.data);
    const setCookie = await setAuthSession(request, { token: auth.token, user: auth.user });
    const flashCookie = await flashMessage(request, { type: "success", message: "Welcome! Your account is ready." });

    return redirect("/quizzes", {
      headers: {
        "Set-Cookie": [setCookie, flashCookie],
      },
    });
  } catch (e) {
    const msg = e instanceof ApiClientError ? e.message : "Registration failed";
    return json<ActionData>({ formError: msg }, { status: 400 });
  }
}

export default function RegisterRoute() {
  const data = useActionData<typeof action>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <Container>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader title="Create your account" subtitle="Register to start timed quiz attempts" />
          <div className="px-6 py-6">
            <Form method="post" className="space-y-4">
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
                autoComplete="new-password"
                error={data?.fieldErrors?.password}
                placeholder="At least 6 characters"
              />

              {data?.formError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{data.formError}</div> : null}

              <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
                {busy ? "Creating..." : "Create account"}
              </Button>
            </Form>

            <div className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link className="font-medium text-blue-700 hover:underline" to="/login">
                Log in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
