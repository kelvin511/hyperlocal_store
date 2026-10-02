import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  createDataTableColumnHelper,
  createDataTableFilterHelper,
  DataTable,
  DataTableFilteringState,
  DataTablePaginationState,
  Heading,
  StatusBadge,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ProductThumbnail } from "../../../components/product-thumbnail"
import { sdk } from "../../../lib/client"
import {
  VendorListResponse,
  VendorProductListResponse,
  VendorProductRow,
} from "../../../lib/types"

const columnHelper = createDataTableColumnHelper<VendorProductRow>()
const filterHelper = createDataTableFilterHelper<VendorProductRow>()

const columns = [
  columnHelper.display({
    id: "product",
    header: "Product",
    cell: ({ row }) => (
      <Link
        to={`/products/${row.original.id}`}
        className="flex items-center gap-x-3"
      >
        <ProductThumbnail src={row.original.thumbnail} />
        <span>{row.original.title}</span>
      </Link>
    ),
  }),
  columnHelper.display({
    id: "vendor",
    header: "Vendor",
    cell: ({ row }) =>
      row.original.vendor ? (
        <Link
          to={`/vendors/${row.original.vendor.id}`}
          className="text-ui-fg-interactive"
        >
          {row.original.vendor.name ?? row.original.vendor.handle}
        </Link>
      ) : (
        <span className="text-ui-fg-muted">No vendor</span>
      ),
  }),
  columnHelper.display({
    id: "price",
    header: "Price",
    cell: ({ row }) =>
      row.original.price === null
        ? "-"
        : `${row.original.price} ${(row.original.currency_code ?? "").toUpperCase()}`,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge color={getValue() === "published" ? "green" : "grey"}>
        {getValue() === "published" ? "Published" : "Draft"}
      </StatusBadge>
    ),
  }),
]

const PAGE_SIZE = 15

const VendorProductsPage = () => {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [filtering, setFiltering] = useState<DataTableFilteringState>(() => {
    const vendorId = searchParams.get("vendor_id")
    return vendorId ? { vendor: vendorId } : {}
  })
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  const vendorFilter = typeof filtering.vendor === "string" ? filtering.vendor : ""

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors-filter-options"],
    queryFn: () =>
      sdk.client.fetch<VendorListResponse>("/admin/vendors", {
        query: { limit: 100 },
      }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products", vendorFilter, search, pagination.pageIndex],
    queryFn: () =>
      sdk.client.fetch<VendorProductListResponse>("/admin/vendor-products", {
        query: {
          vendor_id: vendorFilter || undefined,
          q: search || undefined,
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
        },
      }),
  })

  const filters = useMemo(
    () => [
      filterHelper.accessor("vendor", {
        type: "select",
        label: "Vendor",
        options: (vendorsData?.vendors ?? []).map((vendor) => ({
          label: vendor.name ?? vendor.handle,
          value: vendor.id,
        })),
      }),
    ],
    [vendorsData]
  )

  const table = useDataTable({
    data: data?.products ?? [],
    columns,
    getRowId: (product) => product.id,
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
    search: { state: search, onSearchChange: setSearch },
    pagination: { state: pagination, onPaginationChange: setPagination },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading>Products by vendor</Heading>
          <div className="flex items-center gap-x-2">
            <DataTable.FilterMenu tooltip="Filter" />
            <DataTable.Search placeholder="Search products" />
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "By vendor",
  nested: "/products",
})

export default VendorProductsPage
