import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, GraduationCap, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { appStore } from '../../lib/store';
import Swal from 'sweetalert2';
import { getErrorMessage, cn } from '../../lib/utils';

export const AuthView: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'nisn'>('email');
  const [email, setEmail] = useState('');
  const [nisn, setNisn] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [remember, setRemember] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: 'login' | 'register' | 'reset') => {
    setMode(newMode);
    setResetSent(false);
    if (newMode === 'register') {
      setEmail('');
      setNisn('');
      setPassword('');
      setFullName('');
      setSchool('');
    } else if (newMode === 'login') {
      setEmail('');
      setNisn('');
      setPassword('');
    } else if (newMode === 'reset') {
      setEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          Swal.fire('Gagal', getErrorMessage(error), 'error');
        } else {
          setResetSent(true);
          setTimeout(() => { setResetSent(false); switchMode('login'); }, 3000);
        }
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              nisn: nisn,
              school: school
            }
          }
        });

        if (error) {
          let msg = getErrorMessage(error);
          if (error.message?.includes('Database error saving new user')) {
            msg = 'Terjadi kesalahan database (Trigger Gagal). Harap pastikan Anda telah menjalankan ulang query DDL SQL (blueprint terbaru) di Supabase agar tabel profiles memiliki kolom nisn & is_profile_complete.';
          } else if (error.message?.includes('User already registered')) {
            msg = 'Email ini sudah terdaftar. Jika sebelumnya Anda gagal register karena error SQL, profil Anda mungkin korup. Tolong gunakan Email yang berbeda.';
          }
          Swal.fire('Gagal Register', msg, 'error');
          setLoading(false);
          return;
        }

        if (data.user) {
          if (!data.session) {
            Swal.fire('Sukses', 'Registrasi berhasil! Silakan login menggunakan email dan password Anda.', 'success');
            switchMode('login');
            setLoading(false);
            return;
          }
        } else {
          Swal.fire('Sukses', 'Registrasi berhasil! Silakan login.', 'success');
          switchMode('login');
          setLoading(false);
          return;
        }

        setLoading(false);
        return;
      }

      let loginEmail = email;
      if (loginMethod === 'nisn') {
        try {
          const { data: profileEmail } = await supabase.rpc('get_email_by_nisn', { p_nisn: nisn });
          loginEmail = profileEmail || `${nisn}@peserta.com`;
        } catch {
          loginEmail = `${nisn}@peserta.com`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      if (error) {
        if (loginMethod === 'nisn') {
          let retryEmail: string | null = null;
          try {
            const syncResult = await supabase.rpc('sync_profile_auth_user', { p_nisn: nisn });
            if (syncResult?.data?.success) {
              // Akun baru diprovisioning saat itu juga (password default dibuat di DB)
              // -> boleh dicoba login ulang dengan password default.
              retryEmail = syncResult.data.email;
            } else if (syncResult?.data?.error?.includes('sudah memiliki akses')) {
              // Akun NISN ini SUDAH pernah login/diganti password sendiri.
              // JANGAN auto-reset password: itu menimpa password pilihan user dan
              // memaksa flag 'must_change_password = true' lagi sehingga user terus
              // diarahkan ganti password setiap login berikutnya.
              Swal.fire(
                'Gagal Login',
                'Password salah. Akun NISN ini sudah pernah login. Gunakan email & password yang sudah Anda buat, atau minta admin mereset password Anda.',
                'warning'
              );
              setLoading(false);
              return;
            }
          } catch {}

          if (retryEmail) {
            const retry = await supabase.auth.signInWithPassword({ email: retryEmail, password: 'Password123' });
            if (!retry.error) {
              setLoading(false);
              return;
            }
          }
        }

        const msg = error.message?.includes('Email not confirmed')
          ? 'Email belum dikonfirmasi. Jalankan SQL Blueprint untuk mengaktifkan Auto-Confirm Email.'
          : getErrorMessage(error);
        Swal.fire('Gagal Login', msg, 'error');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      Swal.fire('Error', getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-xl border border-border p-8 shadow-lg animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/40">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white">
            Arah<span className="text-primary">ku</span>
          </span>
        </div>

        <div className="text-center mb-6 space-y-1">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
            {mode === 'login' && 'Portal Masuk'}
            {mode === 'register' && 'Daftar Akun Baru'}
            {mode === 'reset' && 'Atur Ulang Kata Sandi'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {mode === 'login' && 'Silakan masuk menggunakan kredensial akun Arahku Anda'}
            {mode === 'register' && 'Buat akun siswa Arahku untuk menemukan jurusan & kampus yang cocok'}
            {mode === 'reset' && 'Kami akan mengirimkan tautan reset password ke email Anda'}
          </p>
        </div>

        {resetSent && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-50 text-emerald-700 text-xs text-center font-semibold border border-emerald-200">
            Tautan pemulihan kata sandi telah dikirim ke {email}!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' && (
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                  loginMethod === 'email'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Gunakan Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('nisn')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                  loginMethod === 'nisn'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Gunakan NISN
              </button>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">NISN</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Nomor Induk Siswa Nasional"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-background border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Asal Sekolah (SMA/MA/SMK)</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Contoh: SMAN 3 Bandung"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {loginMethod === 'email' || mode !== 'login' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Email Siswa</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@sekolah.sch.id"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">NISN</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Nomor Induk Siswa Nasional"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-background border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kata Sandi (Password)</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[11px] font-bold p-0 h-auto text-primary hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 pt-1">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span>Remember Login (Ingat Sesi Saya)</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground text-xs font-extrabold shadow-lg shadow-primary/30 transition-all gap-2 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 flex items-center justify-center"
          >
            <span>
              {loading ? 'Memproses...' : (
                mode === 'login' ? 'Masuk ke Dashboard' :
                mode === 'register' ? 'Daftar Akun Siswa Sekarang' :
                'Kirim Link Reset Password'
              )}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 text-xs text-muted-foreground">
          <hr className="mb-6 border-border" />
          {mode === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <button type="button" onClick={() => switchMode('register')} className="font-bold p-0 h-auto text-primary hover:underline cursor-pointer bg-transparent border-none">
                Buat Akun Siswa
              </button>
            </p>
          ) : (
            <p>
              Sudah memiliki akun?{' '}
              <button type="button" onClick={() => switchMode('login')} className="font-bold p-0 h-auto text-primary hover:underline cursor-pointer bg-transparent border-none">
                Masuk (Login)
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
