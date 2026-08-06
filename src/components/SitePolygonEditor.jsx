import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import FitBounds from './FitBounds';
import CurrentLocation from './CurrentLocation';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function layerToPolygon(layer) {
  const latlngs = layer.getLatLngs()[0] || [];
  return latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

/**
 * Peta untuk menggambar / mengedit polygon site memakai leaflet-draw.
 * value: [{lat,lng}, ...]; onChange dipanggil dengan format yang sama.
 * Parent disarankan memberi `key` yang berubah saat berpindah site agar state bersih.
 */
export default function SitePolygonEditor({ value, onChange, height = "min(420px, 70vh)" }) {
  const fgRef = useRef(null);
  const center =
    Array.isArray(value) && value.length > 0
      ? [value[0].lat, value[0].lng]
      : [-6.2, 106.816];

  // Tampilkan polygon existing ke dalam FeatureGroup (mode edit).
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.clearLayers();
    if (Array.isArray(value) && value.length >= 3) {
      const layer = L.polygon(value.map((p) => [p.lat, p.lng]));
      fg.addLayer(layer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (e) => {
    if (e.layerType !== 'polygon') return;
    const fg = fgRef.current;
    if (!fg) return;
    // Hanya boleh satu polygon: hapus yang lama
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
    <div className="rounded-none overflow-hidden border-[3px] border-brutal-zinc shadow-brutalSm" style={{ height: containerHeight }}>
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={OSM_URL} attribution={OSM_ATTR} />
        {Array.isArray(value) && value.length >= 3 ? (
          <FitBounds polygon={value} />
        ) : (
          // Belum ada polygon -> pusatkan peta ke lokasi admin saat ini
          <CurrentLocation />
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
            // Catatan: jangan isi prop `edit` dengan boolean true/false —
            // leaflet-draw mengharapkan object konfigurasi. Dibiarkan kosong
            // agar tombol edit & hapus aktif dengan pengaturan default.
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
