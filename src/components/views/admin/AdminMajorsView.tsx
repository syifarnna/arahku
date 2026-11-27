import React, { useState, useEffect } from 'react';
import { useAppState, appStore } from '../../../lib/store';
import { AlertCircle, Pencil, Search, X } from 'lucide-react';
import { Major } from '../../../types';
import { getErrorMessage, cn, formatNumber } from '../../../lib/utils';
import Swal from 'sweetalert2';
import { searchMajors, getMajorsStats, useDebouncedValue, MajorsStats } from '../../../lib/prodiSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';
import { JENJANG_OPTIONS, JenjangBadge } from '@/components/ui/JenjangBadge';

const PAGE_SIZE = 25;

export const AdminMajorsView: React.FC = () => {
  const state = useAppState();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [jenjangFilter, setJenjangFilter] = useState<'SEMUA' | string>('SEMUA');
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<{ name?: string; jenjang?: string }>({});
  const [form, setForm] = useState({
    name: '',
    institution_id: 1,
    cluster: 'Saintek',
    jenjang: 'S1',
    passing_grade_total: 650,
  });

  const debouncedQuery = useDebouncedValue(query, 500);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Major[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [stats, setStats] = useState<MajorsStats | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilter = jenjangFilter !== 'SEMUA' || debouncedQuery.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, jenjangFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await searchMajors({
          search: debouncedQuery,
          jenjang: jenjangFilter === 'SEMUA' ? '' : jenjangFilter,
          sort: 'pg',
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.total);
      } catch (e: any) {
        if (!cancelled) setLoadError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, jenjangFilter, page, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    getMajorsStats()
      .then(s => {
        if (!cancelled && s) setStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const resetForm = () => {
    setForm({ name: '', institution_id: 1, cluster: 'Saintek', jenjang: 'S1', passing_grade_total: 650 });
    setErrors({});
  };

  const startEdit = (m: Major) => {
    setEditingId(m.id);
    setIsEditing(true);
    setErrors({});
    setForm({
      name: m.name || '',
      institution_id: m.institution_id,
      cluster: m.cluster || 'Saintek',
      jenjang: m.jenjang || 'S1',
      passing_grade_total: m.passing_grade_total || 650,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  const refresh = () => setReloadKey(k => k + 1);

  // Hanya mengubah baris yang sudah ada. Data prodi bersumber tunggal dari
  // Mediascanter (kode 8 digit / 2026), sehingga tidak ada tombol tambah/import.
  const handleSave = () => {
    if (editingId == null) return;
    const nextErrors: { name?: string; jenjang?: string } = {};
    if (!form.name.trim()) nextErrors.name = 'Nama jurusan wajib diisi.';
    if (!form.jenjang) nextErrors.jenjang = 'Jenjang wajib dipilih.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const original = rows.find(r => r.id === editingId) ?? state.majors.find(m => m.id === editingId);
    if (!original) return;

    appStore.updateMajor({
      ...original,
      name: form.name.trim(),
      institution_id: form.institution_id,
      cluster: form.cluster as any,
      jenjang: form.jenjang as any,
      passing_grade_total: form.passing_grade_total,
    } as Major);
    Swal.fire({ icon: 'success', title: 'Prodi diperbarui', timer: 1500, showConfirmButton: false });

    closeForm();
    refresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Program Studi</h2>
          <p className="text-slate-500 dark:text-muted-foreground mt-1">
            Data prodi bersumber dari Mediascanter 2026.{' '}
            <span className="font-bold text-primary">{stats ? formatNumber(stats.totalProdi) : '…'} prodi</span> dari{' '}
            <span className="font-bold text-primary">{state.institutions.length} kampus</span>. Hanya dapat mengubah data yang sudah ada.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold flex gap-2 items-center">
          <AlertCircle className="w-5 h-5" />
          Gagal memuat data: {loadError}
        </div>
      )}

      {isEditing && (
        <Card className="bg-card ring-0 border border-slate-200 dark:border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Edit Program Studi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                  Nama Jurusan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                  className={cn('h-10', errors.name && 'border-rose-500 ring-1 ring-rose-300')}
                  placeholder="e.g. Teknik Informatika"
                />
                {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.name}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                  Jenjang <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={String(form.jenjang || '')}
                  onValueChange={(val) => { setForm({ ...form, jenjang: val }); if (errors.jenjang) setErrors({ ...errors, jenjang: undefined }); }}
                >
                  <SelectTrigger className={cn('w-full h-10', errors.jenjang && 'border-rose-500 ring-1 ring-rose-300')}>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENJANG_OPTIONS.map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jenjang && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.jenjang}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Institusi / Kampus</Label>
                <Select
                  value={String(form.institution_id)}
                  onValueChange={(val) => setForm({ ...form, institution_id: Number(val) })}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.institutions.map(inst => (
                      <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Rumpun / Cluster</Label>
                <Select
                  value={form.cluster}
                  onValueChange={(val) => setForm({ ...form, cluster: val as any })}
                >
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
                <Input
                  type="number"
                  value={form.passing_grade_total || ''}
                  onChange={e => setForm({ ...form, passing_grade_total: Number(e.target.value) })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={closeForm}>Batal</Button>
              <Button onClick={handleSave}>Simpan Perubahan</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-3 bg-card rounded-2xl border border-slate-200 dark:border-border p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama jurusan atau nama kampus..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              title="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={jenjangFilter}
          onChange={(e) => setJenjangFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-56"
        >
          <option value="SEMUA">Semua Jenjang ({stats ? formatNumber(stats.totalProdi) : '…'})</option>
          <option value="S1">S1 ({stats ? formatNumber(stats.s1) : '…'})</option>
          <option value="D4">D4 ({stats ? formatNumber(stats.d4) : '…'})</option>
          <option value="D3">D3 ({stats ? formatNumber(stats.d3) : '…'})</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold text-slate-400">
          {loading && rows.length === 0 ? (
            'Memuat data prodi...'
          ) : (
            <>
              Menampilkan <span className="text-slate-700 dark:text-white font-bold">{rows.length}</span> dari{' '}
              <span className="text-slate-700 dark:text-white font-bold">{formatNumber(total)}</span> prodi
              {hasActiveFilter && (
                <> • Ditemukan <span className="text-primary font-bold">{formatNumber(total)}</span> data</>
              )}
            </>
          )}
        </p>
        <p className="text-xs font-semibold text-slate-400">
          Halaman <span className="text-slate-700 dark:text-white font-bold">{page}</span> dari{' '}
          <span className="text-slate-700 dark:text-white font-bold">{totalPages}</span>
        </p>
      </div>

      <div className={cn("bg-card rounded-2xl border border-slate-200 dark:border-border overflow-hidden shadow-sm transition-opacity", loading && rows.length > 0 && 'opacity-60')}>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-card hover:bg-slate-50 dark:hover:bg-black border-b border-slate-200 dark:border-border">
              <TableHead className="px-6 py-4 font-semibold">Nama Jurusan</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Kampus</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Jenjang</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Rumpun</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-center">Passing Grade Total</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-14 text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Data prodi tidak ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tidak ada prodi yang cocok dengan kata kunci "{query.trim()}"{jenjangFilter !== 'SEMUA' && <> dan jenjang {jenjangFilter}</>}. Coba kata kunci lain atau ubah filter.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {loading && rows.length === 0 && (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j} className="px-6 py-4">
                      <div className="h-3.5 w-full max-w-[200px] rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {rows.map((m) => (
              <TableRow key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/80">
                <TableCell className="px-6 py-4">
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{m.name}</p>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <span className="text-xs text-slate-500 dark:text-muted-foreground">{m.institution_name || 'Unknown'}</span>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <JenjangBadge jenjang={m.jenjang} />
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-md text-[11px] font-bold h-auto py-1',
                      m.cluster === 'Saintek'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                        : m.cluster === 'Soshum'
                          ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-100 dark:border-orange-800'
                          : 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-100 dark:border-violet-800'
                    )}
                  >
                    {m.cluster}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <p className="text-sm font-bold text-primary">{m.passing_grade_total}</p>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <Button variant="outline" size="icon-xs" onClick={() => startEdit(m)} title="Edit Prodi" aria-label="Edit prodi">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
};
