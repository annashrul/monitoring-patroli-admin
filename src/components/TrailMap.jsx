import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  LngLatBounds,
  setWorkerUrl,
} from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { animatePosition } from "../utils/gpsFilter";

const STYLES = [
  { id: "liberty", label: "Jalan (Liberty)", url: "https://tiles.openfreemap.org/styles/liberty" },
  { id: "positron", label: "Terang (Positron)", url: "https://tiles.openfreemap.org/styles/positron" },
  { id: "bright", label: "Cerah (Bright)", url: "https://tiles.openfreemap.org/styles/bright" },
  { id: "dark", label: "Gelap (Dark)", url: "https://tiles.openfreemap.org/styles/dark" },
];

const TRAIL_LAYERS = ["trail-line", "trail-points", "trail-start", "trail-end"];

function toGeoJson(points) {
  const coords = points.map((p) => [p.lng, p.lat]);
  const features = [];
  if (coords.length > 0) {
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
      properties: {},
    });
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: coords[0] },
      properties: { kind: "start", time: points[0].recorded_at },
    });
    if (coords.length > 1) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coords[coords.length - 1] },
        properties: { kind: "end", time: points[points.length - 1].recorded_at },
      });
    }
    for (let i = 1; i < coords.length - 1; i++) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coords[i] },
        properties: { kind: "point", time: points[i].recorded_at },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

function fmt(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function addTrailLayers(map, points) {
  TRAIL_LAYERS.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource("trail")) map.removeSource("trail");

  map.addSource("trail", { type: "geojson", data: toGeoJson(points) });

  map.addLayer({
    id: "trail-line",
    type: "line",
    source: "trail",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#3B82F6", "line-width": 4, "line-opacity": 0.85 },
  });
  map.addLayer({
    id: "trail-points",
    type: "circle",
    source: "trail",
    filter: ["==", ["get", "kind"], "point"],
    paint: { "circle-color": "#3B82F6", "circle-radius": 3, "circle-opacity": 0.55 },
  });
  map.addLayer({
    id: "trail-start",
    type: "circle",
    source: "trail",
    filter: ["==", ["get", "kind"], "start"],
    paint: {
      "circle-color": "#16a34a",
      "circle-radius": 8,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: "trail-end",
    type: "circle",
    source: "trail",
    filter: ["==", ["get", "kind"], "end"],
    paint: {
      "circle-color": "#dc2626",
      "circle-radius": 8,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
}

function fitMap(map, points, sitePolygon) {
  const coords = [];
  if (Array.isArray(sitePolygon) && sitePolygon.length >= 3) {
    sitePolygon.forEach((p) => coords.push([p.lng, p.lat]));
  } else {
    points.forEach((p) => coords.push([p.lng, p.lat]));
  }
  if (!coords.length) return;
  try {
    const bounds = new LngLatBounds();
    coords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 40, maxZoom: 19 });
  } catch {
    // abaikan
  }
}

export default function TrailMap({ points, sitePolygon = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const sitePolygonRef = useRef(sitePolygon);
  sitePolygonRef.current = sitePolygon;
  const styleInitialized = useRef(false);
  const [styleId, setStyleId] = useState("liberty");

  // Trail yang benar-benar digambar. Titik akhir dianimasi (smoothing) saat
  // posisi valid berpindah, sehingga marker akhir tidak melompat.
  const [drawnPoints, setDrawnPoints] = useState(points);
  const committedRef = useRef(points);
  const displayedTailRef = useRef(points.length ? points[points.length - 1] : null);
  const animCancelRef = useRef(null);

  // Inisialisasi peta sekali.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setWorkerUrl(maplibreWorkerUrl);
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLES.find((s) => s.id === styleId)?.url,
      center: [106.816, -6.2],
      zoom: 15,
    });
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    map.on("error", (e) => {
      console.error("MapLibre error:", e?.error || e);
    });

    map.on("load", () => {
      addTrailLayers(map, pointsRef.current);
      fitMap(map, pointsRef.current, sitePolygonRef.current);
    });

    map.on("click", (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: TRAIL_LAYERS });
      if (!feats.length) return;
      const f = feats[0];
      const [lng, lat] = f.geometry.coordinates;
      const t = f.properties.time;
      new Popup()
        .setLngLat([lng, lat])
        .setHTML(
          `<div style="font-family:sans-serif;font-size:12px;line-height:1.5">` +
            `<b>${fmt(t)}</b><br/>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`,
        )
        .addTo(map);
    });

    map.on("mouseenter", "trail-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "trail-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Titik akhir trail dianimasi saat ada titik baru (hasil GPS filter):
  // garis/polyline tetap memakai koordinat yang sudah lolos filter, dan
  // marker akhir meluncur ke posisi barunya tanpa melompat.
  useEffect(() => {
    const prev = committedRef.current;
    const next = points;

    const samePrefix =
      prev.length > 0 &&
      next.length >= prev.length &&
      next.slice(0, prev.length).every(
        (p, i) => p.lat === prev[i].lat && p.lng === prev[i].lng,
      );

    animCancelRef.current?.();
    // Titik akhir yang sedang terlihat (bisa sedang di tengah animasi).
    const from =
      displayedTailRef.current ?? (prev.length ? prev[prev.length - 1] : null);
    displayedTailRef.current = next.length ? next[next.length - 1] : null;

    if (!samePrefix) {
      // Pergantian total (ganti satpam/tanggal) — gambar langsung.
      committedRef.current = next;
      setDrawnPoints(next);
      return;
    }

    // Trail bertambah / titik akhir bergeser — animasikan titik akhir.
    const to = next[next.length - 1];
    committedRef.current = next; // bandingkan update berikutnya terhadap target
    animCancelRef.current = animatePosition(
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
      (lat, lng) => {
        displayedTailRef.current = { ...to, lat, lng };
        setDrawnPoints([...next.slice(0, -1), displayedTailRef.current]);
      },
    );

    return () => animCancelRef.current?.();
  }, [points]);

  // Perbarui data saat drawnPoints berubah (tanpa re-fit, agar view tidak
  // lompat saat trail bertambah live).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const src = map.getSource("trail");
      if (src) src.setData(toGeoJson(drawnPoints));
    };
    if (map.loaded() && map.getSource("trail")) update();
    else map.once("load", update);
  }, [drawnPoints]);

  // Ganti gaya peta.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!styleInitialized.current) {
      styleInitialized.current = true;
      return;
    }
    const url = STYLES.find((s) => s.id === styleId)?.url;
    if (!url) return;
    map.setStyle(url);
    map.once("style.load", () => {
      addTrailLayers(map, pointsRef.current);
      fitMap(map, pointsRef.current, sitePolygonRef.current);
    });
  }, [styleId]);

  return (
    <div className="relative" style={{ height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <div className="absolute top-2 left-2 z-10">
        <select
          value={styleId}
          onChange={(e) => setStyleId(e.target.value)}
          className="h-8 px-2 rounded-md border border-saas-border bg-saas-bg-secondary text-saas-text text-xs font-medium"
        >
          {STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="absolute bottom-1 right-1 z-10 text-[10px] text-saas-text-muted bg-saas-bg-secondary/80 px-1.5 py-0.5 rounded">
        &copy; OpenStreetMap &middot; OpenFreeMap
      </div>
    </div>
  );
}
