import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Marker } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import FitBounds from './FitBounds';
import CurrentLocation from './CurrentLocation';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import api from '../api';
import MapFullscreenButton from './MapFullscreenButton';

const KEY = 'AIzaSyDqD1Z03FoLnIGJTbpAgRvjcchrR-NiICk';
const GMAP_URL = `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${KEY}`;
const GSAT_URL = `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${KEY}`;
const ATTR = '&copy; Google';

function layerToPolygon(layer) {
  const latlngs = layer.getLatLngs()[0] || [];
  return latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

function MapPanner({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], 19);
  }, [map, target]);
  return null;
}

function pinIcon(name) {
  return L.divIcon({
    className: 'search-pin',
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:28px;height:28px;filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.3));"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="#2563eb" stroke="#fff" stroke-width="3"/><circle cx="16" cy="14" r="5" fill="#fff"/></svg></div><div style="font-size:11px;font-weight:700;color:#fff;background:rgba(0,0,0,0.75);padding:2px 6px;border-radius:4px;white-space:nowrap;margin-top:2px;">${name || ''}</div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function SitePolygonEditor({ value, onChange, height = "min(420px, 70vh)" }) {
  const fgRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [panTarget, setPanTarget] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [userMoved, setUserMoved] = useState(false);

  // Debounce autocomplete (Google Places)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setVisibleCount(10);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get('/api/geo/autocomplete', { params: { q: searchQuery } });
        const results = res.data.data || [];
        setSearchResults(results.map((r) => ({
          display_name: r.display_name,
          lat: r.lat,
          lng: r.lng,
        })).filter((r) => r.lat != null && r.lng != null));
        setVisibleCount(10);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const center =
    Array.isArray(value) && value.length > 0
      ? [value[0].lat, value[0].lng]
      : [-6.2, 106.816];

  useEffect(() => {
    if (!mapReady) return;
    const fg = fgRef.current;
    if (!fg) return;
    fg.clearLayers();
    if (Array.isArray(value) && value.length >= 3) {
      const layer = L.polygon(value.map((p) => [p.lat, p.lng]));
      fg.addLayer(layer);
    }
  }, [mapReady, value]);

  const handleCreated = (e) => {
    if (e.layerType !== 'polygon') return;
    const fg = fgRef.current;
    if (!fg) return;
    fg.clearLayers();
    fg.addLayer(e.layer);
    onChange(layerToPolygon(e.layer));
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    let latest = null;
    layers.eachLayer((layer) => {
      latest = layerToPolygon(layer);
    });
    if (latest) onChange(latest);
  };

  const handleDeleted = () => {
    onChange([]);
  };

  const handleSelectResult = (result) => {
    setPanTarget({ lat: result.lat, lng: result.lng, name: result.display_name });
    setUserMoved(true);
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  return (
    <div>
      <div className="relative mb-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-saas-text-muted z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lokasi (ketik min 3 huruf)..."
            className="h-9 text-sm pl-9"
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-saas-text-muted">Mencari...</span>
          )}
        </div>
        {searchResults.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 max-w-sm bg-white border-2 border-brutal-black rounded-brutal overflow-hidden shadow-brutal max-h-60 overflow-y-auto z-[2000]"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && visibleCount < searchResults.length) {
                setVisibleCount((c) => Math.min(c + 10, searchResults.length));
              }
            }}
          >
            {searchResults.slice(0, visibleCount).map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-saas-bg-tertiary border-b last:border-b-0 border-saas-border"
              >
                {r.display_name}
              </button>
            ))}
            {visibleCount < searchResults.length && (
              <div className="text-center py-2 text-xs text-saas-text-muted">Scroll untuk lihat lebih banyak...</div>
            )}
          </div>
        )}
      </div>
      <div ref={mapContainerRef} className="relative rounded-none overflow-hidden border-[3px] border-brutal-zinc shadow-brutalSm" style={{ height: containerHeight }}>
        {!mapReady && <Skeleton className="absolute inset-0 z-[9999] w-full h-full" />}
        <MapContainer center={center} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }} whenReady={() => setMapReady(true)}>
          <MapInvalidator />
          <MapPanner target={panTarget} />
          <TileLayer
            url={satellite ? GSAT_URL : GMAP_URL}
            attribution={ATTR}
            maxZoom={21}
            maxNativeZoom={20}
            subdomains={['0', '1', '2', '3']}
          />
          {Array.isArray(value) && value.length >= 3 ? (
            <FitBounds polygon={value} />
          ) : (
            <CurrentLocation zoom={19} enabled={!userMoved} />
          )}
          {panTarget && (
            <Marker position={[panTarget.lat, panTarget.lng]} icon={pinIcon(panTarget.name)} />
          )}
          <FeatureGroup ref={fgRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                polygon: {
                  allowIntersection: false,
                  shapeOptions: { color: '#1e3a5f' },
                },
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
              }}
            />
          </FeatureGroup>
        </MapContainer>
        <div className="absolute bottom-4 left-2 z-[999] flex gap-1">
          <MapFullscreenButton containerRef={mapContainerRef} />
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
    </div>
  );
}
