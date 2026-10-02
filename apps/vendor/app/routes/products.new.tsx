import { redirect, useNavigation } from "react-router"
import type { Route } from "./+types/products.new"
import { ApiError, createProduct } from "~/lib/api.server"
import { getToken, requireVendor } from "~/lib/session.server"
import { parseProductForm } from "~/lib/product-form.server"
import { ProductForm } from "~/components/product-form"

export function meta({}: Route.MetaArgs) {
  return [{ title: "Add product" }]
}

export const handle = { title: "Add product" }

export async function loader({ request }: Route.LoaderArgs) {
  await requireVendor(request)
  return null
}

export async function action({ request }: Route.ActionArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!
  const parsed = parseProductForm(await request.formData())
  if (!parsed.input) return { error: parsed.error }

  try {
    const { thumbnail, ...rest } = parsed.input
    await createProduct(token, { ...rest, thumbnail: thumbnail ?? undefined })
    return redirect("/products")
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message }
    throw e
  }
}

export default function NewProduct({ actionData }: Route.ComponentProps) {
  const submitting = useNavigation().state === "submitting"

  return (
    <ProductForm
      title="Add product"
      error={actionData?.error}
      submitting={submitting}
    />
  )
}
