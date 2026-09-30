import { model } from "@medusajs/framework/utils"
import Vendor from "./vendor"

const VendorStore = model.define("vendor_store", {
  id: model.id().primaryKey(),
  name: model.text(),
  address: model.text().nullable(),
  latitude: model.float(),
  longitude: model.float(),
  vendor: model.belongsTo(() => Vendor, {
    mappedBy: "stores",
  }),
})

export default VendorStore