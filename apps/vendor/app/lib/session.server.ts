import { createCookie, redirect } from "react-router";
import { ApiError, getMe } from "./api.server";

// Medusa's default JWT lifetime is 1 day.
const tokenCookie = createCookie("vendor_token", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
  secure: process.env.NODE_ENV === "production",
  secrets: [process.env.SESSION_SECRET ?? "dev-only-secret"],
});

export async function getToken(request: Request) {
  const token = await tokenCookie.parse(request.headers.get("Cookie"));
  return typeof token === "string" ? token : null;
}

export async function createSessionHeaders(token: string) {
  return { "Set-Cookie": await tokenCookie.serialize(token) };
}

export async function destroySessionHeaders() {
  return { "Set-Cookie": await tokenCookie.serialize("", { maxAge: 0 }) };
}

/** Use in loaders/actions of protected routes. Redirects to /login otherwise. */
export async function requireVendor(request: Request) {
  const token = await getToken(request);
  if (!token) throw redirect("/login");

  try {
    return await getMe(token);
  } catch (e) {
    // Expired/invalid token: clear the cookie. Backend outages propagate.
    if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
      throw redirect("/login", { headers: await destroySessionHeaders() });
    }
    throw e;
  }
}

/** Use in loaders of /login and /register to bounce already-signed-in users. */
export async function redirectIfAuthenticated(request: Request) {
  const token = await getToken(request);
  if (!token) return;
  try {
    await getMe(token);
  } catch {
    return;
  }
  throw redirect("/");
}
