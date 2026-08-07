import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import { useSite } from "../SiteContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
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

const KONDISI_BADGE = {
  aman: { label: "Aman", variant: "success" },
  temuan: { label: "Temuan", variant: "warning" },
  darurat: { label: "Darurat", variant: "destructive" },
};

function KondisiCell({ log }) {
  if (log.status !== "ok")
    return <span className="text-xs text-saas-text-muted">-</span>;
  if (!log.kondisi) return <Badge variant="muted">Belum diisi</Badge>;
  const k = KONDISI_BADGE[log.kondisi] || {
    label: log.kondisi,
    variant: "default",
  };
  return <Badge variant={k.variant}>{k.label}</Badge>;
}

function LaporanCell({ log }) {
  const masalah = Array.isArray(log.checklist)
    ? log.checklist.filter((c) => c && c.ok === false)
    : [];
  if (!log.catatan && masalah.length === 0)
    return <span className="text-xs text-saas-text-muted">-</span>;
  return (
    <div className="max-w-xs space-y-1">
      {log.catatan && (
        <p className="text-xs whitespace-pre-wrap break-words">{log.catatan}</p>
      )}
      {masalah.map((c, i) => (
        <p key={i} className="text-xs text-amber-700">
          ✗ {c.item}
        </p>
      ))}
    </div>
  );
}

export default function Logs() {
  const { selectedSiteId, selectedSite } = useSite();
  const [posts, setPosts] = useState([]);
  const [satpams, setSatpams] = useState([]);

  const [postId, setPostId] = useState("");
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const usersRes = await api.get("/api/users");
        setSatpams(
          (usersRes.data.data || []).filter((u) => u.role === "satpam"),
        );
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat data filter."));
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSiteId) return;
    setPostId("");
    (async () => {
      try {
        const res = await api.get(`/api/sites/${selectedSiteId}/posts`);
        setPosts(res.data.data || []);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat daftar pos."));
      }
    })();
  }, [selectedSiteId]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (selectedSiteId) params.site_id = selectedSiteId;
      if (postId) params.post_id = postId;
      if (userId) params.user_id = userId;
      if (date) params.date = date;
      const res = await api.get("/api/scan-logs", { params });
      setLogs(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat riwayat scan."));
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId, postId, userId, date]);

  useEffect(() => {
    if (selectedSiteId) fetchLogs();
  }, [selectedSiteId, fetchLogs]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-brutal-zinc">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-brutal-zinc text-brutal-muted font-mono tracking-wider"
          >
            LOG
          </Badge>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-saas-text">
            Riwayat Scan
          </h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <DatePicker
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-post">Pos</Label>
              <Select value={postId} onValueChange={setPostId}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">Semua Pos</Select.Item>
                  {posts.map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                      {p.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-user">Satpam</Label>
              <Select value={userId} onValueChange={setUserId}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">Semua Satpam</Select.Item>
                  {satpams.map((u) => (
                    <Select.Item key={u.id} value={u.id}>
                      {u.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Button onClick={fetchLogs} disabled={loading} className="w-full sm:w-auto">
                {loading ? "Memuat..." : "Terapkan Filter"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hasil ({logs.length} catatan)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-brutal-muted font-medium">
              Tidak ada catatan scan untuk filter ini.
            </p>
          ) : (
            <div className="overflow-x-auto border border-brutal-zinc rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pos</TableHead>
                    <TableHead>Satpam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Laporan</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Jarak</TableHead>
                    <TableHead>Koordinat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.scanned_at).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{log.post?.name || "-"}</TableCell>
                      <TableCell>{log.user?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === "ok" ? "success" : "destructive"
                          }
                        >
                          {log.status === "ok" ? "OK" : "Di Luar Radius"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <KondisiCell log={log} />
                      </TableCell>
                      <TableCell>
                        <LaporanCell log={log} />
                      </TableCell>
                      <TableCell>
                        {log.foto_url ? (
                          <a
                            href={log.foto_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Lihat foto"
                          >
                            <img
                              src={log.foto_url}
                              alt="Bukti patroli"
                              className="h-12 w-12 rounded-brutal object-cover border-2 border-brutal-black"
                            />
                          </a>
                        ) : (
                          <span className="text-xs text-saas-text-muted">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.distance_m != null ? `${log.distance_m} m` : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.latitude != null && log.longitude != null
                          ? `${Number(log.latitude).toFixed(6)}, ${Number(log.longitude).toFixed(6)}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
