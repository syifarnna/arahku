import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, ExternalLink, GraduationCap, Loader2, ShieldCheck, Sparkles, Target, TrendingUp, XCircle, Zap } from 'lucide-react';
import { appStore, useAppState } from '../../lib/store';
import { Major } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CampusCombobox } from '@/components/ui/CampusCombobox';
import { JenjangBadge, normalizeJenjang } from '@/components/ui/JenjangBadge';
import { buildProdiPgRanges } from '../../lib/pgRange';
import { normalizeProdiKey } from '../../lib/prodiName';

const DEFAULT_ALTERNATIVE_LIMIT = 3;

export const MantepView: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const state = useAppState();

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [insist, setInsist] = useState(false);
  const [jenjangFilter, setJenjangFilter] = useState<'SEMUA' | string>('SEMUA');

  // State per-kampus: data prodi diambil on-demand dari database saat kampus dipilih
  const [campusMajors, setCampusMajors] = useState<Major[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [majorsLoaded, setMajorsLoaded] = useState(false);

  const latestUtbk = appStore.getUtbkLatest();
  const autoScore = latestUtbk?.total_score ?? null;

  // Rentang passing grade (terkecil-tertinggi) tiap prodi — prodi yang sama dari
  // beberapa kampus dikelompokkan jadi satu prodi, kartu menampilkan rentang PG.
  const prodiPgRanges = useMemo(() => buildProdiPgRanges(state.majors), [state.majors]);

  const pgRangeFor = (m: Major): string => {
    const range = prodiPgRanges.get(normalizeProdiKey(m.name));
    const pg = m.passing_grade_total;
    if (!range) return `PG ${pg ?? '—'}`;
    const min = Math.min(range.min, pg ?? range.min);
    const max = Math.max(range.max, pg ?? range.max);
    return min === max ? `PG ${min}` : `PG ${min}–${max}`;
  };

  const campuses = useMemo(
    () => [...state.institutions].sort((a, b) => a.name.localeCompare(b.name)),
    [state.institutions]
  );

  const selectedCampus = useMemo(
    () => state.institutions.find(i => i.id === Number(selectedCampusId)) || null,
    [state.institutions, selectedCampusId]
  );

  // Trigger fetch prodi database begitu kampus tujuan dipilih
  useEffect(() => {
    let cancelled = false;
    if (!selectedCampus) {
      setCampusMajors([]);
      setMajorsLoading(false);
      setMajorsLoaded(false);
      setSelectedMajorId(null);
      return;
    }
    setMajorsLoading(true);
    setMajorsLoaded(false);
    setSelectedMajorId(null);
    appStore.loadMajorsForInstitution(selectedCampus.id).then((list) => {
      if (cancelled) return;
      setCampusMajors(list);
      setMajorsLoading(false);
      setMajorsLoaded(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampusId]);

  const campusGradeOf = (id: number): number | null => {
    const inst = state.institutions.find(i => i.id === id);
    if (inst?.grade != null) return inst.grade;
    const source = id === selectedCampus?.id ? campusMajors : state.majors;
    const pgs = source
      .filter(m => m.institution_id === id && m.passing_grade_total != null)
      .map(m => m.passing_grade_total as number);
    if (pgs.length === 0) return null;
    pgs.sort((a, b) => a - b);
    return pgs[Math.floor(pgs.length / 2)];
  };

  const campusGrade = selectedCampus ? campusGradeOf(selectedCampus.id) : null;

  const selectedProdi = useMemo(
    () => selectedMajorId != null ? campusMajors.find(m => m.id === selectedMajorId) || null : null,
    [selectedMajorId, campusMajors]
  );

  const prodiMet = selectedProdi ? (selectedProdi.passing_grade_total != null && autoScore != null && autoScore >= selectedProdi.passing_grade_total) : null;
  const campusMet = campusGrade != null && autoScore != null && autoScore >= campusGrade;

  const eligibleMajors = useMemo(() => {
    if (autoScore == null) return [];
    return campusMajors.filter(m => m.passing_grade_total != null && m.passing_grade_total <= autoScore);
  }, [campusMajors, autoScore]);

  const alternativeCampuses = useMemo(() => {
    if (autoScore == null) return [];
    return state.institutions
      .filter(i => {
        const g = campusGradeOf(i.id);
        return g != null && autoScore >= g;
      })
      .map(i => ({ inst: i, grade: campusGradeOf(i.id) as number }))
      .sort((a, b) => b.grade - a.grade)
      .slice(0, DEFAULT_ALTERNATIVE_LIMIT);
  }, [state.institutions, autoScore, campusMajors, campusGrade]);

  const altMajorsOf = (instId: number) =>
    state.majors
      .filter(m => m.institution_id === instId && m.passing_grade_total != null && autoScore != null && m.passing_grade_total <= autoScore)
      .sort((a, b) => (b.passing_grade_total || 0) - (a.passing_grade_total || 0))
      .slice(0, DEFAULT_ALTERNATIVE_LIMIT);

  const fmt = (n?: number | null) => n == null ? '—' : n;

  if (autoScore == null) {
    return (
      <div className="space-y-8 pb-16 animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-3xl p-8 bg-linear-to-r from-sky-600 to-indigo-700 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <Badge className="bg-white/15 text-white border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md h-auto px-3 py-1 gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Analisis Hasil Tryout
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Analisis Kelayakan Nilai terhadap Kampus Tujuan</h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              Sistem mengambil nilai<strong> Input Nilai UTBK</strong> terbaru Anda dari Dashboard secara otomatis untuk dikomparasikan dengan <strong>Grade Campus</strong> &amp; passing grade prodi yang Anda pilih.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 hidden lg:flex items-center justify-center opacity-10 pointer-events-none pr-6">
            <GraduationCap className="w-72 h-72" />
          </div>
        </div>

        <Card className="p-10 text-center bg-card border border-amber-200 dark:border-amber-900/60 rounded-3xl max-w-2xl mx-auto">
          <XCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Belum Ada Nilai UTBK</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Untuk menjalankan analisis kelayakan, masukkan dulu nilai tryout UTBK Anda lewat tombol <strong>Input Nilai UTBK</strong> di Dashboard. Nilai tersebut akan otomatis menjadi acuan kelayakan.
          </p>
          <Button onClick={() => setActiveTab?.('dashboard')} className="mt-6 px-6 py-3 h-auto rounded-xl gap-2">
            <Target className="w-4 h-4" /> Input Nilai UTBK
          </Button>
        </Card>
      </div>
    );
  }

  const showProdiList = majorsLoaded && campusMajors.length > 0;
  const canEvaluate = selectedCampus != null && majorsLoaded && campusMajors.length > 0;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-linear-to-r from-sky-600 to-indigo-700 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge className="bg-white/15 text-white border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md h-auto px-3 py-1 gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" /> Analisis Hasil Tryout
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Analisis Kelayakan Nilai terhadap Kampus Tujuan</h2>
          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
            Nilai Anda diambil otomatis dari hasil tryout terbaru, lalu dikomparasikan dengan <strong>Grade Campus</strong> &amp; passing grade prodi. Pilih kampus tujuan untuk memuat daftar prodi-nya.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden lg:flex items-center justify-center opacity-10 pointer-events-none pr-6">
          <GraduationCap className="w-72 h-72" />
        </div>
      </div>

      {/* Nilai otomatis */}
      <Card className="p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Otomatis — Input Nilai UTBK Terakhir Anda</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            {latestUtbk?.label || 'Input Nilai UTBK'} • {latestUtbk?.recorded_on}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{fmt(autoScore)}</p>
          <p className="text-[11px] font-semibold text-slate-400">skor total UTBK</p>
        </div>
      </Card>

      {/* Pilih kampus & prodi */}
      <Card className="p-6 lg:p-8 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">1. Pilih Kampus Tujuan</Label>
          <CampusCombobox
            institutions={campuses}
            value={selectedCampusId ? Number(selectedCampusId) : null}
            onChange={(id) => { setSelectedCampusId(id != null ? String(id) : ''); setSelectedMajorId(null); setInsist(false); setJenjangFilter('SEMUA'); }}
            placeholder="-- Pilih Kampus Tujuan --"
          />
        </div>

        {selectedCampus && (
          <>
            {/* LOADING: indikator memuat saat prodi diambil dari database */}
            {majorsLoading && (
              <div className="mt-6 rounded-2xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900/40 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Memuat data prodi untuk <strong>{selectedCampus.name}</strong> dari database...
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-3/5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                        <div className="h-2.5 w-2/5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                      </div>
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EMPTY: data prodi memang kosong di database */}
            {!majorsLoading && majorsLoaded && campusMajors.length === 0 && (
              <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-6 text-center">
                <XCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Data prodi untuk kampus ini belum tersedia
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Admin belum menginput daftar program studi pada kampus <strong>{selectedCampus.name}</strong>. Silakan pilih kampus lain atau hubungi admin.
                </p>
              </div>
            )}

            {/* LOADED: grade campus + daftar prodi */}
            {showProdiList && (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-border rounded-2xl p-3">
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-white">{selectedCampus.name}</strong> • Grade Campus{' '}
                    <strong className={campusGrade != null && autoScore >= campusGrade ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                      {fmt(campusGrade)}
                    </strong>{' '}
                    • Range nilai {fmt(selectedCampus.range_min)} – {fmt(selectedCampus.range_max)}
                  </p>
                  <Badge className={cn(
                    'ml-auto rounded-full text-[10px] font-bold h-auto px-2.5 py-1',
                    campusGrade != null && autoScore >= campusGrade
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  )}>
                    {campusGrade != null && autoScore >= campusGrade ? '✓ Grade Terpenuhi' : '✕ Grade Belum Terpenuhi'}
                  </Badge>
                </div>

                <div className="mt-6 space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    2. Pilih Program Studi (kriteria Passing Grade ditampilkan otomatis — status Lolos mengikuti nilai otomatis Anda)
                  </Label>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(['SEMUA', 'S1', 'D4', 'D3'] as const).map(f => {
                      const count = f === 'SEMUA'
                        ? campusMajors.length
                        : campusMajors.filter(x => normalizeJenjang(x.jenjang) === f).length;
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setJenjangFilter(f)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer',
                            jenjangFilter === f
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:bg-muted'
                          )}
                        >
                          {f === 'SEMUA' ? `Semua (${count})` : `${f} (${count})`}
                        </button>
                      );
                    })}
                    <span className="ml-1 text-[10px] font-semibold text-slate-400">
                      {campusMajors.length} prodi • {selectedCampus.name}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedMajorId(null)}
                      className={cn(
                        'w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3',
                        selectedMajorId == null
                          ? 'bg-primary/5 border-primary ring-1 ring-primary/40'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-border hover:border-primary/40'
                      )}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white">Semua Prodi di {selectedCampus.name}</p>
                        <p className="text-[11px] text-slate-400">Tampilkan seluruh daftar prodi sesuai Grade</p>
                      </div>
                      <span className="w-5 h-5 rounded-full border-2 border-primary/40 flex items-center justify-center shrink-0">
                        {selectedMajorId == null && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </span>
                    </button>
                    {campusMajors.filter(m => jenjangFilter === 'SEMUA' || normalizeJenjang(m.jenjang) === jenjangFilter).map(m => {
                      const pass = m.passing_grade_total != null && autoScore >= m.passing_grade_total;
                      const isSel = selectedMajorId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMajorId(m.id)}
                          className={cn(
                            'w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer',
                            isSel
                              ? 'bg-primary/5 border-primary ring-1 ring-primary/40'
                              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-border hover:border-primary/40'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{m.name}</p>
                            <span className="w-5 h-5 rounded-full border-2 border-primary/40 flex items-center justify-center shrink-0">
                              {isSel && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="rounded-md text-[10px] font-bold h-auto px-1.5 py-0.5">
                              {pgRangeFor(m)}
                            </Badge>
                            <Badge className={cn(
                              'rounded-md text-[9px] font-bold h-auto px-1.5 py-0.5',
                              pass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            )}>
                              {pass ? '✓ Lolos' : '✕ Belum Lolos'}
                            </Badge>
                            <JenjangBadge jenjang={m.jenjang} />
                            <span className="text-[10px] text-slate-400">{m.cluster}</span>
                          </div>
                        </button>
                      );
                    })}
                    {jenjangFilter !== 'SEMUA' && campusMajors.filter(m => normalizeJenjang(m.jenjang) === jenjangFilter).length === 0 && (
                      <p className="text-xs text-slate-400 py-6 text-center border-2 border-dashed border-slate-200 dark:border-border rounded-2xl">
                        Tidak ada prodi jenjang {jenjangFilter} di kampus ini.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Card>

      {/* Hasil evaluasi — hanya dijalankan setelah prodi selesai dimuat */}
      {canEvaluate && (() => {
        const overallMet = selectedProdi
          ? Boolean(campusMet || (campusGrade == null && prodiMet)) && Boolean(prodiMet)
          : Boolean(campusMet);

        if (overallMet) {
          return (
      <Card className="p-6 lg:p-8 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs gap-6 !overflow-visible">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                    Kelayakan <span className="text-emerald-600 dark:text-emerald-400">Terpenuhi</span>{' '}
                    {selectedProdi ? `— ${selectedProdi.name}` : `— ${selectedCampus.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Nilai Anda <strong className="text-slate-800 dark:text-white">{fmt(autoScore)}</strong> telah lolos batas{' '}
                    <strong>Grade Campus {fmt(campusGrade)}</strong>
                    {selectedProdi ? <> dan <strong>{pgRangeFor(selectedProdi)}</strong></> : ''}. Berikut prodi yang layak Anda pilih (Passing Grade ≤ nilai Anda):
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Prodi Sesuai Grade ({eligibleMajors.length} dari {campusMajors.length} prodi)
                </p>
                {eligibleMajors.length === 0 && (
                  <p className="text-sm text-slate-400 py-6 text-center border-2 border-dashed border-slate-200 dark:border-border rounded-2xl">
                    Tidak ada prodi di kampus ini yang passing grade-nya ≤ nilai Anda.
                  </p>
                )}
                {eligibleMajors.map((m, i) => {
                  const inst = state.institutions.find(x => x.id === m.institution_id);
                  return (
                    <div key={m.id} className={cn(
                      'p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-colors',
                      selectedMajorId === m.id
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{m.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <JenjangBadge jenjang={m.jenjang} />
                            <Badge variant="outline" className="rounded-md text-[9px] font-bold h-auto px-1.5 py-0.5 text-slate-500">
                              {m.cluster}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{inst?.name} • {pgRangeFor(m)}</p>
                        </div>
                      </div>
                      <Badge className="rounded-full text-[10px] font-bold h-auto px-2.5 py-1 bg-emerald-500 text-white">
                        ✓ Lolos
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <Button
                  variant={selectedProdi ? 'default' : 'ghost'}
                  disabled={selectedProdi ? state.targetMajorIds.includes(selectedProdi.id) : true}
                  onClick={() => selectedProdi && appStore.addTargetMajor(selectedProdi.id)}
                  className="gap-2"
                >
                  {selectedProdi && state.targetMajorIds.includes(selectedProdi.id)
                    ? <>✓ {selectedProdi.name} Sudah Jadi Target</>
                    : <>Jadikan Prodi Pilihan sebagai Target</>}
                </Button>
              </div>
            </Card>
          );
        }

        const delta = campusGrade != null && campusGrade > autoScore ? Math.round((campusGrade - autoScore) * 10) / 10 : 0;
        return (
          <div className="space-y-8">
            <Card className="p-6 lg:p-8 rounded-3xl ring-0 bg-card border border-rose-200 dark:border-rose-900/60 shadow-xs gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                    Kelayakan <span className="text-rose-500">Belum Terpenuhi</span>{' '}
                    {selectedProdi ? `— ${selectedProdi.name}` : `— ${selectedCampus.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Nilai Anda <strong className="text-slate-800 dark:text-white">{fmt(autoScore)}</strong> masih di bawah{' '}
                    <strong>Grade Campus {fmt(campusGrade)}</strong>
                    {selectedProdi ? <> dan <strong>{pgRangeFor(selectedProdi)}</strong></> : ''}.{' '}
                    {delta > 0 && <>Selisih nilai kurang <strong className="text-rose-500">{delta} poin</strong>. </>}
                    Jangan khawatir — berikut rekomendasi kampus &amp; jurusan yang sesuai dengan nilai Anda.
                  </p>
                </div>
              </div>
            </Card>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Rekomendasi Kampus &amp; Jurusan Alternatif (Grade ≤ {fmt(autoScore)})</h3>
              </div>
              {alternativeCampuses.length === 0 && (
                <Card className="p-8 text-center bg-card border border-slate-100 dark:border-border rounded-3xl">
                  <p className="text-sm text-slate-500">Belum ada kampus lain dengan Grade Campus ≤ nilai Anda. Raih nilai lebih tinggi di tryout berikutnya!</p>
                </Card>
              )}
              <div className="space-y-6">
                {alternativeCampuses.map(({ inst, grade }) => (
                  <Card key={inst.id} className="p-5 rounded-3xl bg-card border border-slate-100 dark:border-border shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-white">{inst.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                        Grade {grade}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jurusan yang realistis:</p>
                      {altMajorsOf(inst.id).map(m => (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-border flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <JenjangBadge jenjang={m.jenjang} />
                              <span className="text-[10px] text-slate-400">{pgRangeFor(m)} • {m.cluster}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => !state.targetMajorIds.includes(m.id) && appStore.addTargetMajor(m.id)}
                            disabled={state.targetMajorIds.includes(m.id)}
                            className="text-[11px] font-bold text-primary h-auto"
                          >
                            {state.targetMajorIds.includes(m.id) ? '✓ Target' : '+ Target'}
                          </Button>
                        </div>
                      ))}
                      {altMajorsOf(inst.id).length === 0 && (
                        <p className="text-xs text-slate-400">Belum ada prodi yang passing grade-nya ≤ nilai Anda di kampus ini.</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={insist}
                  onChange={(e) => setInsist(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  Tetap Pilih Kampus Ini
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-1 pl-8">
                Jika tetap pada pilihan, kami tampilkan <strong>Rekomendasi Bimbel</strong> untuk mengejar selisih{' '}
                {delta > 0 ? `${delta} poin` : 'nilai'} menuju Grade Campus {fmt(campusGrade)}.
              </p>

              {insist && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.tutoringCenters.length === 0 && (
                    <p className="col-span-full text-sm text-slate-500 text-center py-4">Belum ada data bimbel dari database.</p>
                  )}
                  {state.tutoringCenters.map(tc => {
                    const linkUrl = tc.link_url && tc.link_url !== '#' ? tc.link_url : '';
                    const cardBody = (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge className="rounded-full text-[10px] font-bold bg-amber-500 text-white border-0">★ {tc.rating ?? '—'}</Badge>
                            <span className="text-[10px] font-bold text-primary">{tc.price}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white">{tc.name}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{tc.description || ''}</p>
                          {tc.focus_competency_code && (
                            <Badge variant="outline" className="rounded-md text-[10px] font-bold text-slate-500">
                              Fokus: {tc.focus_competency_code}
                            </Badge>
                          )}
                        </div>
                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-border flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-400 truncate">
                            {tc.contact_info ? `Kontak: ${tc.contact_info}` : ''}
                          </span>
                          {linkUrl ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary shrink-0 transition-all group-hover:gap-2.5">
                              <ExternalLink className="w-3.5 h-3.5" />
                              Buka Bimbel
                            </span>
                          ) : null}
                        </div>
                      </>
                    );
                    return linkUrl ? (
                      <a
                        key={tc.id}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col justify-between gap-4 p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                      >
                        {cardBody}
                      </a>
                    ) : (
                      <Card key={tc.id} className="p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex flex-col justify-between gap-0 cursor-default">
                        {cardBody}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};