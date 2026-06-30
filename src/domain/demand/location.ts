import type { ApproximateLocation, DemandReport } from "./types";

function hasUsableCoordinates(lat: unknown, lng: unknown) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function getIssueApproximateLocation(demand: DemandReport): ApproximateLocation | null {
  const stored = demand.approximateLocation;
  if (stored && hasUsableCoordinates(stored.lat, stored.lng)) {
    return {
      lat: stored.lat,
      lng: stored.lng,
      accuracyMeters:
        typeof stored.accuracyMeters === "number" && Number.isFinite(stored.accuracyMeters)
          ? Math.max(0, Math.round(stored.accuracyMeters))
          : undefined,
      source: stored.source === "browser_geolocation" ? "browser_geolocation" : "zone",
      capturedAt: stored.capturedAt,
    };
  }

  if (hasUsableCoordinates(demand.latitude, demand.longitude)) {
    return {
      lat: demand.latitude,
      lng: demand.longitude,
      source: "zone",
    };
  }

  return null;
}

export function buildGoogleMapsSearchUrl(location: Pick<ApproximateLocation, "lat" | "lng">) {
  const query = encodeURIComponent(`${location.lat},${location.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getApproximateLocationLabel(location: ApproximateLocation | null) {
  if (!location) return "Zone fallback only";
  if (location.source === "browser_geolocation") return "Browser-local assist";
  return "Zone fallback coordinates";
}

export function getApproximateLocationDetail(location: ApproximateLocation | null) {
  if (!location) return "No coordinates available yet; zone selection still works.";

  const accuracy =
    location.source === "browser_geolocation" && typeof location.accuracyMeters === "number"
      ? `, about ${location.accuracyMeters}m browser accuracy`
      : "";
  return `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}${accuracy}`;
}
