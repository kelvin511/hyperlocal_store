import { Link, useRouteLoaderData } from "react-router"
import type { Route } from "./+types/home"
import type { loader as protectedLoader } from "./protected"
import { useVendorStore } from "~/stores/vendor-store"
import { Button } from "~/components/ui/button"
import {
  Container,
  ContainerHeader,
  SectionRow,
} from "~/components/container"

export function meta({}: Route.MetaArgs) {
  return [{ title: "Vendor dashboard" }]
}

export const handle = { title: "Dashboard" }

export default function Home() {
  const data = useRouteLoaderData<typeof protectedLoader>("routes/protected")
  const storeAdmin = useVendorStore((s) => s.vendorAdmin)
  if (!data) return null
  const { vendor } = storeAdmin ?? data.vendorAdmin

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <ContainerHeader
          title={`Welcome back, ${vendor.name ?? vendor.handle}`}
          description="Here is an overview of your store."
          actions={
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link to="/store" />}
            >
              Store settings
            </Button>
          }
        />
        <dl className="divide-border divide-y">
          <SectionRow title="Name">{vendor.name ?? "-"}</SectionRow>
          <SectionRow title="Handle">{vendor.handle}</SectionRow>
          <SectionRow title="Location">
            {vendor.latitude.toFixed(4)}, {vendor.longitude.toFixed(4)}
          </SectionRow>
        </dl>
      </Container>

      <Container>
        <ContainerHeader
          title="Orders and products"
          description="Product and order management will appear here."
        />
      </Container>
    </div>
  )
}
