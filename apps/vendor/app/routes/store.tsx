import { useEffect, useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/store";
import { ApiError, deleteStore, getStore, updateStore } from "~/lib/api.server";
import {
  destroySessionHeaders,
  getToken,
  requireVendor,
} from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Container,
  ContainerHeader,
  SectionRow,
} from "~/components/container";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Store settings" }];
}

export const handle = { title: "Store settings" };

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
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (actionData?.saved) setEditing(false);
  }, [actionData]);

  return (
    <div className="flex flex-col gap-4">
      <Container>
        {editing ? (
          <Form method="post" className="divide-border divide-y">
            <ContainerHeader
              title="Edit general information"
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    name="intent"
                    value="update"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting && !deleting ? "Saving..." : "Save"}
                  </Button>
                </>
              }
            />
            <SectionRow title="Name">
              <Input name="name" defaultValue={store.name ?? ""} required />
            </SectionRow>
            <SectionRow title="Handle">
              <Input
                name="handle"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                defaultValue={store.handle}
                required
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Lowercase letters, numbers and hyphens only.
              </p>
            </SectionRow>
            <SectionRow title="Logo URL">
              <Input name="logo" type="url" defaultValue={store.logo ?? ""} />
            </SectionRow>
            <SectionRow title="Latitude">
              <Input
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                defaultValue={store.latitude}
                required
              />
            </SectionRow>
            <SectionRow title="Longitude">
              <Input
                name="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                defaultValue={store.longitude}
                required
              />
            </SectionRow>
            {actionData?.error && (
              <div className="px-6 py-3">
                <FieldError>{actionData.error}</FieldError>
              </div>
            )}
          </Form>
        ) : (
          <>
            <ContainerHeader
              title="General"
              description="Your store details and location."
              actions={
                <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              }
            />
            <dl className="divide-border divide-y">
              <SectionRow title="Name">{store.name ?? "-"}</SectionRow>
              <SectionRow title="Handle">{store.handle}</SectionRow>
              <SectionRow title="Logo">
                {store.logo ? (
                  <img
                    src={store.logo}
                    alt={`${store.name ?? store.handle} logo`}
                    className="size-10 rounded-md border object-cover"
                  />
                ) : (
                  "-"
                )}
              </SectionRow>
              <SectionRow title="Latitude">{store.latitude}</SectionRow>
              <SectionRow title="Longitude">{store.longitude}</SectionRow>
            </dl>
            {actionData?.saved && (
              <p className="px-6 py-3 text-[13px] text-green-600">
                Your store has been updated.
              </p>
            )}
          </>
        )}
      </Container>

      <Container>
        <ContainerHeader
          title="Delete store"
          description="Deleting your store also removes all of its admin accounts, and you will be signed out immediately."
          actions={
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm("Delete this store and all of its admin accounts?")) {
                  e.preventDefault();
                }
              }}
            >
              <Button
                type="submit"
                name="intent"
                value="delete"
                variant="destructive"
                size="lg"
                disabled={submitting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </Form>
          }
        />
      </Container>
    </div>
  );
}
