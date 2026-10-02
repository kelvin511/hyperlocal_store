import { useState } from "react"
import { Input, Label, Text } from "@medusajs/ui"

export type VendorFormValues = {
  name: string
  handle: string
  logo: string
  latitude: string
  longitude: string
  admin_email: string
  admin_password: string
  admin_first_name: string
  admin_last_name: string
}

export const emptyVendorForm: VendorFormValues = {
  name: "",
  handle: "",
  logo: "",
  latitude: "",
  longitude: "",
  admin_email: "",
  admin_password: "",
  admin_first_name: "",
  admin_last_name: "",
}

export const useVendorForm = (initial: Partial<VendorFormValues> = {}) =>
  useState<VendorFormValues>({ ...emptyVendorForm, ...initial })

type FieldProps = {
  label: string
  hint?: string
  children: React.ReactNode
}

const Field = ({ label, hint, children }: FieldProps) => (
  <div className="flex flex-col gap-y-1">
    <Label size="small" weight="plus">
      {label}
    </Label>
    {children}
    {hint && (
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {hint}
      </Text>
    )}
  </div>
)

type VendorFormFieldsProps = {
  values: VendorFormValues
  onChange: (values: VendorFormValues) => void
  withAdmin?: boolean
}

export const VendorFormFields = ({
  values,
  onChange,
  withAdmin = false,
}: VendorFormFieldsProps) => {
  const set =
    (key: keyof VendorFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [key]: event.target.value })

  return (
    <div className="flex flex-col gap-y-4">
      <Field label="Name">
        <Input value={values.name} onChange={set("name")} />
      </Field>
      <Field
        label="Handle"
        hint="Lowercase letters, numbers and hyphens only."
      >
        <Input value={values.handle} onChange={set("handle")} />
      </Field>
      <Field label="Logo URL" hint="Optional.">
        <Input type="url" value={values.logo} onChange={set("logo")} />
      </Field>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Latitude">
          <Input
            type="number"
            step="any"
            value={values.latitude}
            onChange={set("latitude")}
          />
        </Field>
        <Field label="Longitude">
          <Input
            type="number"
            step="any"
            value={values.longitude}
            onChange={set("longitude")}
          />
        </Field>
      </div>
      {withAdmin && (
        <>
          <Text size="small" leading="compact" weight="plus">
            Vendor admin account
          </Text>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="First name">
              <Input
                value={values.admin_first_name}
                onChange={set("admin_first_name")}
              />
            </Field>
            <Field label="Last name">
              <Input
                value={values.admin_last_name}
                onChange={set("admin_last_name")}
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={values.admin_email}
              onChange={set("admin_email")}
            />
          </Field>
          <Field label="Password" hint="At least 8 characters.">
            <Input
              type="password"
              value={values.admin_password}
              onChange={set("admin_password")}
            />
          </Field>
        </>
      )}
    </div>
  )
}
