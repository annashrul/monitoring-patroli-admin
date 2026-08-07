import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { TimePicker } from "../components/ui/time-picker";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
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
import { Checkbox } from "../components/ui/checkbox";
import Modal from "../components/Modal";

const EMPTY_FORM = { name: "", start_time: "", end_time: "", is_active: true };

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchShifts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/shifts");
      setShifts(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar shift."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const openCreate = () => {
    setFormMode("create");
    setEditingShift(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setNotice("");
  };

  const openEdit = (shift) => {
    setFormMode("edit");
    setEditingShift(shift);
    setForm({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      is_active: shift.is_active,
    });
    setFormError("");
    setNotice("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingShift(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.start_time || !form.end_time) {
      setFormError("Nama, jam mulai, dan jam selesai wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (formMode === "create") {
        await api.post("/api/shifts", {
          name: form.name.trim(),
          start_time: form.start_time,
          end_time: form.end_time,
        });
        setNotice("Shift berhasil dibuat.");
      } else {
        await api.put(`/api/shifts/${editingShift.id}`, {
          name: form.name.trim(),
          start_time: form.start_time,
          end_time: form.end_time,
          is_active: !!form.is_active,
        });
        setNotice("Shift berhasil diperbarui.");
      }
      closeForm();
      fetchShifts();
    } catch (err) {
      setFormError(getErrorMessage(err, "Gagal menyimpan shift."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift) => {
    if (!window.confirm(`Hapus shift "${shift.name}"?`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/api/shifts/${shift.id}`);
      setNotice(`Shift "${shift.name}" berhasil dihapus.`);
      if (editingShift?.id === shift.id) closeForm();
      fetchShifts();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menghapus shift."));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-brutal-zinc">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-brutal-zinc text-brutal-muted font-mono tracking-wider"
          >
            SHIFT
          </Badge>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-saas-text">
            Manajemen Shift
          </h1>
        </div>
        {formMode === null && (
          <Button onClick={openCreate}>+ Tambah Shift</Button>
        )}
      </div>

      <Alert variant="info" className="mb-4">
        <AlertDescription>
          Status pos (sudah/belum discan) dihitung per{" "}
          <strong>periode shift yang sedang aktif</strong>. Saat shift berganti,
          semua pos otomatis kembali berstatus &quot;Belum Discan&quot;. Shift
          dengan jam selesai ≤ jam mulai dianggap melewati tengah malam.
        </AlertDescription>
      </Alert>

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
              ? "Tambah Shift Baru"
              : `Edit Shift — ${editingShift?.name}`
          }
          onClose={closeForm}
          footer={
            <div className="flex gap-3">
              <Button type="submit" form="shift-form" disabled={saving}>
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
          <form id="shift-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-name">Nama Shift</Label>
                <Input
                  id="shift-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Contoh: Shift Pagi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Mulai</Label>
                <TimePicker
                  value={form.start_time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_time: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <TimePicker
                  value={form.end_time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_time: e.target.value }))
                  }
                />
              </div>
            </div>
            {formMode === "edit" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={!!form.is_active}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_active: !!checked }))
                  }
                />
                <Label>Shift aktif</Label>
              </div>
            )}
          </form>
        </Modal>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Shift</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : shifts.length === 0 ? (
            <p className="text-brutal-muted font-medium">Belum ada shift.</p>
          ) : (
            <div className="overflow-x-auto border border-brutal-zinc rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jam Mulai</TableHead>
                    <TableHead>Jam Selesai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[140px] sm:min-w-[180px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow
                      key={shift.id}
                      className={!shift.is_active ? "opacity-50" : ""}
                    >
                      <TableCell>{shift.name}</TableCell>
                      <TableCell>{shift.start_time}</TableCell>
                      <TableCell>{shift.end_time}</TableCell>
                      <TableCell>
                        <Badge variant={shift.is_active ? "success" : "muted"}>
                          {shift.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(shift)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(shift)}
                          >
                            Hapus
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
