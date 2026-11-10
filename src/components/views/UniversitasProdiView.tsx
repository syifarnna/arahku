import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Building2, GraduationCap, Target, Layers, Loader2, ArrowLeft, ChevronRight, School } from 'lucide-react';
import { useAppState, appStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { searchMajors, getMajorsStats, useDebouncedValue, MajorsStats } from '../../lib/prodiSearch';
import { matchesInstitution, primaryAbbreviation } from '../../lib/institutionSearch';
import { buildProdiPgRanges } from '../../lib/pgRange';
import { normalizeProdiKey } from '../../lib/prodiName';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/Pagination';
import { JenjangBadge } from '@/components/ui/JenjangBadge';
import type { ClusterType, InstitutionType, Major } from '../../types';

type JenjangFilter = 'SEMUA' | 'S1' | 'D4' | 'D3';
type RumpunFilter = 'SEMUA' | ClusterType;

const JENJANG_FILTERS: JenjangFilter[] = ['SEMUA', 'S1', 'D4', 'D3'];
const RUMPUN_FILTERS: RumpunFilter[] = ['SEMUA', 'Saintek', 'Soshum', 'Campuran'];
const TYPE_FILTERS: ('SEMUA' | InstitutionType)[] = ['SEMUA', 'PTN', 'PTS', 'Kedinasan'];

const CLUSTER_STYLE: Record<ClusterType, { badge: string; row: string; dot: string }> = {
  Saintek: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    row: 'hover:bg-sky-50/40 dark:hover:bg-sky-950/20',
    dot: 'bg-sky-500',
  },
  Soshum: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    row: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
    dot: 'bg-amber-500',
  },
  Campuran: {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
    row: 'hover:bg-violet-50/40 dark:hover:bg-violet-950/20',
    dot: 'bg-violet-500',
  },
};

const TYPE_STYLE: Record<InstitutionType, string> = {
  PTN: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-sky-200 dark:border-sky-900',
  PTS: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
  Kedinasan: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
};

const PAGE_SIZE = 50;

const EMPTY_STATS: MajorsStats = {
  universitas: 0,
  totalProdi: 0,
  s1: 0,
  d4: 0,
  d3: 0,
  saintek: 0,
  soshum: 0,
  campuran: 0,
};

const fmt = (n?: number | null) => (n == null ? '—' : n.toLocaleString('id-ID'));

// ---------------------------------------------------------------------------
// Hash-based sub-routing:  #/kampus  (daftar kampus)  dan  #/kampus/:id  (detail)
// ---------------------------------------------------------------------------

type Route = { name: 'list' } | { name: 'detail'; id: number };

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '');
  const m = path.match(/^\/kampus\/(\d+)$/);
  if (m) return { name: 'detail', id: Number(m[1]) };
  return { name: 'list' };
}

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

const goCampusList = () => { window.location.hash = '#/kampus'; };
const goCampusDetail = (id: number) => { window.location.hash = `#/kampus/${id}`; };

