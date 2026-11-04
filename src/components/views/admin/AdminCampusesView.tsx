import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppState, appStore } from '../../../lib/store';
import { Building2, Pencil, Plus, Search, Trash2, X, ArrowLeft, Loader2, GraduationCap, School } from 'lucide-react';
import { Institution, InstitutionType, ClusterType, Major } from '../../../types';
import { searchMajors } from '../../../lib/prodiSearch';
import { matchesInstitution } from '../../../lib/institutionSearch';
import { JenjangBadge } from '@/components/ui/JenjangBadge';
import { cn } from '../../../lib/utils';
import { getErrorMessage } from '../../../lib/utils';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';

const TYPE_OPTIONS: InstitutionType[] = ['PTN', 'PTS', 'Kedinasan'];

const typeColor: Record<string, string> = {
  PTN: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-sky-200 dark:border-sky-900',
  PTS: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
  Kedinasan: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
};

interface CampusForm {
  name: string;
  abbreviation: string;
  type: InstitutionType;
  grade: string;
  range_min: string;
  range_max: string;
}

const emptyForm: CampusForm = { name: '', abbreviation: '', type: 'PTN', grade: '', range_min: '', range_max: '' };

export const AdminCampusesView: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const state = useAppState();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<CampusForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<Institution | null>(null);
  const healedRef = useRef(false);

  // Self-heal: pastikan data prodi ter-load agar jumlah prodi per kampus akurat
  // (tidak selalu 0 saat halaman dibuka sebelum fetch master selesai / gagal).
  useEffect(() => {
    if (healedRef.current) return;
    healedRef.current = true;
    appStore.fetchMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return state.institutions;
    return state.institutions.filter(i => matchesInstitution(i, q));
  }, [state.institutions, search]);

  // Hitung jumlah prodi per kampus langsung dari state.majors (sudah dimuat
  // oleh fetchMasterData) — menghindari N+1 query ke server.
  const prodiCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const m of state.majors) {
      const iid = (m as any).institution_id;
      if (iid != null) counts[iid] = (counts[iid] || 0) + 1;
    }
    return counts;
  }, [state.majors]);
  const campusProdiCount = (id: number) => prodiCounts[id] ?? 0;
  const majorsReady = state.majors.length > 0;

  if (selectedCampus) {
    return (
      <AdminCampusDetail
        campus={selectedCampus}
        onBack={() => setSelectedCampus(null)}
        onEditCampus={(inst) => { startEdit(inst); setSelectedCampus(null); }}
        setActiveTab={setActiveTab}
      />
    );
  }

  const resetForm = () => { setForm(emptyForm); setIsAdding(false); setEditingId(null); };

  const startEdit = (inst: Institution) => {
    setEditingId(inst.id);
    setIsAdding(true);
    setForm({
      name: inst.name,
      abbreviation: inst.abbreviation || '',
      type: inst.type,
      grade: inst.grade != null ? String(inst.grade) : '',
      range_min: inst.range_min != null ? String(inst.range_min) : '',
      range_max: inst.range_max != null ? String(inst.range_max) : '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Swal.fire('Validasi', 'Nama kampus wajib diisi.', 'warning');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      abbreviation: form.abbreviation.trim() || null,
      type: form.type,
      grade: form.grade ? Number(form.grade) : null,
      range_min: form.range_min ? Number(form.range_min) : null,
      range_max: form.range_max ? Number(form.range_max) : null,
    };
    try {
      if (editingId != null) {
        await appStore.updateInstitution({ ...payload, id: editingId } as Institution);
        Swal.fire({ icon: 'success', title: 'Kampus diperbarui', timer: 1500, showConfirmButton: false });
      } else {
        await appStore.addInstitution(payload as any);
        Swal.fire({ icon: 'success', title: 'Kampus ditambahkan', timer: 1500, showConfirmButton: false });
      }
      resetForm();
    } catch (e: any) {
      Swal.fire('Gagal', getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const numCampus = state.institutions.length;
  const numWithGrade = state.institutions.filter(i => i.grade != null).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Kampus & Grade Campus</h2>
          <p className="text-slate-500 dark:text-muted-foreground mt-1">
            Kelola data kampus/PTN beserta <strong>Grade Campus</strong> (batas nilai masuk) dan <strong>Range Nilai</strong> (rentang passing grade prodi di kampus).&nbsp;
            <span className="font-bold text-primary">{numCampus} kampus di database ({numWithGrade} sudah memiliki grade)</span>.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAdding(true); }} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Tambah Kampus
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-card ring-0 border border-slate-200 dark:border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingId != null ? 'Ubah Data Kampus' : 'Tambah Kampus Baru'}
              </h3>
                      <button onClick={resetForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-muted hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer" aria-label="Tutup form">
                        <X className="w-4 h-4" />
                      </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Kampus / PTN</Label>
                <Input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-10" placeholder="contoh: Universitas Indonesia (UI)" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipe</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as InstitutionType })}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Singkatan (opsional)</Label>
                <Input type="text" value={form.abbreviation} onChange={e => setForm({ ...form, abbreviation: e.target.value })} className="h-10" placeholder="contoh: UI (boleh beberapa: UPNVYK, UPNYK)" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Grade Campus (batas nilai masuk)</Label>
                <Input type="number" step="0.1" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10" placeholder="contoh: 645.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Range Nilai Min</Label>
                <Input type="number" step="0.1" value={form.range_min} onChange={e => setForm({ ...form, range_min: e.target.value })} className="h-10" placeholder="contoh: 580" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Range Nilai Max</Label>
                <Input type="number" step="0.1" value={form.range_max} onChange={e => setForm({ ...form, range_max: e.target.value })} className="h-10" placeholder="contoh: 754.2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={resetForm}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Menyimpan...' : editingId != null ? 'Simpan Perubahan' : 'Simpan Kampus'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 bg-card rounded-2xl border border-slate-200 dark:border-border p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama kampus..." className="pl-9 h-9" />
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} kampus tampil</span>
      </div>

      <div className="bg-card rounded-2xl border border-slate-200 dark:border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-card hover:bg-slate-50 dark:hover:bg-black border-b border-slate-200 dark:border-border">
              <TableHead className="px-6 py-4 font-semibold">Kampus</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Tipe</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Grade Campus</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Range Nilai Min–Max</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Jml. Prodi</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Tidak ada kampus ditemukan untuk pencarian ini.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((inst) => {
              const prodiCount = campusProdiCount(inst.id);
              return (
                <TableRow key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/80">
                  <TableCell className="px-6 py-4">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{inst.name}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn('rounded-md text-[11px] font-bold h-auto py-1', typeColor[inst.type] || typeColor.PTN)}>
                      {inst.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    {inst.grade != null ? (
                      <p className="text-sm font-extrabold text-primary">{inst.grade}</p>
                    ) : (
                      <p className="text-xs text-slate-400">—</p>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    {inst.range_min != null && inst.range_max != null
                      ? `${inst.range_min} – ${inst.range_max}`
                      : '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    {majorsReady ? (
                      <Badge variant="outline" className="rounded-full text-[11px] font-bold h-auto px-2.5 py-0.5">
                        {prodiCount} prodi
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> memuat
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <Button variant="outline" size="icon-xs" onClick={() => setSelectedCampus(inst)} className="cursor-pointer" title="Lihat & kelola prodi kampus" aria-label="Lihat prodi kampus">
                        <School className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon-xs" onClick={() => startEdit(inst)} className="cursor-pointer" aria-label="Edit kampus">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon-xs" onClick={async () => {
                        const confirmed = await Swal.fire({
                          icon: 'warning',
                          title: `Hapus kampus ${inst.name}?`,
                          text: 'Semua prodi terkait akan ikut terhapus. Tindakan tidak dapat dibatalkan.',
                          showCancelButton: true,
                          confirmButtonText: 'Ya, hapus',
                          cancelButtonText: 'Batal',
                          confirmButtonColor: '#dc2626',
                        });
                        if (!confirmed.isConfirmed) return;
                        setDeletingId(inst.id);
                        try {
                          await appStore.deleteInstitution(inst.id);
                          Swal.fire({ icon: 'success', title: 'Kampus dihapus', timer: 1500, showConfirmButton: false });
                        } catch (e: any) {
                          Swal.fire('Gagal', getErrorMessage(e), 'error');
                        } finally {
                          setDeletingId(null);
                        }
                      }} className="cursor-pointer" aria-label="Hapus kampus" disabled={deletingId === inst.id}>
                        {deletingId === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail Kampus (Admin): kelola data kampus & daftar prodi milik kampus tsb.
// Jumlah prodi diambil langsung dari server (RPC search_majors filter kampus)
// sehingga akurat meski data master di store belum ter-load.
// ---------------------------------------------------------------------------

const CLUSTER_BADGE: Record<ClusterType, string> = {
  Saintek: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-sky-200 dark:border-sky-900',
  Soshum: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  Campuran: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
};

const PRODI_PAGE_SIZE = 25;

const AdminCampusDetail: React.FC<{
  campus: Institution;
  onBack: () => void;
  onEditCampus: (inst: Institution) => void;
  setActiveTab?: (tab: string) => void;
}> = ({ campus, onBack, onEditCampus, setActiveTab }) => {
  const state = useAppState();
  const [rows, setRows] = useState<Major[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    cluster: 'Saintek' as ClusterType,
    jenjang: 'S1' as NonNullable<Major['jenjang']>,
    passing_grade_total: '',
    passing_grade_percentage: '',
    daya_tampung: '',
    peminat: '',
  });

  const majorsReady = state.majors.length > 0;

  // Debounce pencarian prodi (server-side).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PRODI_PAGE_SIZE));

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchMajors({ institutionId: campus.id, search: debouncedSearch, page, pageSize: PRODI_PAGE_SIZE, sort: 'name' });
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [campus.id, debouncedSearch, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Reset ke halaman 1 saat pencarian berubah.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filtered = rows;

  const resetAddForm = () => {
    setForm({
      name: '', code: '', cluster: 'Saintek', jenjang: 'S1',
      passing_grade_total: '', passing_grade_percentage: '', daya_tampung: '', peminat: '',
    });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) {
      Swal.fire('Validasi', 'Nama prodi wajib diisi.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await appStore.addMajor({
        institution_id: campus.id,
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        cluster: form.cluster,
        jenjang: form.jenjang,
        passing_grade_total: form.passing_grade_total ? Number(form.passing_grade_total) : 0,
        passing_grade_percentage: form.passing_grade_percentage ? Number(form.passing_grade_percentage) : undefined,
        daya_tampung: form.daya_tampung ? Number(form.daya_tampung) : undefined,
        peminat: form.peminat ? Number(form.peminat) : undefined,
      } as Major);
      setShowAdd(false);
      resetAddForm();
      await reload();
      Swal.fire({ icon: 'success', title: 'Prodi ditambahkan', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Gagal', getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Major) => {
    const confirmed = await Swal.fire({
      icon: 'warning',
      title: `Hapus prodi ${m.name}?`,
      text: `Akan dihapus dari ${campus.name}.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirmed.isConfirmed) return;
    try {
      await appStore.deleteMajor(m.id);
      await reload();
      Swal.fire({ icon: 'success', title: 'Prodi dihapus', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Gagal', getErrorMessage(e), 'error');
    }
  };

  const localTotal = majorsReady
    ? state.majors.filter(m => m.institution_id === campus.id).length
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" aria-label="Kembali ke daftar kampus">
            <ArrowLeft className="w-4 h-4" /> Daftar Kampus
          </button>
        <div className="flex flex-wrap gap-2">
          {setActiveTab && (
            <Button variant="outline" className="gap-2" onClick={() => setActiveTab('admin_majors')}>
              <GraduationCap className="w-4 h-4" /> Kelola Semua Prodi
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => onEditCampus(campus)}>
            <Pencil className="w-4 h-4" /> Ubah Data Kampus
          </Button>
          <Button className="gap-2" onClick={() => { if (!showAdd) resetAddForm(); setShowAdd(v => !v); }}>
            <Plus className="w-4 h-4" /> Tambah Prodi
          </Button>
        </div>
      </div>

      {/* Ringkasan kampus */}
      <div className="bg-card rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{campus.name}</h2>
              <Badge variant="outline" className={cn('rounded-md text-[11px] font-bold h-auto px-2 py-1', typeColor[campus.type] || typeColor.PTN)}>
                {campus.type}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grade Campus</p>
              <p className="text-lg font-extrabold text-primary">{campus.grade != null ? campus.grade : '—'}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Range Nilai</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {campus.range_min != null && campus.range_max != null ? `${campus.range_min}–${campus.range_max}` : '—'}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Prodi</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">
                {loading ? '—' : total}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Di Store</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">
                {majorsReady ? localTotal : <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form tambah prodi */}
      {showAdd && (
        <Card className="bg-card ring-0 border border-slate-200 dark:border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Tambah Prodi di {campus.name}</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-muted hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Prodi *</Label>
                <Input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-10" placeholder="contoh: Teknik Informatika" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kode Prodi</Label>
                <Input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="h-10" placeholder="contoh: 55201" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jenjang</Label>
                <Select value={form.jenjang} onValueChange={(v) => setForm({ ...form, jenjang: v as NonNullable<Major['jenjang']> })}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S1">S1</SelectItem>
                    <SelectItem value="D-IV">D-IV</SelectItem>
                    <SelectItem value="D-III">D-III</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Rumpun</Label>
                <Select value={form.cluster} onValueChange={(v) => setForm({ ...form, cluster: v as ClusterType })}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saintek">Saintek</SelectItem>
                    <SelectItem value="Soshum">Soshum</SelectItem>
                    <SelectItem value="Campuran">Campuran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Passing Grade Total</Label>
                <Input type="number" step="0.1" value={form.passing_grade_total} onChange={e => setForm({ ...form, passing_grade_total: e.target.value })} className="h-10" placeholder="contoh: 645.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Passing Grade (%)</Label>
                <Input type="number" step="0.01" value={form.passing_grade_percentage} onChange={e => setForm({ ...form, passing_grade_percentage: e.target.value })} className="h-10" placeholder="contoh: 64.55" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Daya Tampung</Label>
                <Input type="number" value={form.daya_tampung} onChange={e => setForm({ ...form, daya_tampung: e.target.value })} className="h-10" placeholder="contoh: 120" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Peminat</Label>
                <Input type="number" value={form.peminat} onChange={e => setForm({ ...form, peminat: e.target.value })} className="h-10" placeholder="contoh: 3500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => { setShowAdd(false); resetAddForm(); }}>Batal</Button>
              <Button onClick={handleAdd} disabled={saving || !form.name.trim()}>
                {saving ? 'Menyimpan...' : 'Simpan Prodi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daftar prodi kampus */}
      <div className="flex flex-wrap items-center gap-2 bg-card rounded-2xl border border-slate-200 dark:border-border p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama prodi atau kode di kampus ini..." className="pl-9 h-9" />
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-400">{total.toLocaleString('id-ID')} prodi</span>
      </div>

      <div className="bg-card rounded-2xl border border-slate-200 dark:border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 dark:border-border bg-slate-50/60 dark:bg-slate-900/40">
                <th className="px-6 py-3">Kode</th>
                <th className="px-6 py-3">Program Studi</th>
                <th className="px-6 py-3">Rumpun</th>
                <th className="px-6 py-3">Jenjang</th>
                <th className="px-6 py-3 text-right">Daya</th>
                <th className="px-6 py-3 text-right">Peminat</th>
                <th className="px-6 py-3 text-right">P. Grade</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {debouncedSearch
                      ? 'Tidak ada prodi ditemukan untuk pencarian ini.'
                      : 'Belum ada prodi untuk kampus ini. Gunakan "Tambah Prodi" di atas.'}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto opacity-50" />
                    <span className="text-xs mt-2 block">Memuat data prodi...</span>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/80 border-b border-slate-50 dark:border-border/50">
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{m.code || '—'}</td>
                  <td className="px-6 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">{m.name}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <Badge variant="secondary" className={cn('text-[10px] font-bold gap-1.5 border', CLUSTER_BADGE[m.cluster] || CLUSTER_BADGE.Campuran)}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {m.cluster || '—'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <JenjangBadge jenjang={m.jenjang} />
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {m.daya_tampung != null ? m.daya_tampung.toLocaleString('id-ID') : '—'}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {m.peminat != null ? m.peminat.toLocaleString('id-ID') : '—'}
                  </td>
                  <td className="px-6 py-3 text-right text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {m.passing_grade_total != null ? m.passing_grade_total : '—'}
                  </td>
                  <td className="px-6 py-3 text-right">
                     <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(m)} className="cursor-pointer" aria-label="Hapus prodi">
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-border bg-slate-50/50 dark:bg-card/50">
            <span className="text-xs text-slate-500 dark:text-muted-foreground">
              Halaman {page} dari {totalPages} · {total.toLocaleString('id-ID')} prodi
            </span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};