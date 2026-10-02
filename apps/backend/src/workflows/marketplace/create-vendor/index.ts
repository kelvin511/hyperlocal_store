import {
    createWorkflow,
    WorkflowResponse,
    transform,
} from "@medusajs/framework/workflows-sdk"
import {
    setAuthAppMetadataStep,
    useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import createVendorAdminStep from "./steps/create-vendor-admin"
import createVendorStep from "./steps/create-vendor"
import { VendorStatus } from "../../../modules/marketplace/vendor-status"

export type CreateVendorWorkflowInput = {
    name: string
    latitude: number
    longitude: number
    handle?: string
    logo?: string
    status?: VendorStatus
    admin: {
        email: string
        first_name?: string
        last_name?: string
    }
    authIdentityId: string
}

const createVendorWorkflow = createWorkflow(
    "create-vendor",
    function (input: CreateVendorWorkflowInput) {
        const vendor = createVendorStep({
            name: input.name,
            handle: input.handle,
            logo: input.logo,
            status: input.status,
            latitude: input.latitude,
            longitude: input.longitude,
        })

        const vendorAdminData = transform({
            input,
            vendor,
        }, (data) => {
            return {
                ...data.input.admin,
                vendor_id: data.vendor.id,
            }
        })

        const vendorAdmin = createVendorAdminStep(
            vendorAdminData
        )

        setAuthAppMetadataStep({
            authIdentityId: input.authIdentityId,
            actorType: "vendor",
            value: vendorAdmin.id,
        })
        const { data: vendorWithAdmin } = useQueryGraphStep({
            entity: "vendor",
            fields: ["id", "name","latitude", "longitude", "handle", "logo", "status", "admins.*"],
            filters: {
                id: vendor.id,
            },
        })

        return new WorkflowResponse({
            vendor: vendorWithAdmin[0],
        })
    })

export default createVendorWorkflow