import React, { useEffect, useState } from 'react';
import { useAppState } from '../../../lib/store';
import { supabase } from '../../../lib/supabaseClient';
import { getMajorsStats, MajorsStats } from '../../../lib/prodiSearch';
import { BookOpen, Target, Award, Building2, GraduationCap, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatNumber } from '@/lib/utils';

export const AdminDashboardView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const state = useAppState();
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [prodiStats, setProdiStats] = useState<MajorsStats | null>(null);

  useEffect(() => {
    supabase.from('utbk_scores').select('*', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) setTotalSubmissions(count);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMajorsStats()
      .then(s => {
        if (!cancelled && s) setProdiStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: 'Total Kampus', value: state.institutions.length, icon: Building2, color: 'text-sky-500', bg: 'bg-sky-500/10', tab: 'admin_campuses' },
    { label: 'Total Prodi', value: prodiStats?.totalProdi ?? state.majors.length, icon: Target, color: 'text-secondary', bg: 'bg-secondary/10', tab: 'admin_majors' },
    { label: 'Total Input Nilai', value: totalSubmissions, icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'admin_results' },
  ];

  const prodiCards = [
    { label: 'Seluruh Program Studi', value: prodiStats?.totalProdi ?? state.majors.length, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Program Studi S1', value: prodiStats?.s1 ?? 0, icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Program Studi D4', value: prodiStats?.d4 ?? 0, icon: Layers, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Program Studi D3', value: prodiStats?.d3 ?? 0, icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Administrator</h2>
        <p className="text-slate-500 dark:text-muted-foreground mt-1">
          Ringkasan sistem Arahku dan akses cepat ke panel manajemen. Data disinkronkan langsung dari database Supabase ({state.institutions.length} kampus, {formatNumber(prodiStats?.totalProdi ?? state.majors.length)} prodi, {state.questions.length} soal penjurusan, {state.tutoringCenters.length} bimbel terdaftar).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              onClick={() => setActiveTab(stat.tab)}
              className="cursor-pointer hover:shadow-md transition-all group ring-0 border border-slate-100 dark:border-border shadow-sm bg-card"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform', stat.bg, stat.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{formatNumber(stat.value)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ringkasan Program Studi (hitung langsung dari query agregasi COUNT) */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
          Statistik Program Studi
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {prodiCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card
                key={i}
                onClick={() => setActiveTab('admin_majors')}
                className="cursor-pointer hover:shadow-md transition-all group ring-0 border border-slate-100 dark:border-border shadow-sm bg-card"
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform', stat.bg, stat.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
                      {prodiStats ? formatNumber(stat.value) : '…'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
