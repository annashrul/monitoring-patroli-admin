import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
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

const EMPTY_CREATE = { username: "", password: "", name: "", role: "satpam" };
const EMPTY_EDIT = { name: "", role: "satpam", is_active: true, password: "" };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/users");
      setUsers(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar pengguna."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setFormMode("create");
    setEditingUser(null);
    setCreateForm(EMPTY_CREATE);
    setFormError("");
    setNotice("");
  };

  const openEdit = (u) => {
    setFormMode("edit");
    setEditingUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
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
      });
      setNotice("Pengguna berhasil dibuat.");
      closeForm();
      fetchUsers();
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
        is_active: !!editForm.is_active,
      };
      if (editForm.password) body.password = editForm.password;
      await api.put(`/api/users/${editingUser.id}`, body);
      setNotice("Pengguna berhasil diperbarui.");
      closeForm();
      fetchUsers();
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
      fetchUsers();
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
          <h1 className="text-2xl font-bold tracking-tight text-saas-text">
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tambah Pengguna Baru</CardTitle>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </Select.Content>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {formMode === "edit" && editingUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Pengguna — {editingUser.username}</CardTitle>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
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
                    </Select.Content>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    Reset Password{" "}
                    <span className="text-xs font-semibold text-brutal-muted">
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
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!editForm.is_active}
                    onCheckedChange={(checked) =>
                      setEditForm((f) => ({ ...f, is_active: !!checked }))
                    }
                  />
                  <Label>Akun aktif</Label>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-brutal-muted font-medium">Memuat...</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead style={{ width: 180 }}>Aksi</TableHead>
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
                        <Badge variant={u.role === "admin" ? "info" : "muted"}>
                          {u.role}
                        </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
