import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../../lib/store';
import { appStore } from '../../lib/store';
import { cn, formatNumber } from '../../lib/utils';
import { searchMajors, getMajorsStats, getPopularMajors, MajorsStats } from '../../lib/prodiSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { JenjangBadge } from '@/components/ui/JenjangBadge';
import { Pagination } from '@/components/ui/Pagination';
import { ScoreLineChart } from '@/components/ui/ScoreLineChart';
import { UtbkInputModal } from '@/components/modals/UtbkInputModal';
import Swal from 'sweetalert2';
import { Search, Target, GraduationCap, Building2, Layers, TrendingUp, AlertCircle, CheckCircle2, Clock, BookOpen, Sparkles, ArrowRight, Info, Award, Compass, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import type { Major, ClusterType, UtbkScore } from '../../types';

type JenjangFilter = 'SEMUA' | 'S1' | 'D4' | 'D3';
type RumpunFilter = 'SEMUA' | ClusterType;

const JENJANG_FILTERS: JenjangFilter[] = ['SEMUA', 'S1', 'D4', 'D3'];
const RUMPUN_FILTERS: RumpunFilter[] = ['SEMUA', 'Saintek', 'Soshum', 'Campuran'];

const FALLBACK_SUBTESTS: { code: string; name: string }[] = [
  { code: 'PU', name: 'Penalaran Umum' },
  { code: 'PPU', name: 'Pengetahuan & Pemahaman Umum' },
  { code: 'PBM', name: 'Kemampuan Memahami Bacaan' },
  { code: 'PK', name: 'Pengetahuan Kuantitatif' },
  { code: 'LBI', name: 'Literasi Bahasa Indonesia' },
  { code: 'LBE', name: 'Literasi Bahasa Inggris' },
  { code: 'PM', name: 'Penalaran Matematika' },
];

const todayISO = () => new Date().toISOString().split('T')[0];

const formatShortDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
};

const CLUSTER_STYLE: Record<ClusterType, { badge: string; row: string; dot: string }> = {
  Saintek: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    row: 'hover:bg-sky-50/40 dark:hover:bg-sky-950/20',
    dot: 'bg-sky-500',
  },
  Soshum: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    row: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
    dot: 'bg-amber-500',
  },
  Campuran: {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
    row: 'hover:bg-violet-50/40 dark:hover:bg-violet-950/20',
    dot: 'bg-violet-500',
  },
};

