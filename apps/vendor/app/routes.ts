import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  // Everything nested under this layout requires a signed-in vendor.
  layout("routes/protected.tsx", [
    index("routes/home.tsx"),
    route("store", "routes/store.tsx"),
    route("products", "routes/products.tsx"),
    route("products/new", "routes/products.new.tsx"),
    route("products/:id", "routes/products.detail.tsx"),
    route("orders", "routes/orders.tsx"),
    route("orders/:id", "routes/orders.detail.tsx"),
  ]),
] satisfies RouteConfig;
