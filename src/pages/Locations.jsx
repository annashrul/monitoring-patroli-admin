import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { getErrorMessage } from "../api";
import { useSite } from "../SiteContext";
import { subscribeLocation } from "../mqtt";
import { GpsFilter, haversineMeters } from "../utils/gpsFilter";
import TrailMap from "../components/TrailMap";
import { Card, CardContent } from "../components/ui/card";
import { DatePicker } from "../components/ui/date-picker";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { Route, Clock, TrendingUp } from "lucide-react";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Format jarak (meter) → "856 m" atau "1,24 km". */
function formatDistance(m) {
  if (m == null || !Number.isFinite(m)) return "-";
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

/** Format durasi (ms) → "45 mnt" atau "1 jam 10 mnt". */
function formatDuration(ms) {
  if (ms == null || ms < 0) return "-";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h > 0) return `${h} jam ${min} mnt`;
  return `${min} mnt`;
}

/** Kecepatan rata-rata (km/jam) dari jarak & durasi. */
function formatSpeed(distanceM, durationMs) {
  if (distanceM == null || !durationMs || durationMs <= 0) return "-";
  const kmh = distanceM / 1000 / (durationMs / 3600000);
  return `${kmh.toFixed(1)} km/jam`;
}

export default function Locations() {
  const { selectedSiteId, selectedSite } = useSite();
  const [allSatpams, setAllSatpams] = useState([]);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Satpam difilter berdasarkan site aktif di sidebar.
  const satpams = selectedSiteId
    ? allSatpams.filter((u) => u.site_id === selectedSiteId || !u.site_id)
    : allSatpams;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/users");
        setAllSatpams((res.data.data || []).filter((u) => u.role === "satpam"));
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat data satpam."));
      }
    })();
  }, []);

  // Reset satpam terpilih saat site berubah.
  useEffect(() => {
    setUserId("");
  }, [selectedSiteId]);

  const fetchLocations = useCallback(async () => {
    if (!userId) {
      setLocations([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = { user_id: userId, date, limit: "2000" };
      if (selectedSiteId) params.site_id = selectedSiteId;
      const res = await api.get("/api/locations", { params });
      setLocations(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat riwayat lokasi."));
    } finally {
      setLoading(false);
    }
  }, [userId, date, selectedSiteId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Live trail: saat melihat tanggal hari ini, tambahkan lokasi realtime dari MQTT.
  // Setiap koordinat mentah dilewatkan GPS filter — polyline hanya menambah
  // titik yang lolos filter (jitter/outlier/akurasi buruk tidak ikut digambar).
  useEffect(() => {
    if (!userId || date !== todayStr()) return;
    const filter = new GpsFilter();
    const unsubscribe = subscribeLocation((data) => {
      if (data?.id !== userId) return;
      const ts = data.timestamp || new Date().toISOString();
      const result = filter.push({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        timestamp: ts,
      });
      if (!result.accepted) return;
      const p = result.point;
      setLocations((prev) => {
        // Hindari duplikat (QoS 1 bisa kirim dua kali).
        if (prev.length && prev[prev.length - 1].recorded_at === ts) return prev;
        return [
          ...prev,
          {
            id: `live-${ts}`,
            user_id: userId,
            latitude: p.lat,
            longitude: p.lng,
            recorded_at: ts,
            user: { id: userId, name: data.name || "" },
          },
        ];
      });
    });
    return unsubscribe;
  }, [userId, date]);

  const points = useMemo(
    () =>
      locations
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => ({
          lat: Number(l.latitude),
          lng: Number(l.longitude),
          recorded_at: l.recorded_at,
        })),
    [locations],
  );

  const satpamName = satpams.find((u) => u.id === userId)?.name || "-";

  // Statistik pergerakan: jarak total (meter), durasi, kecepatan rata-rata.
  const trailStats = useMemo(() => {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += haversineMeters(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng,
      );
    }
    let durationMs = null;
    if (points.length >= 2) {
      const t0 = points[0].recorded_at
        ? new Date(points[0].recorded_at).getTime()
        : null;
      const t1 = points[points.length - 1].recorded_at
        ? new Date(points[points.length - 1].recorded_at).getTime()
        : null;
      if (t0 != null && t1 != null) durationMs = Math.max(0, t1 - t0);
    }
    return { distance, durationMs };
  }, [points]);

  const latest = [...points].reverse().slice(0, 100);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-saas-border">
        <Badge variant="outline" className="border-saas-border text-saas-text-muted font-mono tracking-wider">
          TRACK
        </Badge>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-saas-text">
          Riwayat Pergerakan
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="loc-user">Satpam</Label>
              <Select value={userId} onValueChange={setUserId}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">Pilih Satpam</Select.Item>
                  {satpams.map((u) => (
                    <Select.Item key={u.id} value={u.id}>
                      {u.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <DatePicker value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!userId ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-saas-text-muted font-medium">
              Pilih satpam untuk melihat rute pergerakannya.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="space-y-2 p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-saas-border">
                <div className="flex items-center gap-2 font-bold text-saas-text">
                  <Route className="w-4 h-4" />
                  {satpamName} — {date}
                </div>
                <span className="text-xs text-saas-text-muted font-medium">
                  {points.length} titik tercatat
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-b border-saas-border text-xs font-bold text-saas-text">
                <span className="flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-saas-info" />
                  Jarak: {formatDistance(trailStats.distance)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-saas-info" />
                  Durasi: {formatDuration(trailStats.durationMs)}
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-saas-info" />
                  Rata-rata: {formatSpeed(trailStats.distance, trailStats.durationMs)}
                </span>
              </div>
              <div style={{ height: "min(520px, 70vh)" }}>
                <TrailMap
                  key={`${selectedSiteId}-${userId}-${date}`}
                  points={points}
                  sitePolygon={selectedSite?.polygon || []}
                />
              </div>
              <div className="flex items-center gap-4 px-4 py-2 text-xs text-saas-text-muted font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#16a34a]" /> Awal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#dc2626]" /> Akhir
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 inline-block bg-[#3B82F6]" /> Rute
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {points.length === 0 ? (
                <p className="text-saas-text-muted font-medium">
                  Belum ada catatan lokasi pada tanggal ini.
                </p>
              ) : (
                <>
                  <p className="text-xs text-saas-text-muted mb-3">
                    Menampilkan {latest.length} titik terakhir dari {points.length} titik.
                  </p>
                  <div className="overflow-x-auto border border-saas-border rounded-xl max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Latitude</TableHead>
                          <TableHead>Longitude</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latest.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="whitespace-nowrap">
                              {p.recorded_at
                                ? new Date(p.recorded_at).toLocaleString("id-ID")
                                : "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {p.lat.toFixed(6)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {p.lng.toFixed(6)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
