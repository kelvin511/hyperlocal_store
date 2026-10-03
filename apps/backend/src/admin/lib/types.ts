export type VendorStatus = "pending" | "approved" | "rejected" | "disabled"

export type VendorSummary = {
  id: string
  name: string | null
  handle: string
  logo: string | null
  latitude: number
  longitude: number
  status: VendorStatus
  created_at: string
}

export type VendorAdminSummary = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

export type VendorDetail = VendorSummary & {
  admins: VendorAdminSummary[]
  product_count: number
}

export type VendorProductRow = {
  id: string
  title: string
  thumbnail: string | null
  status: string
  price: number | null
  currency_code: string | null
  vendor: { id: string; name: string | null; handle: string } | null
}

export type VendorListResponse = {
  vendors: VendorSummary[]
  count: number
  limit: number
  offset: number
}

export type VendorProductListResponse = {
  products: VendorProductRow[]
  count: number
  limit: number
  offset: number
}

export type OrderVendorsResponse = {
  currency_code: string
  unassigned_item_count: number
  vendors: {
    id: string
    name: string | null
    handle: string
    status: string
    subtotal: number
    items: { id: string; title: string; quantity: number; unit_price: number }[]
  }[]
}
