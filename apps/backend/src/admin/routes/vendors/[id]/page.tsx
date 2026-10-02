import {
  Button,
  Container,
  Drawer,
  Heading,
  Prompt,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { VendorFormFields, useVendorForm } from "../../../components/vendor-form"
import { ProductThumbnail } from "../../../components/product-thumbnail"
import { sdk } from "../../../lib/client"
import { VendorDetail, VendorProductListResponse } from "../../../lib/types"

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-2 items-center px-6 py-4">
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>
    <Text size="small" leading="compact">
      {children}
    </Text>
  </div>
)

const VendorDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useVendorForm()

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () =>
      sdk.client.fetch<{ vendor: VendorDetail }>(`/admin/vendors/${id}`),
  })

  const { data: productsData } = useQuery({
    queryKey: ["vendor-products", id],
    queryFn: () =>
      sdk.client.fetch<VendorProductListResponse>("/admin/vendor-products", {
        query: { vendor_id: id, limit: 10 },
      }),
  })

  const updateVendor = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/vendors/${id}`, {
        method: "POST",
        body: {
          name: form.name,
          handle: form.handle,
          logo: form.logo || null,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] })
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast.success("Vendor updated")
      setEditOpen(false)
    },
    onError: (error) => toast.error(error.message || "Failed to update vendor"),
  })

  const deleteVendor = useMutation({
    mutationFn: () => sdk.client.fetch(`/admin/vendors/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast.success("Vendor deleted")
      navigate("/vendors")
    },
    onError: (error) => toast.error(error.message || "Failed to delete vendor"),
  })

  if (isLoading || !data) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-subtle">
          Loading...
        </Text>
      </Container>
    )
  }

  const { vendor } = data

  const openEdit = () => {
    setForm({
      name: vendor.name ?? "",
      handle: vendor.handle,
      logo: vendor.logo ?? "",
      latitude: String(vendor.latitude),
      longitude: String(vendor.longitude),
      admin_email: "",
      admin_password: "",
      admin_first_name: "",
      admin_last_name: "",
    })
    setEditOpen(true)
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>{vendor.name ?? vendor.handle}</Heading>
          <div className="flex items-center gap-x-2">
            <Button size="small" variant="secondary" onClick={openEdit}>
              Edit
            </Button>
            <Prompt>
              <Prompt.Trigger asChild>
                <Button size="small" variant="danger">
                  Delete
                </Button>
              </Prompt.Trigger>
              <Prompt.Content>
                <Prompt.Header>
                  <Prompt.Title>Delete vendor</Prompt.Title>
                  <Prompt.Description>
                    This also removes all admin accounts of this vendor.
                  </Prompt.Description>
                </Prompt.Header>
                <Prompt.Footer>
                  <Prompt.Cancel>Cancel</Prompt.Cancel>
                  <Prompt.Action
                    onClick={() => deleteVendor.mutate()}
                    disabled={deleteVendor.isPending}
                  >
                    Delete
                  </Prompt.Action>
                </Prompt.Footer>
              </Prompt.Content>
            </Prompt>
          </div>
        </div>
        <Row label="Handle">{vendor.handle}</Row>
        <Row label="Location">
          {vendor.latitude}, {vendor.longitude}
        </Row>
        <Row label="Logo">{vendor.logo ?? "-"}</Row>
        <Row label="Products">{vendor.product_count}</Row>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Admins</Heading>
        </div>
        {vendor.admins.length === 0 && <Row label="No admins">-</Row>}
        {vendor.admins.map((admin) => (
          <Row
            key={admin.id}
            label={[admin.first_name, admin.last_name].filter(Boolean).join(" ") || "Admin"}
          >
            {admin.email}
          </Row>
        ))}
      </Container>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Products</Heading>
          <Button size="small" variant="secondary" asChild>
            <Link to={`/products/vendors?vendor_id=${vendor.id}`}>View all</Link>
          </Button>
        </div>
        {productsData?.products.length === 0 && (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">
              This vendor has no products.
            </Text>
          </div>
        )}
        {productsData?.products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="hover:bg-ui-bg-base-hover flex items-center gap-x-3 px-6 py-3"
          >
            <ProductThumbnail src={product.thumbnail} />
            <Text size="small" leading="compact" weight="plus">
              {product.title}
            </Text>
          </Link>
        ))}
      </Container>

      <Drawer open={editOpen} onOpenChange={setEditOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit vendor</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="overflow-y-auto">
            <VendorFormFields values={form} onChange={setForm} />
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button size="small" variant="secondary">
                Cancel
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              onClick={() => updateVendor.mutate()}
              isLoading={updateVendor.isPending}
              disabled={updateVendor.isPending}
            >
              Save
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export default VendorDetailPage
