import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side OSRM proxy — avoids all browser CORS restrictions.
 * Client calls: GET /api/route?o=lat,lng&d=lat,lng
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const o = searchParams.get("o"); // "lat,lng"
  const d = searchParams.get("d"); // "lat,lng"

  if (!o || !d) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [oLat, oLng] = o.split(",").map(Number);
  const [dLat, dLng] = d.split(",").map(Number);

  if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // OSRM expects longitude,latitude order
  const osrmUrl =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${oLng},${oLat};${dLng},${dLat}` +
    `?overview=full&geometries=geojson`;

  try {
    const resp = await fetch(osrmUrl, {
      // Server-side: no CORS, User-Agent is allowed here
      headers: { "User-Agent": "BusExpress-Admin/1.0" },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 300 }, // cache route for 5 min (same road, same result)
    });

    if (!resp.ok) {
      console.error(`[route-proxy] OSRM HTTP ${resp.status}`);
      return NextResponse.json({ coords: [] });
    }

    const data = await resp.json();

    if (data.code !== "Ok") {
      console.warn(`[route-proxy] OSRM code: ${data.code}`);
      return NextResponse.json({ coords: [] });
    }

    const raw: [number, number][] = data?.routes?.[0]?.geometry?.coordinates ?? [];
    // Convert OSRM's [lng, lat] → [lat, lng]
    const coords = raw.map(([lng, lat]) => [lat, lng]);

    console.info(`[route-proxy] ${coords.length} road points: ${o} → ${d}`);
    return NextResponse.json({ coords });
  } catch (err) {
    console.error("[route-proxy] fetch error:", err);
    return NextResponse.json({ coords: [] });
  }
}
