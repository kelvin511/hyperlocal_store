import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { ApiError, login } from "~/lib/api.server";
import {
  createSessionHeaders,
  redirectIfAuthenticated,
} from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/password-input";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Vendor login" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required.", email };
  }

  try {
    const token = await login(email, password);
    return redirect("/", { headers: await createSessionHeaders(token) });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, email };
    throw e;
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  const submitting = useNavigation().state === "submitting";

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vendor login</CardTitle>
          <CardDescription>Sign in to manage your store.</CardDescription>
        </CardHeader>
        <Form method="post">
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={actionData?.email}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              {actionData?.error && <FieldError>{actionData.error}</FieldError>}
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-muted-foreground text-xs">
              New vendor?{" "}
              <Button variant="link" size="sm" className="h-auto p-0" nativeButton={false} render={<Link to="/register" />}>Create an account</Button>
            </p>
          </CardFooter>
        </Form>
      </Card>
    </main>
  );
}
