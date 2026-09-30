import { authenticate, configureStoreSearch, defineMiddlewares, validateAndTransformBody } from '@medusajs/framework/http'
import { PostVendorRegisterSchema } from './vendor/register/route'

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
      matcher: "/vendors/register",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostVendorRegisterSchema),
      ],
    },
    {
      matcher: "/vendors/*",
      middlewares: [
        authenticate("vendor", ["session", "bearer"]),
      ],
    },

  ],
})
