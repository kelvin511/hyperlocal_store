import { useEffect } from "react";
import { Outlet } from "react-router";
import type { Route } from "./+types/protected";
import { requireVendor } from "~/lib/session.server";
import { useVendorStore } from "~/stores/vendor-store";

export async function loader({ request }: Route.LoaderArgs) {
  return { vendorAdmin: await requireVendor(request) };
}

export default function Protected({ loaderData }: Route.ComponentProps) {
  const setVendorAdmin = useVendorStore((s) => s.setVendorAdmin);

  useEffect(() => {
    setVendorAdmin(loaderData.vendorAdmin);
    return () => setVendorAdmin(null);
  }, [loaderData.vendorAdmin, setVendorAdmin]);

  return <Outlet />;
}
