export const ProductThumbnail = ({ src }: { src?: string | null }) => (
  <div className="bg-ui-bg-component border-ui-border-base flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border">
    {src ? <img src={src} alt="" className="size-full object-cover" /> : null}
  </div>
)
