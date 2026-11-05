import React, { useMemo, useState } from 'react';
import { Award, Compass, GraduationCap, Layers, RotateCcw, Sparkles, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ClusterType } from '../../types';
import { RecomBestView } from './RecomBestView';
import { RecomAlternativesView } from './RecomAlternativesView';
import { readPenjurusanResult } from '../../lib/penjurusanResult';

interface RekomendasiViewProps {
  setActiveTab?: (tab: string) => void;
  initialTab?: 'best' | 'alt';
}

type RekomendasiTab = 'best' | 'alt';

const clusterStyle: Record<ClusterType, { label: string; bar: string; badge: string; desc: string }> = {
  Saintek: { label: 'Saintek', bar: 'bg-sky-500', badge: 'bg-sky-500 text-white', desc: 'Senang pada sains & teknologi — cocok untuk rumpun Matematika & IPA (MIPA), Teknik, Kedokteran.' },
  Soshum: { label: 'Soshum', bar: 'bg-amber-500', badge: 'bg-amber-500 text-white', desc: 'Senang pada sosial & humaniora — cocok untuk rumpun Sosial & Humaniora (Soshum).' },
  Campuran: { label: 'Campuran / Multidisiplin', bar: 'bg-violet-500', badge: 'bg-violet-500 text-white', desc: 'Minat seimbang antara sains & sosial — cocok untuk prodi multidisiplin.' },
};

const emptyTally = () => ({ Saintek: 0, Soshum: 0, Campuran: 0 });

const TABS: { id: RekomendasiTab; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'best', label: 'Rekomendasi Prodi Terbaik', desc: 'Prodi yang memenuhi nilai & rumpun minat Anda', icon: Award },
  { id: 'alt', label: 'Institut Alternatif Sesuai Skor', desc: 'Kampus cadangan dengan passing grade aman', icon: Compass },
];

export const RekomendasiView: React.FC<RekomendasiViewProps> = ({ setActiveTab, initialTab = 'best' }) => {
  const [tab, setTab] = useState<RekomendasiTab>(initialTab);
  const target = setActiveTab ?? (() => {});

  const lastResult = useMemo<{ dominant: ClusterType; tally: { Saintek: number; Soshum: number; Campuran: number } } | null>(
    () => readPenjurusanResult(),
  []);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Hasil Tes Penjurusan (agar user tidak perlu balik ke Tes Penjurusan) */}
      {lastResult ? (
        <Card className="w-full p-6 lg:p-8 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md', clusterStyle[lastResult.dominant].badge)}>
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <Badge className="rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground h-auto px-2.5 py-1">Hasil Tes Penjurusan</Badge>
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mt-1">
                Kecenderungan Anda: <span className="text-primary">{clusterStyle[lastResult.dominant].label}</span>
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{clusterStyle[lastResult.dominant].desc}</p>
          <div className="space-y-3">
            {(['Saintek', 'Soshum'] as const).map(c => {
              const n = lastResult.tally[c] ?? 0;
              const grandTotal = (lastResult.tally.Saintek || 0) + (lastResult.tally.Soshum || 0) + (lastResult.tally.Campuran || 0);
              const pct = Math.round((n / (grandTotal || 1)) * 100);
              return (
                <div key={c} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">{c}</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={cn('h-3 rounded-full transition-all duration-700', clusterStyle[c].bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-right text-xs font-black text-slate-700 dark:text-slate-200">{n} poin · {pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setActiveTab?.('tes_minat')} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Ulangi Tes
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="w-full p-8 text-center bg-card border border-amber-200 dark:border-amber-900/60 rounded-3xl">
          <Target className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Belum Ada Hasil Tes Penjurusan</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Kerjakan Tes Minat &amp; Bakat agar rekomendasi prodi disesuaikan dengan rumpun minat Anda.
          </p>
          <Button onClick={() => setActiveTab?.('tes_minat')} className="mt-5 gap-2">
            <Sparkles className="w-4 h-4" /> Ikuti Tes Minat &amp; Bakat
          </Button>
        </Card>
      )}

      {/* Header merged */}
      <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-linear-to-r from-emerald-600 via-teal-700 to-sky-700 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs border-0 text-white hover:bg-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Rekomendasi Terpadu — Nilai Tryout ⊕ Tes Minat &amp; Bakat</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Rekomendasi Prodi &amp; Institut Alternatif</h2>
          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
            Satu halaman untuk melihat <strong>prodi terbaik</strong> yang sesuai nilai dan minat Anda, sekaligus <strong>kampus alternatif</strong> yang passing grade-nya realistis terhadap skor tryout terakhir.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden lg:flex items-center justify-center opacity-10 pointer-events-none pr-6">
          <GraduationCap className="w-72 h-72" />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3',
                isActive
                  ? 'bg-card border-primary/50 dark:border-primary/60 shadow-md ring-1 ring-primary/20'
                  : 'bg-card/50 border-slate-200 dark:border-border hover:border-primary/40 hover:bg-card'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={cn('font-bold text-sm truncate', isActive ? 'text-primary' : 'text-slate-800 dark:text-white')}>{t.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content per tab */}
      {tab === 'best' ? (
        <RecomBestView setActiveTab={target} />
      ) : (
        <RecomAlternativesView setActiveTab={target} />
      )}
    </div>
  );
};