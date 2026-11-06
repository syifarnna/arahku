import React, { useState, useEffect } from 'react';
import { Copy, Check, Database, Terminal, ShieldCheck, Key, ExternalLink, Sparkles, Server, Activity, AlertCircle, Save } from 'lucide-react';
import { SUPABASE_SQL_BLUEPRINT } from '../../lib/mockData';
import Swal from 'sweetalert2';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SupabaseSqlView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('ddl');
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  
  useEffect(() => {
    setUrl(localStorage.getItem('supabase_url') || '');
    setAnonKey(localStorage.getItem('supabase_anon_key') || '');
  }, []);

  const handleSaveCredentials = () => {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', anonKey);
    Swal.fire({
      title: 'Berhasil Disimpan',
      text: 'Kredensial Supabase berhasil disimpan di browser. Halaman akan dimuat ulang.',
      icon: 'success',
      timer: 2000
    }).then(() => {
      window.location.reload();
    });
  };

  const seedSql = `-- ==========================================
-- SEED DATA AWAL ARAHKU (PTN & PRODI SNBT)
-- ==========================================

-- 1. Insert Kompetensi Dasar SNBT
INSERT INTO competencies (code, name, description, weight) VALUES
('PU', 'Penalaran Umum', 'Kemampuan memecahkan masalah baru dengan logika rasional', 1.0),
('PPU', 'Pengetahuan & Pemahaman Umum', 'Kemampuan memahami kaidah dasar informasi & kebahasaan', 1.0),
('PBM', 'Kemampuan Memahami Bacaan', 'Kemampuan membaca teks kompleks dan menarik kesimpulan kritis', 1.0),
('PK', 'Pengetahuan Kuantitatif', 'Kemampuan berhitung, aljabar, geometri, dan statistika dasar', 1.2),
('LBI', 'Literasi Bahasa Indonesia', 'Kemampuan memahami & merefleksikan teks berbahasa Indonesia', 1.0),
('LBE', 'Literasi Bahasa Inggris', 'Kemampuan memahami esai akademis berbahasa Inggris', 1.1),
('PM', 'Penalaran Matematika', 'Kemampuan menganalisis masalah kontekstual kehidupan nyata', 1.3)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Universitas Terkemuka
INSERT INTO institutions (id, name, type) VALUES
(101, 'Institut Teknologi Bandung (ITB)', 'PTN'),
(102, 'Universitas Indonesia (UI)', 'PTN'),
(103, 'Universitas Gadjah Mada (UGM)', 'PTN'),
(104, 'Institut Teknologi Sepuluh Nopember (ITS)', 'PTN'),
(107, 'Universitas Brawijaya (UB)', 'PTN')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Program Studi Unggulan
INSERT INTO majors (id, institution_id, name, cluster, passing_grade_total) VALUES
(1, 101, 'STEI - Komputasi', 'Saintek', 738.5),
(5, 102, 'Pendidikan Dokter', 'Saintek', 754.2),
(6, 102, 'Ilmu Hukum', 'Soshum', 708.5),
(9, 103, 'Teknologi Informasi', 'Saintek', 722.0),
(13, 104, 'Teknik Informatika', 'Saintek', 716.0)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Master Tryouts Nasional
INSERT INTO tryouts (id, name, date, type, duration_minutes, question_count, status) VALUES
(1, 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 1', '2026-05-10', 'UTBK SNBT', 195, 155, 'Selesai'),
(2, 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 2', '2026-06-15', 'UTBK SNBT', 195, 155, 'Selesai'),
(3, 'Tryout Intensif Kedinasan STAN & STIS 2026', '2026-06-20', 'Ujian Kedinasan', 120, 100, 'Tersedia')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Master Tryouts Nasional
INSERT INTO tryouts (id, name, date, type, duration_minutes, question_count, status) VALUES
(1, 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 1', '2026-05-10', 'UTBK SNBT', 195, 155, 'Selesai'),
(2, 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 2', '2026-06-15', 'UTBK SNBT', 195, 155, 'Selesai'),
(3, 'Tryout Intensif Kedinasan STAN & STIS 2026', '2026-06-20', 'Ujian Kedinasan', 120, 100, 'Tersedia')
ON CONFLICT (id) DO NOTHING;
`;

  const handleCopy = () => {
    let textToCopy = '';
    if (activeSubTab === 'ddl') textToCopy = SUPABASE_SQL_BLUEPRINT;
    else if (activeSubTab === 'seed') textToCopy = seedSql;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Database Setup & Konfigurasi
          </h2>
          <p className="text-slate-500 dark:text-muted-foreground mt-1">Salin SQL Editor Blueprint ini ke proyek Supabase Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl ring-0 bg-card border border-slate-200 dark:border-border p-6 shadow-sm gap-4">
            <CardTitle className="font-bold text-slate-800 dark:text-white">Panduan Implementasi Supabase</CardTitle>
            <ol className="space-y-4 text-sm text-slate-600 dark:text-muted-foreground list-decimal pl-4">
              <li>Buka dashboard Supabase.com dan buat proyek baru</li>
              <li>Buka menu <strong className="text-slate-800 dark:text-slate-200">SQL Editor</strong> di sidebar kiri</li>
              <li>Salin kode DDL Table Schema & RLS, lalu jalankan.</li>
              <li>Salin kode Dummy Seed Data, lalu jalankan.</li>
              <li>Buka menu <strong>Authentication</strong> &gt; Providers &gt; Email. Pastikan diaktifkan.</li>
              <li>Salin <strong>URL</strong> & <strong>Anon Key</strong> ke file <code>.env</code> di root folder project ini.</li>
            </ol>
            
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
              <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                Input Koneksi (Browser Only)
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-500/80 mb-4">
                Karena ini aplikasi preview AI Studio, Anda dapat memasukkan URL dan Anon Key di sini (tersimpan secara lokal di browser Anda).
              </p>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Supabase URL</Label>
                  <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="h-auto px-3 py-2 bg-white dark:bg-muted border-slate-200 dark:border-border rounded-lg text-sm text-slate-800 dark:text-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Anon Key</Label>
                  <Input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp..."
                    className="h-auto px-3 py-2 bg-white dark:bg-muted border-slate-200 dark:border-border rounded-lg text-sm text-slate-800 dark:text-white focus:border-primary"
                  />
                </div>
                <Button
                  onClick={handleSaveCredentials}
                  className="w-full py-2 h-auto bg-primary hover:bg-secondary/90 text-white rounded-lg text-sm font-bold gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan Kredensial
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="rounded-2xl ring-0 bg-card border border-slate-200 dark:border-border overflow-hidden shadow-sm flex flex-col h-full gap-0">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <TabsList className="border-b border-slate-100 dark:border-border bg-slate-50 dark:bg-card rounded-none p-0 h-auto w-full justify-start">
                <TabsTrigger value="ddl" className="px-6 py-4 text-sm font-bold whitespace-nowrap rounded-none data-active:border-b-2 data-active:border-primary data-active:text-primary data-active:bg-transparent gap-2">
                  <Terminal className="w-4 h-4" />
                  1. Table Schema & RLS
                </TabsTrigger>
                <TabsTrigger value="seed" className="px-6 py-4 text-sm font-bold whitespace-nowrap rounded-none data-active:border-b-2 data-active:border-primary data-active:text-primary data-active:bg-transparent gap-2">
                  <Database className="w-4 h-4" />
                  2. Master Seed Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ddl" className="mt-0">
                <div className="p-4 bg-slate-900 relative min-h-[400px]">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="px-4 py-2 h-auto bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold gap-2 border border-slate-700 shadow-lg"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Tersalin!' : 'Copy SQL'}
                    </Button>
                  </div>
                  <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap pt-10 h-[500px] overflow-y-auto w-full custom-scrollbar leading-relaxed">
                    {SUPABASE_SQL_BLUEPRINT}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="seed" className="mt-0">
                <div className="p-4 bg-slate-900 relative min-h-[400px]">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="px-4 py-2 h-auto bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold gap-2 border border-slate-700 shadow-lg"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Tersalin!' : 'Copy SQL'}
                    </Button>
                  </div>
                  <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap pt-10 h-[500px] overflow-y-auto w-full custom-scrollbar leading-relaxed">
                    {seedSql}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};
