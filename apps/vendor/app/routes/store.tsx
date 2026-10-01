import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/store";
import { ApiError, deleteStore, getStore, updateStore } from "~/lib/api.server";
import {
  destroySessionHeaders,
  getToken,
  requireVendor,
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

export function meta({}: Route.MetaArgs) {
  return [{ title: "Store settings" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireVendor(request);
  const token = (await getToken(request))!;
  return { store: await getStore(token) };
}

export async function action({ request }: Route.ActionArgs) {
  await requireVendor(request);
  const token = (await getToken(request))!;
  const form = await request.formData();

  try {
    if (form.get("intent") === "delete") {
      await deleteStore(token);
      return redirect("/login", { headers: await destroySessionHeaders() });
    }

    const get = (key: string) => String(form.get(key) ?? "").trim();
    const latitude = Number(get("latitude"));
    const longitude = Number(get("longitude"));
    if (!get("latitude") || !get("longitude") || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return { error: "Latitude and longitude must be numbers.", saved: false };
    }

    await updateStore(token, {
      name: get("name"),
      handle: get("handle"),
      logo: get("logo") || null,
      latitude,
      longitude,
    });
    return { error: null, saved: true };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message, saved: false };
    throw e;
  }
}

export default function StoreSettings({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { store } = loaderData;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const deleting = submitting && navigation.formData?.get("intent") === "delete";

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Store settings</CardTitle>
          <CardDescription>Update how your store appears to customers.</CardDescription>
        </CardHeader>
        <Form method="post">
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Store name</FieldLabel>
                <Input id="name" name="name" defaultValue={store.name ?? ""} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="handle">Store handle</FieldLabel>
                <Input
                  id="handle"
                  name="handle"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  defaultValue={store.handle}
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
                    defaultValue={store.latitude}
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
                    defaultValue={store.longitude}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="logo">Logo URL (optional)</FieldLabel>
                <Input id="logo" name="logo" type="url" defaultValue={store.logo ?? ""} />
              </Field>
              {actionData?.error && <FieldError>{actionData.error}</FieldError>}
              {actionData?.saved && (
                <p className="text-sm text-green-600">Store updated.</p>
              )}
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-4 gap-3">
            <Button type="submit" name="intent" value="update" disabled={submitting}>
              {submitting && !deleting ? "Saving..." : "Save changes"}
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link to="/" />}>
              Back
            </Button>
          </CardFooter>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete store</CardTitle>
          <CardDescription>
            This removes your store and all of its admin accounts. You will be signed out.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Form
            method="post"
            onSubmit={(e) => {
              if (!confirm("Delete this store? This cannot be undone from the panel.")) {
                e.preventDefault();
              }
            }}
          >
            <Button
              type="submit"
              name="intent"
              value="delete"
              variant="destructive"
              disabled={submitting}
            >
              {deleting ? "Deleting..." : "Delete store"}
            </Button>
          </Form>
        </CardFooter>
      </Card>
    </main>
  );
}
