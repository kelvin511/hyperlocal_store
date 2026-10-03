export const dataCache: RequestCache =
  process.env.NODE_ENV === "development" ? "no-store" : "force-cache"
