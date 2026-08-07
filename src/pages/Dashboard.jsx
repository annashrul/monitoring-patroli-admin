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
  XCircle,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { token } = useAuth();
  const { sites, selectedSiteId, selectedSite, loading: sitesLoading } = useSite();
  const [posts, setPosts] = useState([]);
  const [shiftData, setShiftData] = useState({ shift: null, period: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedSiteRef = useRef("");

  const fetchPosts = useCallback(async (siteId) => {
    if (!siteId) return;
    try {
      const res = await api.get(`/api/sites/${siteId}/posts`);
      setPosts(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat data pos."));
    }
  }, []);

  const fetchCurrentShift = useCallback(async () => {
    try {
      const res = await api.get("/api/shifts/current");
      setShiftData(res.data.data || { shift: null, period: null });
    } catch (err) {
      console.error("Gagal memuat shift aktif:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(sitesLoading);
  }, [sitesLoading]);

  useEffect(() => {
    if (!selectedSiteId) return;
    selectedSiteRef.current = selectedSiteId;
    setPosts([]);
    fetchPosts(selectedSiteId);
    fetchCurrentShift();
  }, [selectedSiteId, fetchPosts, fetchCurrentShift]);

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
                status: "scanned",
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

    const onShiftChanged = (payload) => {
      setShiftData({
        shift: payload.shift || null,
        period: payload.period || null,
      });
      if (selectedSiteRef.current) {
        fetchPosts(selectedSiteRef.current);
      }
      fetchCurrentShift();
    };

    socket.on("post:scanned", onPostScanned);
    socket.on("posts:changed", onPostsChanged);
    socket.on("shift:changed", onShiftChanged);

    return () => {
      socket.off("post:scanned", onPostScanned);
      socket.off("posts:changed", onPostsChanged);
      socket.off("shift:changed", onShiftChanged);
    };
  }, [token, fetchPosts, fetchCurrentShift]);

  const scannedCount = posts.filter((p) => p.status === "scanned").length;
  const activePosts = posts.filter((p) => p.is_active);
  const scannedActive = activePosts.filter((p) => p.status === "scanned").length;

  const statCards = [
    {
      icon: CheckCircle,
      label: "Pos Sudah Discan (Aktif)",
      value: `${scannedActive}/${activePosts.length}`,
      color: "text-saas-success",
      bgColor: "bg-saas-success-light",
    },
    {
      icon: Clock,
      label: "Shift Aktif Saat Ini",
      value: shiftData.shift ? shiftData.shift.name : "-",
      color: "text-saas-primary",
      bgColor: "bg-saas-primary-light",
    },
    {
      icon: MapPin,
      label: "Jam Shift",
      value: shiftData.shift
        ? `${shiftData.shift.start_time} - ${shiftData.shift.end_time}`
        : "-",
      color: "text-saas-warning",
      bgColor: "bg-saas-warning-light",
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

          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <MonitoringMap
                site={selectedSite}
                posts={posts}
                height="min(520px, 70vh)"
              />
            </CardContent>
          </Card>

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
                                  p.status === "scanned" ? "success" : "destructive"
                                }
                              >
                                {p.status === "scanned"
                                  ? "Sudah Discan"
                                  : "Belum Discan"}
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
                    Total scanned (termasuk pos nonaktif): {scannedCount}/
                    {posts.length}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}