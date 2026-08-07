import { useEffect, useState } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

function pinSvg(color, size = 20) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="16" cy="14" r="5" fill="#fff"/></svg>`;
}

function pinIcon() {
  const s = 20;
  return L.divIcon({
    className: 'post-marker-icon',
    html: `<div style="width:${s}px;height:${s}px;filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.3));">${pinSvg('#2563eb', s)}</div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s],
  });
}

export default function CurrentLocation({ enabled = true, zoom = 19 }) {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return undefined;
    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setPosition(p);
        map.setView([p.lat, p.lng], zoom);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, map, zoom]);

  if (!position) return null;
  return <Marker position={[position.lat, position.lng]} icon={pinIcon()} />;
}