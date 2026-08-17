import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api, { getErrorMessage } from "../api";
import { useSite } from "../SiteContext";
import Modal from "../components/Modal";
import PostLocationMap from "../components/PostLocationMap";
import Pagination from "../components/Pagination";
import { isPointInPolygon } from "../utils/geo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  QrCode,
  Printer,
  Eye,
  Loader2,
  ClipboardList,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  radius_m: 20,
  interval_minutes: 120,
  latitude: "",
  longitude: "",
  accuracy: null,
  gps_timestamp: null,
  is_active: true,
};

export default function Posts() {
  const {
    sites,
    selectedSiteId,
    selectedSite,
    loading: loadingSites,
  } = useSite();
  const [posts, setPosts] = useState([]);
  const [mapPosts, setMapPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [formMode, setFormMode] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [qrPost, setQrPost] = useState(null);
  const [checklistPost, setChecklistPost] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editItemText, setEditItemText] = useState("");

  const fetchPosts = useCallback(async (siteId, query) => {
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams();
      if (query?.search) params.set("search", query.search);
      params.set("page", String(query?.page || 1));
      params.set("limit", String(PAGE_SIZE));

      const res = siteId
        ? await api.get(`/api/sites/${siteId}/posts`, { params })
        : await api.get("/api/posts?all=true", { params });

      setPosts(res.data.data || []);
      const meta = res.data.meta;
      if (meta) {
        setTotalPages(meta.total_pages || 1);
        setPage(meta.page || 1);
      } else {
        setTotalPages(1);
        setPage(1);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar pos."));
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Peta perlu seluruh pos (bukan yang dipaginasi), jadi dimuat terpisah tanpa limit.
  const fetchMapPosts = useCallback(async (siteId) => {
    try {
      const res = siteId
        ? await api.get(`/api/sites/${siteId}/posts`, { params: { limit: 1000 } })
        : await api.get("/api/posts?all=true", { params: { limit: 1000 } });
      setMapPosts(res.data.data || []);
    } catch {
      setMapPosts([]);
    }
  }, []);

  useEffect(() => {
    setPosts([]);
    setMapPosts([]);
    setPage(1);
    setSearch("");
    setLoadingPosts(true);
    fetchMapPosts(selectedSiteId);
    setFormMode(null);
  }, [selectedSiteId, fetchMapPosts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPosts(selectedSiteId, { search, page: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedSiteId, fetchPosts]);

  const openCreate = () => {
    setFormMode("create");
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setNotice("");
  };

  const openEdit = (post) => {
    setFormMode("edit");
    setEditingPost(post);
    setForm({
      name: post.name,
      radius_m: post.radius_m,
      interval_minutes: post.interval_minutes || 120,
      latitude: post.latitude,
      longitude: post.longitude,
      accuracy: post.accuracy ?? null,
      gps_timestamp: post.gps_timestamp ?? null,
      is_active: post.is_active,
    });
    setFormError("");
    setNotice("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const setLocation = (lat, lng) => {
    setForm((f) => ({
      ...f,
      latitude: Number(lat.toFixed ? lat.toFixed(7) : lat),
      longitude: Number(lng.toFixed ? lng.toFixed(7) : lng),
    }));
  };

  const handleMapPick = ({ lat, lng }) => {
    setLocation(lat, lng);
    setForm((f) => ({ ...f, accuracy: null, gps_timestamp: null }));
    setFormError("");
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Browser tidak mendukung geolocation.");
      return;
    }
    setGeoLoading(true);
    setFormError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude);
        setForm((f) => ({
          ...f,
          accuracy: pos.coords.accuracy != null ? Number(pos.coords.accuracy) : null,
          gps_timestamp: pos.timestamp != null ? new Date(pos.timestamp).toISOString() : null,
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setFormError(`Gagal mengambil lokasi: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const pickedPoint =
    form.latitude !== "" && form.longitude !== ""
      ? {
          lat: Number(form.latitude),
          lng: Number(form.longitude),
          radius: Number(form.radius_m) || 20,
        }
      : null;

  const pointInside =
    pickedPoint && selectedSite
      ? isPointInPolygon(pickedPoint, selectedSite.polygon)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Nama pos wajib diisi.");
      return;
    }
    const radius = parseInt(form.radius_m, 10);
    if (Number.isNaN(radius) || radius < 5 || radius > 500) {
      setFormError("Radius harus berupa angka 5 - 500 meter.");
      return;
    }
    if (!pickedPoint) {
      setFormError(
        "Lokasi pos wajib ditentukan (klik peta atau gunakan lokasi saat ini).",
      );
      return;
    }
    if (pointInside === false) {
      setFormError(
        "Titik berada di luar polygon site. Pilih titik di dalam area.",
      );
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        await api.post("/api/posts", {
          site_id: selectedSiteId,
          name: form.name.trim(),
          latitude: pickedPoint.lat,
          longitude: pickedPoint.lng,
          radius_m: radius,
          interval_minutes: parseInt(form.interval_minutes, 10) || 120,
          accuracy: form.accuracy,
          gps_timestamp: form.gps_timestamp,
        });
        setNotice("Pos berhasil dibuat.");
      } else {
        await api.put(`/api/posts/${editingPost.id}`, {
          name: form.name.trim(),
          latitude: pickedPoint.lat,
          longitude: pickedPoint.lng,
          radius_m: radius,
          interval_minutes: parseInt(form.interval_minutes, 10) || 120,
          is_active: !!form.is_active,
          accuracy: form.accuracy,
          gps_timestamp: form.gps_timestamp,
        });
        setNotice("Pos berhasil diperbarui.");
      }
      closeForm();
      fetchPosts(selectedSiteId, { search, page });
      fetchMapPosts(selectedSiteId);
    } catch (err) {
      setFormError(getErrorMessage(err, "Gagal menyimpan pos."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (
      !window.confirm(
        `Hapus pos "${post.name}"? Riwayat scan terkait mungkin ikut terpengaruh.`,
      )
    ) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.delete(`/api/posts/${post.id}`);
      setNotice(`Pos "${post.name}" berhasil dihapus.`);
      if (editingPost?.id === post.id) closeForm();
      fetchPosts(selectedSiteId, { search, page });
      fetchMapPosts(selectedSiteId);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menghapus pos."));
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("qr-print-area");
    if (!printArea) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up diblokir. Izinkan pop-up untuk mencetak QR.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR - ${qrPost.name}</title>
        <style>
          @page { margin: 0; size: auto; }
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          #qr-print-area { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px; border: 2px solid #000; }
          #qr-print-area svg { width: 420px !important; height: 420px !important; }
        </style>
      </head>
      <body>${printArea.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const fetchChecklist = async (postId) => {
    try {
      const res = await api.get(`/api/checklist-items?post_id=${postId}`);
      setChecklistItems(res.data.data || []);
    } catch {}
  };

  const addChecklistItem = async () => {
    if (!newItem.trim() || !checklistPost) return;
    try {
      await api.post("/api/checklist-items", { post_id: checklistPost.id, item: newItem.trim() });
      setNewItem("");
      fetchChecklist(checklistPost.id);
    } catch (err) { setError(getErrorMessage(err, "Gagal menambah item.")); }
  };

  const toggleChecklistItem = async (item) => {
    try {
      await api.put(`/api/checklist-items/${item.id}`, { is_active: !item.is_active });
      fetchChecklist(checklistPost.id);
    } catch (err) { setError(getErrorMessage(err, "Gagal update item.")); }
  };

  const deleteChecklistItem = async (item) => {
    if (!window.confirm(`Hapus "${item.item}"?`)) return;
    try {
      await api.delete(`/api/checklist-items/${item.id}`);
      fetchChecklist(checklistPost.id);
    } catch (err) { setError(getErrorMessage(err, "Gagal hapus item.")); }
  };

  const updateChecklistItem = async () => {
    if (!editItemText.trim() || !editingItem) return;
    try {
      await api.put(`/api/checklist-items/${editingItem.id}`, { item: editItemText.trim() });
      setEditingItem(null);
      setEditItemText("");
      fetchChecklist(checklistPost.id);
    } catch (err) { setError(getErrorMessage(err, "Gagal update item.")); }
  };

  if (loadingSites) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[360px] w-full" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Titik Pos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-saas-text-muted font-medium">
            Belum ada site. Buat area terlebih dahulu di menu{" "}
            <strong>Area (Sites)</strong>.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-saas-border">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-saas-border text-saas-text-muted font-mono tracking-wider"
          >
            POS
          </Badge>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-saas-text">
            Manajemen Titik Pos
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {formMode === null && selectedSiteId && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pos
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {formMode !== null && (
        <Modal
          title={
            formMode === "create"
              ? "Tambah Pos Baru"
              : `Edit Pos — ${editingPost?.name}`
          }
          onClose={closeForm}
          fullWidth
          footer={
            <div className="flex gap-3">
              <Button type="submit" form="post-form" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Batal
              </Button>
            </div>
          }
        >
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <form id="post-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post-name">Nama Pos</Label>
                  <Input
                    id="post-name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Contoh: Pos Lobby"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-radius">Radius (meter, 5 - 500)</Label>
                  <Input
                    id="post-radius"
                    type="number"
                    min="5"
                    max="500"
                    value={form.radius_m}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, radius_m: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-interval">Interval (menit)</Label>
                  <Input
                    id="post-interval"
                    type="number"
                    min="1"
                    max="1440"
                    value={form.interval_minutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, interval_minutes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lokasi Pos</Label>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseMyLocation}
                    disabled={geoLoading}
                  >
                    {geoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengambil lokasi...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Gunakan Lokasi Saya Saat Ini
                      </>
                    )}
                  </Button>
                  <span className="text-xs font-medium text-saas-text-muted">
                    atau klik pada peta di bawah untuk memilih titik
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-[480px]">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-saas-text-muted uppercase">
                      Latitude
                    </Label>
                    <Input
                      type="text"
                      value={form.latitude}
                      readOnly
                      placeholder="-"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-saas-text-muted uppercase">
                      Longitude
                    </Label>
                    <Input
                      type="text"
                      value={form.longitude}
                      readOnly
                      placeholder="-"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap mt-2 text-xs font-medium text-saas-text">
                  <span className="text-saas-text-muted">Akurasi GPS:</span>
                  {form.accuracy != null ? (
                    <Badge
                      variant={
                        form.accuracy <= 20
                          ? "success"
                          : form.accuracy <= 50
                          ? "warning"
                          : "destructive"
                      }
                    >
                      ± {Math.round(form.accuracy)} m
                    </Badge>
                  ) : (
                    <span className="text-saas-text-muted">—</span>
                  )}
                  <span className="text-saas-text-muted">Waktu GPS:</span>
                  <span>
                    {form.gps_timestamp
                      ? new Date(form.gps_timestamp).toLocaleString("id-ID")
                      : "—"}
                  </span>
                </div>
                <p className="text-[11px] text-saas-text-muted">
                  Akurasi &amp; waktu diambil dari GPS saat kamu menekan
                  &quot;Gunakan Lokasi Saya&quot;. Semakin kecil akurasi, semakin
                  akurat posisi titik pos.
                </p>
                {pointInside === false && (
                  <Alert variant="warning">
                    <AlertDescription>
                      ⚠ Titik yang dipilih berada DI LUAR polygon site. Server
                      akan menolak penyimpanan.
                    </AlertDescription>
                  </Alert>
                )}
                {pointInside === true && (
                  <Alert variant="success">
                    <AlertDescription>
                      ✓ Titik berada di dalam polygon site.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <PostLocationMap
                  polygon={selectedSite?.polygon || []}
                  posts={mapPosts}
                  picked={pickedPoint}
                  onPick={handleMapPick}
                  excludePostId={editingPost?.id}
                  height={360}
                />
              </div>

              {formMode === "edit" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!form.is_active}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, is_active: !!checked }))
                    }
                  />
                  <Label>Pos aktif</Label>
                </div>
              )}

          </form>
        </Modal>
      )}

      {/* Map — grid per site jika "Semua Site" */}
      {selectedSite ? (
        <Card className="mb-6 overflow-hidden">
          <CardHeader>
            <CardTitle>Peta — {selectedSite.name}</CardTitle>
            <CardDescription>Visualisasi polygon site dan posisi titik pos</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PostLocationMap
              polygon={selectedSite.polygon || []}
              posts={mapPosts}
              picked={null}
              onPick={null}
              height={300}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {sites.map((s) => {
            const sitePosts = mapPosts.filter((p) => p.site_id === s.id);
            return (
              <Card key={s.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{s.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <PostLocationMap
                    polygon={s.polygon || []}
                    posts={sitePosts}
                    picked={null}
                    onPick={null}
                    height={220}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>
              Daftar Pos {selectedSite ? `— ${selectedSite.name}` : "— Semua Site"}
            </CardTitle>
            <CardDescription>
              {selectedSite ? "Kelola pos patroli pada site ini" : "Daftar semua pos dari semua site"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pos..."
              className="h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingPosts ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-saas-text-muted font-medium py-4">
              Belum ada pos pada site ini.
            </p>
          ) : (
            <div className="overflow-x-auto border border-saas-border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Koordinat</TableHead>
                    <TableHead>Radius</TableHead>
                    <TableHead>Interval</TableHead>
                    {!selectedSite && <TableHead>Site</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>QR</TableHead>
                    {selectedSite && <TableHead className="min-w-[140px] sm:min-w-[180px]">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow
                      key={post.id}
                      className={!post.is_active ? "opacity-50" : ""}
                    >
                      <TableCell>{post.name}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {Number(post.latitude).toFixed(6)},{" "}
                        {Number(post.longitude).toFixed(6)}
                      </TableCell>
                      <TableCell>{post.radius_m} m</TableCell>
                      <TableCell>{post.interval_minutes || 120} mnt</TableCell>
                      {!selectedSite && (
                        <TableCell className="text-xs">
                          {sites.find((s) => s.id === post.site_id)?.name || post.site_id}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={post.is_active ? "success" : "muted"}>
                          {post.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQrPost(post)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Lihat QR
                        </Button>
                      </TableCell>
                      {selectedSite && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setChecklistPost(post); fetchChecklist(post.id); }}
                          >
                            <ClipboardList className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Checklist</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(post)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(post)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              fetchPosts(selectedSiteId, { search, page: p });
            }}
          />
        </CardContent>
      </Card>

      {qrPost && (
        <Modal title={`QR Code — ${qrPost.name}`} onClose={() => setQrPost(null)} footer={<><Button onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button><Button variant="outline" onClick={() => setQrPost(null)}>Tutup</Button></>}>
          <div className="flex flex-col items-center gap-3">
            <div id="qr-print-area" className="flex flex-col items-center gap-2.5 p-5 border-2 border-dashed border-brutal-black rounded-brutal bg-saas-bg-secondary">
              <div className="w-[min(80vw,380px)] [&_svg]:!w-full [&_svg]:!h-auto">
              <QRCodeSVG value={`PATROLI:${qrPost.qr_token}`} size={380} level="M" includeMargin />
              </div>
              <div className="text-lg font-semibold text-saas-text">{qrPost.name}</div>
              {selectedSite && <div className="text-xs font-mono text-saas-text-muted">{selectedSite.name}</div>}
            </div>
            {!qrPost.qr_token && <Alert variant="warning"><AlertDescription>qr_token tidak tersedia (hanya dikirim untuk role admin).</AlertDescription></Alert>}
          </div>
        </Modal>
      )}

      {checklistPost && (
        <Modal wide title={`Checklist — ${checklistPost.name}`} onClose={() => setChecklistPost(null)} footer={<Button variant="outline" onClick={() => setChecklistPost(null)}>Tutup</Button>}>
          <div className="flex gap-2 mb-4">
            <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Item checklist baru" className="flex-1" onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()} />
            <Button onClick={addChecklistItem}>Tambah</Button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {checklistItems.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-2 rounded-brutal border border-saas-border ${!item.is_active ? 'opacity-50' : ''}`}>
                {editingItem?.id === item.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input value={editItemText} onChange={(e) => setEditItemText(e.target.value)} className="flex-1 h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && updateChecklistItem()} />
                    <Button size="sm" onClick={updateChecklistItem}>Simpan</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>Batal</Button>
                  </div>
                ) : (
                  <><span className="text-sm">{item.item}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setEditItemText(item.item); }}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleChecklistItem(item)}>{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteChecklistItem(item)}>Hapus</Button>
                  </div></>
                )}
              </div>
            ))}
            {checklistItems.length === 0 && <p className="text-saas-text-muted text-sm">Belum ada item checklist.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
