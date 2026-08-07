import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import FitBounds from './FitBounds';
import CurrentLocation from './CurrentLocation';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';

const KEY = 'AIzaSyDqD1Z03FoLnIGJTbpAgRvjcchrR-NiICk';
const GMAP_URL = `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${KEY}`;
const GSAT_URL = `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${KEY}`;
const ATTR = '&copy; Google';

function layerToPolygon(layer) {
  const latlngs = layer.getLatLngs()[0] || [];
  return latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

export default function SitePolygonEditor({ value, onChange, height = "min(420px, 70vh)" }) {
  const fgRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const center =
    Array.isArray(value) && value.length > 0
      ? [value[0].lat, value[0].lng]
      : [-6.2, 106.816];

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.clearLayers();
    if (Array.isArray(value) && value.length >= 3) {
      const layer = L.polygon(value.map((p) => [p.lat, p.lng]));
      fg.addLayer(layer);
    }
  }, []);

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
        {Array.isArray(value) && value.length >= 3 ? (
          <FitBounds polygon={value} />
        ) : (
          <CurrentLocation zoom={19} />
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
