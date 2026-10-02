import { Form } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon, Menu01Icon } from "@hugeicons/core-free-icons"
import { Button } from "~/components/ui/button"
import { useUiStore } from "~/stores/ui-store"

type AppHeaderProps = {
  title: string
  userName: string
  userEmail: string
}

export function AppHeader({ title, userName, userEmail }: AppHeaderProps) {
  const openSidebar = useUiStore((s) => s.openSidebar)
  const initial = userName.trim().charAt(0).toUpperCase() || "V"

  return (
    <header className="bg-card sticky top-0 z-20 flex h-12 items-center gap-3 border-b px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        onClick={openSidebar}
      >
        <HugeiconsIcon icon={Menu01Icon} />
      </Button>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px]">
        <span className="text-muted-foreground">Vendor panel</span>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-medium">{title}</h1>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-[13px] font-medium">{userName}</p>
          <p className="text-muted-foreground text-xs">{userEmail}</p>
        </div>
        <div className="bg-muted text-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium shadow-card-rest">
          {initial}
        </div>
        <Form method="post" action="/logout">
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Log out"
            title="Log out"
          >
            <HugeiconsIcon icon={Logout01Icon} />
          </Button>
        </Form>
      </div>
    </header>
  )
}
