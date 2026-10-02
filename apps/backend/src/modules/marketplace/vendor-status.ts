export const VENDOR_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "disabled",
] as const

export type VendorStatus = (typeof VENDOR_STATUSES)[number]

export const VENDOR_STATUS_TRANSITIONS: Record<VendorStatus, VendorStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["disabled"],
  rejected: ["approved"],
  disabled: ["approved"],
}
