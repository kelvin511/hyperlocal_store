import { Metadata } from "next"

import StoresList from "@modules/stores/templates/stores-list"

export const metadata: Metadata = {
  title: "Stores near you",
  description: "Order from stores near you.",
}

export default async function Home(props: {
  searchParams: Promise<{ radius?: string }>
}) {
  const { radius } = await props.searchParams

  return <StoresList radius={radius} basePath="/" />
}