export const UniversitasProdiView: React.FC = () => {
  const state = useAppState();
  const route = useHashRoute();
  const healedRef = useRef(false);

  // Safety net: pastikan data kampus & prodi tersedia saat halaman dibuka
  // (mis. dibuka langsung sebelum fetch master login selesai atau fetch gagal).
  useEffect(() => {
    if (healedRef.current) return;
    healedRef.current = true;
    if (state.institutions.length === 0 || state.majors.length === 0) {
      appStore.fetchMasterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (route.name === 'detail') {
    return <CampusDetail key={route.id} campusId={route.id} />;
  }
  return <CampusList />;
};

// ---------------------------------------------------------------------------
// Daftar Kampus
// ---------------------------------------------------------------------------

export const CampusList: React.FC = () => {
  const state = useAppState();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'SEMUA' | InstitutionType>('SEMUA');
  const [stats, setStats] = useState<MajorsStats>(EMPTY_STATS);

  useEffect(() => {
    let cancelled = false;
    getMajorsStats()
      .then(s => {
        if (!cancelled && s) setStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      state.institutions.filter(
        i => (typeFilter === 'SEMUA' || i.type === typeFilter) && matchesInstitution(i, search)
      ),
    [state.institutions, search, typeFilter]
  );

  const prodiCount = (id: number) => state.majors.filter(m => m.institution_id === id).length;
  const majorsReady = state.majors.length > 0;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-border pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Browser Kampus &amp; Program Studi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {fmt(stats.totalProdi)} prodi dari {fmt(stats.universitas)} kampus • data passing grade UTBK-SNBT 2025
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Prodi', value: stats.totalProdi, icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
          { label: 'Kampus', value: stats.universitas, icon: Building2, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
          { label: 'Jenjang S1', value: stats.s1, icon: Layers, color: 'text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
          { label: 'Jenjang D3', value: stats.d3, icon: Layers, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Jenjang D4', value: stats.d4, icon: Layers, color: 'text-sky-400 bg-sky-50 dark:bg-sky-950/40' },
        ].map((s, i) => (
          <Card key={i} className="p-4 rounded-2xl flex items-center gap-3 border-slate-200/70 dark:border-border">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{fmt(s.value)}</p>
              <p className="text-[11px] font-medium text-slate-400 truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filter jenis */}
      <Card className="p-4 rounded-2xl border-slate-200/70 dark:border-border space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama kampus, singkatan, atau lokasi (mis. ITB, Bandung, Kedinasan)..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis:</span>
          {TYPE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                typeFilter === f
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} kampus tampil</span>
        </div>
      </Card>

      {/* Grid kampus */}
      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Tidak ada kampus ditemukan untuk pencarian ini.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(i => {
          const n = prodiCount(i.id);
          const abbr = primaryAbbreviation(i);
          return (
            <button
              key={i.id}
              onClick={() => goCampusDetail(i.id)}
              className="text-left bg-card rounded-2xl border border-slate-200 dark:border-border p-5 shadow-sm hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 dark:text-white text-sm leading-snug group-hover:text-primary transition-colors">
                      {i.name}
                    </p>
                    {abbr && (
                      <Badge variant="outline" className="rounded-md text-[10px] font-bold h-auto px-1.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900">
                        {abbr}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn('rounded-md text-[10px] font-bold h-auto px-2 py-1 shrink-0', TYPE_STYLE[i.type] || TYPE_STYLE.PTN)}>
                  {i.type}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grade</p>
                  <p className="text-sm font-extrabold text-primary">{i.grade != null ? i.grade : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Range</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {i.range_min != null && i.range_max != null ? `${i.range_min}–${i.range_max}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Prodi</p>
                  {majorsReady ? (
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{n}</p>
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                <School className="w-3.5 h-3.5" /> Lihat Prodi <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail Kampus: info kampus + daftar prodi (bisa difilter jenjang / rumpun)
// ---------------------------------------------------------------------------

export const CampusDetail: React.FC<{ campusId: number }> = ({ campusId }) => {
  const state = useAppState();
  const institution = state.institutions.find(i => i.id === campusId);

  const [search, setSearch] = useState('');
  const [jenjang, setJenjang] = useState<JenjangFilter>('SEMUA');
  const [rumpun, setRumpun] = useState<RumpunFilter>('SEMUA');
  const [sortBy, setSortBy] = useState<'name' | 'pg'>('pg');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Major[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 500);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const majorsReady = state.majors.length > 0;

  // Rentang passing grade (terkecil-tertinggi) tiap prodi — prodi yang sama dari
  // beberapa kampus dikelompokkan jadi satu prodi, kartu menampilkan rentang PG.
  const prodiPgRanges = useMemo(() => buildProdiPgRanges(state.majors), [state.majors]);

  const pgRangeFor = (m: Major): string => {
    const range = prodiPgRanges.get(normalizeProdiKey(m.name));
    const pg = m.passing_grade_total;
    if (!range) return `PG ${pg ?? '—'}`;
    const min = Math.min(range.min, pg ?? range.min);
    const max = Math.max(range.max, pg ?? range.max);
    return min === max ? `PG ${min}` : `PG ${min}–${max}`;
  };


  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, jenjang, rumpun, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await searchMajors({
          search: debouncedSearch,
          jenjang: jenjang === 'SEMUA' ? '' : jenjang,
          rumpun: rumpun === 'SEMUA' ? '' : rumpun,
          sort: sortBy,
          page,
          pageSize: PAGE_SIZE,
          institutionId: campusId,
        });
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.total);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, jenjang, rumpun, sortBy, page, campusId]);

  if (!institution) {
    return (
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        <button onClick={goCampusList} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Semua Kampus
        </button>
        <div className="py-16 text-center text-slate-400 text-sm">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Kampus tidak ditemukan.
        </div>
      </div>
    );
  }

  const isEmptyCampus = !loading && rows.length === 0 && !debouncedSearch && jenjang === 'SEMUA' && rumpun === 'SEMUA';

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Kembali */}
      <button onClick={goCampusList} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Semua Kampus
      </button>

      {/* Hero kampus */}
      <Card className="p-6 rounded-2xl border-slate-200/70 dark:border-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{institution.name}</h2>
              {primaryAbbreviation(institution) && (
                <Badge variant="outline" className="rounded-md text-[11px] font-bold h-auto px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900">
                  {primaryAbbreviation(institution)}
                </Badge>
              )}
              <Badge variant="outline" className={cn('rounded-md text-[11px] font-bold h-auto px-2 py-1', TYPE_STYLE[institution.type] || TYPE_STYLE.PTN)}>
                {institution.type}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grade Campus</p>
              <p className="text-lg font-extrabold text-primary">{institution.grade != null ? institution.grade : '—'}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Range Nilai</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {institution.range_min != null && institution.range_max != null ? `${institution.range_min}–${institution.range_max}` : '—'}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Prodi</p>
              {majorsReady ? (
                <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">
                  {fmt(state.majors.filter(m => m.institution_id === campusId).length)}
                </p>
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
              )}
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-muted/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rumpun</p>
              <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap">Saintek/Soshum</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Kontrol filter */}
      <Card className="p-4 rounded-2xl border-slate-200/70 dark:border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={`Cari program studi di ${institution.name}...`}
              className="pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as 'name' | 'pg'); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="pg">Urut: Passing Grade Tertinggi</option>
            <option value="name">Urut: Nama Prodi A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenjang:</span>
          {JENJANG_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setJenjang(f); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                jenjang === f
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs font-semibold text-slate-400">
            {loading ? 'Memuat...' : `Ditemukan ${fmt(total)} prodi`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rumpun:</span>
          {RUMPUN_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setRumpun(f); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                rumpun === f
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>

      {/* Tabel prodi kampus */}
      <Card className={cn('rounded-2xl overflow-hidden border-slate-200/70 dark:border-border transition-opacity', loading && rows.length > 0 && 'opacity-60')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 dark:border-border bg-slate-50/60 dark:bg-slate-900/40">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Program Studi</th>
                <th className="px-4 py-3">Rumpun</th>
                <th className="px-4 py-3">Jenjang</th>
                <th className="px-4 py-3 text-right">Daya</th>
                <th className="px-4 py-3 text-right">PG Range</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    {isEmptyCampus ? (
                      <>
                        <School className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Belum ada data prodi untuk kampus ini.
                      </>
                    ) : (
                      <>
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Tidak ada hasil untuk pencarian ini.
                      </>
                    )}
                  </td>
                </tr>
              )}
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto opacity-50" />
                    <span className="text-xs mt-2 block">Memuat data prodi...</span>
                  </td>
                </tr>
              )}
              {rows.map((m) => {
                const isTarget = state.targetMajorIds.includes(m.id);
                const cs = CLUSTER_STYLE[m.cluster === 'Saintek' || m.cluster === 'Soshum' || m.cluster === 'Campuran' ? m.cluster : 'Campuran'];
                return (
                  <tr key={m.id} className={cn('border-b border-slate-50 dark:border-border/50 transition-colors', cs.row)}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{m.code || '—'}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">{m.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="secondary" className={cn('text-[10px] font-bold gap-1.5 border', cs.badge)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cs.dot)} />
                        {m.cluster || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <JenjangBadge jenjang={m.jenjang} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{fmt(m.daya_tampung)}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{pgRangeFor(m)}</td>
                    <td className="px-4 py-3 text-right">
                      {isTarget ? (
                        <Badge className="text-[10px] font-bold gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
                          <Target className="w-3 h-3" /> Target
                        </Badge>
                      ) : (
                        <button
                          onClick={() => !isTarget && appStore.addTargetMajor(m.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
                        >
                          <Target className="w-3.5 h-3.5" /> Set Target
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-border gap-3 flex-wrap">
          <p className="text-xs text-slate-400">
            Halaman {Math.min(page, totalPages)} dari {totalPages} • {fmt(total)} prodi
          </p>
          <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>
    </div>
  );
};