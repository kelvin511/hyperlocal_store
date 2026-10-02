import { Form } from "react-router"
import type { VendorAdmin } from "~/lib/api.server"
import { Button } from "~/components/ui/button"
import { Container, ContainerHeader } from "~/components/container"

type Status = Exclude<VendorAdmin["vendor"]["status"], "approved">

const messages: Record<Status, { title: string; description: string }> = {
  pending: {
    title: "Your registration is pending approval",
    description:
      "An administrator is reviewing your store. You will be able to manage products once it is approved.",
  },
  rejected: {
    title: "Your registration was rejected",
    description:
      "Your store registration was not approved, so you cannot manage products.",
  },
  disabled: {
    title: "Your store has been disabled",
    description:
      "An administrator has disabled your store, so you cannot manage products.",
  },
}

export function AccountStatusNotice({ status }: { status: Status }) {
  const message = messages[status]

  return (
    <Container>
      <ContainerHeader
        title={message.title}
        description={message.description}
        actions={
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline" size="lg">
              Log out
            </Button>
          </Form>
        }
      />
    </Container>
  )
}
