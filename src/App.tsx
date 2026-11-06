/**
 * @license Arahku - Sneat Bootstrap Admin Platform
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAppState } from './lib/store';
import { Tryout } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SupabaseSqlModal } from './components/modals/SupabaseSqlModal';
import { TakeTryoutModal } from './components/modals/TakeTryoutModal';
import { AuthView } from './components/views/AuthView';
import { TooltipProvider } from './components/ui/tooltip';

type ViewModule = Record<string, React.ComponentType<any>>;

function lazyView<N extends keyof ViewModule>(
  importFn: () => Promise<Record<string, React.ComponentType<any>>>,
  name: N
) {
  return lazy(() => importFn().then((m) => ({ default: m[name] as React.ComponentType<any> })));
}

const DashboardView = lazyView(() => import('./components/views/DashboardView'), 'DashboardView');
const TryoutsView = lazyView(() => import('./components/views/TryoutsView'), 'TryoutsView');
const TargetMajorsView = lazyView(() => import('./components/views/TargetMajorsView'), 'TargetMajorsView');
const UniversitasProdiView = lazyView(() => import('./components/views/UniversitasProdiView'), 'UniversitasProdiView');
const RekomendasiView = lazyView(() => import('./components/views/RekomendasiView'), 'RekomendasiView');
const ReportsView = lazyView(() => import('./components/views/ReportsView'), 'ReportsView');
const ProfileView = lazyView(() => import('./components/views/ProfileView'), 'ProfileView');
const SupabaseSqlView = lazyView(() => import('./components/views/SupabaseSqlView'), 'SupabaseSqlView');
const ChangePasswordView = lazyView(() => import('./components/views/ChangePasswordView'), 'ChangePasswordView');

const AdminDashboardView = lazyView(() => import('./components/views/admin/AdminDashboardView'), 'AdminDashboardView');

const AdminMajorsView = lazyView(() => import('./components/views/admin/AdminMajorsView'), 'AdminMajorsView');
const AdminCampusesView = lazyView(() => import('./components/views/admin/AdminCampusesView'), 'AdminCampusesView');
const AdminQuestionsView = lazyView(() => import('./components/views/admin/AdminQuestionsView'), 'AdminQuestionsView');
const AdminResultsView = lazyView(() => import('./components/views/admin/AdminResultsView'), 'AdminResultsView');
const AdminUsersView = lazyView(() => import('./components/views/admin/AdminUsersView'), 'AdminUsersView');
const MantepView = lazyView(() => import('./components/views/MantepView'), 'MantepView');
const BingungView = lazyView(() => import('./components/views/BingungView'), 'BingungView');

export default function App() {
  const state = useAppState();
  
  // ---------------------------------------------------------------------------
  // Hash-based routing: URL (window.location.hash) adalah sumber kebenaran untuk
  // tab aktif. Saat reload, halaman dibaca dari hash sehingga pengguna tetap
  // berada di halaman yang sedang dibuka (bukan reset ke dashboard).
  // ---------------------------------------------------------------------------

  const TAB_HASH: Record<string, string> = {
    dashboard: 'dashboard',

    admin_majors: 'admin/majors',
    admin_campuses: 'admin/campuses',
    admin_questions: 'admin/questions',
    admin_results: 'admin/results',
    admin_users: 'admin/users',
    analisis_tryout: 'analisis',
    tes_minat: 'tes-minat',
    results: 'results',
    target_majors: 'target',
    rekomendasi: 'rekomendasi',
    recom_integrated: 'rekomendasi',
    recom_alternatives: 'rekomendasi/alternatif',
    browse_universitas: 'kampus',
    reports: 'laporan',
    profile: 'profil',
    supabase_cfg: 'supabase-sql',
  };

  const hashToTab = (hash: string): string => {
    const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    // Sub-routing campus detail (#/kampus/:id) -> tetap tab browse_universitas
    if (path.startsWith('kampus/') || path === 'kampus') return 'browse_universitas';
    if (path.startsWith('rekomendasi/alternatif')) return 'recom_alternatives';
    if (path.startsWith('rekomendasi')) return 'rekomendasi';
    const entry = Object.entries(TAB_HASH).find(([, h]) => h === path);
    return entry ? entry[0] : 'dashboard';
  };

  const initialTab = () => {
    if (typeof window !== 'undefined') {
      return hashToTab(window.location.hash);
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabRaw] = useState<string>(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
      if (localStorage.getItem('arahku_theme_dark') == null) {
        const old = localStorage.getItem('tryoutku_theme_dark');
        if (old != null) {
          localStorage.setItem('arahku_theme_dark', old);
          localStorage.removeItem('tryoutku_theme_dark');
        }
      }
    } catch {}
    return localStorage.getItem('arahku_theme_dark') === 'true';
    }
    return false;
  });
  const [activeTryoutModal, setActiveTryoutModal] = useState<Tryout | null>(null);

  // Sinkronkan tab -> URL saat navigasi terjadi (sidebar/navbar/dalam halaman).
  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab);
    const hashTarget = TAB_HASH[tab];
    if (hashTarget && typeof window !== 'undefined') {
      // Jangan timpa hash campus-detail ketika sudah berada di dalamnya.
      const currentPath = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
      if (tab === 'browse_universitas' && (currentPath === 'kampus' || currentPath.startsWith('kampus/'))) {
        return;
      }
      if (currentPath !== hashTarget) {
        window.location.hash = `#/${hashTarget}`;
      }
    }
  };

  // Tolak perubahan hash eksternal (back/forward browser atau klik hash lain)
  // kembali ke state tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHash = () => setActiveTabRaw(hashToTab(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('arahku_theme_dark', String(val));
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleOpenSqlModal = () => setIsSqlModalOpen(true);
    window.addEventListener('open-sql-modal', handleOpenSqlModal);
    return () => window.removeEventListener('open-sql-modal', handleOpenSqlModal);
  }, []);

  if (!state.authChecked) {
    // Auth masih dicek (token/session dipulihkan dari Supabase). Jangan langsung
    // me-render AuthView: bisa flash login walau sesi valid, atau mengarahkan ke
    // dashboard sebelum state halaman ter-restore.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Memeriksa sesi Anda…</p>
        </div>
      </div>
    );
  }

  if (!state.isLoggedIn) {
    return (
      <TooltipProvider>
        <AuthView />
        <SupabaseSqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
      </TooltipProvider>
    );
  }

  const isProfileComplete = state.profile.is_profile_complete;
  const mustChangePassword = state.profile.must_change_password;

  const handleTakeTryout = (tryout: Tryout) => {
    setActiveTryoutModal(tryout);
  };

  const renderActiveView = () => {
    if (mustChangePassword) {
      return <ChangePasswordView />;
    }
    if (!isProfileComplete) {
      return (
        <div className="pt-8 animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500">Lengkapi Data Diri Anda</h4>
              <p className="text-xs text-amber-700 dark:text-amber-600">Sebelum memulai tryout, pastikan seluruh data diri dan NISN Anda telah terisi dengan benar.</p>
            </div>
          </div>
          <ProfileView />
        </div>
      );
    }
    if (state.profile.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboardView setActiveTab={setActiveTab} />;
        case 'admin_majors':
          return <AdminMajorsView />;
        case 'admin_campuses':
          return <AdminCampusesView setActiveTab={setActiveTab} />;
        case 'admin_questions':
          return <AdminQuestionsView />;
        case 'admin_results':
          return <AdminResultsView />;
        case 'admin_users':
          return <AdminUsersView />;
        case 'profile':
          return <ProfileView />;
        case 'supabase_cfg':
          return <SupabaseSqlView />;
        default:
          return <AdminDashboardView setActiveTab={setActiveTab} />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onTakeTryout={handleTakeTryout} setActiveTab={setActiveTab} />;
      case 'analisis_tryout':
        return <MantepView setActiveTab={setActiveTab} />;
      case 'tes_minat':
        return <BingungView setActiveTab={setActiveTab} />;
      case 'results':
        return <TryoutsView key="results" onTakeTryout={handleTakeTryout} />;
      case 'target_majors':
        return <TargetMajorsView />;
      case 'rekomendasi':
      case 'recom_integrated':
      case 'recom_alternatives':
        return <RekomendasiView key={activeTab} setActiveTab={setActiveTab} initialTab={activeTab === 'recom_alternatives' ? 'alt' : 'best'} />;
      case 'browse_universitas':
        return <UniversitasProdiView />;
      case 'reports':
        return <ReportsView />;
      case 'profile':
        return <ProfileView />;
      case 'supabase_cfg':
        if (state.profile.role !== 'admin') {
          return (
            <div className="p-8 text-center bg-card dark:bg-card rounded-2xl border border-border space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
                🔒
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Akses Khusus Administrator</h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground leading-relaxed">
                Akun Anda bertindak sebagai <span className="font-bold text-indigo-600 dark:text-indigo-400">Peserta</span>. Hak pengubahan skema SQL, eksekusi DDL, maupun konfigurasi koneksi Live Supabase dibatasi hanya untuk Administrator.
              </p>
              <button onClick={() => setActiveTab('dashboard')} className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all cursor-pointer">
                Kembali ke Dashboard
              </button>
            </div>
          );
        }
        return <SupabaseSqlView />;
      default:
        return <DashboardView onTakeTryout={handleTakeTryout} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <TooltipProvider>
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-background text-foreground' : 'bg-background text-foreground'} font-sans selection:bg-primary selection:text-primary-foreground flex transition-colors duration-200`}>
      
      {/* Sneat Admin Sidebar */}
      {isProfileComplete && !mustChangePassword && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          onOpenSqlModal={() => setActiveTab('supabase_cfg')}
        />
      )}

      {/* Main Page Layout Container */}
      <div className={`flex-1 ${(isProfileComplete && !mustChangePassword) ? 'lg:pl-64' : ''} flex flex-col min-w-0`}>
        
        {/* Top Sticky Navbar */}
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSqlModal={() => setActiveTab('supabase_cfg')}
          isDarkMode={isDarkMode}
          setIsDarkMode={handleSetDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-32">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          }>
            {renderActiveView()}
          </Suspense>
        </main>

        {/* Minimalist Footer */}
        <Footer />

      </div>

      {/* Modals */}
      <SupabaseSqlModal 
        isOpen={isSqlModalOpen} 
        onClose={() => setIsSqlModalOpen(false)} 
      />

      <TakeTryoutModal 
        tryout={activeTryoutModal} 
        isOpen={!!activeTryoutModal} 
        onClose={() => setActiveTryoutModal(null)}
        onFinished={() => {
          setActiveTryoutModal(null);
          setActiveTab('dashboard');
        }}
      />

    </div>
    </TooltipProvider>
  );
}

