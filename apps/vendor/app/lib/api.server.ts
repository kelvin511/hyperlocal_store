const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

export type VendorAdmin = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  vendor: {
    id: string;
    name: string | null;
    handle: string;
    logo: string | null;
    latitude: number;
    longitude: number;
    status: "pending" | "approved" | "rejected" | "disabled";
  };
};

export type RegisterInput = {
  name: string;
  handle: string;
  latitude: number;
  longitude: number;
  logo?: string;
  admin: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.", 503);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.message ?? "Something went wrong.", res.status);
  }
  return body as T;
}

/** Medusa emailpass auth for the `vendor` actor type. Returns a JWT. */
export async function login(email: string, password: string) {
  const { token } = await request<{ token: string }>("/auth/vendor/emailpass", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return token;
}

export async function registerVendor(input: RegisterInput) {
  await request("/vendor/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMe(token: string) {
  const { vendor_admin } = await request<{ vendor_admin: VendorAdmin }>(
    "/vendor/me",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return vendor_admin;
}

export type Store = VendorAdmin["vendor"];

export type UpdateStoreInput = {
  name?: string;
  handle?: string;
  logo?: string | null;
  latitude?: number;
  longitude?: number;
};

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function getStore(token: string) {
  const { vendor } = await request<{ vendor: Store }>("/vendor/store", {
    headers: authHeaders(token),
  });
  return vendor;
}

export async function updateStore(token: string, input: UpdateStoreInput) {
  const { vendor } = await request<{ vendor: Store }>("/vendor/store", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return vendor;
}

export async function deleteStore(token: string) {
  await request("/vendor/store", {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export type Product = {
  id: string
  title: string
  thumbnail: string | null
  price: number | null
  currency_code: string | null
  stock: number | null
  available: boolean
  created_at: string
}

export type ProductInput = {
  title: string
  thumbnail?: string | null
  price: number
  stock: number
  available: boolean
}

export type ProductList = {
  products: Product[]
  count: number
  limit: number
  offset: number
}

export async function listProducts(
  token: string,
  { limit, offset }: { limit: number; offset: number },
) {
  return request<ProductList>(`/vendor/product?limit=${limit}&offset=${offset}`, {
    headers: authHeaders(token),
  })
}

export async function getProduct(token: string, id: string) {
  const { product } = await request<{ product: Product }>(
    `/vendor/product/${id}`,
    { headers: authHeaders(token) },
  )
  return product
}

export async function createProduct(token: string, input: ProductInput) {
  const { product } = await request<{ product: Product }>("/vendor/product", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  })
  return product
}

export async function updateProduct(
  token: string,
  id: string,
  input: Partial<ProductInput>,
) {
  const { product } = await request<{ product: Product }>(
    `/vendor/product/${id}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(input),
    },
  )
  return product
}

export async function deleteProduct(token: string, id: string) {
  await request(`/vendor/product/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
}

export type OrderItem = {
  id: string
  title: string
  thumbnail: string | null
  quantity: number
  unit_price: number
}

export type OrderAddress = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

export type VendorOrder = {
  id: string
  display_id: number | string | null
  status: string
  payment_status: string | null
  fulfillment_status: string | null
  currency_code: string
  created_at: string
  customer_email: string | null
  shipping_address: OrderAddress | null
  items: OrderItem[]
  subtotal: number
}

export type OrderList = {
  orders: VendorOrder[]
  count: number
  limit: number
  offset: number
}

export async function listOrders(
  token: string,
  { limit, offset }: { limit: number; offset: number },
) {
  return request<OrderList>(`/vendor/order?limit=${limit}&offset=${offset}`, {
    headers: authHeaders(token),
  })
}

export async function getOrder(token: string, id: string) {
  const { order } = await request<{ order: VendorOrder }>(
    `/vendor/order/${id}`,
    { headers: authHeaders(token) },
  )
  return order
}
