import React, { useEffect } from 'react';
import { 
  ArrowUpRight,
  BookOpen, 
  Brain,
  Compass, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  Target, 
  TrendingUp, 
  Award,
  Database,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import { appStore, useAppState } from '../../lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenSqlModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  onOpenSqlModal 
}) => {
  const state = useAppState();

  // Tutup otomatis saat ukuran layar mengecil ke mobile/tablet, dan saat
  // pengguna menekan tombol Escape di keyboard.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    mql.addEventListener('change', handleChange);
    window.addEventListener('keydown', handleKey);
    return () => {
      mql.removeEventListener('change', handleChange);
      window.removeEventListener('keydown', handleKey);
    };
  }, [setIsOpen]);

  // Kunci scroll body ketika menu mobile terbuka agar konten di belakang
  // (overlay) tidak ikut tergeser.
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isOpen && !isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const menuSections = state.profile.role === 'admin' ? [
    {
      title: 'MENU UTAMA ADMIN',
      items: [
        { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard, badge: '' }
      ]
    },
    {
      title: 'MANAJEMEN DATA',
      items: [
        { id: 'admin_users', label: 'Daftar Pengguna', icon: Users, badge: '' },
        { id: 'admin_campuses', label: 'Kelola Kampus & Grade', icon: Database, badge: '' },
        { id: 'admin_majors', label: 'Kelola Prodi', icon: Target, badge: `` },
        { id: 'admin_questions', label: 'Bank Soal Penjurusan', icon: Brain, badge: '' },
        { id: 'admin_results', label: 'Leaderboard Nasional', icon: Award, badge: '' }
      ]
    },
    {
      title: 'PENGATURAN SYSTEM',
      items: [
        { id: 'profile', label: 'Profil Admin', icon: Settings, badge: '' },
        { id: 'supabase_cfg', label: 'Supabase SQL Blueprint', icon: Database, badge: 'SQL', isSpecial: true }
      ]
    }
  ] : [
    {
      title: 'MENU UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'EKSPLORASI & PENJURUSAN',
      items: [
        { id: 'browse_universitas', label: 'Browser Kampus & Prodi', icon: Compass },
        { id: 'tes_minat', label: 'Tes Penjurusan', icon: Brain },
        { id: 'analisis_tryout', label: 'Analisis Nilai', icon: TrendingUp }
      ]
    },
    {
      title: 'ANALISIS & TARGET (INTI)',
      items: [
        { id: 'target_majors', label: 'Target Institut', icon: Target }
      ]
    },
    {
      title: 'HASIL & REKOMENDASI',
      items: [
        { id: 'rekomendasi', label: 'Rekomendasi', icon: Sparkles },
        { id: 'reports', label: 'Laporan Komprehensif', icon: FileText }
      ]
    },
    {
      title: 'PENGATURAN',
      items: [
        { id: 'profile', label: 'Profil Siswa', icon: Settings }
      ]
    }
  ];

  const handleNavClick = (item: any) => {
    setActiveTab(item.id);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 bottom-0 left-0 z-50 w-64 bg-card dark:bg-card border-r border-slate-100 dark:border-border flex flex-col transition-transform duration-300 ease-in-out shadow-xs",
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-border gap-3 shrink-0">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
              Arah<span className="text-primary">ku</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Sneat Admin
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup menu"
            className="lg:hidden shrink-0 text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation List */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden py-4 px-4">
          <div className="space-y-6 pb-2">
            {menuSections.map((sec, idx) => (
              <div key={idx}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {sec.title}
                </p>
                <ul className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id && !item.isSpecial;

                    return (
                      <li key={item.id}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleNavClick(item)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            "group w-full justify-between px-4 py-2.5 h-auto rounded-md text-sm font-medium cursor-pointer",
                            isActive && 'bg-primary/10 text-primary font-semibold hover:bg-primary/15',
                            item.isSpecial && 'border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/60',
                            !isActive && !item.isSpecial && 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={cn(
                              "w-5 h-5 transition-transform group-hover:scale-105 opacity-80 shrink-0",
                              isActive && 'text-primary opacity-100',
                              item.isSpecial && 'text-amber-600 dark:text-amber-400',
                              !isActive && !item.isSpecial && 'text-muted-foreground group-hover:text-foreground'
                            )} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <Badge
                              variant={isActive ? 'default' : 'secondary'}
                              className={cn(
                                "text-[11px] px-2 py-0.5 rounded-md font-semibold uppercase ml-2 shrink-0",
                                isActive && 'bg-primary/15 text-primary',
                                !isActive && item.badge === 'Kritis' && 'bg-rose-100 text-destructive dark:bg-rose-950 dark:text-rose-400',
                                !isActive && item.badge === 'Solusi' && 'bg-emerald-100 text-secondary dark:bg-emerald-950 dark:text-emerald-400',
                                !isActive && item.badge !== 'Kritis' && item.badge !== 'Solusi' && 'bg-muted text-muted-foreground'
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* User Card & Logout */}
        <div className="p-4 bg-muted/50 dark:bg-card shrink-0">
          <div className="flex items-center gap-3 mb-3 px-1">
            <Avatar size="lg" className="border-2 border-primary">
              <AvatarImage 
                src={state.profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${state.profile.full_name || 'User'}`} 
                alt={state.profile.full_name || 'User'} 
              />
              <AvatarFallback>
                {(state.profile.full_name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                {state.profile.full_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {state.profile.role === 'admin' ? '👑 Administrator' : '🎓 Peserta'} • {state.profile.school}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => appStore.logout()}
            className="w-full justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar (Logout)
          </Button>
        </div>
      </aside>
    </>
  );
};
