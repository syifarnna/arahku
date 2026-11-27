import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppState, appStore } from '../../../lib/store';
import { Pencil, Search, ArrowLeft, Loader2, GraduationCap, School } from 'lucide-react';
import { Institution, InstitutionType, ClusterType, Major } from '../../../types';
import { searchMajors, getCampusPassingGradeRanges } from '../../../lib/prodiSearch';
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
}

const emptyForm: CampusForm = { name: '', abbreviation: '', type: 'PTN', grade: '' };

export const AdminCampusesView: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const state = useAppState();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CampusForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<Institution | null>(null);
  const [campusRangeMap, setCampusRangeMap] = useState<Map<number, string>>(new Map());
  const healedRef = useRef(false);

  // Self-heal: pastikan data prodi ter-load agar jumlah prodi per kampus akurat.
  useEffect(() => {
    if (healedRef.current) return;
    healedRef.current = true;
    appStore.fetchMasterData();
    let active = true;
    getCampusPassingGradeRanges()
      .then(rows => {
        if (!active) return;
        const m = new Map<number, string>();
        rows.forEach(r => m.set(r.institution_id, r.range));
        setCampusRangeMap(m);
      })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return state.institutions;
    return state.institutions.filter(i => matchesInstitution(i, q));
  }, [state.institutions, search]);

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
        range={campusRangeMap.get(selectedCampus.id) ?? '-'}
        onBack={() => setSelectedCampus(null)}
        onEditCampus={(inst) => { startEdit(inst); setSelectedCampus(null); }}
        setActiveTab={setActiveTab}
      />
    );
  }

  const resetForm = () => { setForm(emptyForm); setIsEditing(false); setEditingId(null); };

  const startEdit = (inst: Institution) => {
    setEditingId(inst.id);
    setIsEditing(true);
    setForm({
      name: inst.name,
      abbreviation: inst.abbreviation || '',
      type: inst.type,
      grade: inst.grade != null ? String(inst.grade) : '',
    });
  };

  const handleSave = async () => {
    if (editingId == null) return;
    if (!form.name.trim()) {
      Swal.fire('Validasi', 'Nama kampus wajib diisi.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await appStore.updateInstitution({
        id: editingId,
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim() || null,
        type: form.type,
        grade: form.grade ? Number(form.grade) : null,
      } as Institution);
      Swal.fire({ icon: 'success', title: 'Kampus diperbarui', timer: 1500, showConfirmButton: false });
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
            Data kampus bersumber dari Mediascanter 2026. <strong>Grade Campus</strong> dapat diubah; <strong>Range Nilai</strong> dihitung otomatis dari passing grade prodi.&nbsp;
            <span className="font-bold text-primary">{numCampus} kampus di database ({numWithGrade} sudah memiliki grade)</span>.
          </p>
        </div>
      </div>

      {isEditing && (
        <Card className="bg-card ring-0 border border-slate-200 dark:border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Ubah Data Kampus</h3>
              <button onClick={resetForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-muted hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer" aria-label="Tutup form">
                <span className="text-xl leading-none">&times;</span>
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
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={resetForm}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                    {campusRangeMap.get(inst.id) ?? '-'}
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
                      <Button variant="outline" size="icon-xs" onClick={() => setSelectedCampus(inst)} className="cursor-pointer" title="Lihat prodi kampus" aria-label="Lihat prodi kampus">
                        <School className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon-xs" onClick={() => startEdit(inst)} className="cursor-pointer" aria-label="Edit kampus">
                        <Pencil className="w-4 h-4" />
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
// Detail Kampus (Admin): info kampus & daftar prodi milik kampus tsb.
// Jumlah prodi dan range passing grade berasal dari server (RPC), bukan state
// lokal yang bisa tertinggal / dobel.
// ---------------------------------------------------------------------------

const CLUSTER_BADGE: Record<ClusterType, string> = {
  Saintek: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-sky-200 dark:border-sky-900',
  Soshum: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  Campuran: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
};

const PRODI_PAGE_SIZE = 25;

const AdminCampusDetail: React.FC<{
  campus: Institution;
  range: string;
  onBack: () => void;
  onEditCampus: (inst: Institution) => void;
  setActiveTab?: (tab: string) => void;
}> = ({ campus, range, onBack, onEditCampus, setActiveTab }) => {
  const [rows, setRows] = useState<Major[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filtered = rows;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
        </div>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grade Campus</p>
              <p className="text-lg font-extrabold text-primary">{campus.grade != null ? campus.grade : '—'}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Range Nilai</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap">{range}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Prodi</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{loading ? '—' : total}</p>
            </div>
          </div>
        </div>
      </div>

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
                <th className="px-6 py-3 text-right">P. Grade</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {debouncedSearch
                      ? 'Tidak ada prodi ditemukan untuk pencarian ini.'
                      : 'Belum ada prodi untuk kampus ini.'}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
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
                  <td className="px-6 py-3 text-right text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {m.passing_grade_total != null ? m.passing_grade_total : '—'}
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
