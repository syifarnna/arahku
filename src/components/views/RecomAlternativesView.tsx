import React, { useState } from 'react';
import { Award, Check, Compass, Plus, Sparkles, Target, TrendingUp, ShieldCheck } from 'lucide-react';
import { appStore, useAppState } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface RecomAlternativesViewProps {
  setActiveTab: (tab: string) => void;
}

export const RecomAlternativesView: React.FC<RecomAlternativesViewProps> = ({ setActiveTab }) => {
  const state = useAppState();
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const targetMajorsList = appStore.getTargetMajors();
  const activeTargetMajorId = state.activeTargetMajorId || state.targetMajorIds[0] || null;
  const summary = appStore.getAnalysis(activeTargetMajorId);
  const hasUtbk = appStore.getUtbkLatestScore() != null;

  if (!summary) {
    return (
      <div className="space-y-8 pb-16 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-linear-to-r from-primary to-secondary text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <Badge className="bg-white/20 text-white border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md h-auto px-3 py-1 gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Fitur Inti: Kalkulator Peluang Lolos Alternatif</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Rekomendasi Institut Alternatif Sesuai Skor Anda
            </h2>
          </div>
        </div>
        <div className="p-12 text-center bg-card rounded-3xl border border-slate-100 space-y-4">
          <Compass className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {!hasUtbk
              ? 'Masukkan nilai tryout UTBK Anda lewat tombol "Input Nilai UTBK" di Dashboard agar skor Anda menjadi acuan rekomendasi.'
              : 'Pilih prodi target terlebih dahulu agar sistem dapat menghitung peluang kelulusan & memberikan kampus alternatif yang sesuai pilihan Anda.'}
          </p>
          <div className="flex justify-center">
            <Button onClick={() => setActiveTab(!hasUtbk ? 'dashboard' : 'target_majors')} className="gap-1.5">
              <Target className="w-4 h-4" />
              {!hasUtbk ? 'Input Nilai UTBK' : 'Pilih Prodi Target'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddTarget = (id: number) => {
    appStore.addTargetMajor(id);
    setAddedIds([...addedIds, id]);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Header Info */}
      <div className="p-8 rounded-3xl bg-linear-to-r from-primary to-secondary text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge className="bg-white/20 text-white border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md h-auto px-3 py-1 gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>Fitur Inti: Kalkulator Peluang Lolos Alternatif</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Rekomendasi Institut Alternatif Sesuai Skor Anda
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Skor capaian tryout terakhir Anda adalah <strong className="text-amber-300 font-extrabold text-base">{summary.latest_result.total_score}</strong>. Sistem telah mencocokkan program studi dari PTN ternama lainnya yang passing grade-nya berada di bawah atau setara nilai Anda agar Anda memiliki cadangan pilihan 100% realistis!
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden lg:flex items-center justify-center opacity-10 pointer-events-none pr-6">
          <Target className="w-72 h-72" />
        </div>
      </div>

      {/* Pilih prodi target yang dibandingkan */}
      <Card className="p-4 rounded-2xl bg-card border border-slate-100 dark:border-border shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider shrink-0">
          <Target className="w-4 h-4" />
          <span>Prodi Target Perbandingan:</span>
        </div>
        <select
          value={activeTargetMajorId || ''}
          onChange={(e) => appStore.setActiveTargetMajor(parseInt(e.target.value))}
          className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border border-slate-200 dark:border-border text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-primary cursor-pointer"
        >
          {targetMajorsList.map(m => (
            <option key={m.id} value={m.id}>{m.name} — {m.institution_name} (PG {m.passing_grade_total})</option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400 shrink-0">
          Perbandingan dihitung terhadap <strong className="text-slate-700 dark:text-slate-200">{summary.target_major.name}</strong> (PG {summary.target_major.passing_grade_total})
        </p>
      </Card>

      {/* Alternatives Grid */}
      {summary.alternative_majors.length === 0 ? (
        <Card className="p-8 text-center ring-0 bg-card border border-slate-100 dark:border-border shadow-sm gap-0">
          <p className="text-slate-500 dark:text-muted-foreground">Belum ada alternatif prodi dengan passing grade di bawah skor Anda saat ini ({summary.latest_result.total_score}). Terus tingkatkan skor tryout Anda!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary.alternative_majors.map((altMajor) => {
            const isAlreadyTarget = state.targetMajorIds.includes(altMajor.id);
            const isRecentlyAdded = addedIds.includes(altMajor.id);

            let chanceColor = 'bg-emerald-500 text-white';
            let chanceLabel = 'Aman';
            if (altMajor.chance_percentage < 35) {
              chanceColor = 'bg-rose-500 text-white';
              chanceLabel = 'Sangat Ambisius';
            } else if (altMajor.chance_percentage < 65) {
              chanceColor = 'bg-amber-500 text-white';
              chanceLabel = 'Ambisius';
            } else if (altMajor.chance_percentage < 85) {
              chanceColor = 'bg-teal-500 text-white';
              chanceLabel = 'Kompetitif';
            }

            return (
              <Card key={altMajor.id} className="p-6 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs flex flex-col justify-between hover:shadow-md transition-all group gap-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-bold h-auto px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-card text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border">
                      {altMajor.cluster}
                    </Badge>
                    <Badge className={cn("text-xs font-black h-auto px-3 py-1 rounded-full shadow-xs", chanceColor)}>
                      {altMajor.chance_percentage}% {chanceLabel}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-primary block">{altMajor.institution_name}</span>
                    <h3 className="font-bold text-base text-slate-800 dark:text-white mt-0.5 group-hover:text-primary transition-colors leading-snug">
                      {altMajor.name}
                    </h3>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-card flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Passing Grade Prodi:</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">{altMajor.passing_grade_total}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Surplus Skor Anda:</span>
                      <span className={cn("font-black", altMajor.gap_diff >= 0 ? 'text-emerald-500' : 'text-amber-500')}>
                        {altMajor.gap_diff >= 0 ? '+' : ''}{altMajor.gap_diff} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-border/80">
                  <Button
                    onClick={() => !isAlreadyTarget && handleAddTarget(altMajor.id)}
                    disabled={isAlreadyTarget || isRecentlyAdded}
                    className={cn(
                      "w-full py-3 px-4 h-auto rounded-2xl text-xs font-bold gap-2",
                      (isAlreadyTarget || isRecentlyAdded)
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-50'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                    )}
                  >
                    {isAlreadyTarget || isRecentlyAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Masuk Daftar Target Anda</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>+ Jadikan Target Cadangan</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
