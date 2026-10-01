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
