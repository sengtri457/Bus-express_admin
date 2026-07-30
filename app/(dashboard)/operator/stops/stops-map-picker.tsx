"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface StopsMapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function StopsMapPicker({ lat, lng, onChange }: StopsMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = lat ?? 11.5564;
    const initialLng = lng ?? 104.9282;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Standard Leaflet marker icon resolution fallback
    const DefaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: DefaultIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;
    mapRef.current = map;

    // Handle map clicks
    map.on("click", (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      marker.setLatLng(e.latlng);
      onChange(newLat, newLng);
    });

    // Handle marker drag
    marker.on("dragend", () => {
      const latlng = marker.getLatLng();
      onChange(latlng.lat, latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position if coordinates change externally (sync with manual typing)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || lat === null || lng === null) return;

    const currentPos = marker.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
      const newLatLng = L.latLng(lat, lng);
      marker.setLatLng(newLatLng);
      map.panTo(newLatLng);
    }
  }, [lat, lng]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500">Pick Location on Map</label>
      <div 
        ref={containerRef} 
        className="h-[200px] w-full rounded-lg border border-gray-300 overflow-hidden"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
