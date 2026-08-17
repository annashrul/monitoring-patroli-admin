import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { useSite } from "../SiteContext";
import Pagination from "../components/Pagination";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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

const EMPTY_CREATE = { username: "", password: "", name: "", role: "satpam", site_id: "", color: "#3B82F6" };
const EMPTY_EDIT = { name: "", role: "satpam", site_id: "", color: "#3B82F6", is_active: true, password: "" };

export default function Users() {
  const { user: currentUser } = useAuth();
  const { sites, selectedSiteId } = useSite();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [formMode, setFormMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async (targetPage = 1, searchQuery = "") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedSiteId) params.set("site_id", selectedSiteId);
      params.set("exclude_owner", "true");
      params.set("page", String(targetPage));
      params.set("limit", String(PAGE_SIZE));

      const res = await api.get("/api/users", { params });
      setAllUsers(res.data.data || []);

      const meta = res.data.meta;
      if (meta) {
        setTotalPages(meta.total_pages || 1);
        setPage(meta.page || 1);
      } else {
        setTotalPages(1);
        setPage(1);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar pengguna."));
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedSiteId, fetchUsers]);

  const users = allUsers;

  const openCreate = () => {
    setFormMode("create");
    setEditingUser(null);
    setCreateForm({ ...EMPTY_CREATE, site_id: selectedSiteId || "" });
    setFormError("");
    setNotice("");
  };

  const openEdit = (u) => {
    setFormMode("edit");
    setEditingUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      site_id: u.site_id || "",
      color: u.color || "#3B82F6",
      is_active: u.is_active,
      password: "",
    });
    setFormError("");
    setNotice("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingUser(null);
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (
      !createForm.username.trim() ||
      !createForm.name.trim() ||
      !createForm.password
    ) {
      setFormError("Username, nama, dan password wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/users", {
        username: createForm.username.trim(),
        password: createForm.password,
        name: createForm.name.trim(),
        role: createForm.role,
        site_id: createForm.site_id || null,
        color: createForm.color,
      });
      setNotice("Pengguna berhasil dibuat.");
      closeForm();
      fetchUsers(page, search);
    } catch (err) {
      setFormError(getErrorMessage(err, "Gagal membuat pengguna."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!editForm.name.trim()) {
      setFormError("Nama wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: editForm.name.trim(),
        role: editForm.role,
        site_id: editForm.site_id || null,
        color: editForm.color,
        is_active: !!editForm.is_active,
      };
      if (editForm.password) body.password = editForm.password;
      await api.put(`/api/users/${editingUser.id}`, body);
      setNotice("Pengguna berhasil diperbarui.");
      closeForm();
      fetchUsers(page, search);
    } catch (err) {
      setFormError(getErrorMessage(err, "Gagal memperbarui pengguna."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Hapus pengguna "${u.username}" (${u.name})?`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/api/users/${u.id}`);
      setNotice(`Pengguna "${u.username}" berhasil dihapus.`);
      if (editingUser?.id === u.id) closeForm();
      fetchUsers(page, search);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menghapus pengguna."));
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
            USER
          </Badge>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-saas-text">
            Manajemen Pengguna
          </h1>
        </div>
        {formMode === null && (
          <Button onClick={openCreate}>+ Tambah Pengguna</Button>
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

      {formMode === "create" && (
        <Modal
          wide
          title="Tambah Pengguna Baru"
          onClose={closeForm}
          footer={
            <div className="flex gap-3">
              <Button type="submit" form="user-create-form" disabled={saving}>
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
            <form id="user-create-form" onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username">Username</Label>
                  <Input
                    id="new-username"
                    type="text"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, username: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nama Lengkap</Label>
                  <Input
                    id="new-name"
                    type="text"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, password: e.target.value }))
                    }
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(val) =>
                      setCreateForm((f) => ({ ...f, role: val }))
                    }
                  >
                    <Select.Trigger id="new-role">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="satpam">Satpam</Select.Item>
                      <Select.Item value="admin">Admin</Select.Item>
                      <Select.Item value="owner">Owner</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Site{!selectedSiteId && " (wajib)"}</Label>
                {selectedSiteId ? (
                  <Input
                    value={sites.find((s) => s.id === selectedSiteId)?.name || ""}
                    readOnly
                    disabled
                  />
                ) : (
                  <Select
                    value={createForm.site_id || "__none"}
                    onValueChange={(val) =>
                      setCreateForm((f) => ({ ...f, site_id: val === "__none" ? "" : val }))
                    }
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Pilih Site" />
                    </Select.Trigger>
                    <Select.Content>
                      {sites.map((s) => (
                        <Select.Item key={s.id} value={s.id}>
                          {s.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                )}
              </div>
              {createForm.role === "satpam" && (
                <div className="space-y-2">
                  <Label>Warna Marker</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["#3B82F6","#EF4444","#22C55E","#F59E0B","#8B5CF6","#EC4899","#06B6D4","#F97316"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCreateForm((f) => ({ ...f, color: c }))}
                        className={`w-8 h-8 rounded-full border-2 ${createForm.color === c ? "border-brutal-black scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </form>
        </Modal>
      )}

      {formMode === "edit" && editingUser && (
        <Modal
          wide
          title={`Edit Pengguna — ${editingUser.username}`}
          onClose={closeForm}
          footer={
            <div className="flex gap-3">
              <Button type="submit" form="user-edit-form" disabled={saving}>
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
            <form id="user-edit-form" onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Lengkap</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(val) =>
                      setEditForm((f) => ({ ...f, role: val }))
                    }
                  >
                    <Select.Trigger id="edit-role">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="satpam">Satpam</Select.Item>
                      <Select.Item value="admin">Admin</Select.Item>
                      <Select.Item value="owner">Owner</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    Reset Password{" "}
                    <span className="text-xs font-medium text-saas-text-muted">
                      (kosongkan jika tidak diubah)
                    </span>
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, password: e.target.value }))
                    }
                    autoComplete="new-password"
                    placeholder="Password baru (opsional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site{!selectedSiteId && " (wajib)"}</Label>
                  {selectedSiteId ? (
                    <Input
                      value={sites.find((s) => s.id === selectedSiteId)?.name || ""}
                      readOnly
                      disabled
                    />
                  ) : (
                  <Select
                    value={editForm.site_id || "__none"}
                    onValueChange={(val) =>
                      setEditForm((f) => ({ ...f, site_id: val === "__none" ? "" : val }))
                    }
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Semua site" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="__none">Semua site</Select.Item>
                      {sites.map((s) => (
                        <Select.Item key={s.id} value={s.id}>
                          {s.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  )}
                </div>
              </div>
              {editForm.role === "satpam" && (
                <div className="space-y-2">
                  <Label>Warna Marker</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["#3B82F6","#EF4444","#22C55E","#F59E0B","#8B5CF6","#EC4899","#06B6D4","#F97316"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, color: c }))}
                        className={`w-8 h-8 rounded-full border-2 ${editForm.color === c ? "border-brutal-black scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={!!editForm.is_active}
                  onCheckedChange={(checked) =>
                    setEditForm((f) => ({ ...f, is_active: !!checked }))
                  }
                />
                <Label>Akun aktif</Label>
              </div>
            </form>
        </Modal>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Daftar Pengguna</CardTitle>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau username..."
              className="h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-brutal-muted font-medium">Belum ada pengguna.</p>
          ) : (
            <div className="overflow-x-auto border border-brutal-zinc rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Warna</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[140px] sm:min-w-[180px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className={!u.is_active ? "opacity-50" : ""}
                    >
                      <TableCell>
                        {u.username}
                        {currentUser?.id === u.id && (
                          <Badge variant="info" className="ml-2">
                            Anda
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "info" : u.role === "owner" ? "default" : "muted"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-saas-text-muted">
                        {u.site_id ? (sites.find((s) => s.id === u.site_id)?.name || u.site_id) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-brutal-black" style={{ backgroundColor: u.color || "#3B82F6" }} />
                          <span className="text-xs font-mono">{u.color || "#3B82F6"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "success" : "muted"}>
                          {u.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(u)}
                          >
                            Edit
                          </Button>
                          {u.role === "satpam" && u.device_token && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await api.post(`/api/users/${u.id}/release`);
                                  setNotice(`Sesi ${u.name} dilepas.`);
                                  fetchUsers(page, search);
                                } catch (err) {
                                  setError(getErrorMessage(err, "Gagal melepas sesi."));
                                }
                              }}
                            >
                              Lepas
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(u)}
                            disabled={currentUser?.id === u.id}
                            title={
                              currentUser?.id === u.id
                                ? "Tidak dapat menghapus akun sendiri"
                                : ""
                            }
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

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              fetchUsers(p, search);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
