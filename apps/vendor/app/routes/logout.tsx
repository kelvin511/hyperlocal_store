import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroySessionHeaders } from "~/lib/session.server";

export async function action(_: Route.ActionArgs) {
  return redirect("/login", { headers: await destroySessionHeaders() });
}

export async function loader() {
  return redirect("/");
}
