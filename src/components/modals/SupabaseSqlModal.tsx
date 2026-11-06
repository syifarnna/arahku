import React, { useState } from 'react';
import { Copy, Check, Database, X, Terminal, ShieldCheck, AlertCircle } from 'lucide-react';
import { SUPABASE_SQL_BLUEPRINT } from '../../lib/mockData';
import { appStore, useAppState } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({ isOpen, onClose }) => {
  const state = useAppState();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState((state as any).supabaseUrl || localStorage.getItem('supabase_url') || '');
  const [key, setKey] = useState((state as any).supabaseAnonKey || localStorage.getItem('supabase_anon_key') || '');
  const [enable, setEnable] = useState((state as any).useRealSupabase ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form saat modal dibuka, agar nilai tersimpan dari browser/localStorage
  // tidak tertinggal saat modal dibuka kembali.
  React.useEffect(() => {
    if (!isOpen) return;
    setUrl((state as any).supabaseUrl || localStorage.getItem('supabase_url') || '');
    setKey((state as any).supabaseAnonKey || localStorage.getItem('supabase_anon_key') || '');
    setEnable((state as any).useRealSupabase ?? true);
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_BLUEPRINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    appStore.setSupabaseCfg(url, key, enable);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-4xl max-h-[90vh] flex flex-col rounded-3xl p-0 gap-0 ring-0 bg-card border border-slate-100 dark:border-border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-border flex items-center justify-between bg-slate-50/50 dark:bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-bold text-lg text-slate-800 dark:text-white">
                Supabase SQL Blueprint & Koneksi Database
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Struktur relasi lengkap untuk VPS aaPanel / Cloud Supabase Anda
              </DialogDescription>
            </div>
          </div>
          <DialogClose render={<Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-slate-600" />}>
            <X className="w-5 h-5" />
          </DialogClose>
        </div>

        {/* Modal Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            
            {/* Info Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-bold">Mode Live Demo Siap Pakai</p>
                <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Aplikasi Arahku saat ini berjalan dengan <strong>Local Instant Engine</strong> yang sudah diisi puluhan universitas, passing grade real, dan 7 kompetensi SNBT. Anda tidak wajib mengisi kredensial API untuk mencoba seluruh fitur analisis!
                </p>
              </div>
            </div>

            {/* Supabase Connection Form */}
            <form onSubmit={handleSaveConfig} className="p-5 rounded-2xl border border-slate-200 dark:border-border/80 bg-slate-50/40 dark:bg-card/50 space-y-4">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <span>Konfigurasi API Supabase Client (Opsional)</span>
                {savedSuccess && <Badge variant="outline" className="text-xs text-emerald-500 font-normal ml-2 h-auto animate-bounce bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">✓ Tersimpan!</Badge>}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                    Supabase Project URL
                  </Label>
                  <Input 
                    type="url" 
                    placeholder="https://xyzxyz.supabase.co" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-auto px-3.5 py-2.5 rounded-xl bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                    Supabase Anon Public Key
                  </Label>
                  <Input 
                    type="password" 
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="h-auto px-3.5 py-2.5 rounded-xl bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Switch 
                    checked={enable} 
                    onCheckedChange={(checked) => setEnable(checked)}
                  />
                  <span>Aktifkan query langsung ke Supabase Server</span>
                </label>

                <Button
                  type="submit"
                  className="px-5 py-2 h-auto rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
                >
                  Simpan Kredensial
                </Button>
              </div>
            </form>

            {/* SQL Blueprint Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>SQL Database DDL Blueprint (Supabase PostgreSql)</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopySql}
                  className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-xl bg-slate-100 dark:bg-muted hover:bg-slate-200 dark:hover:bg-muted/80 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Berhasil Disalin!' : 'Salin Semua SQL'}</span>
                </Button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 overflow-x-auto font-mono text-[11px] text-slate-300 leading-relaxed max-h-80">
                <pre>{SUPABASE_SQL_BLUEPRINT}</pre>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="shrink-0">
          <DialogClose render={<Button variant="outline" className="px-6 py-2.5 h-auto rounded-xl text-xs font-semibold" />}>
            Tutup
          </DialogClose>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
