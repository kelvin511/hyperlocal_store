import { model } from "@medusajs/framework/utils"
import { VENDOR_STATUSES } from "../vendor-status"
import VendorAdmin from "./vendor-admin"

const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  handle: model.text().unique(),
  name: model.text().nullable(),
  logo: model.text().nullable(),
  latitude: model.float(),
  longitude: model.float(),
  status: model.enum([...VENDOR_STATUSES]).default("pending"),
  admins: model.hasMany(() => VendorAdmin, {
    mappedBy: "vendor",
  }),
})

export default Vendor
