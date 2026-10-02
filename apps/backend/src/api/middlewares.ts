import { authenticate, configureStoreSearch, defineMiddlewares, validateAndTransformBody } from '@medusajs/framework/http'
import { PostVendorRegisterSchema } from './vendor/register/route'
import { PatchVendorStoreSchema } from './vendor/store/route'
import { PostVendorProductSchema } from './vendor/product/route'
import { PostVendorStatusSchema } from "./admin/vendors/[id]/status/route"
import { PatchVendorProductSchema } from './vendor/product/[id]/route'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      matcher: "/vendor/register",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostVendorRegisterSchema),
      ],
    },
    {
      method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      matcher: /^\/vendor\/(?!register(\/|$)).*$/,
      middlewares: [
        authenticate("vendor", ["session", "bearer"]),
      ],
    },
    {
      matcher: "/admin/vendors",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostVendorRegisterSchema),
      ],
    },
    {
      matcher: "/admin/vendors/:id/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostVendorStatusSchema),
      ],
    },
    {
      matcher: "/admin/vendors/:id",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PatchVendorStoreSchema),
      ],
    },
    {
      matcher: "/vendor/product",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostVendorProductSchema),
      ],
    },
    {
      matcher: "/vendor/product/:id",
      method: ["PATCH"],
      middlewares: [
        validateAndTransformBody(PatchVendorProductSchema),
      ],
    },
    {
      matcher: "/vendor/store",
      method: ["PATCH"],
      middlewares: [
        validateAndTransformBody(PatchVendorStoreSchema),
      ],
    },

  ],
})
