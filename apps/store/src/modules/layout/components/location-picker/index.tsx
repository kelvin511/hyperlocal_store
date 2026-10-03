"use client"

import { useState, useTransition } from "react"
import {
  clearLocation,
  CustomerLocation,
  saveLocation,
} from "@lib/data/customer-location"

type LocationPickerProps = {
  initialLocation: CustomerLocation | null
}

const formatLocation = (location: CustomerLocation) =>
  location.address ||
  `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`

const geolocationErrors: Record<number, string> = {
  1: "Location permission was denied.",
  2: "Your location is unavailable.",
  3: "Finding your location took too long.",
}

const LocationPicker = ({ initialLocation }: LocationPickerProps) => {
  const [location, setLocation] = useState<CustomerLocation | null>(
    initialLocation
  )
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [, startTransition] = useTransition()

  const detect = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location.")
      return
    }

    setError(null)
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const saved = await saveLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })

          setLocation(saved)
          setLocating(false)
        })
      },
      (failure) => {
        setError(geolocationErrors[failure.code] ?? "Could not get location.")
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    )
  }

  const clear = () => {
    startTransition(async () => {
      await clearLocation()
      setLocation(null)
    })
  }

  return (
    <div
      className="flex items-center gap-x-2"
      data-testid="location-picker"
    >
      <button
        type="button"
        onClick={detect}
        disabled={locating}
        className="hover:text-ui-fg-base transition-colors disabled:opacity-60"
        data-testid="location-picker-button"
      >
        {locating
          ? "Locating..."
          : location
            ? formatLocation(location)
            : "Set location"}
      </button>
      {location && !locating && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear location"
          className="hover:text-ui-fg-base"
          data-testid="location-picker-clear"
        >
          x
        </button>
      )}
      {error && (
        <span className="text-ui-fg-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default LocationPicker
