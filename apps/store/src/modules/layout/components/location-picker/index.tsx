"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  clearLocation,
  CustomerLocation,
  saveLocation,
} from "@lib/data/customer-location"

type LocationPickerProps = {
  initialLocation: CustomerLocation | null
}

const PRESETS = [
  { label: "Navrangpura, Ahmedabad", latitude: 23.0395, longitude: 72.566 },
  { label: "Satellite, Ahmedabad", latitude: 23.03, longitude: 72.5072 },
  { label: "Gandhinagar", latitude: 23.2156, longitude: 72.6369 },
  { label: "Mumbai", latitude: 19.076, longitude: 72.8777 },
]

const formatLocation = (location: CustomerLocation) =>
  location.address ||
  `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`

const geolocationErrors: Record<number, string> = {
  1: "Location permission was denied.",
  2: "Your location is unavailable.",
  3: "Finding your location took too long.",
}

const LocationPicker = ({ initialLocation }: LocationPickerProps) => {
  const router = useRouter()
  const [location, setLocation] = useState<CustomerLocation | null>(
    initialLocation
  )
  const [open, setOpen] = useState(false)
  const [latitude, setLatitude] = useState(
    initialLocation ? String(initialLocation.latitude) : ""
  )
  const [longitude, setLongitude] = useState(
    initialLocation ? String(initialLocation.longitude) : ""
  )
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [pending, startTransition] = useTransition()

  const apply = (input: {
    latitude: number
    longitude: number
    address?: string
  }) => {
    setError(null)

    startTransition(async () => {
      const saved = await saveLocation(input)

      if (!saved) {
        setError("Enter a valid latitude (-90 to 90) and longitude (-180 to 180).")
        return
      }

      setLocation(saved)
      setLatitude(String(saved.latitude))
      setLongitude(String(saved.longitude))
      setOpen(false)
      router.refresh()
    })
  }

  const submitManual = () => {
    const lat = Number(latitude)
    const lng = Number(longitude)

    if (
      !latitude.trim() ||
      !longitude.trim() ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      setError("Enter a valid latitude and longitude.")
      return
    }

    apply({ latitude: lat, longitude: lng })
  }

  const detect = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location.")
      return
    }

    setError(null)
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        apply({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
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
      setLatitude("")
      setLongitude("")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="relative" data-testid="location-picker">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="hover:text-ui-fg-base transition-colors"
        aria-expanded={open}
        data-testid="location-picker-button"
      >
        {location ? formatLocation(location) : "Set location"}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-3 w-80 rounded-rounded border border-ui-border-base bg-white p-4 shadow-elevation-flyout text-ui-fg-base"
          data-testid="location-picker-panel"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={pending}
                onClick={() =>
                  apply({
                    latitude: preset.latitude,
                    longitude: preset.longitude,
                    address: preset.label,
                  })
                }
                className="rounded-full border border-ui-border-base px-3 py-1 hover:bg-ui-bg-subtle disabled:opacity-60"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-y-1">
              <span className="text-ui-fg-subtle">Latitude</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                className="rounded-rounded border border-ui-border-base px-2 py-1"
                data-testid="location-latitude"
              />
            </label>
            <label className="flex flex-col gap-y-1">
              <span className="text-ui-fg-subtle">Longitude</span>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                className="rounded-rounded border border-ui-border-base px-2 py-1"
                data-testid="location-longitude"
              />
            </label>
          </div>

          {error && (
            <p className="mt-2 text-ui-fg-error" role="alert">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submitManual}
              disabled={pending}
              className="rounded-rounded bg-ui-bg-interactive px-3 py-1 text-ui-fg-on-color disabled:opacity-60"
              data-testid="location-save"
            >
              {pending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={detect}
              disabled={pending || locating}
              className="rounded-rounded border border-ui-border-base px-3 py-1 hover:bg-ui-bg-subtle disabled:opacity-60"
            >
              {locating ? "Locating..." : "Use my location"}
            </button>
            {location && (
              <button
                type="button"
                onClick={clear}
                disabled={pending}
                className="px-1 text-ui-fg-subtle hover:text-ui-fg-base"
                data-testid="location-picker-clear"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationPicker
