import React, { useMemo } from 'react';
import { Award, CheckCircle2, Compass, Layers, Plus, Sparkles, Target, TrendingUp, XCircle } from 'lucide-react';
import { appStore, useAppState } from '../../lib/store';
import { ClusterType } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { JenjangBadge } from '@/components/ui/JenjangBadge';
import { readPenjurusanResult } from '../../lib/penjurusanResult';
import { buildProdiPgRanges } from '../../lib/pgRange';
import { normalizeProdiKey } from '../../lib/prodiName';

const clusterStyle: Record<ClusterType, { label: string; badge: string }> = {
  Saintek: { label: 'Saintek', badge: 'bg-sky-500 text-white' },
  Soshum: { label: 'Soshum', badge: 'bg-amber-500 text-white' },
  Campuran: { label: 'Multidisiplin', badge: 'bg-violet-500 text-white' },
};

// Rumpun prodi dianggap cocok jika: minat Campuran (semua ok), prodi Campuran (multidisiplin), atau sama persis.
const isRumpunMatch = (majorCluster: string, interest: ClusterType): boolean => {
  if (interest === 'Campuran') return true;
  if (majorCluster === 'Campuran') return true;
  return majorCluster === interest;
};

const RANK_TOP = 8;
const RANK_ALT = 6;

export const RecomBestView: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const state = useAppState();

  const autoScore = appStore.getUtbkLatestScore();
  const lastResult = useMemo<{ dominant: ClusterType; tally: { Saintek: number; Soshum: number; Campuran: number } } | null>(
    () => readPenjurusanResult(),
  []);
  // Fallback: jika user belum menyimpan minat, pakai hasil tes penjurusan (jika ada).
  const interest = state.profile.major_interest ?? lastResult?.dominant ?? null;

  const prodiPgRanges = useMemo(() => buildProdiPgRanges(state.majors), [state.majors]);

  const pgRangeFor = (m: (typeof state.majors)[number]) => {
    const range = prodiPgRanges.get(normalizeProdiKey(m.name));
    const pg = m.passing_grade_total;
    if (!range) return `PG ${pg ?? '—'}`;
    const min = Math.min(range.min, pg ?? range.min);
    const max = Math.max(range.max, pg ?? range.max);
    return min === max ? `PG ${min}` : `PG ${min}–${max}`;
  };

  const { tier1, tier2, tier3, totalReachable } = useMemo(() => {
    if (autoScore == null || !interest) return { tier1: [] as typeof state.majors, tier2: [] as typeof state.majors, tier3: [] as typeof state.majors, totalReachable: 0 };
    // Zona Aman: skor >= PG
    const safe = state.majors.filter(m => m.passing_grade_total != null && m.passing_grade_total > 0 && autoScore >= m.passing_grade_total);
    // Zona Kompetitif: 97% <= skor/PG < 100%
    const competitive = state.majors.filter(m => {
      if (!m.passing_grade_total || m.passing_grade_total <= 0) return false;
      const r = autoScore / m.passing_grade_total;
      return r >= 0.97 && r < 1.0;
    });
    // Zona Ambisius: 90% <= skor/PG < 97%
    const ambitious = state.majors.filter(m => {
      if (!m.passing_grade_total || m.passing_grade_total <= 0) return false;
      const r = autoScore / m.passing_grade_total;
      return r >= 0.90 && r < 0.97;
    });
    const byGradeDesc = (a: typeof state.majors[0], b: typeof state.majors[0]) => (b.passing_grade_total || 0) - (a.passing_grade_total || 0);
    const matchFilter = (list: typeof state.majors) => list.filter(m => isRumpunMatch(m.cluster, interest as ClusterType));
    const t1 = matchFilter(safe).sort(byGradeDesc).slice(0, RANK_TOP);
    const t2 = competitive.filter(m => !isRumpunMatch(m.cluster, interest as ClusterType)).sort(byGradeDesc).slice(0, RANK_ALT);
    const t3 = matchFilter(ambitious).sort(byGradeDesc).slice(0, RANK_ALT);
    return { tier1: t1, tier2: t2, tier3: t3, totalReachable: safe.length + competitive.length + ambitious.length };
  }, [state.majors, autoScore, interest]);

  const campusName = (id: number) => state.institutions.find(i => i.id === id)?.name || '—';

  const fmt = (n?: number | null) => n == null ? '—' : n;

  const renderProdiRow = (m: typeof state.majors[0], rank: number, type: 'best' | 'alt') => (
    <div key={m.id} className={cn(
      'p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-colors',
      type === 'best'
        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-border'
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0',
          type === 'best' ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-white'
        )}>
          {rank}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{m.name}</p>
          <p className="text-[11px] text-slate-400 truncate">
            {campusName(m.institution_id)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={cn('rounded-md text-[10px] font-bold border-0', clusterStyle[m.cluster as ClusterType]?.badge || 'bg-primary')}>
          {m.cluster}
        </Badge>
        <JenjangBadge jenjang={m.jenjang} />
        <Badge variant="outline" className="rounded-md text-[10px] font-bold">
          {pgRangeFor(m)}
        </Badge>
        <Badge className="rounded-full text-[9px] font-bold h-auto px-2 py-0.5 bg-emerald-500 text-white">
          ✓ Nilai Cukup
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => !state.targetMajorIds.includes(m.id) && appStore.addTargetMajor(m.id)}
          disabled={state.targetMajorIds.includes(m.id)}
          className="text-[11px] font-bold text-primary h-auto"
        >
          {state.targetMajorIds.includes(m.id) ? '✓ Target' : <><Plus className="w-3.5 h-3.5" /> Target</>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Ringkasan sinyal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai UTBK</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{autoScore != null ? autoScore : '—'}</p>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rumpun Minat</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5 truncate">
              {interest ? clusterStyle[interest].label : <span className="text-amber-500 text-sm font-bold">Belum disimpan</span>}
            </p>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prodi Nilai Cukup</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{totalReachable}</p>
          </div>
        </Card>
      </div>

      {/* Panduan jika sinyal belum lengkap */}
      {autoScore == null && (
        <Card className="p-8 text-center bg-card border border-amber-200 dark:border-amber-900/60 rounded-3xl">
          <XCircle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Nilai UTBK Belum Diinput</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Masukkan nilai tryout UTBK Anda lewat tombol <strong>Input Nilai UTBK</strong> di Dashboard agar sistem dapat menghitung peluang lolos secara otomatis.
          </p>
          <Button onClick={() => setActiveTab?.('dashboard')} className="mt-5 gap-2">
            <Target className="w-4 h-4" /> Input Nilai UTBK
          </Button>
        </Card>
      )}

      {autoScore != null && !interest && (
        <Card className="p-8 text-center bg-card border border-amber-200 dark:border-amber-900/60 rounded-3xl">
          <Compass className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Minat Rumpun Belum Disimpan</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Kerjakan <strong>Tes Minat dan Bakat</strong>, lalu klik <strong>"Simpan sebagai Minat Saya"</strong> pada hasilnya. Minat tidak tersimpan otomatis — hanya saat Anda sengaja menyimpannya.
          </p>
          <Button onClick={() => setActiveTab?.('tes_minat')} className="mt-5 gap-2" variant="outline">
            <Sparkles className="w-4 h-4" /> Ikuti Tes Minat &amp; Bakat
          </Button>
        </Card>
      )}

      {/* Rekomendasi terintegrasi */}
      {autoScore != null && interest && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                Paling Relevan — Rumpun {clusterStyle[interest].label} &amp; Nilai Terpenuhi ({tier1.length})
              </h3>
            </div>
            {tier1.length === 0 && (
              <Card className="p-6 text-center bg-card border border-slate-100 dark:border-border rounded-2xl">
                <p className="text-sm text-slate-500">
                  Belum ada prodi rumpun <strong>{clusterStyle[interest].label}</strong> dengan passing grade ≤ {autoScore}.
                </p>
              </Card>
            )}
            <div className="space-y-2">
              {tier1.map((m, i) => renderProdiRow(m, i + 1, 'best'))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-slate-400" />
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                Alternatif — Kompetitif, Nilai Mendekati Passing Grade ({tier2.length})
              </h3>
            </div>
            {tier2.length === 0 ? (
              <Card className="p-6 text-center bg-card border border-slate-100 dark:border-border rounded-2xl">
                <p className="text-sm text-slate-500">Belum ada prodi alternatif di zona kompetitif untuk nilai Anda.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {tier2.map((m, i) => renderProdiRow(m, i + 1, 'alt'))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                Zona Ambisius — Rumpun {clusterStyle[interest].label} &amp; Nilai Mendekati Passing Grade ({tier3.length})
              </h3>
            </div>
            {tier3.length === 0 ? (
              <Card className="p-6 text-center bg-card border border-slate-100 dark:border-border rounded-2xl">
                <p className="text-sm text-slate-500">Belum ada prodi rumpun <strong>{clusterStyle[interest].label}</strong> di zona ambisius untuk nilai Anda.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {tier3.map((m, i) => renderProdiRow(m, i + 1, 'alt'))}
              </div>
            )}
          </div>

          <Card className="p-5 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex flex-wrap items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300 flex-1 min-w-[240px]">
              Rekomendasi diurutkan dari yang paling relevan: <strong>rumpun {clusterStyle[interest].label}</strong> dengan passing grade ≤ nilai Anda (zona Aman), lalu prodi rumpun lain / nilai mendekati passing grade Anda (zona Kompetitif &amp; Ambisius) yang masih terjangkau.
            </p>
            <Button variant="outline" size="sm" onClick={() => setActiveTab?.('recom_alternatives')} className="gap-2 text-[11px] font-bold">
              Lihat Rekomendasi Alternatif Lengkap
            </Button>
          </Card>
        </>
      )}
    </div>
  );
};