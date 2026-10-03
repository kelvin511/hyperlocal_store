import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import updateCustomerLocationWorkflow, {
  CustomerLocation,
} from "../../../../../workflows/customer/update-customer-location"

export const PostCustomerLocationSchema = z.strictObject({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(255).optional(),
})

export type PostCustomerLocationBody = z.infer<typeof PostCustomerLocationSchema>

const getCustomerLocation = async (
  req: AuthenticatedMedusaRequest
): Promise<CustomerLocation | null> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "metadata"],
    filters: { id: req.auth_context.actor_id },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found")
  }

  const location = data[0].metadata?.location

  return location && typeof location === "object"
    ? (location as CustomerLocation)
    : null
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({ location: await getCustomerLocation(req) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostCustomerLocationBody>,
  res: MedusaResponse
) => {
  await updateCustomerLocationWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      location: req.validatedBody,
    },
  })

  res.json({ location: await getCustomerLocation(req) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await updateCustomerLocationWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, location: null },
  })

  res.json({ location: null })
}
