/**
 * Ray-casting: cek apakah titik (lat, lng) berada di dalam polygon.
 * polygon: [{ lat, lng }, ...] (minimal 3 titik, titik pertama tidak diulang).
 */
export function isPointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/** Titik tengah sederhana dari polygon (untuk center peta). */
export function polygonCenter(polygon) {
  if (!Array.isArray(polygon) || polygon.length === 0) return null;
  let lat = 0;
  let lng = 0;
  polygon.forEach((p) => {
    lat += Number(p.lat);
    lng += Number(p.lng);
  });
  return [lat / polygon.length, lng / polygon.length];
}
