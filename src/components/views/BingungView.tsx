import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { BookOpen, Brain, Briefcase, Building2, CheckCircle2, ChevronRight, Compass, HelpCircle, Loader2, RotateCcw, Save, Sparkles, Target, Trash2, X, TrendingUp, Award, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { appStore, useAppState } from '../../lib/store';
import { supabase } from '../../lib/supabaseClient';
import { ClusterType, Institution, Major, PenjurusanQuestion } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { JenjangBadge } from '@/components/ui/JenjangBadge';
import { UtbkInputModal } from '@/components/modals/UtbkInputModal';
import { displayProdiName, normalizeProdiKey } from '../../lib/prodiName';
import { fetchAllRows } from '../../lib/supabasePaging';

const CLUSTERS: ClusterType[] = ['Saintek', 'Soshum', 'Campuran'];

const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const clusterStyle: Record<ClusterType, { label: string; bar: string; badge: string; desc: string }> = {
  Saintek: {
    label: 'Saintek',
    bar: 'bg-sky-500',
    badge: 'bg-sky-500 text-white',
    desc: 'Senang pada sains & teknologi — cocok untuk rumpun Matematika & IPA (MIPA), Teknik, Kedokteran.',
  },
  Soshum: {
    label: 'Soshum',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    desc: 'Senang pada sosial & humaniora — cocok untuk rumpun Sosial & Humaniora (Soshum).',
  },
  Campuran: {
    label: 'Campuran / Multidisiplin',
    bar: 'bg-violet-500',
    badge: 'bg-violet-500 text-white',
    desc: 'Minatmu seimbang lintas rumpun — cocok untuk jurusan multidisiplin.',
  },
};

type Tally = Record<ClusterType, number>;

const emptyTally = (): Tally => ({ Saintek: 0, Soshum: 0, Campuran: 0 });

// Dataset PTN baru menyimpan nama prodi tanpa akhiran kampus, tapi masih ada
// varian seperti "(PSDKU ...)" atau "ANIRY ACEH - ARSITEKTUR". Helper di
// ../../lib/prodiName menormalkan nama agar pengelompokan & pencarian konsisten.
const gradeOf = (major: Major): number => major.passing_grade_total || 0;

interface MajorDescription {
  found: boolean;
  description?: string;
  career_prospects?: string;
  cluster?: string;
}

type WizardStep = 'idle' | 'running' | 'result' | 'need_score' | 'campus_categories';

interface CampusEntry {
  institution: Institution;
  major: Major;
}

// Satu prodi bisa punya beberapa baris di kampus yang sama (mis. S1 dan D-III
// dengan nama sama). Untuk daftar kampus, tampilkan satu baris per kampus dan
// pertahankan PG tertinggi. Input harus sudah diurutkan PG menurun.
const dedupeCampusEntries = (entries: CampusEntry[]): CampusEntry[] => {
  const seen = new Set<number>();
  const out: CampusEntry[] = [];
  for (const entry of entries) {
    const id = entry.institution.id;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(entry);
  }
  return out;
};

export const BingungView: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const state = useAppState();

  const [wizardStep, setWizardStep] = useState<WizardStep>('idle');
  const [phase, setPhase] = useState<'idle' | 'running' | 'result'>('idle');
  const [step, setStep] = useState(0);
  const [tally, setTally] = useState<Tally>(emptyTally());
  const [savingInterest, setSavingInterest] = useState(false);
  const [descCache, setDescCache] = useState<Record<number, MajorDescription>>({});
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [campusesForMajor, setCampusesForMajor] = useState<CampusEntry[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  const [pickedMajor, setPickedMajor] = useState<Major | null>(null);
  const [allCampusesForPicked, setAllCampusesForPicked] = useState<CampusEntry[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  const questions = useMemo(() => state.questions.filter(q => q.is_active), [state.questions]);

  const [deck, setDeck] = useState<{ q: PenjurusanQuestion; order: number[] }[]>([]);

  const total = questions.length;

  const current = deck[step];

  const autoScore = appStore.getUtbkLatestScore() ?? state.results[0]?.total_score ?? null;

  const showToast = (icon: 'success' | 'error', title: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  };

  const handleSaveInterest = async (cluster: ClusterType, label: string) => {
    if (savingInterest) return;
    setSavingInterest(true);
    const ok = await appStore.saveInterest(cluster);
    setSavingInterest(false);
    if (ok) showToast('success', `Minat "${label}" tersimpan di profil Anda`);
    else showToast('error', 'Gagal menyimpan minat. Coba lagi.');
  };

  const handleClearInterest = async (cluster: ClusterType, label: string) => {
    const res = await Swal.fire({
      icon: 'question',
      title: 'Hapus minat saya?',
      text: `Rumpun "${label}" tidak akan tersimpan sebagai minat di profil Anda.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    });
    if (!res.isConfirmed) return;
    const ok = await appStore.clearInterest();
    if (ok) showToast('success', `Minat "${label}" telah dihapus`);
    else showToast('error', 'Gagal menghapus minat. Coba lagi.');
  };

  const lastResult = useMemo<{ dominant: ClusterType; tally: Tally } | null>(() => {
    try {
      const raw = localStorage.getItem('tryoutku_penjurusan_v3');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const sortByGradeDesc = useCallback((a: Major, b: Major): number =>
    gradeOf(b) - gradeOf(a),
  []);

  // Cari semua kampus yang menawarkan prodi yang sama (berdasarkan kunci
  // ternormalisasi), langsung dari master data yang sudah dimuat.
  const collectCampuses = useCallback((major: Major): CampusEntry[] => {
    const key = normalizeProdiKey(major.name);
    if (!key) return [];
    const instById = new Map<number, Institution>(state.institutions.map(i => [i.id, i] as const));
    const entries = state.majors
      .filter(m => normalizeProdiKey(m.name) === key)
      .map(m => {
        const institution = instById.get(m.institution_id);
        return institution ? { institution, major: m } : null;
      })
      .filter((x): x is CampusEntry => x != null)
      .sort((a, b) => sortByGradeDesc(a.major, b.major));
    return dedupeCampusEntries(entries);
  }, [state.majors, state.institutions, sortByGradeDesc]);

  const start = () => {
    if (total === 0) return;
    // Acak urutan soal + posisi opsi setiap kali tes dimulai agar polanya tidak sama.
    setDeck(shuffle(questions).map(q => ({ q, order: shuffle([0, 1, 2, 3]) })));
    setPhase('running'); setWizardStep('running'); setStep(0); setTally(emptyTally());
  };

  const pick = (cluster: ClusterType, weight: number = 1) => {
    // Bobot per jawaban/opsi (1-5) yang dipilih.
    const w = weight > 0 ? weight : 1;
    if (step + 1 >= total) {
      const next = { ...tally, [cluster]: tally[cluster] + w };
      setTally(next);
      const dominant = dominantOf(next);
      setPhase('result');
      setWizardStep('result');
      try {
        localStorage.setItem('tryoutku_penjurusan_v3', JSON.stringify({ dominant, tally: next }));
      } catch {}
    } else {
      setTally(t => ({ ...t, [cluster]: t[cluster] + w }));
      setStep(step + 1);
    }
  };

  const dominantOf = (t: Tally): ClusterType => {
    const grandTotal = CLUSTERS.reduce((acc, c) => acc + (t[c] || 0), 0);
    if (grandTotal === 0) return 'Campuran';
    const entries = CLUSTERS.map(c => ({ c, n: t[c] || 0 }));
    entries.sort((a, b) => b.n - a.n);
    // Aturan Campuran: bila selisih skor tertinggi & kedua <= 10% total skor,
    // minat dianggap seimbang lintas rumpun.
    if (entries[0].n - entries[1].n <= 0.1 * grandTotal) return 'Campuran';
    return entries[0].c;
  };

  const recommendedProdi = useMemo(() => {
    const dom = phase === 'result' ? dominantOf(tally) : lastResult?.dominant;
    if (!dom) return [] as { name: string; major: Major; campusCount: number }[];
    const pool = state.majors.filter(m =>
      dom === 'Campuran'
        ? (m.cluster === 'Saintek' || m.cluster === 'Soshum')
        : m.cluster === dom
    );
    const map = new Map<string, { name: string; major: Major; campuses: Set<number> }>();
    // Urutkan PG tertinggi dulu supaya representatif grup = prodi PG tertinggi.
    [...pool].sort(sortByGradeDesc).forEach(m => {
      const baseKey = normalizeProdiKey(m.name);
      if (!baseKey) return;
      // Dikelompokkan per nama prodi saja (tanpa memisah jenjang), agar semua
      // kampus dengan prodi yang sama tergabung dalam satu grup.
      const key = baseKey;
      const entry = map.get(key);
      if (entry) {
        entry.campuses.add(m.institution_id);
        if (gradeOf(m) > gradeOf(entry.major)) entry.major = m;
      } else {
        map.set(key, {
          name: displayProdiName(m.name),
          major: m,
          campuses: new Set([m.institution_id]),
        });
      }
    });
    const instById = new Map<number, Institution>(state.institutions.map(i => [i.id, i] as const));
    return Array.from(map.values())
      .map(e => ({ name: e.name, major: e.major, campusCount: e.campuses.size }))
      .sort((a, b) => {
        const peminatDiff = (b.major.peminat || 0) - (a.major.peminat || 0);
        if (peminatDiff !== 0) return peminatDiff;
        // Tie-break: kampus favorit (grade rata-rata tertinggi) lalu PG tertinggi.
        const gradeDiff =
          (instById.get(b.major.institution_id)?.grade || 0) -
          (instById.get(a.major.institution_id)?.grade || 0);
        if (gradeDiff !== 0) return gradeDiff;
        return sortByGradeDesc(a.major, b.major);
      });
  }, [state.majors, state.institutions, phase, tally, lastResult, sortByGradeDesc]);

  useEffect(() => {
    const reps = recommendedProdi.map(p => p.major);
    if (reps.length === 0) return;
    const idsToFetch = reps.filter(m => !descCache[m.id]).map(m => m.id);
    if (idsToFetch.length === 0) return;
    let cancelled = false;
    Promise.all(idsToFetch.map(async (id) => {
      const m = reps.find(x => x.id === id);
      if (!m) return null;
      try {
        const { data } = await supabase.rpc('get_major_description', { p_name: normalizeProdiKey(m.name) });
        return { id, desc: data as MajorDescription };
      } catch {
        return { id, desc: { found: false } as MajorDescription };
      }
    })).then(results => {
      if (cancelled) return;
      const next: Record<number, MajorDescription> = { ...descCache };
      results.forEach(r => { if (r) next[r.id] = r.desc; });
      setDescCache(next);
    });
    return () => { cancelled = true; };
  }, [recommendedProdi, descCache]);

  // Fallback bila master data lokal belum memuat prodi ini: ambil majors dari
  // server lalu saring dengan kunci yang sama (bukan pola "PRODI - %").
  const fetchCampusesFromServer = useCallback(async (major: Major): Promise<CampusEntry[]> => {
    const key = normalizeProdiKey(major.name);
    if (!key) return [];
    // Ambil SEMUA baris lewat pagination; `.limit()` di Supabase dibatasi
    // maksimal 1000 baris sehingga daftar kampus bisa terpotong.
    const { data, error } = await fetchAllRows<any>(() =>
      supabase
        .from('majors')
        .select('*, institutions(id, name, abbreviation, type, grade, range_min, range_max)')
        .order('passing_grade_total', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true }) as any,
    );
    if (error) return [];
    const entries = data
      .filter(row => normalizeProdiKey(row.name) === key)
      .map((row: any) => ({
        institution: row.institutions as Institution,
        major: { ...row, institution_name: row.institutions?.name, institution_type: row.institutions?.type } as Major,
      }))
      .filter(x => x.institution)
      .sort((a, b) => sortByGradeDesc(a.major, b.major));
    return dedupeCampusEntries(entries);
  }, [sortByGradeDesc]);

  const openMajorDetail = async (major: Major) => {
    setSelectedMajor(major);
    const local = collectCampuses(major);
    if (local.length > 0) {
      setCampusesForMajor(local);
      setLoadingCampuses(false);
      return;
    }
    setLoadingCampuses(true);
    try {
      setCampusesForMajor(await fetchCampusesFromServer(major));
    } catch {
      setCampusesForMajor([]);
    } finally {
      setLoadingCampuses(false);
    }
  };

  const fetchCampusesForMajor = async (major: Major) => {
    setWizardStep('campus_categories');
    const local = collectCampuses(major);
    if (local.length > 0) {
      setAllCampusesForPicked(local);
      setLoadingCategories(false);
      return;
    }
    setLoadingCategories(true);
    try {
      setAllCampusesForPicked(await fetchCampusesFromServer(major));
    } catch {
      setAllCampusesForPicked([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePickMajor = (major: Major) => {
    setPickedMajor(major);
    if (autoScore == null) {
      setWizardStep('need_score');
    } else {
      fetchCampusesForMajor(major);
    }
  };

  const handleScoreSave = async (input: { total_score: number; scores: Record<string, number>; label?: string | null; recorded_on?: string }) => {
    await appStore.addUtbkScore(input);
    setScoreModalOpen(false);
  };

  useEffect(() => {
    if (wizardStep === 'need_score' && autoScore != null && pickedMajor) {
      fetchCampusesForMajor(pickedMajor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScore, wizardStep, pickedMajor]);

  const categorized = useMemo(() => {
    if (autoScore == null || allCampusesForPicked.length === 0) return { top: [] as CampusEntry[], pas: [] as CampusEntry[], aman: [] as CampusEntry[] };
    const withPg = allCampusesForPicked.filter(c => c.major.passing_grade_total != null);
    const grade = (c: CampusEntry) => c.major.passing_grade_total || 0;
    // Top: kampus terbaik (PG tertinggi) untuk prodi ini — kota tidak dipertimbangkan.
    const top = [...withPg].sort((a, b) => grade(b) - grade(a)).slice(0, 6);
    const topIds = new Set(top.map(c => c.major.id));
    const rest = withPg.filter(c => !topIds.has(c.major.id));
    // Pas & Aman: PG tertinggi didahulukan.
    const byNear = (a: CampusEntry, b: CampusEntry) => grade(b) - grade(a);
    const below = rest.filter(c => grade(c) <= autoScore);
    const pas = below
      .filter(c => autoScore - grade(c) < 50)
      .sort(byNear);
    const aman = below
      .filter(c => autoScore - grade(c) >= 50)
      .sort(byNear);
    return { top, pas, aman };
  }, [autoScore, allCampusesForPicked]);

  const renderResult = (dominant: ClusterType) => {
    const s = clusterStyle[dominant];
    const isLive = phase === 'result';
    const tallyData = isLive ? tally : lastResult?.tally ?? emptyTally();

    return (
      <div className="space-y-6">
        <Card className="w-full p-6 lg:p-8 rounded-3xl ring-0 bg-card border border-slate-100 dark:border-border shadow-xs">
          <div className="flex items-center gap-4">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md', s.badge)}>
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <Badge className="rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground h-auto px-2.5 py-1">Hasil Tes Penjurusan</Badge>
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mt-1">
                Kecenderungan Anda: <span className="text-primary">{s.label}</span>
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{s.desc}</p>

          <div className="mt-6 space-y-3">
            {(() => {
              const grandTotal = CLUSTERS.reduce((acc, c) => acc + (tallyData[c] || 0), 0);
              return (['Saintek', 'Soshum'] as ClusterType[]).map(c => {
                const n = tallyData[c] ?? 0;
                const pct = Math.round((n / (grandTotal || 1)) * 100);
                return (
                  <div key={c} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">{c}</span>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={cn('h-3 rounded-full transition-all duration-700', clusterStyle[c].bar)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 text-right text-xs font-black text-slate-700 dark:text-slate-200">{n} poin · {pct}%</span>
                  </div>
                );
              });
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-border">
            {state.profile.major_interest !== dominant ? (
              <Button
                onClick={() => handleSaveInterest(dominant, s.label)}
                disabled={savingInterest}
                className={cn('gap-2', savingInterest && 'opacity-70')}
              >
                {savingInterest ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4" /> Simpan sebagai Minat Saya ({s.label})</>
                )}
              </Button>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Tersimpan di Minat Saya ({s.label})
                </span>
                <Button
                  variant="outline"
                  className="gap-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                  onClick={() => handleClearInterest(dominant, s.label)}
                >
                  <Trash2 className="w-4 h-4" /> Hapus dari Minat
                </Button>
              </>
            )}
            <Button variant="outline" onClick={start} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Ulangi Tes
            </Button>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Rekomendasi Jurusan untuk Anda ({s.label})</h3>
            </div>
          </div>

          {recommendedProdi.length === 0 ? (
            <Card className="p-6 text-center bg-card border border-slate-100 dark:border-border rounded-2xl">
              <p className="text-sm text-slate-500">Belum ada jurusan untuk rumpun ini.</p>
            </Card>
          ) : (
            <div className="rounded-2xl border border-slate-100 dark:border-border bg-card overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recommendedProdi.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => openMajorDetail(p.major)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('rounded-md text-[10px] font-bold text-white border-0', clusterStyle[p.major.cluster as ClusterType]?.badge || 'bg-primary')}>
                          {p.major.cluster}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400">{p.campusCount} kampus</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-1.5 truncate">{p.name}</h4>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCampusRow = (item: CampusEntry, badge?: { label: string; className: string }) => (
    <div key={`${item.institution.id}-${item.major.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-border">
      <div className="min-w-0">
        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.institution.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <Badge variant="outline" className="text-[9px] font-bold h-auto px-1.5 py-0.5">{item.institution.type}</Badge>
          {badge && (
            <Badge className={cn('text-[9px] font-bold h-auto px-1.5 py-0.5 border-0', badge.className)}>{badge.label}</Badge>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">PG {item.major.passing_grade_total ?? '—'}</p>
        {!state.targetMajorIds.includes(item.major.id) ? (
          <button
            onClick={() => appStore.addTargetMajor(item.major.id)}
            className="text-[10px] font-bold text-primary hover:underline mt-0.5 cursor-pointer"
          >
            + Target
          </button>
        ) : (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Target</span>
        )}
      </div>
    </div>
  );

  const renderNeedScore = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="p-8 text-center bg-card border border-amber-200 dark:border-amber-900/60 rounded-3xl">
        <TrendingUp className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Nilai Anda Belum Tersedia</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          Untuk menampilkan kategori kampus <strong>Top</strong>, <strong>Pas</strong>, dan <strong>Aman</strong> bagi jurusan <strong>{displayProdiName(pickedMajor?.name)}</strong>, masukkan dulu nilai tryout UTBK Anda.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button onClick={() => setScoreModalOpen(true)} className="gap-2">
            <Target className="w-4 h-4" /> Input Nilai UTBK
          </Button>
          <Button variant="outline" onClick={() => setActiveTab?.('dashboard')} className="gap-2">
            <ArrowRight className="w-4 h-4" /> Ke Dashboard
          </Button>
          <Button variant="ghost" onClick={() => setWizardStep('result')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </div>
      </Card>

      <UtbkInputModal
        open={scoreModalOpen}
        onOpenChange={setScoreModalOpen}
        competencies={state.competencies}
        editingId={null}
        onSave={handleScoreSave}
        onEditRequest={() => {}}
        onDeleteRequest={() => {}}
        utbkRows={state.utbkScores}
      />
    </div>
  );

  const renderCampusCategories = () => {
    if (!pickedMajor) return null;
    const s = clusterStyle[pickedMajor.cluster as ClusterType];
    const groups = [
      { key: 'top', data: categorized.top, title: 'Kampus Top / Favorit', icon: TrendingUp, accent: 'text-emerald-500', note: 'Kampus terbaik untuk jurusan ini (passing grade tertinggi). Kota tidak dipertimbangkan — berani coba?' },
      { key: 'pas', data: categorized.pas, title: 'Kampus Pas', icon: Award, accent: 'text-amber-500', note: 'Selisih passing grade kurang dari 50 poin dari nilai Anda — peluang realistis.' },
      { key: 'aman', data: categorized.aman, title: 'Kampus Aman', icon: ShieldCheck, accent: 'text-sky-500', note: 'Nilai Anda di atas passing grade (selisih ≥ 50 poin) — pilihan aman.' },
    ] as const;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setWizardStep('result')} className="gap-1.5 text-xs h-auto py-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </Button>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">{displayProdiName(pickedMajor.name)}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge className={cn('rounded-md text-[10px] font-bold text-white border-0', s?.badge || 'bg-primary')}>{pickedMajor.cluster}</Badge>
                <JenjangBadge jenjang={pickedMajor.jenjang} />
                <span className="text-[11px] text-slate-400">Nilai Anda: <strong className="text-primary">{autoScore ?? '—'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {loadingCategories ? (
          <Card className="p-10 text-center bg-card border border-slate-100 dark:border-border rounded-3xl">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-sm text-slate-500">Memuat daftar kampus...</p>
          </Card>
        ) : allCampusesForPicked.length === 0 ? (
          <Card className="p-10 text-center bg-card border border-slate-100 dark:border-border rounded-3xl">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Tidak ditemukan kampus lain dengan jurusan ini.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {groups.map(g => {
              const Icon = g.icon;
              const badge =
                g.key === 'top' ? { label: 'Top', className: 'bg-emerald-500 text-white' }
                : g.key === 'pas' ? { label: 'Pas', className: 'bg-amber-500 text-white' }
                : { label: 'Aman', className: 'bg-sky-500 text-white' };
              return (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn('w-5 h-5', g.accent)} />
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-white">{g.title}</h4>
                    <Badge variant="secondary" className="text-[10px] font-bold ml-1">{g.data.length} kampus</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{g.note}</p>
                  {g.data.length === 0 ? (
                    <Card className="p-4 rounded-2xl bg-card border border-dashed border-slate-200 dark:border-border text-center">
                      <p className="text-[11px] text-slate-400">Belum ada kampus pada kategori ini untuk nilai Anda.</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {g.data.map(item => renderCampusRow(item, badge))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {(wizardStep === 'idle' || wizardStep === 'running' || wizardStep === 'result') && (
        <div className="relative overflow-hidden rounded-3xl p-8 bg-linear-to-r from-violet-600 to-fuchsia-700 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <Badge className="bg-white/15 text-white border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md h-auto px-3 py-1 gap-2">
              <Brain className="w-3.5 h-3.5 text-fuchsia-300" /> Tes Minat dan Bakat
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Temukan Jurusan Dengan Tes Penjurusan</h2>
            <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
              Belum menentukan arah studi? Kerjakan <strong>{total} pertanyaan minat &amp; bakat</strong> singkat — sistem akan menghitung kecenderungan rumpun Anda lalu merekomendasikan jurusan &amp; kampus yang paling sesuai.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 hidden lg:flex items-center justify-center opacity-10 pointer-events-none pr-6">
            <BookOpen className="w-72 h-72" />
          </div>
        </div>
      )}

      {(wizardStep === 'idle' || wizardStep === 'running' || wizardStep === 'result') && total === 0 && (
        <Card className="p-10 text-center bg-card border border-slate-100 dark:border-border rounded-3xl">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-white">Belum ada soal penjurusan</h3>
          <p className="text-sm text-slate-400 mt-1">Admin belum menambahkan bank soal. Silakan hubungi admin untuk mengaktifkan tes ini.</p>
        </Card>
      )}

      {phase === 'idle' && wizardStep === 'idle' && total > 0 && (
        <>
          <Card className="p-6 lg:p-10 rounded-3xl bg-card border border-slate-100 dark:border-border shadow-xs text-center max-w-3xl mx-auto gap-0">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg mb-4">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Siap Menemukan Arah?</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Tes terdiri dari <strong>{total} soal</strong>. Jawab sesuai insting Anda — tidak ada jawaban benar atau salah. Butuh sekitar 2 menit.
            </p>
            <Button onClick={start} size="lg" className="mt-6 px-8 py-3 h-auto rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg gap-2">
              <Target className="w-4 h-4" /> Mulai Tes Penjurusan
            </Button>
          </Card>

          {lastResult && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lihat hasil terakhir Anda</p>
              {renderResult(lastResult.dominant)}
            </div>
          )}
        </>
      )}

      {phase === 'running' && wizardStep === 'running' && current && (
        <Card className="p-6 lg:p-10 rounded-3xl bg-card border border-slate-100 dark:border-border shadow-xs max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="rounded-full text-[11px] font-bold text-slate-500">
              Soal {step + 1} / {total}
            </Badge>
            <span className="text-[11px] font-bold text-primary">{Math.round(((step + 1) / total) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6">
            <div className="h-2 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>

          <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-white leading-relaxed">
            {current.q.question}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {current.order.map((origIdx, i) => {
              const k = OPTION_KEYS[origIdx];
              const opt = current.q[`option_${k}`];
              const cl = current.q[`cluster_${k}` as keyof PenjurusanQuestion] as ClusterType;
              const w = (current.q[`weight_${k}` as keyof PenjurusanQuestion] as number) || 1;
              if (!opt) return null;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pick(cl, w)}
                  className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-border hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-border font-black text-violet-600 dark:text-violet-400 text-xs flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold leading-snug">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {phase === 'result' && wizardStep === 'result' && (() => {
        const dom = dominantOf(tally);
        return renderResult(dom);
      })()}

      {wizardStep === 'need_score' && renderNeedScore()}

      {wizardStep === 'campus_categories' && renderCampusCategories()}

      {selectedMajor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-slate-200 dark:border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-border flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">{displayProdiName(selectedMajor.name)}</h3>
                  <Badge className={cn('rounded-md text-[10px] font-bold text-white border-0', clusterStyle[selectedMajor.cluster as ClusterType]?.badge || 'bg-primary')}>
                    {selectedMajor.cluster}
                  </Badge>
                  <JenjangBadge jenjang={selectedMajor.jenjang} />
                </div>
                <p className="text-xs text-slate-400">
                  {loadingCampuses ? 'Memuat kampus...' : ''}
                </p>
              </div>
              <button onClick={() => setSelectedMajor(null)} className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {descCache[selectedMajor.id]?.found && descCache[selectedMajor.id]?.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apa yang Dipelajari</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{descCache[selectedMajor.id].description}</p>
                </div>
              )}
              {descCache[selectedMajor.id]?.found && descCache[selectedMajor.id]?.career_prospects && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> Prospek Kerja
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">{descCache[selectedMajor.id].career_prospects}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Kampus dengan Jurusan Ini
                </h4>
                {loadingCampuses ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Memuat daftar kampus...</span>
                  </div>
                ) : campusesForMajor.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Tidak ditemukan kampus lain dengan jurusan ini.</p>
                ) : (
                  <div className="space-y-2">
                    {campusesForMajor.map((item, idx) => (
                      <div key={`${item.major.id}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-border">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.institution.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[9px] font-bold h-auto px-1.5 py-0.5">{item.institution.type}</Badge>
                            <JenjangBadge jenjang={item.major.jenjang} />
                          </div>
                        </div>
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0 ml-3">PG {item.major.passing_grade_total ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-border space-y-3">
              <p className="text-[11px] text-slate-400">
                Target disimpan untuk jurusan <strong className="text-slate-600 dark:text-slate-300">{displayProdiName(selectedMajor.name)}</strong>
                {selectedMajor.institution_name ? <> (kampus: {selectedMajor.institution_name})</> : null}.
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { const m = selectedMajor; setSelectedMajor(null); handlePickMajor(m); }}
                  className="gap-1.5"
                >
                  <Building2 className="w-4 h-4" /> Lihat Rekomendasi Kampus
                </Button>
                {state.targetMajorIds.includes(selectedMajor.id) ? (
                  <Button disabled className="gap-2 bg-emerald-600 text-white hover:bg-emerald-600 opacity-100">
                    <CheckCircle2 className="w-4 h-4" /> Sudah Jadi Target
                  </Button>
                ) : (
                  <Button onClick={() => appStore.addTargetMajor(selectedMajor.id)} className="gap-2">
                    <Target className="w-4 h-4" /> Jadikan Prodi Target
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
