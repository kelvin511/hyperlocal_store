import { useEffect } from "react"
import { NavLink, useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  DashboardSquare01Icon,
  Settings01Icon,
  ShoppingBag01Icon,
  ShoppingBasket01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"
import { Button } from "~/components/ui/button"
import { useUiStore } from "~/stores/ui-store"

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardSquare01Icon, end: true },
  { to: "/products", label: "Products", icon: ShoppingBasket01Icon, end: false },
  { to: "/orders", label: "Orders", icon: ShoppingBag01Icon, end: false },
  { to: "/store", label: "Store settings", icon: Settings01Icon, end: false },
]

type AppSidebarProps = {
  storeName: string
  storeHandle: string
}

export function AppSidebar({ storeName, storeHandle }: AppSidebarProps) {
  const open = useUiStore((s) => s.sidebarOpen)
  const closeSidebar = useUiStore((s) => s.closeSidebar)
  const { pathname } = useLocation()

  useEffect(() => {
    closeSidebar()
  }, [pathname, closeSidebar])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeSidebar}
        aria-hidden
      />
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="hover:bg-black/5 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5">
            <div className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-md text-[13px] font-medium uppercase">
              {storeName.charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-medium">{storeName}</p>
              <p className="text-muted-foreground truncate text-xs">
                {storeHandle}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Close menu"
            onClick={closeSidebar}
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </div>
        <div className="border-sidebar-border mx-3 border-t border-dashed" />
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-black/[0.07] text-foreground"
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
                )
              }
            >
              <HugeiconsIcon icon={item.icon} className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
