"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import {
  getAuthHeaders,
  getCacheTag,
  getLocationCookie,
  removeLocationCookie,
  setLocationCookie,
} from "./cookies"

export type CustomerLocation = {
  latitude: number
  longitude: number
  address?: string
  updated_at?: string
}

export type CustomerLocationInput = {
  latitude: number
  longitude: number
  address?: string
}

const isValid = (value: unknown): value is CustomerLocation => {
  const location = value as CustomerLocation | null

  return (
    !!location &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  )
}

const readCookie = async (): Promise<CustomerLocation | null> => {
  const raw = await getLocationCookie()

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

const hasAuth = async () => {
  const headers = await getAuthHeaders()
  return "authorization" in headers ? headers : null
}

const pushToBackend = async (
  headers: { authorization: string },
  input: CustomerLocationInput
) => {
  const { location } = await sdk.client.fetch<{
    location: CustomerLocation | null
  }>("/store/customers/me/location", {
    method: "POST",
    headers,
    body: {
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || undefined,
    },
  })

  const tag = await getCacheTag("customers")
  if (tag) revalidateTag(tag)

  return location
}

export const getLocation = async (): Promise<CustomerLocation | null> => {
  const cookieLocation = await readCookie()
  const headers = await hasAuth()

  if (!headers) return cookieLocation

  try {
    const { location } = await sdk.client.fetch<{
      location: CustomerLocation | null
    }>("/store/customers/me/location", {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (isValid(location)) return location

    if (cookieLocation) {
      return (await pushToBackend(headers, cookieLocation)) ?? cookieLocation
    }

    return null
  } catch {
    return cookieLocation
  }
}

export const saveLocation = async (
  input: CustomerLocationInput
): Promise<CustomerLocation | null> => {
  if (!isValid(input)) return null

  const location: CustomerLocation = {
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    updated_at: new Date().toISOString(),
  }

  await setLocationCookie(JSON.stringify(location))

  const headers = await hasAuth()

  if (!headers) return location

  try {
    return (await pushToBackend(headers, input)) ?? location
  } catch {
    return location
  }
}

export const clearLocation = async (): Promise<void> => {
  await removeLocationCookie()

  const headers = await hasAuth()

  if (!headers) return

  try {
    await sdk.client.fetch("/store/customers/me/location", {
      method: "DELETE",
      headers,
    })

    const tag = await getCacheTag("customers")
    if (tag) revalidateTag(tag)
  } catch {}
}
