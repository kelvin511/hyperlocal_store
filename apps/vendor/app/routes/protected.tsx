import { useEffect } from "react"
import { Outlet, useMatches } from "react-router"
import type { Route } from "./+types/protected"
import { requireVendor } from "~/lib/session.server"
import { useVendorStore } from "~/stores/vendor-store"
import { AppSidebar } from "~/components/app-sidebar"
import { AppHeader } from "~/components/app-header"
import { AccountStatusNotice } from "~/components/account-status-notice"

export async function loader({ request }: Route.LoaderArgs) {
  return { vendorAdmin: await requireVendor(request) }
}

export default function Protected({ loaderData }: Route.ComponentProps) {
  const setVendorAdmin = useVendorStore((s) => s.setVendorAdmin)
  const storeAdmin = useVendorStore((s) => s.vendorAdmin)
  const vendorAdmin = storeAdmin ?? loaderData.vendorAdmin
  const matches = useMatches()

  useEffect(() => {
    setVendorAdmin(loaderData.vendorAdmin)
    return () => setVendorAdmin(null)
  }, [loaderData.vendorAdmin, setVendorAdmin])

  const title =
    [...matches]
      .reverse()
      .map((m) => (m.handle as { title?: string } | undefined)?.title)
      .find(Boolean) ?? "Dashboard"
  const userName =
    [vendorAdmin.first_name, vendorAdmin.last_name].filter(Boolean).join(" ") ||
    vendorAdmin.email

  return (
    <div className="bg-background min-h-svh">
      <AppSidebar
        storeName={vendorAdmin.vendor.name ?? vendorAdmin.vendor.handle}
        storeHandle={vendorAdmin.vendor.handle}
      />
      <div className="flex min-h-svh flex-col lg:pl-[232px]">
        <AppHeader
          title={title}
          userName={userName}
          userEmail={vendorAdmin.email}
        />
        <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
          {vendorAdmin.vendor.status === "approved" ? (
            <Outlet />
          ) : (
            <AccountStatusNotice status={vendorAdmin.vendor.status} />
          )}
        </main>
      </div>
    </div>
  )
}
