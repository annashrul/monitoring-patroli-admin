import { Fragment, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import FitBounds from './FitBounds';
import { Badge } from './ui/badge';
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

function pinSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="16" cy="14" r="5" fill="#fff"/></svg>`;
}

function pinIcon(color) {
  return L.divIcon({
    className: 'post-marker-icon',
    html: `<div style="width:32px;height:32px;filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.3));">${pinSvg(color)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function smallPinIcon(color) {
  return L.divIcon({
    className: 'post-marker-icon',
    html: `<div style="width:22px;height:22px;filter:drop-shadow(1px 1px 0 rgba(0,0,0,0.3));">${pinSvg(color).replace('width="32" height="32"', 'width="22" height="22"')}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

function formatTime(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MonitoringMap({ site, sites, posts, satpamLocations = {}, height = "min(520px, 70vh)" }) {
  const polygon = site?.polygon || [];
  const allSites = site ? [site] : (sites || []);
  const allPolygons = allSites.map((s) => s.polygon).filter((p) => Array.isArray(p) && p.length >= 3);
  const [mapReady, setMapReady] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const center =
    polygon.length > 0
      ? [polygon[0].lat, polygon[0].lng]
      : allPolygons.length > 0
      ? [allPolygons[0][0].lat, allPolygons[0][0].lng]
      : [-6.2, 106.816];

  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  return (
    <div className="relative rounded-none overflow-hidden border-[3px] border-brutal-zinc shadow-brutalSm" style={{ height: containerHeight }}>
      {!mapReady && <Skeleton className="absolute inset-0 z-[9999] w-full h-full" />}
      <MapContainer center={center} zoom={16} maxZoom={21} style={{ height: '100%', width: '100%' }} whenReady={() => setMapReady(true)}>
        <TileLayer
          url={satellite ? GSAT_URL : GMAP_URL}
          attribution={ATTR}
          maxZoom={21}
          maxNativeZoom={20}
          subdomains={['0', '1', '2', '3']}
        />
        {allPolygons.map((poly, i) => (
          <Fragment key={i}>
            <Polygon
              positions={poly.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#1e3a5f', weight: 2, fillOpacity: 0.06 }}
            />
          </Fragment>
        ))}
        {allPolygons.length > 0 && (
          <FitBounds polygon={allPolygons.flat()} />
        )}
        {posts.map((post) => (
          <Marker
            key={post.id}
            position={[post.latitude, post.longitude]}
            icon={pinIcon(post.status === 'scanned' ? '#16a34a' : '#dc2626')}
          >
            <Popup>
              <div className="text-sm font-sans">
                <strong>{post.name}</strong>
                <div className="mt-1">
                  Status:{' '}
                  <Badge variant={post.status === 'scanned' ? 'success' : 'destructive'}>
                    {post.status === 'scanned' ? 'Sudah Discan' : 'Belum Discan'}
                  </Badge>
                </div>
                <div className="mt-1">Radius: {post.radius_m} m</div>
                {post.last_scan ? (
                  <div className="mt-1">
                    Scan terakhir: {formatTime(post.last_scan.scanned_at)}
                    <br />
                    oleh {post.last_scan.scanned_by_name}
                  </div>
                ) : (
                  <div className="mt-1">Belum ada scan pada shift ini</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {Object.values(satpamLocations).map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={L.divIcon({
              className: 'satpam-marker',
              html: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(59,130,246,0.6);"></div><div style="font-size:10px;font-weight:700;color:#fff;background:rgba(0,0,0,0.7);padding:1px 5px;border-radius:3px;white-space:nowrap;margin-top:2px;">${loc.name}</div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          />
        ))}
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
