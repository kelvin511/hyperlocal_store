import { VendorStatus } from "./types"

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  disabled: "Disabled",
}

export const VENDOR_STATUS_COLORS: Record<
  VendorStatus,
  "green" | "orange" | "red" | "grey"
> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  disabled: "grey",
}
