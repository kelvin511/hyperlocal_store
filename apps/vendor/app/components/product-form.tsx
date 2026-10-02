import { Form, Link } from "react-router"
import type { Product } from "~/lib/api.server"
import { Button } from "~/components/ui/button"
import { FieldError } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
  Container,
  ContainerHeader,
  SectionRow,
} from "~/components/container"

type ProductFormProps = {
  title: string
  product?: Product
  error?: string | null
  submitting: boolean
}

export function ProductForm({
  title,
  product,
  error,
  submitting,
}: ProductFormProps) {
  const currency = product?.currency_code?.toUpperCase()

  return (
    <Container>
      <Form method="post" className="divide-border divide-y">
        <ContainerHeader
          title={title}
          actions={
            <>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link to="/products" />}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </>
          }
        />
        <SectionRow title="Title">
          <Input name="title" defaultValue={product?.title ?? ""} required />
        </SectionRow>
        <SectionRow title="Image URL">
          <Input
            name="thumbnail"
            type="url"
            placeholder="https://example.com/product.jpg"
            defaultValue={product?.thumbnail ?? ""}
          />
          {product?.thumbnail && (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="mt-2 size-16 rounded-md border object-cover"
            />
          )}
        </SectionRow>
        <SectionRow title={currency ? `Price (${currency})` : "Price"}>
          <Input
            name="price"
            type="number"
            step="0.01"
            min={0}
            defaultValue={product?.price ?? ""}
            required
          />
          {!product && (
            <p className="text-muted-foreground mt-1 text-xs">
              Uses the default currency of your marketplace.
            </p>
          )}
        </SectionRow>
        <SectionRow title="Availability">
          <select
            name="available"
            defaultValue={String(product?.available ?? true)}
            className="border-input bg-background h-7 w-full rounded-md border px-2 text-xs"
          >
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </SectionRow>
        {error && (
          <div className="px-6 py-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
      </Form>
    </Container>
  )
}
