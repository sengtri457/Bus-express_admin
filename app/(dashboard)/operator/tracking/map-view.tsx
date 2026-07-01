"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchRoadRoute } from "@/app/actions/fetch-road-route";

// ── Types ──────────────────────────────────────────────────────────────────
interface DriverPoint {
  id: string;
  name: string | null;
  trip: {
    routeName: string;
    origin: string;
    destination: string;
    busPlate: string;
    status: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    heading: number | null;
    speed: number | null;
    updated_at: string;
  } | null;
}

interface Props {
  drivers: DriverPoint[];
  selectedDriverId?: string | null;
  onDriverSelect?: (id: string) => void;
}

// ── Cambodian city lookup ──────────────────────────────────────────────────
const CITY_COORDINATES: Record<string, [number, number]> = {
  "phnom penh": [11.5564, 104.9282],
  "takeo": [10.9904, 104.7845],
  "siem reap": [13.3633, 103.8564],
  "sihanoukville": [10.6096, 103.5292],
  "kampot": [10.5942, 104.1814],
  "battambang": [13.0957, 103.2022],
  "poipet": [13.6561, 102.563],
  "kampong cham": [11.9934, 105.4645],
  "kampong chhnang": [12.25, 104.6667],
  "kampong speu": [11.4533, 104.5208],
  "kampong thom": [12.7111, 104.8883],
  "kandal": [11.4833, 104.95],
  "kep": [10.4833, 104.3167],
  "koh kong": [11.6153, 102.9838],
  "kratie": [12.4833, 106.0167],
  "mondulkiri": [12.45, 107.2],
  "oddar meanchey": [14.175, 103.5167],
  "pailin": [12.8489, 102.6092],
  "preah vihear": [13.8, 104.9667],
  "prey veng": [11.4833, 105.3333],
  "pursat": [12.5333, 103.9167],
  "ratanakiri": [13.7333, 107.0],
  "stung treng": [13.525, 105.9667],
  "svay rieng": [11.0833, 105.8],
  "tboung khmum": [11.9167, 105.6667],
};

