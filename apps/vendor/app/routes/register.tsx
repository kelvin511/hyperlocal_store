import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/register";
import { ApiError, login, registerVendor } from "~/lib/api.server";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/password-input";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Vendor registration" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const get = (key: string) => String(form.get(key) ?? "").trim();
  const values = {
    name: get("name"),
    handle: get("handle"),
    latitude: get("latitude"),
    longitude: get("longitude"),
    logo: get("logo"),
    first_name: get("first_name"),
    last_name: get("last_name"),
    email: get("email"),
  };
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");

  const fail = (error: string) => ({ error, values });

  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);
  if (!values.latitude || !values.longitude || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return fail("Latitude and longitude must be numbers.");
  }
  if (password !== confirm) return fail("Passwords do not match.");

  try {
    await registerVendor({
      name: values.name,
      handle: values.handle,
      latitude,
      longitude,
      logo: values.logo || undefined,
      admin: {
        email: values.email,
        password,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
      },
    });
    const token = await login(values.email, password);
    return redirect("/", { headers: await createSessionHeaders(token) });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.message);
    throw e;
  }
}

export default function Register({ actionData }: Route.ComponentProps) {
  const submitting = useNavigation().state === "submitting";
  const v = actionData?.values;
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(null);

  const useMyLocation = () =>
    navigator.geolocation?.getCurrentPosition((pos) =>
      setCoords({
        lat: String(pos.coords.latitude),
        lng: String(pos.coords.longitude),
      }),
    );

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Register your store</CardTitle>
          <CardDescription>Create a vendor account to start selling.</CardDescription>
        </CardHeader>
        <Form method="post">
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Store name</FieldLabel>
                <Input id="name" name="name" defaultValue={v?.name} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="handle">Store handle</FieldLabel>
                <Input
                  id="handle"
                  name="handle"
                  placeholder="fresh-mart"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  defaultValue={v?.handle}
                  required
                />
                <FieldDescription>
                  Lowercase letters, numbers and hyphens only.
                </FieldDescription>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    key={coords?.lat}
                    defaultValue={coords?.lat ?? v?.latitude}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    key={coords?.lng}
                    defaultValue={coords?.lng ?? v?.longitude}
                    required
                  />
                </Field>
              </div>
              <Button type="button" variant="outline" onClick={useMyLocation}>
                Use my current location
              </Button>
              <Field>
                <FieldLabel htmlFor="logo">Logo URL (optional)</FieldLabel>
                <Input id="logo" name="logo" type="url" defaultValue={v?.logo} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="first_name">First name</FieldLabel>
                  <Input id="first_name" name="first_name" defaultValue={v?.first_name} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last_name">Last name</FieldLabel>
                  <Input id="last_name" name="last_name" defaultValue={v?.last_name} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={v?.email}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm_password">Confirm password</FieldLabel>
                <PasswordInput
                  id="confirm_password"
                  name="confirm_password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
              {actionData?.error && <FieldError>{actionData.error}</FieldError>}
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-muted-foreground text-xs">
              Already registered?{" "}
              <Button variant="link" size="sm" className="h-auto p-0" nativeButton={false} render={<Link to="/login" />}>Sign in</Button>
            </p>
          </CardFooter>
        </Form>
      </Card>
    </main>
  );
}
