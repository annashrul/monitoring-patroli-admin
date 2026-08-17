import { useEffect, useState } from "react";
import api from "../api";
import { useSite } from "../SiteContext";
import Pagination from "../components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import Modal from "../components/Modal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Eye } from "lucide-react";

const CAT_LABELS = { general: "Umum", security: "Keamanan", cleanliness: "Kebersihan", damage: "Kerusakan", other: "Lainnya" };
const CAT_COLORS = { general: "muted", security: "destructive", cleanliness: "warning", damage: "warning", other: "default" };

export default function Temuan() {
  const { selectedSiteId } = useSite();
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const fetchFindings = async (targetPage = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSiteId) params.set("site_id", selectedSiteId);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(targetPage));
      params.set("limit", String(PAGE_SIZE));

      const res = await api.get("/api/findings", { params });
      setFindings(res.data.data || []);

      const meta = res.data.meta;
      if (meta) {
        setTotalPages(meta.total_pages || 1);
        setPage(meta.page || 1);
      } else {
        setTotalPages(1);
        setPage(1);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedSiteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchFindings(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedSiteId]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-saas-border">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-saas-text">Laporan Findings</h1>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Daftar Findings</CardTitle>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari deskripsi..."
              className="h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 py-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : findings.length === 0 ? (
            <p className="text-saas-text-muted font-medium py-4">Belum ada laporan findings.</p>
          ) : (
            <div className="overflow-x-auto border border-saas-border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Satpam</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>WA</TableHead>
                    <TableHead className="w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {findings.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs">{new Date(f.created_at).toLocaleString("id-ID")}</TableCell>
                      <TableCell>{f.user?.name || "-"}</TableCell>
                      <TableCell><Badge variant={CAT_COLORS[f.category] || "default"}>{CAT_LABELS[f.category] || f.category}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate">{f.description}</TableCell>
                      <TableCell>{f.photo_url ? <span className="text-green-600 text-xs">✓</span> : <span className="text-saas-text-muted">-</span>}</TableCell>
                      <TableCell>{f.whatsapp_sent ? <span className="text-green-600 text-xs">Terkirim</span> : <span className="text-saas-text-muted">-</span>}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => setDetail(f)}><Eye className="w-4 h-4" /></Button></TableCell>
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
              fetchFindings(p);
            }}
          />
        </CardContent>
      </Card>

      {detail && (
        <Modal title={`Detail Finding — ${CAT_LABELS[detail.category] || detail.category}`} onClose={() => setDetail(null)} footer={<Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button>}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold text-saas-text-muted">Waktu</span><span>{new Date(detail.created_at).toLocaleString("id-ID")}</span>
              <span className="font-bold text-saas-text-muted">Satpam</span><span>{detail.user?.name || "-"}</span>
              <span className="font-bold text-saas-text-muted">Kategori</span><Badge variant={CAT_COLORS[detail.category] || "default"}>{CAT_LABELS[detail.category] || detail.category}</Badge>
              {detail.latitude && <><span className="font-bold text-saas-text-muted">Lokasi</span><span className="font-mono text-xs">{Number(detail.latitude).toFixed(6)}, {Number(detail.longitude).toFixed(6)}</span></>}
            </div>
            <hr className="border-saas-border" />
            <div><div className="font-bold text-saas-text-muted mb-1">Deskripsi</div><p className="break-words">{detail.description}</p></div>
            {detail.photo_url && (
              <div><div className="font-bold text-saas-text-muted mb-1">Foto</div>
                <img src={detail.photo_url} alt="Foto" className="max-w-full max-h-60 rounded-brutal border-2 border-brutal-black object-cover" />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
