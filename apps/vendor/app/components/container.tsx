import { cn } from "cn"

export function Container({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "bg-card shadow-card-rest divide-border divide-y rounded-lg",
        className,
      )}
      {...props}
    />
  )
}

type ContainerHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function ContainerHeader({
  title,
  description,
  actions,
}: ContainerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <h2 className="text-[16px] leading-6 font-medium">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-[13px] leading-5">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

type SectionRowProps = {
  title: string
  children: React.ReactNode
}

export function SectionRow({ title, children }: SectionRowProps) {
  return (
    <div className="grid grid-cols-1 gap-1 px-6 py-3 text-[13px] leading-5 sm:grid-cols-[1fr_2fr] sm:items-center sm:gap-4">
      <dt className="text-muted-foreground font-medium">{title}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}