export const DashboardView: React.FC<{ onTakeTryout: (t: any) => void; setActiveTab: (tab: string) => void }> = ({ onTakeTryout, setActiveTab }) => {
  const state = useAppState();
  const [stats, setStats] = useState<MajorsStats | null>(null);
  const [popular, setPopular] = useState<Major[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [jenjang, setJenjang] = useState<JenjangFilter>('SEMUA');
  const [rumpun, setRumpun] = useState<RumpunFilter>('SEMUA');
  const [searchResults, setSearchResults] = useState<Major[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const targetMajors = state.getTargetMajors ? state.getTargetMajors() : state.targetMajorIds.map(id => state.majors.find(m => m.id === id)).filter(Boolean);

  // Muat & segerakan data Target Institut begitu user login/buka dashboard (atau
  // sudah login saat halaman pertama dimuat) agar ringkasan prodi tidak kosong.
  useEffect(() => {
    if (state.isLoggedIn) {
      appStore.ensureTargetMajorsLoaded();
    }
  }, [state.isLoggedIn]);

  // Self-healing: kalau fetch master menimpa state.majors dan prodi target belum
  // ada di daftar, resolve ulang supaya ringkasan tetap tampil tanpa menunggu
  // membuka halaman Target Institut.
  useEffect(() => {
    if (!state.isLoggedIn || state.targetMajorIds.length === 0) return;
    const hasUnresolved = state.targetMajorIds.some(id => !state.majors.some(m => m.id === id));
    if (hasUnresolved) {
      appStore.resolveTargetMajors();
    }
  }, [state.isLoggedIn, state.targetMajorIds, state.majors]);

  useEffect(() => {
    let cancelled = false;
    getMajorsStats().then(s => { if (!cancelled && s) setStats(s); }).catch(() => {});
    getPopularMajors(8).then(p => { if (!cancelled) setPopular(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || jenjang !== 'SEMUA' || rumpun !== 'SEMUA';

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!hasActiveFilters) {
        setSearchResults([]);
        setSearchTotal(0);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await searchMajors({
          search: searchQuery.trim(),
          jenjang: jenjang === 'SEMUA' ? '' : jenjang,
          rumpun: rumpun === 'SEMUA' ? '' : rumpun,
          page: 1,
          pageSize: searchQuery.trim() ? 10 : 8,
        });
        setSearchResults(res.data);
        setSearchTotal(res.total);
      } catch {
        setSearchResults([]);
        setSearchTotal(0);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, jenjang, rumpun, hasActiveFilters]);

  const fmt = (n?: number | null) => n == null ? '—' : formatNumber(n);

  // Keketangan (tightness) prodi = rasio jumlah peminat terhadap daya tampung (%).
  // Bukan passing grade percentage — nilai yang benar untuk "keketangan" kompetisi.
  const tightness = (m: Major) => (m.daya_tampung && m.daya_tampung > 0 && m.peminat != null) ? `${((m.peminat / m.daya_tampung) * 100).toFixed(0)}%` : '—';

  const activeTargetMajorId = state.activeTargetMajorId || state.targetMajorIds[0];
  const targetMajor = activeTargetMajorId ? state.majors.find(m => m.id === activeTargetMajorId) : undefined;
  const latestUtbkScore = appStore.getUtbkLatestScore();
  const avgScore = state.utbkScores.length > 0 ? (state.utbkScores.reduce((a, b) => a + b.total_score, 0) / state.utbkScores.length).toFixed(1) : '0';
  const isPassedTarget = latestUtbkScore != null && targetMajor && latestUtbkScore >= targetMajor.passing_grade_total;
  const gapValue = latestUtbkScore != null && targetMajor ? (latestUtbkScore - targetMajor.passing_grade_total).toFixed(1) : '0';

  // Rata-rata keketangan (tightness) dihitung dari data prodi yang memiliki
  // rasio peminat/daya_tampung — bukan rata-rata persentase passing grade.
  const avgKeketangan = useMemo(() => {
    const vals = state.majors
      .map(m => (m.daya_tampung && m.daya_tampung > 0 && m.peminat != null) ? (m.peminat / m.daya_tampung) * 100 : null)
      .filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [state.majors]);

// ===== Countdown UTBK-SNBT 2027 =====
const UTBK_EVENTS = [
  { name: 'Registrasi Akun SNPMB', start: '2027-01-12', end: '2027-04-07' },
  { name: 'Pendaftaran UTBK-SNBT', start: '2027-03-25', end: '2027-04-07' },
  { name: 'Pembayaran UTBK', start: '2027-03-25', end: '2027-04-08' },
  { name: 'Unduh Kartu Peserta', start: '2027-04-11', end: '2027-04-15' },
  { name: 'Pelaksanaan UTBK', start: '2027-04-21', end: '2027-04-30' },
  { name: 'Pengumuman Hasil SNBT', start: '2027-05-25', end: '2027-05-25' },
  { name: 'Unduh Sertifikat UTBK', start: '2027-05-26', end: '2027-07-31' },
];

const [utbkNow, setUtbkNow] = useState(new Date());
useEffect(() => {
  const id = setInterval(() => setUtbkNow(new Date()), 1000);
  return () => clearInterval(id);
}, []);

const utbkCountdown = useMemo(() => {
  // Countdown hanya ke Pelaksanaan UTBK (21-30 Apr 2027).
  const now = utbkNow;
  const start = new Date('2027-04-21T00:00:00');
  const end = new Date('2027-04-30T23:59:59');
  let target: Date;
  let phase: string;
  let ongoing = false;
  if (now < start) { target = start; phase = 'Menuju Pelaksanaan UTBK'; ongoing = false; }
  else if (now <= end) { target = end; phase = 'Pelaksanaan UTBK berlangsung'; ongoing = true; }
  else { target = end; phase = 'Pelaksanaan UTBK 2027 selesai'; ongoing = false; }
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const finished = now > end;
  return { phase, target, ongoing, finished, days, hours, minutes, seconds };
}, [utbkNow]);

  // ===== Input Nilai Tryout UTBK (mandiri) =====
  const subtests = state.competencies.length > 0
    ? state.competencies.map(c => ({ code: c.code, name: c.name }))
    : FALLBACK_SUBTESTS;

  const [utbkModalOpen, setUtbkModalOpen] = useState(false);
  const [editingUtbkId, setEditingUtbkId] = useState<number | null>(null);

  const handleUtbkSave = async (input: { total_score: number; scores: Record<string, number>; label?: string | null; recorded_on?: string }) => {
    const ok = editingUtbkId == null
      ? !!(await appStore.addUtbkScore(input))
      : await appStore.updateUtbkScore(editingUtbkId, input);
    if (ok) setEditingUtbkId(null);
  };

  const handleEditRequest = (row: UtbkScore) => {
    setEditingUtbkId(row.id);
    setUtbkModalOpen(true);
  };

  const openUtbkModal = () => {
    setEditingUtbkId(null);
    setUtbkModalOpen(true);
  };

  const handleDeleteRequest = async (row: UtbkScore) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Hapus nilai ini?',
      text: `${row.label || 'Nilai UTBK'} • ${formatShortDate(row.recorded_on)} (${row.total_score})`,
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!res.isConfirmed) return;
    const ok = await appStore.deleteUtbkScore(row.id);
    if (ok) {
      if (editingUtbkId === row.id) setEditingUtbkId(null);
      Swal.fire({ icon: 'success', title: 'Nilai terhapus', timer: 1200, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus', confirmButtonColor: '#6355d8' });
    }
  };

  const utbkRows = state.utbkScores;
  const utbkLatest = utbkRows[0];
  const utbkHighest = utbkRows.length ? Math.max(...utbkRows.map(r => r.total_score)) : 0;
  const utbkAvg = utbkRows.length ? utbkRows.reduce((a, b) => a + b.total_score, 0) / utbkRows.length : 0;
  const utbkDelta = utbkRows.length > 1 ? Math.round((utbkRows[0].total_score - utbkRows[1].total_score) * 10) / 10 : 0;
  const utbkChartPoints = [...utbkRows]
    .reverse()
    .map(r => ({ label: formatShortDate(r.recorded_on), value: Math.round(r.total_score) }));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">

      {/* SECTION 1: Personal Welcome & Status Bar + Countdown UTBK (kanan) */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary to-secondary p-6 lg:p-8 text-white shadow-xl shadow-primary/20">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Badge className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs border-0 text-white hover:bg-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>UTBK-SNBT 2027</span>
            </Badge>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Selamat Datang, {state.profile.full_name}! 🎓</h1>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Target aktif Anda saat ini adalah <strong>{targetMajor?.name || 'Belum dipilih'} ({targetMajor?.institution_name || '—'})</strong> dengan passing grade <strong>{targetMajor?.passing_grade_total ?? '—'}</strong>. Terus asah kompetensi berhitung dan literasi akademis Anda!
            </p>
          </div>

          {/* Countdown UTBK-SNBT 2027 (kanan) */}
            <div className="shrink-0 w-full lg:w-auto lg:min-w-[260px]">
            <div className="rounded-2xl bg-black/25 backdrop-blur-sm border border-white/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 mb-1">
                Countdown Pelaksanaan UTBK-SNBT 2027
              </p>
              <p className="text-sm font-extrabold text-white mb-3 truncate">
                {utbkCountdown.finished ? 'Pelaksanaan UTBK 2027 selesai' : utbkCountdown.phase}
              </p>
              {!utbkCountdown.finished && utbkCountdown.target && (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: 'Hari', value: utbkCountdown.days },
                      { label: 'Jam', value: utbkCountdown.hours },
                      { label: 'Menit', value: utbkCountdown.minutes },
                      { label: 'Detik', value: utbkCountdown.seconds },
                    ].map(c => (
                      <div key={c.label} className="flex flex-col items-center rounded-xl bg-white/15 py-2">
                        <span className="text-lg font-black tabular-nums leading-none">{String(c.value).padStart(2, '0')}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-100 mt-1">{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-100">
                    {utbkCountdown.ongoing ? 'Berakhir' : 'Mulai'}: {utbkCountdown.target.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900">
          <Clock className="w-3.5 h-3.5" /> Jalur Aktif: SNBT 2026
        </Badge>
        <Badge variant="secondary" className={cn("gap-1.5", targetMajors.length > 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900")}>
          {targetMajors.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} Pilihan Prodi: {targetMajors.length}/2
        </Badge>
      </div>

      {/* Onboarding: Belum tahu minat */}
      {!state.profile.major_interest && targetMajors.length === 0 && (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-900 bg-linear-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Belum tahu minatmu?</p>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Ikuti tes penjurusan singkat agar sistem merekomendasikan prodi &amp; kampus yang paling cocok untukmu.</p>
            </div>
          </div>
          <Button onClick={() => setActiveTab('tes_minat')} className="shrink-0 gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Ikuti Tes Penjurusan
          </Button>
        </div>
      )}

      {/* Input & Perkembangan Nilai Tryout UTBK */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Nilai Tryout UTBK
          </h2>
          <Button onClick={openUtbkModal} className="gap-1.5 text-xs">
            <PlusCircle className="w-3.5 h-3.5" /> Input Nilai UTBK
          </Button>
        </div>

        {utbkRows.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-border shadow-xs gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Ringkasan</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: 'Skor Terakhir', value: utbkLatest ? utbkLatest.total_score : 0, icon: Award, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
                    { label: 'Skor Tertinggi', value: utbkHighest, icon: Sparkles, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
                    { label: 'Rata-rata', value: Math.round(utbkAvg * 10) / 10, icon: Layers, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
                    { label: 'Perubahan', value: `${utbkDelta >= 0 ? '+' : ''}${utbkDelta}`, icon: TrendingUp, color: utbkDelta >= 0 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
                  ] as const).map((s, i) => (
                    <Card key={i} className="p-3 rounded-xl bg-card border border-slate-100 dark:border-border flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.color)}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">{s.label}</p>
                        <p className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate">{s.value}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-border shadow-xs gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Grafik Perkembangan
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold">{utbkRows.length} input</Badge>
                </div>
                <ScoreLineChart points={utbkChartPoints} />
              </Card>
            </div>

            <Card className="rounded-2xl border border-slate-200 dark:border-border shadow-xs overflow-hidden gap-0">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-border flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Riwayat Input Nilai</span>
                  <span className="text-[11px] text-slate-400">Terbaru di atas</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {utbkRows.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-muted/40 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{row.label || 'Nilai UTBK'}</p>
                        <p className="text-[11px] text-slate-400">{formatShortDate(row.recorded_on)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm font-extrabold text-primary tabular-nums">{row.total_score}</span>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit nilai" onClick={() => handleEditRequest(row)} className="text-slate-400 hover:text-primary">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Hapus nilai" onClick={() => handleDeleteRequest(row)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
          </div>
        ) : (
          <Card className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-border bg-card/50 flex flex-col items-center justify-center text-center min-h-[200px]">
            <TrendingUp className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belum Ada Data Nilai UTBK</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Klik tombol "Input Nilai UTBK" untuk memulai</p>
            <Button onClick={openUtbkModal} className="gap-1.5 text-xs">
              <PlusCircle className="w-3.5 h-3.5" /> Input Sekarang
            </Button>
          </Card>
        )}

        <UtbkInputModal
          open={utbkModalOpen}
          onOpenChange={(o) => { setUtbkModalOpen(o); if (!o) setEditingUtbkId(null); }}
          competencies={state.competencies}
          editingId={editingUtbkId}
          onSave={handleUtbkSave}
          onEditRequest={handleEditRequest}
          onDeleteRequest={handleDeleteRequest}
          utbkRows={utbkRows}
        />
      </div>

      {/* SECTION 2: Ringkasan Analisis Pilihan Saya */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Ringkasan Pilihan Prodi Anda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map(idx => {
            const m = targetMajors[idx];
            if (!m) {
              return (
                <Card key={idx} className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-border bg-card/50 flex flex-col items-center justify-center text-center min-h-[180px]">
                  <Target className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belum Ada Pilihan #{idx + 1}</p>
                  <p className="text-xs text-slate-400 mt-1 mb-3">Cari & pilih prodi impian Anda sekarang</p>
                  <Button size="sm" onClick={() => setActiveTab('target_majors')} className="gap-1.5 text-xs">
                    <Search className="w-3.5 h-3.5" /> Cari Prodi
                  </Button>
                </Card>
              );
            }
            const inst = state.institutions.find(i => i.id === m.institution_id);
            const cs = CLUSTER_STYLE[m.cluster === 'Saintek' || m.cluster === 'Soshum' || m.cluster === 'Campuran' ? m.cluster : 'Campuran'];
            const keketatan = tightness(m);
            return (
              <Card key={m.id} className={cn("p-5 rounded-2xl border border-slate-200 dark:border-border shadow-xs flex flex-col gap-3", cs.row)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{m.name}</p>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground">{inst?.name || '—'}</p>
                  </div>
                  <JenjangBadge jenjang={m.jenjang} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className={cn("text-[10px] font-bold gap-1.5 border", cs.badge)}><span className={cn("w-1.5 h-1.5 rounded-full", cs.dot)} />{m.cluster}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">Daya:</span> <span className="font-bold text-slate-700 dark:text-white">{fmt(m.daya_tampung)}</span></div>
                  <div><span className="text-slate-400">Peminat:</span> <span className="font-bold text-slate-700 dark:text-white">{fmt(m.peminat)}</span></div>
                  <div><span className="text-slate-400">Keketatan:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{keketatan}</span></div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border">
                  <span className="text-[10px] text-slate-400">PG: <span className="font-bold text-primary">{m.passing_grade_total ?? '—'}</span></span>
                  <Button size="sm" variant="ghost" onClick={() => { appStore.setActiveTargetMajor(m.id); setActiveTab('target_majors'); }} className="text-xs gap-1.5 h-auto">
                    Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Quick Search & Filter Prodi */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> Eksplorasi Prodi Cepat</h2>
        <Card className="p-4 rounded-2xl border-slate-200/70 dark:border-border space-y-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama prodi atau kampus..." className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenjang:</span>
            {JENJANG_FILTERS.map(f => (
              <button key={f} onClick={() => setJenjang(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer", jenjang === f ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted")}>{f}</button>
            ))}
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-2">Rumpun:</span>
            {RUMPUN_FILTERS.map(f => (
              <button key={f} onClick={() => setRumpun(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer", rumpun === f ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted")}>{f}</button>
            ))}
          </div>
          {searchQuery.trim() && (
            <p className="text-xs text-slate-400">Ditemukan <span className="font-bold text-slate-700 dark:text-white">{formatNumber(searchTotal)}</span> hasil untuk "{searchQuery.trim()}"</p>
          )}
        </Card>

        {(searchResults.length > 0 || (!hasActiveFilters && popular.length > 0)) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(hasActiveFilters ? searchResults : popular.slice(0, 8)).map(m => {
              const inst = state.institutions.find(i => i.id === m.institution_id);
              const cs = CLUSTER_STYLE[m.cluster === 'Saintek' || m.cluster === 'Soshum' || m.cluster === 'Campuran' ? m.cluster : 'Campuran'];
              return (
                <Card key={m.id} className={cn("p-4 rounded-xl border border-slate-200 dark:border-border shadow-xs flex flex-col gap-2", cs.row)}>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-muted-foreground truncate">{inst?.name || '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <JenjangBadge jenjang={m.jenjang} />
                    <Badge variant="secondary" className={cn("text-[10px] font-bold border", cs.badge)}>{m.cluster}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <div><span className="text-slate-400">Daya:</span> <span className="font-bold">{fmt(m.daya_tampung)}</span></div>
                    <div><span className="text-slate-400">Peminat:</span> <span className="font-bold">{fmt(m.peminat)}</span></div>
                    <div><span className="text-slate-400">Keketangan:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{tightness(m)}</span></div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {searchLoading && <p className="text-xs text-slate-400 text-center py-4">Mencari...</p>}
        {!searchLoading && hasActiveFilters && searchResults.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Tidak ada hasil untuk filter ini.</p>}
      </div>

      {/* SECTION 4: Widget Statistik & Distribusi Data */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Statistik Sistem</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Prodi', value: stats?.totalProdi ?? 0, icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
            { label: 'Total PTN', value: stats?.universitas ?? 0, icon: Building2, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
            { label: 'Rata-rata Keketatan', value: stats ? (avgKeketangan != null ? `${avgKeketangan.toFixed(1)}%` : '—') : '—', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
            { label: 'Input Nilai UTBK', value: state.utbkScores.length, icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
          ].map((s, i) => (
            <Card key={i} className="p-4 rounded-2xl flex items-center gap-3 border-slate-200/70 dark:border-border">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.color)}><s.icon className="w-5 h-5" /></div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{fmt(typeof s.value === 'string' ? undefined : s.value)}</p>
                <p className="text-[11px] font-medium text-slate-400 truncate">{typeof s.value === 'string' ? s.value : s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 5: Papan Informasi & Panduan */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> Panduan & Informasi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 rounded-2xl border border-slate-200 dark:border-border space-y-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Ketentuan Pemilihan Prodi</h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Pilihan 1 & 2 wajib berbeda rumpun (Saintek/Soshum).</li>
              <li>Jenjang S1: 4 tahun, D4: 4 tahun (vokasi), D3: 3 tahun (vokasi).</li>
              <li>Pastikan skor passing grade memenuhi minimum prodi target.</li>
            </ul>
          </Card>
          <Card className="p-5 rounded-2xl border border-slate-200 dark:border-border space-y-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Tips Pendaftaran</h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Daftar akun sebelum batas waktu pendaftaran ditutup.</li>
              <li>Lengkapi profil & riwayat tryout untuk rekomendasi akurat.</li>
              <li>Pantau pengumuman resmi SNBP/SNBT di situs LTMPT.</li>
            </ul>
          </Card>
        </div>
      </div>

    </div>
  );
};