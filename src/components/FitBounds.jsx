import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Menyesuaikan viewport peta agar memuat seluruh polygon (atau titik fallback).
 */
export default function FitBounds({ polygon, fallbackPoints }) {
  const map = useMap();

  useEffect(() => {
    const pts =
      Array.isArray(polygon) && polygon.length >= 3
        ? polygon.map((p) => [p.lat, p.lng])
        : (fallbackPoints || []).map((p) => [p.lat, p.lng]);

    if (pts.length === 0) return;

    try {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds.pad(0.15));
    } catch {
      // abaikan jika bounds tidak valid
    }
  }, [map, polygon, fallbackPoints]);

  return null;
}
