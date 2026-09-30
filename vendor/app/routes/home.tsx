import { Form, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/home";
import type { loader as protectedLoader } from "./protected";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Vendor dashboard" }];
}

export default function Home() {
  const data = useRouteLoaderData<typeof protectedLoader>("routes/protected");
  if (!data) return null;
  const { vendorAdmin } = data;

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {vendorAdmin.vendor.name ?? vendorAdmin.vendor.handle}
          </CardTitle>
          <CardDescription>Signed in as {vendorAdmin.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
