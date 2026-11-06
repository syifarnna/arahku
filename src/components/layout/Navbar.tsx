import React, { useState, useEffect } from 'react';
import {
  Bell, 
  Database, 
  LogOut, 
  Menu, 
  Moon, 
  Search, 
  Sun, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { appStore, useAppState } from '../../lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSqlModal: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSqlModal,
  isDarkMode,
  setIsDarkMode,
  activeTab,
  setActiveTab
}) => {
  const state = useAppState();
  const [searchQuery, setSearchQuery] = useState('');

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const notifications = [
    {
      id: 1,
      title: 'Analisis Passing Grade Diperbarui',
      desc: 'Skor simulasi Episode 2 telah dikomparasi dengan STEI ITB.',
      time: '10 menit lalu',
      type: 'info'
    },
    {
      id: 2,
      title: 'Defisit Skor Literasi Inggris',
      desc: 'Anda butuh +70 poin di LBE untuk aman di Kedokteran UI.',
      time: '2 jam lalu',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Rekomendasi Les Baru Tersedia',
      desc: 'Supercamp English Batch 5 cocok untuk menutup gap Anda.',
      time: '1 hari lalu',
      type: 'success'
    }
  ];

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-card/80 dark:bg-card/80 backdrop-blur-md border-b border-slate-100 dark:border-border shadow-2xs">
        {/* Left section: Mobile menu & Search */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className={cn("lg:hidden text-slate-600 dark:text-slate-300 rounded-xl")}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari jurusan, kampus, atau passing grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-card border border-transparent focus:border-primary dark:focus:border-primary rounded-xl text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 ms-4">
          {/* Supabase Status Trigger (Khusus Admin) */}
          {state.profile.role === 'admin' && (
            <Tooltip>
              <TooltipTrigger render={<Button
                variant="secondary"
                onClick={onOpenSqlModal}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl",
                  "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors text-xs font-semibold cursor-pointer"
                )}
              />}>
                <Database className="w-3.5 h-3.5 text-primary" />
                <span>{state.useRealSupabase ? 'Supabase Connected' : 'Supabase (Demo Mode)'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </TooltipTrigger>
              <TooltipContent>
                Konfigurasi Supabase Authentication & Database SQL
              </TooltipContent>
            </Tooltip>
          )}

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger render={<Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn("rounded-xl text-slate-600 dark:text-slate-300")}
            />}>
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </TooltipTrigger>
            <TooltipContent>
              {isDarkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            </TooltipContent>
          </Tooltip>

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button
              variant="ghost"
              size="icon"
              className={cn("rounded-xl text-slate-600 dark:text-slate-300 relative")}
            />}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-80 sm:w-96 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-border">
                <span className="font-bold text-sm text-slate-800 dark:text-white">Pemberitahuan Analisis</span>
                <Badge variant="default" className="bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full h-auto">
                  3 Baru
                </Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="p-4 focus:bg-slate-50 dark:focus:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex gap-3 w-full">
                      <div className={cn(
                        "mt-0.5 p-2 rounded-xl h-fit shrink-0",
                        notif.type === 'warning'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      )}>
                        {notif.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white mb-0.5">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-muted-foreground leading-relaxed mb-1">{notif.desc}</p>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full p-1 h-auto hover:ring-2 hover:ring-primary/40 transition-all")}
            />}>
              <Avatar size="lg" className="border-2 border-primary/10 dark:border-primary">
                <AvatarImage
                  src={state.profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${state.profile.full_name || 'User'}`}
                  alt={state.profile.full_name || 'User'}
                />
                <AvatarFallback>
                  {(state.profile.full_name || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-0">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-4 py-2.5 border-b border-slate-100 dark:border-border mb-1 font-normal">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{state.profile.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate mb-1.5">{state.profile.email}</p>
                  <Badge
                    variant={state.profile.role === 'admin' ? 'default' : 'secondary'}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase h-auto",
                      state.profile.role === 'admin'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {state.profile.role === 'admin' ? '👑 Administrator' : '🎓 Peserta Siswa'}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => { setActiveTab('profile'); }}
                  className="gap-2.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Profil Saya & Pengaturan
                </DropdownMenuItem>
                {state.profile.role === 'admin' && (
                  <DropdownMenuItem
                    onClick={() => { onOpenSqlModal(); }}
                    className="gap-2.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    <Database className="w-3.5 h-3.5 text-primary" />
                    Supabase SQL Blueprint
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => { appStore.logout(); }}
                  className="gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar (Logout)
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
};
