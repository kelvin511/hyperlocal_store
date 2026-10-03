import { Metadata } from "next"

import StoresList from "@modules/stores/templates/stores-list"

export const metadata: Metadata = {
  title: "Stores",
  description: "Find stores near you.",
}

type Props = {
  searchParams: Promise<{ radius?: string }>
}

export default async function StoresPage(props: Props) {
  const { radius } = await props.searchParams

  return <StoresList radius={radius} basePath="/stores" />
}
