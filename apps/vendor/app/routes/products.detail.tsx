import { redirect, useNavigation } from "react-router"
import type { Route } from "./+types/products.detail"
import { ApiError, getProduct, updateProduct } from "~/lib/api.server"
import { getToken, requireVendor } from "~/lib/session.server"
import { parseProductForm } from "~/lib/product-form.server"
import { ProductForm } from "~/components/product-form"

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit product" }]
}

export const handle = { title: "Edit product" }

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!

  try {
    return { product: await getProduct(token, params.id) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      throw new Response("Product not found", { status: 404 })
    }
    throw e
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!
  const parsed = parseProductForm(await request.formData())
  if (!parsed.input) return { error: parsed.error }

  try {
    await updateProduct(token, params.id, parsed.input)
    return redirect("/products")
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message }
    throw e
  }
}

export default function EditProduct({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const submitting = useNavigation().state === "submitting"

  return (
    <ProductForm
      title="Edit product"
      product={loaderData.product}
      error={actionData?.error}
      submitting={submitting}
    />
  )
}
