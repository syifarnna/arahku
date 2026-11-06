import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-16 flex items-center justify-between px-6 bg-transparent text-xs text-slate-400 border-t border-slate-100 dark:border-border/80">
      <div>
        © 2026 <span className="font-semibold text-slate-600 dark:text-slate-300">Arahku</span> • Platform Penjurusan &amp; Rekomendasi Kampus PTN
      </div>
      <div className="hidden sm:flex gap-4">
        <a href="#dashboard" className="hover:text-primary transition-colors">Sneat Admin Bootstrap</a>
      </div>
    </footer>
  );
};