async function resolveCity(name: string): Promise<[number, number] | null> {
  const key = name.trim().toLowerCase();
  if (CITY_COORDINATES[key]) return CITY_COORDINATES[key];
  try {
    const q = encodeURIComponent(`${name}, Cambodia`);
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { signal: ctrl.signal }
    );
    clearTimeout(tid);
    if (r.ok) {
      const list = await r.json();
      if (list[0]) return [parseFloat(list[0].lat), parseFloat(list[0].lon)];
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Calls the Next.js Server Action to fetch the full road route.
 * Server Actions run on the server (Node.js) — zero CORS issues,
 * User-Agent header works, no API proxy needed.
 */
async function fetchFullRoadRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<[number, number][]> {
  try {
    const pts = await fetchRoadRoute(origin[0], origin[1], destination[0], destination[1]);
    if (pts.length) console.info(`[route] ${pts.length} road pts via server action`);
    return pts;
  } catch (e) {
    console.warn("[route] server action error:", e);
    return [];
  }
}

/**
 * Given a full road polyline and the bus's current position,
 * split the polyline at the nearest point to the bus.
 * Returns { travelled: points[], remaining: points[] }
 */
function splitRouteAtBus(
  routePts: [number, number][],
  busPos: [number, number]
): { travelled: [number, number][]; remaining: [number, number][] } {
  if (routePts.length < 2) {
    return { travelled: [], remaining: routePts };
  }

  let closestIdx = 0;
  let minDist = Infinity;

  for (let i = 0; i < routePts.length; i++) {
    const [lat, lng] = routePts[i];
    const dLat = lat - busPos[0];
    const dLng = lng - busPos[1];
    const dist = dLat * dLat + dLng * dLng; // squared distance (fast, no sqrt needed)
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  const travelled = routePts.slice(0, closestIdx + 1);
  const remaining = [routePts[closestIdx], ...routePts.slice(closestIdx + 1)];

  return { travelled, remaining };
}

function getRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

// ── Bus Marker Icon (clean SVG, no emoji) ─────────────────────────────────
function makeBusIcon(active: boolean, selected: boolean) {
  const bg = active ? "#2563EB" : "#9CA3AF";
  const border = active ? "#1d4ed8" : "#6b7280";
  const pinW = selected ? 48 : 40;
  const pinH = selected ? 58 : 48;
  // Pulse ring for selected+active
  const pulse = active && selected
    ? `<circle cx="${pinW / 2}" cy="${pinW / 2}" r="${pinW / 2 - 1}" fill="none" stroke="${bg}" stroke-width="2" opacity="0.3"/>`
    : "";
  // Clean bus SVG (side-view silhouette)
  const busW = selected ? 22 : 18;
  const busH = selected ? 16 : 13;
  const bx = (pinW - busW) / 2;
  const by = (pinW - pinH * 0.3 - busH) / 2;  // centre in the circle part
  const busSvg = `
    <!-- Body -->
    <rect x="${bx}" y="${by}" width="${busW}" height="${busH}" rx="2.5" fill="white"/>
    <!-- Front window -->
    <rect x="${bx + busW * 0.6}" y="${by + 2}" width="${busW * 0.28}" height="${busH * 0.45}" rx="1" fill="${bg}"/>
    <!-- Rear window -->
    <rect x="${bx + busW * 0.1}" y="${by + 2}" width="${busW * 0.38}" height="${busH * 0.45}" rx="1" fill="${bg}"/>
    <!-- Door line -->
    <line x1="${bx + busW * 0.52}" y1="${by + busH * 0.5}" x2="${bx + busW * 0.52}" y2="${by + busH}" stroke="${bg}" stroke-width="1"/>
    <!-- Left wheel -->
    <circle cx="${bx + busW * 0.22}" cy="${by + busH}" r="${selected ? 3 : 2.5}" fill="${border}"/>
    <circle cx="${bx + busW * 0.22}" cy="${by + busH}" r="${selected ? 1.5 : 1.2}" fill="white"/>
    <!-- Right wheel -->
    <circle cx="${bx + busW * 0.78}" cy="${by + busH}" r="${selected ? 3 : 2.5}" fill="${border}"/>
    <circle cx="${bx + busW * 0.78}" cy="${by + busH}" r="${selected ? 1.5 : 1.2}" fill="white"/>
  `;

  return L.divIcon({
    className: "",
    html: `
      <div style="width:${pinW}px;height:${pinH}px;position:relative;">
        <svg width="${pinW}" height="${pinH}" viewBox="0 0 ${pinW} ${pinH}" xmlns="http://www.w3.org/2000/svg"
             style="filter:drop-shadow(0 3px 10px rgba(0,0,0,0.32));">
          ${pulse}
          <!-- Teardrop pin shape -->
          <path d="M${pinW / 2} ${pinH - 2}
                   C${pinW / 2} ${pinH - 2} ${2} ${pinW * 0.72}
                   ${2} ${pinW / 2}
                   A${pinW / 2 - 2} ${pinW / 2 - 2} 0 1 1 ${pinW - 2} ${pinW / 2}
                   C${pinW - 2} ${pinW * 0.72} ${pinW / 2} ${pinH - 2} ${pinW / 2} ${pinH - 2}Z"
                fill="${bg}" stroke="white" stroke-width="2"/>
          ${busSvg}
        </svg>
      </div>`,
    iconSize: [pinW, pinH],
    iconAnchor: [pinW / 2, pinH - 2],
  });
}

// ── Direction arrow markers along a polyline ───────────────────────────────
function placeArrows(map: L.Map, pts: [number, number][], color: string): L.Marker[] {
  const arrows: L.Marker[] = [];
  const step = Math.max(1, Math.floor(pts.length / 5));
  for (let i = step; i < pts.length; i += step) {
    const [lat1, lng1] = pts[i - 1];
    const [lat2, lng2] = pts[i];
    const angle = (Math.atan2(lng2 - lng1, lat2 - lat1) * 180) / Math.PI;
    const m = L.marker([lat2, lng2], {
      icon: L.divIcon({
        className: "",
        html: `<div style="transform:rotate(${angle}deg);color:${color};font-size:13px;line-height:1;opacity:0.9;text-shadow:0 1px 3px rgba(255,255,255,0.8);">▶</div>`,
        iconSize: [13, 13],
        iconAnchor: [6, 6],
      }),
      interactive: false,
      zIndexOffset: 400,
    }).addTo(map);
    arrows.push(m);
  }
  return arrows;
}

// ── Origin/Destination markers ─────────────────────────────────────────────
const originIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destIcon = L.divIcon({
  className: "",
  html: `<svg width="22" height="34" viewBox="0 0 22 34" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 23 11 23s11-14.75 11-23C22 4.925 17.075 0 11 0z" fill="#ef4444"/>
    <circle cx="11" cy="11" r="4.5" fill="white"/>
  </svg>`,
  iconSize: [22, 34],
  iconAnchor: [11, 34],
});

// ── Stored route state per driver ──────────────────────────────────────────
type RouteState = {
  fullRoute: [number, number][];  // road polyline from initial busPos → destination
  routeLine: L.Polyline;          // blue road line (bus → destination)
  arrows: L.Marker[];
  originMarker: L.Marker;         // green pulsing dot — lives at current bus GPS
  destMarker: L.Marker;
  destCoord: [number, number];
};

function clearRoute(map: L.Map, routes: Map<string, RouteState>, id: string) {
  const r = routes.get(id);
  if (!r) return;
  map.removeLayer(r.routeLine);
  map.removeLayer(r.originMarker);
  map.removeLayer(r.destMarker);
  r.arrows.forEach((a) => map.removeLayer(a));
  routes.delete(id);
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MapView({ drivers, selectedDriverId, onDriverSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routesRef = useRef<Map<string, RouteState>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());

  // ── Initialise map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [11.5564, 104.9282],
      zoom: 7,
      zoomControl: false,
    });

    // Carto Voyager — clean Google Maps-style tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      routesRef.current.clear();
      fetchingRef.current.clear();
    };
  }, []);

  // ── Fly to selected driver ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDriverId || !mapRef.current) return;
    const d = drivers.find((x) => x.id === selectedDriverId);
    if (!d?.location) return;
    mapRef.current.flyTo([d.location.latitude, d.location.longitude], 13, {
      animate: true,
      duration: 1.0,
    });
  }, [selectedDriverId, drivers]);

  // ── Update markers + routes ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const routes = routesRef.current;
    const fetching = fetchingRef.current;

    for (const driver of drivers) {
      const isActive = driver.trip?.status === "in_progress" && !!driver.location;
      const isSelected = driver.id === selectedDriverId;
      const existing = markers.get(driver.id);

      // ── No location: remove everything ──────────────────────────────────
      if (!driver.location) {
        if (existing) { map.removeLayer(existing); markers.delete(driver.id); }
        clearRoute(map, routes, driver.id);
        continue;
      }

      const latlng: [number, number] = [driver.location.latitude, driver.location.longitude];

      // ── Bus popup HTML ───────────────────────────────────────────────────
      const popup = `
        <div style="font-family:system-ui;min-width:180px;font-size:13px;line-height:1.6;">
          <div style="font-weight:700;font-size:14px;color:#0F172A;margin-bottom:3px;">${driver.name ?? "Driver"}</div>
          ${driver.trip ? `
            <div style="color:#2563EB;font-weight:600;font-size:12px;">${driver.trip.routeName}</div>
            <div style="color:#64748B;font-size:11px;margin:3px 0;">
              <span style="color:#22c55e;">●</span> ${driver.trip.origin}<br/>
              <span style="color:#ef4444;">●</span> ${driver.trip.destination}
            </div>
            <div style="color:#64748B;font-size:11px;">🚌 ${driver.trip.busPlate}</div>
          ` : '<div style="color:#94A3B8;font-size:11px;">No active trip</div>'}
          <div style="color:#94A3B8;font-size:11px;margin-top:4px;">📡 ${getRelativeTime(driver.location.updated_at)}</div>
          <div style="color:#CBD5E1;font-size:10px;font-family:monospace;">${latlng[0].toFixed(5)}, ${latlng[1].toFixed(5)}</div>
        </div>`;

      // ── Update or create bus marker ──────────────────────────────────────
      const icon = makeBusIcon(isActive, isSelected);
      if (existing) {
        existing.setLatLng(latlng);
        existing.setIcon(icon);
        existing.setPopupContent(popup);
      } else {
        const m = L.marker(latlng, { icon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(popup, { closeButton: false, maxWidth: 240 });
        m.on("click", () => onDriverSelect?.(driver.id));
        markers.set(driver.id, m);
      }
      if (isSelected) {
        const m = markers.get(driver.id);
        if (m && !m.isPopupOpen()) m.openPopup();
      }

      // ── Route drawing ────────────────────────────────────────────────────
      if (!isActive) {
        clearRoute(map, routes, driver.id);
        continue;
      }

      const existingRoute = routes.get(driver.id);

      if (existingRoute) {
        // ── Bus moved: update origin dot + route line ──────────────────────
        // Origin marker follows the bus live position
        existingRoute.originMarker.setLatLng(latlng);

        // Split the original route at the closest point to the bus
        const { remaining } = splitRouteAtBus(existingRoute.fullRoute, latlng);
        
        let updatedPts: [number, number][] = remaining.length >= 2
          ? [latlng, ...remaining.slice(1)]
          : [latlng, existingRoute.destCoord];

        existingRoute.routeLine.setLatLngs(updatedPts);

        // Refresh direction arrows
        existingRoute.arrows.forEach((a) => map.removeLayer(a));
        existingRoute.arrows = placeArrows(map, updatedPts, "#1d4ed8");

        // Check if bus has deviated from the route by more than ~800 meters (0.008 degrees)
        let needsRefetch = false;
        if (remaining.length > 0) {
          const closestPt = remaining[0];
          const dLat = closestPt[0] - latlng[0];
          const dLng = closestPt[1] - latlng[1];
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist > 0.008) {
            needsRefetch = true;
          }
        } else {
          needsRefetch = true;
        }

        if (needsRefetch && !fetching.has(driver.id)) {
          fetching.add(driver.id);
          fetchFullRoadRoute(latlng, existingRoute.destCoord)
            .then((newRoute) => {
              if (newRoute.length >= 2) {
                existingRoute.fullRoute = newRoute;
                existingRoute.routeLine.setLatLngs(newRoute);
                
                // Refresh direction arrows
                existingRoute.arrows.forEach((a) => map.removeLayer(a));
                existingRoute.arrows = placeArrows(map, newRoute, "#1d4ed8");
              }
              fetching.delete(driver.id);
            })
            .catch(() => {
              fetching.delete(driver.id);
            });
        }

      } else if (!fetching.has(driver.id) && driver.trip) {
        // ── First time: fetch road route bus→destination ─────────────────────
        // Origin = bus current GPS position (live, dynamic)
        fetching.add(driver.id);
        const { destination } = driver.trip;
        const busPos = latlng;

        resolveCity(destination)
          .then(async (destCoord) => {
            if (!destCoord) { fetching.delete(driver.id); return; }

            // Fetch road route from current bus position → destination
            const fullRoute = await fetchFullRoadRoute(busPos, destCoord);

            const currentMap = mapRef.current;
            if (!currentMap) { fetching.delete(driver.id); return; }

            // Fallback arc if OSRM fails
            const routePts: [number, number][] =
              fullRoute.length >= 2
                ? fullRoute
                : buildFallbackArc(busPos, destCoord, 16);

            // Ensure route starts exactly at bus position
            const finalPts: [number, number][] = [busPos, ...routePts.slice(1)];

            // Blue road line from bus → destination
            const routeLine = L.polyline(finalPts, {
              color: "#2563EB",
              weight: 5,
              opacity: 0.92,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(currentMap);

            // Direction arrows
            const arrows = placeArrows(currentMap, finalPts, "#1d4ed8");

            // Green pulsing dot at bus current position (origin = "here")
            const originMarker = L.marker(busPos, {
              icon: L.divIcon({
                className: "",
                html: `
                  <div style="position:relative;width:20px;height:20px;">
                    <div style="
                      position:absolute;inset:0;
                      border-radius:50%;
                      background:rgba(34,197,94,0.25);
                      animation:pulse-ring 1.8s ease-out infinite;
                    "></div>
                    <div style="
                      position:absolute;inset:4px;
                      border-radius:50%;
                      background:#22c55e;
                      border:2.5px solid white;
                      box-shadow:0 2px 6px rgba(34,197,94,0.6);
                    "></div>
                  </div>
                  <style>
                    @keyframes pulse-ring {
                      0%   { transform:scale(0.8); opacity:0.8; }
                      100% { transform:scale(2.2); opacity:0; }
                    }
                  </style>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              }),
              zIndexOffset: 900,
              interactive: false,
            })
              .addTo(currentMap)
              .bindTooltip(`<b>Current location</b><br/>${driver.name ?? ""}`, {
                direction: "top",
                sticky: true,
              });

            // Red destination pin
            const destMarker = L.marker(destCoord, {
              icon: destIcon,
              zIndexOffset: 200,
            })
              .addTo(currentMap)
              .bindTooltip(`<b>Destination:</b> ${destination}`, {
                direction: "top",
                sticky: true,
              });

            routes.set(driver.id, {
              fullRoute: routePts,
              routeLine,
              arrows,
              originMarker,
              destMarker,
              destCoord,
            });

            // Auto-fit to show full route
            const bounds = L.latLngBounds(finalPts.map(([lat, lng]) => L.latLng(lat, lng)));
            if (bounds.isValid()) currentMap.fitBounds(bounds, { padding: [70, 70] });

            fetching.delete(driver.id);
          })
          .catch(() => fetching.delete(driver.id));
      }
    }

    // ── Clean up removed drivers ───────────────────────────────────────────
    for (const [id, marker] of markers) {
      if (!drivers.find((d) => d.id === id)) {
        map.removeLayer(marker);
        markers.delete(id);
        clearRoute(map, routes, id);
      }
    }
  }, [drivers, selectedDriverId, onDriverSelect]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map Legend */}
      <div className="absolute bottom-10 left-3 z-[1000] rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2.5 text-[11px] text-slate-500 shadow-lg space-y-1.5">
        <p className="font-semibold text-slate-700 text-xs mb-1">Legend</p>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-[4px] rounded bg-[#2563EB]" />
          <span>Route to Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white shadow" />
          <span>Live Origin (Bus)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#ef4444] border-2 border-white shadow" />
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback when OSRM is unavailable: generate a curved arc between two points
 * using great-circle interpolation with a slight midpoint offset (not straight line).
 */
function buildFallbackArc(
  from: [number, number],
  to: [number, number],
  steps: number
): [number, number][] {
  const pts: [number, number][] = [];
  // midpoint with a perpendicular offset to simulate a curve
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  // perpendicular offset (slight arc)
  const offsetLat = -dLng * 0.15;
  const offsetLng = dLat * 0.15;
  const cp: [number, number] = [midLat + offsetLat, midLng + offsetLng];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * cp[0] + t * t * to[0];
    const lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * cp[1] + t * t * to[1];
    pts.push([lat, lng]);
  }
  return pts;
}
