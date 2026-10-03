import { Form, Link, useNavigation } from "react-router"
import type { Route } from "./+types/products"
import { ApiError, deleteProduct, listProducts } from "~/lib/api.server"
import { getToken, requireVendor } from "~/lib/session.server"
import { formatPrice } from "~/lib/format"
import { Button } from "~/components/ui/button"
import { Container, ContainerHeader } from "~/components/container"

const PAGE_SIZE = 10

export function meta({}: Route.MetaArgs) {
  return [{ title: "Products" }]
}

export const handle = { title: "Products" }

export async function loader({ request }: Route.LoaderArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!
  const page = Math.max(
    Number(new URL(request.url).searchParams.get("page")) || 1,
    1,
  )
  const list = await listProducts(token, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  return { ...list, page }
}

export async function action({ request }: Route.ActionArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!
  const form = await request.formData()

  try {
    await deleteProduct(token, String(form.get("id") ?? ""))
    return { error: null }
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message }
    throw e
  }
}

export default function Products({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { products, count, page } = loaderData
  const navigation = useNavigation()
  const deletingId =
    navigation.state === "submitting"
      ? String(navigation.formData?.get("id") ?? "")
      : null
  const hasNext = page * PAGE_SIZE < count

  return (
    <Container>
      <ContainerHeader
        title="Products"
        description="Manage the products you sell."
        actions={
          <Button
            size="lg"
            nativeButton={false}
            render={<Link to="/products/new" />}
          >
            Add product
          </Button>
        }
      />
      {actionData?.error && (
        <p className="text-destructive px-6 py-3 text-[13px]">
          {actionData.error}
        </p>
      )}
      {products.length === 0 ? (
        <p className="text-muted-foreground px-6 py-10 text-center text-[13px]">
          You have no products yet. Add your first product to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-muted-foreground">
              <tr className="border-border border-b">
                <th className="px-6 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Availability</th>
                <th className="px-6 py-2" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt=""
                          className="size-8 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="bg-muted size-8 rounded-md border" />
                      )}
                      <span className="font-medium">{product.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {formatPrice(product.price, product.currency_code)}
                  </td>
                  <td className="px-3 py-3">
                    {product.stock === null ? (
                      <span className="text-muted-foreground">Not tracked</span>
                    ) : product.stock === 0 ? (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Out of stock
                      </span>
                    ) : (
                      <span
                        className={
                          product.stock <= 10 ? "text-amber-600" : undefined
                        }
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        product.available
                          ? "rounded-md bg-green-100 px-2 py-0.5 text-xs text-green-700"
                          : "bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs"
                      }
                    >
                      {product.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        nativeButton={false}
                        render={<Link to={`/products/${product.id}`} />}
                      >
                        Edit
                      </Button>
                      <Form
                        method="post"
                        onSubmit={(e) => {
                          if (!confirm(`Delete "${product.title}"?`)) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={product.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </Button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-between px-6 py-3 text-[13px]">
          <span className="text-muted-foreground">
            Page {page} of {Math.ceil(count / PAGE_SIZE)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              nativeButton={false}
              render={<Link to={`?page=${page - 1}`} />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext}
              nativeButton={false}
              render={<Link to={`?page=${page + 1}`} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}
