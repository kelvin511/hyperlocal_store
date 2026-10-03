import { redirect } from "next/navigation"

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const { countryCode } = await props.params

  redirect(`/${countryCode}/stores`)
}
