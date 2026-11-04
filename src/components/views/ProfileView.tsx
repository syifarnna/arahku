import React, { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { appStore, useAppState } from '../../lib/store';
import { ClusterType } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ProfileView: React.FC = () => {
  const state = useAppState();
  
  const [name, setName] = useState(state.profile.full_name || '');
  const [nisn, setNisn] = useState(state.profile.nisn || '');
  const [email, setEmail] = useState(state.profile.email || '');
  const [phone, setPhone] = useState(state.profile.phone || '');
  const [school, setSchool] = useState(state.profile.school || '');
  const [interest, setInterest] = useState<ClusterType>(state.profile.major_interest || 'Saintek');
  const [avatar, setAvatar] = useState(state.profile.avatar_url || '');

  const [pwd, setPwd] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    appStore.updateProfile({
      full_name: name,
      nisn,
      email,
      phone,
      school,
      major_interest: interest,
      avatar_url: avatar,
      is_profile_complete: true
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-8 pb-16 animate-in fade-in duration-300">
      
      <div className="border-b border-slate-100 dark:border-border pb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pengaturan Profil Siswa TryoutKu</h2>
        <p className="text-xs text-slate-400 mt-0.5">Kelola identitas peserta tryout dan preferensi rumpun minat jurusan</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs gap-8">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-border">
            <div className="relative">
              <img 
                src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'User'}`} 
                alt={name || 'User'} 
                className="w-20 h-20 rounded-full object-cover border-4 border-indigo-50 dark:border-indigo-950 shadow-md"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Foto Profil Siswa</Label>
              <Input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="h-auto px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs focus:border-primary"
              />
              <p className="text-[10px] text-slate-400">Gunakan tautan gambar JPG/PNG langsung</p>
            </div>
          </div>

          {/* Biodata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lengkap Siswa</Label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white font-semibold focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">NISN / Nomor Peserta</Label>
              <Input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomor WhatsApp / HP</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Asal Sekolah SMA/SMK</Label>
              <Input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rumpun Minat Jurusan</Label>
              <Select value={interest} onValueChange={(v) => setInterest(v as ClusterType)}>
                <SelectTrigger className="w-full h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs font-bold text-primary focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saintek">Saintek (IPA / Komputasi / Medis)</SelectItem>
                  <SelectItem value="Soshum">Soshum (IPS / Hukum / Bisnis)</SelectItem>
                  <SelectItem value="Campuran">Campuran / Kedinasan STAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Change password */}
          <div className="pt-4 border-t border-slate-100 dark:border-border space-y-3">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Ubah Kata Sandi (Password) Baru</span>
            </h4>
            <Input
              type="password"
              placeholder="Ketik password baru jika ingin mengubah..."
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="max-w-md w-full h-auto px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-card border-slate-200 dark:border-border text-xs text-slate-800 dark:text-white focus:border-primary"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-500 font-semibold">{saved ? '✓ Profil Berhasil Disimpan!' : ''}</span>
            <Button
              type="submit"
              className={cn(
                "px-8 py-3 h-auto rounded-2xl text-xs font-bold shadow-lg shadow-primary/30 gap-2",
                "bg-primary text-white hover:bg-primary/90"
              )}
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>

        </Card>
      </form>

    </div>
  );
};
