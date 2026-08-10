import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import { useSite } from "../SiteContext";
import SitePolygonEditor from "../components/SitePolygonEditor";
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
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import { Alert, AlertDescription } from "../components/ui/alert";
import Modal from "../components/Modal";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, MapPin } from "lucide-react";

const EMPTY_FORM = { name: "", polygon: [] };

export default function Sites() {
  const { refetchSites, selectedSiteId } = useSite();
  const [allSites, setAllSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSites = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/sites");
      setAllSites(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar site."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const sites = selectedSiteId
    ? allSites.filter((s) => s.id === selectedSiteId)
    : allSites;

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setNotice("");
  };

  const openEdit = (site) => {
    setFormMode("edit");
    setEditingId(site.id);
    setForm({ name: site.name, polygon: site.polygon || [] });
    setFormError("");
    setNotice("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Nama site wajib diisi.");
      return;
    }
    if (!Array.isArray(form.polygon) || form.polygon.length < 3) {
      setFormError("Polygon area wajib digambar dengan minimal 3 titik.");
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        await api.post("/api/sites", {
          name: form.name.trim(),
          polygon: form.polygon,
        });
        setNotice("Site berhasil dibuat.");
      } else {
        await api.put(`/api/sites/${editingId}`, {
          name: form.name.trim(),
          polygon: form.polygon,
        });
        setNotice("Site berhasil diperbarui.");
      }
      closeForm();
      fetchSites();
      refetchSites();
    } catch (err) {
      setFormError(getErrorMessage(err, "Gagal menyimpan site."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (site) => {
    setError("");
    setNotice("");
    try {
      await api.put(`/api/sites/${site.id}`, { is_active: !site.is_active });
      setNotice(
        `Site "${site.name}" ${site.is_active ? "dinonaktifkan" : "diaktifkan"}.`,
      );
      fetchSites();
      refetchSites();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengubah status site."));
    }
  };

  const handleDelete = async (site) => {
    if (
      !window.confirm(
        `Hapus site "${site.name}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.delete(`/api/sites/${site.id}`);
      setNotice(`Site "${site.name}" berhasil dihapus.`);
      if (editingId === site.id) closeForm();
      fetchSites();
      refetchSites();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menghapus site."));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-saas-border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-saas-border text-saas-text-muted font-mono tracking-wider">
            SITE
          </Badge>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-saas-text">
            Manajemen Area (Sites)
          </h1>
        </div>
        {formMode === null && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Site
          </Button>
        )}
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
          title={formMode === "create" ? "Tambah Site Baru" : "Edit Site"}
          onClose={closeForm}
          wide
          footer={
            <div className="flex gap-3">
              <Button type="submit" form="site-form" disabled={saving}>
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
          <form id="site-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Nama Site</Label>
              <Input
                id="site-name"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Contoh: Kawasan Pabrik Cikarang"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Polygon Area{" "}
                <span className="text-xs font-medium text-saas-text-muted">
                  (gunakan toolbar di kanan atas peta untuk menggambar /
                  mengedit; minimal 3 titik)
                </span>
              </Label>
              <SitePolygonEditor
                key={editingId || "new"}
                value={form.polygon}
                onChange={(poly) => setForm((f) => ({ ...f, polygon: poly }))}
                height={360}
              />
              <div className="text-xs font-medium text-saas-text-muted">
                Jumlah titik polygon: {form.polygon.length}
              </div>
            </div>
          </form>
        </Modal>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Site</CardTitle>
          <CardDescription>Kelola area patroli dan polygon zona</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <p className="text-saas-text-muted font-medium">Belum ada site.</p>
          ) : (
            <div className="overflow-x-auto border border-saas-border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jumlah Titik Polygon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[130px] sm:min-w-[280px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow
                      key={site.id}
                      className={!site.is_active ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-saas-text-muted" />
                          {site.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(site.polygon) ? site.polygon.length : 0}{" "}
                        titik
                      </TableCell>
                      <TableCell>
                        <Badge variant={site.is_active ? "success" : "muted"}>
                          {site.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(site)}
                          >
                            <Edit className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(site)}
                          >
                            {site.is_active ? (
                              <>
                                <ToggleLeft className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Nonaktifkan</span>
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Aktifkan</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(site)}
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Hapus</span>
                          </Button>
                        </div>
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