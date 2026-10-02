import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront } from "@medusajs/icons"
import {
  Button,
  Container,
  createDataTableColumnHelper,
  createDataTableFilterHelper,
  DataTable,
  DataTableFilteringState,
  DataTablePaginationState,
  FocusModal,
  Heading,
  StatusBadge,
  toast,
  useDataTable,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { VendorFormFields, useVendorForm } from "../../components/vendor-form"
import { sdk } from "../../lib/client"
import { VendorListResponse, VendorSummary } from "../../lib/types"
import {
  VENDOR_STATUS_COLORS,
  VENDOR_STATUS_LABELS,
} from "../../lib/vendor-status"

const columnHelper = createDataTableColumnHelper<VendorSummary>()
const filterHelper = createDataTableFilterHelper<VendorSummary>()

const filters = [
  filterHelper.accessor("status", {
    type: "select",
    label: "Status",
    options: Object.entries(VENDOR_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  }),
]

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ getValue, row }) => getValue() ?? row.original.handle,
  }),
  columnHelper.accessor("handle", { header: "Handle" }),
  columnHelper.display({
    id: "location",
    header: "Location",
    cell: ({ row }) =>
      `${row.original.latitude.toFixed(4)}, ${row.original.longitude.toFixed(4)}`,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge color={VENDOR_STATUS_COLORS[getValue()]}>
        {VENDOR_STATUS_LABELS[getValue()]}
      </StatusBadge>
    ),
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  }),
]

const PAGE_SIZE = 15

const VendorsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [filtering, setFiltering] = useState<DataTableFilteringState>({})
  const [open, setOpen] = useState(false)
  const [form, setForm] = useVendorForm()

  const offset = pagination.pageIndex * pagination.pageSize
  const statusFilter = typeof filtering.status === "string" ? filtering.status : ""

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", pagination.pageIndex, search, statusFilter],
    queryFn: () =>
      sdk.client.fetch<VendorListResponse>("/admin/vendors", {
        query: {
          limit: pagination.pageSize,
          offset,
          q: search || undefined,
          status: statusFilter || undefined,
        },
      }),
  })

  const createVendor = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ vendor: VendorSummary }>("/admin/vendors", {
        method: "POST",
        body: {
          name: form.name,
          handle: form.handle,
          logo: form.logo || undefined,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          admin: {
            email: form.admin_email,
            password: form.admin_password,
            first_name: form.admin_first_name || undefined,
            last_name: form.admin_last_name || undefined,
          },
        },
      }),
    onSuccess: ({ vendor }) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast.success("Vendor created")
      setOpen(false)
      setForm({ ...form, name: "", handle: "", logo: "" })
      navigate(`/vendors/${vendor.id}`)
    },
    onError: (error) => toast.error(error.message || "Failed to create vendor"),
  })

  const table = useDataTable({
    data: data?.vendors ?? [],
    columns,
    getRowId: (vendor) => vendor.id,
    rowCount: data?.count ?? 0,
    isLoading,
    filters,
    filtering: {
      state: filtering,
      onFilteringChange: (state) => {
        setFiltering(state)
        setPagination({ ...pagination, pageIndex: 0 })
      },
    },
    onRowClick: (_, vendor) => navigate(`/vendors/${vendor.id}`),
    search: { state: search, onSearchChange: setSearch },
    pagination: { state: pagination, onPaginationChange: setPagination },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading>Vendors</Heading>
          <div className="flex items-center gap-x-2">
            <DataTable.FilterMenu tooltip="Filter" />
            <DataTable.Search placeholder="Search vendors" />
            <Button size="small" onClick={() => setOpen(true)}>
              Create
            </Button>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary">
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => createVendor.mutate()}
                  isLoading={createVendor.isPending}
                  disabled={createVendor.isPending}
                >
                  Create vendor
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto py-12">
              <div className="flex w-full max-w-[560px] flex-col gap-y-6">
                <Heading>Create vendor</Heading>
                <VendorFormFields values={form} onChange={setForm} withAdmin />
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Vendors",
  icon: BuildingStorefront,
})

export default VendorsPage
