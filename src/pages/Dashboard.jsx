import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { useSite } from "../SiteContext";
import { connectSocket } from "../socket";
import MonitoringMap from "../components/MonitoringMap";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { token } = useAuth();
  const { sites, selectedSiteId, selectedSite, loading: sitesLoading } = useSite();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [satpamLocations, setSatpamLocations] = useState({});
  const [statusLabels, setStatusLabels] = useState(null);
  const selectedSiteRef = useRef("");

  const fetchPosts = useCallback(async (siteId) => {
    try {
      const res = siteId
        ? await api.get(`/api/sites/${siteId}/posts`)
        : await api.get("/api/posts?all=true");
      setPosts(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat data pos."));
    }
  }, []);

  useEffect(() => {
    setLoading(sitesLoading);
  }, [sitesLoading]);

  useEffect(() => {
    selectedSiteRef.current = selectedSiteId;
    setPosts([]);
    fetchPosts(selectedSiteId);
  }, [selectedSiteId, fetchPosts]);

  useEffect(() => {
    api.get("/api/config/status-labels").then((res) => setStatusLabels(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const onPostScanned = (payload) => {
      if (payload.site_id !== selectedSiteRef.current) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === payload.post_id
            ? {
                ...p,
                status: "green",
                last_scan: {
                  scanned_at: payload.scanned_at,
                  scanned_by_name: payload.scanned_by?.name || "-",
                },
              }
            : p,
        ),
      );
    };

    const onPostsChanged = (payload) => {
      if (payload.site_id === selectedSiteRef.current) {
        fetchPosts(payload.site_id);
      }
    };

    socket.on("post:scanned", onPostScanned);
    socket.on("posts:changed", onPostsChanged);
    socket.on("satpam:location", (data) => {
      setSatpamLocations((prev) => ({ ...prev, [data.id]: data }));
    });
    socket.on("satpam:offline", (data) => {
      setSatpamLocations((prev) => {
        const next = { ...prev };
        delete next[data.id];
        return next;
      });
    });

    return () => {
      socket.off("post:scanned", onPostScanned);
      socket.off("posts:changed", onPostsChanged);
      socket.off("satpam:location");
      socket.off("satpam:offline");
    };
  }, [token, fetchPosts]);

  const greenCount = posts.filter((p) => p.status === "green").length;
  const yellowCount = posts.filter((p) => p.status === "yellow").length;
  const redCount = posts.filter((p) => p.status === "red").length;
  const activePosts = posts.filter((p) => p.is_active);

  const statCards = [
    {
      icon: CheckCircle,
      label: "Hijau (Aman)",
      value: greenCount,
      color: "text-saas-success",
      bgColor: "bg-saas-success-light",
    },
    {
      icon: AlertTriangle,
      label: "Kuning (Harus Scan Ulang)",
      value: yellowCount,
      color: "text-saas-warning",
      bgColor: "bg-saas-warning-light",
    },
    {
      icon: XCircle,
      label: "Merah (Belum Scanned)",
      value: redCount,
      color: "text-saas-danger",
      bgColor: "bg-saas-danger-light",
    },
    {
      icon: Users,
      label: "Total Pos",
      value: `${activePosts.length}`,
      color: "text-saas-text-muted",
      bgColor: "bg-saas-bg-secondary",
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-saas-border">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-saas-text">
            Dashboard Monitoring
          </h1>
          <p className="text-saas-text-muted mt-1">
            Pantau status pos patroli secara real-time
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-saas-text-muted font-medium">
              Belum ada site aktif. Buat area terlebih dahulu di menu{" "}
              <strong>Area (Sites)</strong>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-semibold tracking-tight text-saas-text">
                        {stat.value}
                      </div>
                      <div className="text-xs font-medium text-saas-text-muted mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Map — grid 3 kolom jika "Semua Site" */}
          {selectedSite ? (
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <MonitoringMap
                  site={selectedSite}
                  posts={posts}
                  satpamLocations={satpamLocations}
                  statusLabels={statusLabels}
                  height="min(520px, 70vh)"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {sites.map((s) => {
                const sitePosts = posts.filter((p) => p.site_id === s.id);
                return (
                  <Card key={s.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <CardDescription>
                        {sitePosts.length} pos • {sitePosts.filter((p) => p.status === 'green').length} hijau
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <MonitoringMap
                        site={s}
                        posts={sitePosts}
                        satpamLocations={satpamLocations}
                        statusLabels={statusLabels}
                        height={280}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedSite && (
          <Card>
            <CardHeader>
              <CardTitle>
                Status Pos {selectedSite ? `— ${selectedSite.name}` : ""}
              </CardTitle>
              <CardDescription>
                Daftar semua pos pada site ini beserta status scan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <p className="text-saas-text-muted font-medium py-4">
                  Belum ada pos pada site ini.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto border border-saas-border rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Pos</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Radius</TableHead>
                          <TableHead>Scan Terakhir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((p) => (
                          <TableRow
                            key={p.id}
                            className={!p.is_active ? "opacity-50" : ""}
                          >
                            <TableCell>
                              {p.name}{" "}
                              {!p.is_active && (
                                <Badge variant="muted">Nonaktif</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                                <Badge
                                  variant={
                                    p.status === "green" ? "success" :
                                    p.status === "yellow" ? "warning" : "destructive"
                                  }
                                >
                                  {p.status === "green"
                                    ? "Hijau"
                                    : p.status === "yellow"
                                    ? "Kuning"
                                    : "Merah"}
                                </Badge>
                            </TableCell>
                            <TableCell>{p.radius_m} m</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {p.last_scan
                                ? `${new Date(
                                    p.last_scan.scanned_at,
                                  ).toLocaleString("id-ID")} — ${p.last_scan.scanned_by_name}`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs font-medium text-saas-text-muted mt-3">
                    Hijau: {greenCount} | Kuning: {yellowCount} | Merah: {redCount} /
                    {posts.length}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          )}
        </>
      )}
    </div>
  );
}