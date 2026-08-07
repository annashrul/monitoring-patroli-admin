import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import FitBounds from './FitBounds';
import CurrentLocation from './CurrentLocation';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';

const KEY = 'AIzaSyDqD1Z03FoLnIGJTbpAgRvjcchrR-NiICk';
const GMAP_URL = `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${KEY}`;
const GSAT_URL = `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${KEY}`;
const ATTR = '&copy; Google';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pinSvg(color, size = 32) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="16" cy="14" r="5" fill="#fff"/></svg>`;
}

function smallPostIcon(post) {
  const color = post.is_active ? '#ff6b00' : '#6b7280';
  const s = 22;
  return L.divIcon({
    className: 'post-marker-icon',
    html: `<div style="width:${s}px;height:${s}px;filter:drop-shadow(1px 1px 0 rgba(0,0,0,0.3));">${pinSvg(color, s)}</div><div style="transform:translate(-50%,6px);white-space:nowrap;font-size:11px;font-weight:700;color:#111827;background:rgba(255,255,255,0.92);padding:1px 6px;border-radius:2px;border:2px solid rgba(0,0,0,0.12);position:absolute;left:0;text-align:center;">${escapeHtml(post.name)}</div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s],
  });
}

function pickedIcon() {
  const s = 22;
  return L.divIcon({
    className: 'post-marker-icon',
    html: `<div style="width:${s}px;height:${s}px;filter:drop-shadow(1px 1px 0 rgba(0,0,0,0.3));">${pinSvg('#f59e0b', s)}</div><div style="transform:translate(-50%,6px);white-space:nowrap;font-size:11px;font-weight:700;color:#111827;background:rgba(255,255,255,0.92);padding:1px 6px;border-radius:2px;border:2px solid rgba(0,0,0,0.12);position:absolute;left:0;text-align:center;">Lokasi Dipilih</div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s],
  });
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      if (onPick) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function PostLocationMap({
  polygon,
  posts = [],
  picked,
  onPick,
  excludePostId,
  height = "min(340px, 70vh)",
}) {
  const [mapReady, setMapReady] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const center =
    Array.isArray(polygon) && polygon.length > 0
      ? [polygon[0].lat, polygon[0].lng]
      : [-6.2, 106.816];

  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  return (
    <div className="relative rounded-none overflow-hidden border-[3px] border-brutal-zinc shadow-brutalSm" style={{ height: containerHeight }}>
      {!mapReady && <Skeleton className="absolute inset-0 z-[9999] w-full h-full" />}
      <MapContainer center={center} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }} whenReady={() => setMapReady(true)}>
        <TileLayer
          url={satellite ? GSAT_URL : GMAP_URL}
          attribution={ATTR}
          maxZoom={21}
          maxNativeZoom={20}
          subdomains={['0', '1', '2', '3']}
        />
        <ClickHandler onPick={onPick} />
        {Array.isArray(polygon) && polygon.length >= 3 ? (
          <>
            <Polygon
              positions={polygon.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#1e3a5f', weight: 2, fillOpacity: 0.06 }}
            />
            <FitBounds polygon={polygon} />
          </>
        ) : (
          <CurrentLocation zoom={19} />
        )}
        {posts
          .filter((p) => p.id !== excludePostId)
          .map((post) => (
            <Marker
              key={post.id}
              position={[post.latitude, post.longitude]}
              icon={smallPostIcon(post)}
            />
          ))}
        {picked && (
          <Marker position={[picked.lat, picked.lng]} icon={pickedIcon()} />
        )}
      </MapContainer>
      <div className="absolute bottom-4 left-2 z-[999] flex gap-1">
        <Button
          size="sm"
          variant={satellite ? "outline" : "default"}
          onClick={() => setSatellite(false)}
          className="text-xs h-7 px-2"
        >
          Peta
        </Button>
        <Button
          size="sm"
          variant={satellite ? "default" : "outline"}
          onClick={() => setSatellite(true)}
          className="text-xs h-7 px-2"
        >
          Satelit
        </Button>
      </div>
    </div>
  );
}
