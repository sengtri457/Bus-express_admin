"use server";

/**
 * Server Action — runs on the server (no CORS, full Node.js).
 * Called directly from client components via React's server action mechanism.
 */
export async function fetchRoadRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<[number, number][]> {
  // OSRM expects longitude,latitude
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${originLng},${originLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson`;

  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "BusExpress-Admin/1.0" },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 600 }, // cache 10 min — same road, same result
    });

    if (!resp.ok) {
      console.error(`[fetchRoadRoute] OSRM HTTP ${resp.status}`);
      return [];
    }

    const data = await resp.json();

    if (data?.code !== "Ok") {
      console.warn(`[fetchRoadRoute] OSRM code: ${data?.code}`);
      return [];
    }

    const coords: [number, number][] =
      data?.routes?.[0]?.geometry?.coordinates ?? [];

    if (!coords.length) return [];

    // Convert OSRM [lng, lat] → [lat, lng]
    const points = coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
    console.info(`[fetchRoadRoute] ${points.length} road points`);
    return points;
  } catch (err) {
    console.error("[fetchRoadRoute] error:", err);
    return [];
  }
}
