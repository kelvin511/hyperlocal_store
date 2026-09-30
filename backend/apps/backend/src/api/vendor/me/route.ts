import { MedusaResponse } from "@medusajs/framework/http"
import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"


export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    const query = req.scope.resolve("query")

    const { data } = await query.graph({
        entity: "vendor_admin",
        fields: ["id", "email", "first_name", "last_name", "vendor.*"],
        filters: { id: req.auth_context.actor_id },
    })

    if (!data.length) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor admin not found")
    }

    res.json({ vendor_admin: data[0] })
}
