import React, { useState, useMemo } from 'react';
import { Calendar, Download, FileSpreadsheet, FileText, Filter, Printer } from 'lucide-react';
import { useAppState, toTryoutResultFromUtbkScore } from '../../lib/store';
import { exportAnalysisPDF, exportResultsExcel, exportResultsPDF } from '../../lib/exportUtils';
import { appStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ReportsView: React.FC = () => {
  const state = useAppState();
  const [filterPeriod, setFilterPeriod] = useState('semua');

  const summary = appStore.getAnalysis();

  // Hasil "Kerjakan Tryout" tidak lagi direkam; riwayat nilai diturunkan dari
  // utbk_scores (sumber nilai tunggal terbaru milik user).
  const results = useMemo(
    () => state.utbkScores.map(s => toTryoutResultFromUtbkScore(s, state.profile.id)),
    [state.utbkScores, state.profile.id]
  );

  const filteredResults = useMemo(() => {
    if (filterPeriod === 'semua') return results;
    const nowMonth = new Date().getMonth();
    return results.filter(r => new Date(r.created_at).getMonth() === nowMonth);
  }, [results, filterPeriod]);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div className="border-b border-slate-100 dark:border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modul Laporan Eksekutif Arahku</h2>
          <p className="text-xs text-slate-400 mt-0.5">Unduh berkas resmi PDF & Excel untuk evaluasi orang tua atau guru sekolah</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-auto h-auto px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-card border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Periode Tryout</SelectItem>
              <SelectItem value="bulan_ini">Pelaksanaan Bulan Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Types Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Laporan Hasil Tryout */}
        <Card className="p-6 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs flex flex-col justify-between gap-0">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-500">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-white">Laporan Hasil Tryout (PDF)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Rekap nilai total IRT beserta predikat capaian siswa.</p>
          </div>
          <Button
            onClick={() => exportResultsPDF(filteredResults, state.profile.full_name)}
            disabled={filteredResults.length === 0}
            className="mt-6 w-full py-2.5 h-auto rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </Card>

        {/* Laporan Analisis Passing Grade */}
        <Card className="p-6 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs flex flex-col justify-between gap-0">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-white">Laporan Analisis Target (PDF)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Komparasi passing grade prodi pilihan dan gap analysis subtes.</p>
          </div>
          <Button
            onClick={() => summary && exportAnalysisPDF(summary, state.profile.full_name)}
            disabled={!summary}
            className="mt-6 w-full py-2.5 h-auto rounded-xl text-white text-xs font-bold shadow-xs gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Unduh Analisis PDF
          </Button>
        </Card>

        {/* Laporan Perkembangan Excel */}
        <Card className="p-6 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs flex flex-col justify-between gap-0">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-800 dark:text-white">Rekapitulasi Nilai (Excel)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Data mentah rincian skor PU, PPU, PK, PM untuk diolah lanjut.</p>
          </div>
          <Button
            onClick={() => exportResultsExcel(filteredResults, state.profile.full_name)}
            disabled={filteredResults.length === 0}
            className="mt-6 w-full py-2.5 h-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Excel (.xlsx)
          </Button>
        </Card>

      </div>

    </div>
  );
};
