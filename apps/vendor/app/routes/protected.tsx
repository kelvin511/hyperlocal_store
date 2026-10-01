import { Outlet } from "react-router";
import type { Route } from "./+types/protected";
import { requireVendor } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  return { vendorAdmin: await requireVendor(request) };
}

export default function Protected() {
  return <Outlet />;
}
