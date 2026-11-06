import { useState, useEffect } from 'react';
import {
  AnalysisSummary, 
  ClusterType,
  Competency, 
  GapAnalysisItem, 
  Institution, 
  Major, 
  PenjurusanQuestion,
  Profile, 
  TargetInstitution, 
  Tryout, 
  TryoutResult,
  TutoringCenter,
  UtbkScore
} from '../types';
import { 
  INITIAL_COMPETENCIES, 
  INITIAL_INSTITUTIONS, 
  INITIAL_MAJORS, 
  EMPTY_PROFILE, 
  INITIAL_RESULTS, 
  INITIAL_TRYOUTS 
} from './mockData';
import { supabase, setSupabaseCredentials } from './supabaseClient';
import { dedupeByKey, fetchAllRows } from './supabasePaging';
import { readMasterCache, writeMasterCache } from './masterCache';

// Label predikat capaian UTBK dari total score (sumber nilai tunggal: utbk_scores).
export function getUtbkPredicateLabel(totalScore: number): TryoutResult['predicate'] {
  if (totalScore >= 710) return 'Sangat Baik';
  if (totalScore >= 660) return 'Baik';
  if (totalScore >= 600) return 'Cukup';
  return 'Kurang';
}

// Bentuk TryoutResult yang dipakai view untuk riwayat nilai UTBK (hasil "Kerjakan
// Tryout" tidak lagi direkam; nilai yang tampil berasal dari utbk_scores).
export function toTryoutResultFromUtbkScore(s: UtbkScore, studentId: string): TryoutResult {
  return {
    id: s.id,
    user_id: s.user_id,
    student_id: studentId,
    tryout_id: -1,
    tryout_name: s.label || 'Input Nilai UTBK',
    tryout_type: 'UTBK SNBT',
    tryout_date: s.recorded_on,
    total_score: s.total_score,
    predicate: getUtbkPredicateLabel(s.total_score),
    created_at: s.created_at,
    scores: s.scores ?? {},
  };
}

export interface AppState {
  authChecked: boolean;
  isLoggedIn: boolean;
  rememberMe: boolean;
  profile: Profile;
  institutions: Institution[];
  majors: Major[];
  competencies: Competency[];
  tryouts: Tryout[];
  results: TryoutResult[];
  utbkScores: UtbkScore[];
  targetMajorIds: number[]; 
  activeTargetMajorId: number | null; 
  useRealSupabase: boolean; // Keep for compatibility but it's always true now
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  questions: PenjurusanQuestion[];
  tutoringCenters: TutoringCenter[];
  // Status pemuatan master data (prodi/kampus/soal). Dipakai view untuk
  // membedakan "belum selesai dimuat" dari "memang kosong".
  masterDataLoaded: boolean;
  masterDataError: string | null;
}

const DEFAULT_STATE: AppState = {
  authChecked: false,
  isLoggedIn: false, // Default to false, wait for Supabase Auth
  rememberMe: true,
  profile: EMPTY_PROFILE,
  institutions: [],
  majors: [],
  competencies: [],
  tryouts: [],
  results: [],
  utbkScores: [],
  targetMajorIds: [], 
  activeTargetMajorId: null, 
  useRealSupabase: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
  questions: [],
  tutoringCenters: [],
  masterDataLoaded: false,
  masterDataError: null,
};

class AppStore {
  private state: AppState;
  private listeners: Set<() => void> = new Set();
  private _masterDataAuthed = false;
  private _masterDataInFlight: Promise<void> | null = null;
  private _masterDataQueued = false;
  private _loginRecordedUserId: string | null = null;

  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.hydrateTargetsFromStorage();
    this.hydrateMasterCache();
    this.initAuth();
  }

  // Tampilkan data master terakhir dari cache agar halaman rekomendasi tidak
  // kosong saat reload. Data ini akan digantikan hasil fetch server.
  private hydrateMasterCache() {
    const snapshot = readMasterCache();
    if (!snapshot) return;
    if (snapshot.institutions.length > 0) {
      this.state.institutions = snapshot.institutions;
    }
    this.applyMajors(snapshot.majors);
    if (snapshot.questions.length > 0) {
      this.state.questions = snapshot.questions;
    }
    this.state.masterDataLoaded = true;
  }

  private persistTargetsSnapshot() {
    try {
      const snapshot = {
        version: 1,
        targetMajorIds: this.state.targetMajorIds,
        activeTargetMajorId: this.state.activeTargetMajorId || null,
        majors: this.getTargetMajors().map((m) => ({
          id: m.id,
          institution_id: m.institution_id,
          institution_name: m.institution_name,
          name: m.name,
          cluster: m.cluster,
          passing_grade_total: m.passing_grade_total,
        })),
      };
      localStorage.setItem('arahku_targets_v1', JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Gagal menyimpan target prodi ke localStorage:', e);
    }
  }

  private hydrateTargetsFromStorage() {
    try {
      // Migrasi sekali jalan dari key lama.
    try {
      if (localStorage.getItem('arahku_targets_v1') == null) {
        const old = localStorage.getItem('tryoutku_targets_v1');
        if (old != null) {
          localStorage.setItem('arahku_targets_v1', old);
          localStorage.removeItem('tryoutku_targets_v1');
        }
      }
    } catch {}
    const raw = localStorage.getItem('arahku_targets_v1');
      if (!raw) return;
      const snap = JSON.parse(raw);
      if (!snap || snap.version !== 1 || !Array.isArray(snap.targetMajorIds)) return;
      this.state.targetMajorIds = snap.targetMajorIds;
      if (snap.activeTargetMajorId != null) {
        this.state.activeTargetMajorId = snap.activeTargetMajorId;
      }
      if (Array.isArray(snap.majors)) {
        snap.majors.forEach((m: Major) => {
          if (!this.state.majors.find((x) => x.id === m.id)) {
            this.state.majors = [...this.state.majors, m];
          }
        });
      }
    } catch (e) {
      console.warn('Gagal memuat target prodi dari localStorage:', e);
    }
  }

  private async initAuth() {
    // Initial fetch of master data so it's ready even before login
    this.fetchMasterData();
    
    supabase.auth.onAuthStateChange((event, session) => {
      // Auth check selesai pada event pertama (INITIAL_SESSION / TOKEN_REFRESHED / dst)
      // sehingga UI tidak me-render AuthView sebelum status sesi dipastikan.
      this.state.authChecked = true;
      if (session?.user) {
        this.state.isLoggedIn = true;
        this.state.profile.email = session.user.email || '';
        this.syncFromSupabase(session.user.id);
        // Catat riwayat login (lokasi/IP) sekali per sesi saat benar-benar SIGNED_IN,
        // bukan saat pemulihan sesi (INITIAL_SESSION) / refresh token.
        if (event === 'SIGNED_IN' && this._loginRecordedUserId !== session.user.id) {
          this._loginRecordedUserId = session.user.id;
          this.recordLogin();
        }
        // Re-fetch master data dengan sesi yang sudah ter-authenticated.
        // Login pertama kadang fetch awal (anon) difilter RLS hingga prodi kosong.
        if (!this._masterDataAuthed) {
          this._masterDataAuthed = true;
          this.fetchMasterData();
        }
      } else {
        this.state.isLoggedIn = false;
        this.state.profile = { ...EMPTY_PROFILE };
        this.state.results = [];
        this.state.utbkScores = [];
        this.state.targetMajorIds = [];
        this._masterDataAuthed = false;
        this._loginRecordedUserId = null;
        try { localStorage.removeItem('arahku_targets_v1'); } catch (e) {}
        this.notify();
      }
    });

    // Safety net: bila backend Supabase tidak didefinisikan (VITE_SUPABASE_URL kosong),
    // onAuthStateChange mungkin tidak pernah terpanggil -> pastikan authChecked tetap true
    // agar aplikasi tidak terkunci di layar loading selamanya.
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        if (!this.state.authChecked) {
          this.state.authChecked = true;
          this.notify();
        }
      }, 500);
    }
  }

  public getState(): AppState {
    return this.state;
  }

  public updateProfileLocally(updates: Partial<Profile>) {
    this.state.profile = { ...this.state.profile, ...updates };
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify() {
    this.listeners.forEach(l => l());
  }

  public async logout() {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      this.state.isLoggedIn = false;
      this.state.profile = { ...EMPTY_PROFILE };
      this.notify();
      return;
    }
    await supabase.auth.signOut();
  }

  // Rekam riwayat login (IP + lokasi + perangkat) lewat Edge Function 'record-login'.
  // Best-effort: kegagalan tidak boleh mengganggu alur login.
  private async recordLogin() {
    try {
      await supabase.functions.invoke('record-login', { method: 'POST' });
    } catch (e) {
      console.warn('Gagal mencatat riwayat login:', e);
    }
  }

  public mockLogin(email: string, name?: string) {
    this.state.authChecked = true;
    this.state.isLoggedIn = true;
    this.state.profile = {
      ...EMPTY_PROFILE,
      id: 'demo-user-id',
      email: email,
      full_name: name || email.split('@')[0],
    };
    this.notify();
  }

  public async updateProfile(updated: Partial<Profile>) {
    this.state.profile = { ...this.state.profile, ...updated, updated_at: new Date().toISOString() };
    this.notify();
    try {
      const { error } = await supabase.from('profiles').upsert(this.state.profile);
      if (error) {
        console.warn('Sync profil ditolak:', error.message);
      }
    } catch (err) {
      console.warn('Supabase sync warning:', err);
    }
  }

  // Target Majors
  public syncMajorToState(major: Major) {
    if (!this.state.majors.find(m => m.id === major.id)) {
      this.state.majors = [...this.state.majors, major];
      this.notify();
    }
  }

  public async addTargetMajor(majorId: number) {
    if (!this.state.targetMajorIds.includes(majorId)) {
      this.state.targetMajorIds = [...this.state.targetMajorIds, majorId];
      if (!this.state.activeTargetMajorId) {
        this.state.activeTargetMajorId = majorId;
      }
      this.notify();
      this.persistTargetsSnapshot();
      
      try {
        const { data: sData } = await supabase.auth.getUser();
        const uid = sData?.user?.id || this.state.profile.id;
        await supabase.from('target_institutions').insert({
          user_id: uid,
          student_id: uid,
          major_id: majorId,
          priority: this.state.targetMajorIds.length
        });
      } catch (e) { console.warn('Supabase sync error', e); }
    }
  }

  public async removeTargetMajor(majorId: number) {
    this.state.targetMajorIds = this.state.targetMajorIds.filter(id => id !== majorId);
    if (this.state.activeTargetMajorId === majorId) {
      this.state.activeTargetMajorId = this.state.targetMajorIds[0] || null;
    }
    this.notify();
    this.persistTargetsSnapshot();

    try {
      const { data: sData } = await supabase.auth.getUser();
      const uid = sData?.user?.id || this.state.profile.id;
      await supabase.from('target_institutions')
        .delete()
        .match({ user_id: uid, major_id: majorId });
    } catch (e) { console.warn('Supabase sync error', e); }
  }

  public setActiveTargetMajor(majorId: number) {
    this.state.activeTargetMajorId = majorId;
    this.notify();
    this.persistTargetsSnapshot();
  }

  public async saveInterest(cluster: ClusterType): Promise<boolean> {
    this.state.profile = { ...this.state.profile, major_interest: cluster };
    this.notify();
    try {
      const { error } = await supabase.from('profiles').update({ major_interest: cluster }).eq('id', this.state.profile.id);
      if (error) {
        console.warn('Gagal simpan minat ke Supabase:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Gagal simpan minat ke Supabase:', e);
      return false;
    }
  }

  public async clearInterest(): Promise<boolean> {
    this.state.profile = { ...this.state.profile, major_interest: null };
    this.notify();
    try {
      const { error } = await supabase.from('profiles').update({ major_interest: null }).eq('id', this.state.profile.id);
      if (error) {
        console.warn('Gagal hapus minat di Supabase:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Gagal hapus minat di Supabase:', e);
      return false;
    }
  }

  // Tryout Results
  public async submitResult(tryoutId: number, scores: Record<string, number>) {
    const tr = this.state.tryouts.find(t => t.id === tryoutId) || INITIAL_TRYOUTS[0];
    const codes = Object.keys(scores);
    const sum = codes.reduce((acc, code) => {
      const comp = this.state.competencies.find(c => c.code === code);
      const weight = comp ? comp.weight : 1;
      return acc + (scores[code] * weight);
    }, 0);
    
    const totalWeight = codes.reduce((acc, code) => {
      const comp = this.state.competencies.find(c => c.code === code);
      return acc + (comp ? comp.weight : 1);
    }, 0) || 1;

    const finalTotal = Math.round((sum / totalWeight) * 10) / 10;
    
    let pred: TryoutResult['predicate'] = 'Kurang';
    if (finalTotal >= 710) pred = 'Sangat Baik';
    else if (finalTotal >= 660) pred = 'Baik';
    else if (finalTotal >= 600) pred = 'Cukup';

    const newResult: TryoutResult = {
      id: Date.now(), // temp id
      student_id: this.state.profile.id,
      tryout_id: tr.id,
      tryout_name: tr.name,
      tryout_type: tr.type,
      tryout_date: new Date().toISOString().split('T')[0],
      total_score: finalTotal,
      predicate: pred,
      created_at: new Date().toISOString(),
      scores
    };

    // Hasil tryout TIDAK lagi disimpan/direkam. Nilai yang dipakai di seluruh
    // halaman analisis hanya berasal dari "Input Nilai UTBK" di Dashboard
    // (tabel utbk_scores). Method ini tetap menghitung & mengembalikan hasil
    // agar modal "Kerjakan Tryout" bisa menampilkan skor sesaat tanpa persist.
    return newResult;
  }

  // Riwayat input nilai UTBK mandiri (form di Dashboard).
  // Data disimpan permanen di tabel utbk_scores agar dapat dirender ulang
  // setiap dashboard dibuka (lihat syncFromSupabase).
  private sortUtbkScores() {
    this.state.utbkScores = [...this.state.utbkScores].sort((a, b) => {
      const d = (b.recorded_on || '').localeCompare(a.recorded_on || '');
      if (d !== 0) return d;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }

  private async currentOwnerUid(): Promise<string> {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) return data.user.id;
    } catch { /* backend non-supabase */ }
    return this.state.profile.id;
  }

  public async addUtbkScore(input: {
    total_score: number;
    scores: Record<string, number>;
    label?: string | null;
    recorded_on?: string;
  }): Promise<UtbkScore | null> {
    const ownerUid = await this.currentOwnerUid();
    const recordedOn = input.recorded_on || new Date().toISOString().split('T')[0];
    const payload: Record<string, unknown> = {
      total_score: input.total_score,
      scores: input.scores,
      label: input.label ?? null,
      recorded_on: recordedOn,
    };
    if (ownerUid) payload.user_id = ownerUid;

    const optimistic: UtbkScore = {
      id: -Date.now(),
      user_id: ownerUid,
      total_score: input.total_score,
      scores: input.scores,
      label: input.label ?? null,
      recorded_on: recordedOn,
      created_at: new Date().toISOString(),
    };
    const prev = this.state.utbkScores;
    this.state.utbkScores = [optimistic, ...this.state.utbkScores];
    this.sortUtbkScores();
    this.notify();

    try {
      const { data: inserted, error } = await supabase.from('utbk_scores').insert(payload).select().single();
      if (error) {
        console.warn('Gagal menyimpan nilai UTBK ke Supabase:', error.message);
        this.state.utbkScores = prev;
        this.notify();
        return null;
      }
      this.state.utbkScores = this.state.utbkScores.map(s => (s.id === optimistic.id ? inserted : s));
      this.sortUtbkScores();
      this.notify();
      return inserted;
    } catch (err) {
      console.warn('Supabase sync error:', err);
      this.state.utbkScores = prev;
      this.notify();
      return null;
    }
  }

  public async updateUtbkScore(id: number, input: {
    total_score: number;
    scores: Record<string, number>;
    label?: string | null;
    recorded_on?: string;
  }): Promise<boolean> {
    const prev = this.state.utbkScores;
    this.state.utbkScores = this.state.utbkScores.map(s => (s.id === id ? {
      ...s,
      total_score: input.total_score,
      scores: input.scores,
      label: input.label ?? null,
      recorded_on: input.recorded_on || s.recorded_on,
    } : s));
    this.sortUtbkScores();
    this.notify();

    try {
      const { error } = await supabase.from('utbk_scores').update({
        total_score: input.total_score,
        scores: input.scores,
        label: input.label ?? null,
        ...(input.recorded_on ? { recorded_on: input.recorded_on } : {}),
      }).eq('id', id);
      if (error) {
        console.warn('Gagal memperbarui nilai UTBK:', error.message);
        this.state.utbkScores = prev;
        this.notify();
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase sync error:', err);
      this.state.utbkScores = prev;
      this.notify();
      return false;
    }
  }

  public async deleteUtbkScore(id: number): Promise<boolean> {
    const prev = this.state.utbkScores;
    this.state.utbkScores = this.state.utbkScores.filter(s => s.id !== id);
    this.notify();

    try {
      const { error } = await supabase.from('utbk_scores').delete().eq('id', id);
      if (error) {
        console.warn('Gagal menghapus nilai UTBK:', error.message);
        this.state.utbkScores = prev;
        this.notify();
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase sync error:', err);
      this.state.utbkScores = prev;
      this.notify();
      return false;
    }
  }

  public getUtbkLatest(): UtbkScore | null {
    return this.state.utbkScores[0] ?? null;
  }

  public getUtbkLatestScore(): number | null {
    return this.state.utbkScores[0]?.total_score ?? null;
  }

  // Analysis & Recommendation Engine.
  // Sumber nilai tunggal: "Input Nilai UTBK" di Dashboard (utbk_scores terbaru).
  // Hasil "Kerjakan Tryout" tidak lagi dipakai karena tidak lagi direkam.
  public getAnalysis(targetMajorId?: number | null): AnalysisSummary | null {
    const majorId = targetMajorId ?? this.state.activeTargetMajorId ?? this.state.targetMajorIds[0] ?? null;
    if (majorId == null) return null;
    const major = this.state.majors.find(m => m.id === majorId);
    if (!major) return null;

    const latest = this.getUtbkLatest();
    if (!latest) return null;

    const totalScore = latest.total_score;
    let predicate: TryoutResult['predicate'] = 'Kurang';
    if (totalScore >= 710) predicate = 'Sangat Baik';
    else if (totalScore >= 660) predicate = 'Baik';
    else if (totalScore >= 600) predicate = 'Cukup';

    const result: TryoutResult = {
      id: latest.id,
      user_id: latest.user_id ?? '',
      student_id: this.state.profile.id,
      tryout_id: -1,
      tryout_name: latest.label || 'Input Nilai UTBK',
      tryout_type: 'UTBK',
      tryout_date: latest.recorded_on,
      total_score: totalScore,
      predicate,
      scores: latest.scores || {},
      created_at: latest.created_at,
    };

    const isPassedTotal = result.total_score >= major.passing_grade_total;
    const totalGap = Math.round((result.total_score - major.passing_grade_total) * 10) / 10;

    const gaps: GapAnalysisItem[] = this.state.competencies.map(comp => {
      const score = result.scores[comp.code] || 0;
      const minReq = major.requirements && major.requirements[comp.code] 
        ? major.requirements[comp.code] 
        : Math.round(major.passing_grade_total * 0.95);
      
      const gap = Math.round((score - minReq) * 10) / 10;
      let status: GapAnalysisItem['status'] = 'Aman';
      if (gap < -50) status = 'Kritis';
      else if (gap < 0) status = 'Defisit';

      return {
        competency_code: comp.code,
        competency_name: comp.name,
        student_score: score,
        min_required: minReq,
        gap,
        status
      };
    });

    const deficitGaps = gaps.filter(g => g.gap < 0).sort((a, b) => a.gap - b.gap);
    const weakest = deficitGaps[0] || null;

    const userInterest = this.state.profile?.major_interest || 'Campuran';
    const alternatives = this.state.majors
      .filter(m => {
        if (m.id === major.id) return false;
        if (!m.passing_grade_total || m.passing_grade_total <= 0) return false;
        // Tampilkan prodi dengan PG hingga +15% di atas skor user (zona ambisius).
        // Prodi yang terlalu jauh (>15%) tidak relevan sebagai alternatif.
        const ratio = result.total_score / m.passing_grade_total;
        return ratio >= 0.85;
      })
      .map(m => {
        const pg = m.passing_grade_total || 1;
        const diff = result.total_score - pg;
        const ratio = result.total_score / pg;

        // Estimasi peluang berbasis rasio skor/PG:
        //   ≥ 1.00 → 85–99% (Aman)
        //   0.97–0.99 → 65–84% (Kompetitif)
        //   0.90–0.96 → 35–64% (Ambisius)
        //   0.85–0.89 → 10–34% (Sangat Ambisius)
        let chance: number;
        if (ratio >= 1.05) chance = 99;
        else if (ratio >= 1.00) chance = Math.round(85 + (ratio - 1.0) / 0.05 * 14);
        else if (ratio >= 0.97) chance = Math.round(65 + (ratio - 0.97) / 0.03 * 19);
        else if (ratio >= 0.90) chance = Math.round(35 + (ratio - 0.90) / 0.07 * 29);
        else chance = Math.round(10 + (ratio - 0.85) / 0.05 * 24);
        chance = Math.max(5, Math.min(99, chance));

        // Boost for matching cluster
        let matchScore = 0;
        if (m.cluster === userInterest || userInterest === 'Campuran') matchScore = 1;

        return {
          ...m,
          chance_percentage: chance,
          gap_diff: Math.round(diff * 10) / 10,
          _matchScore: matchScore
        };
      })
      .sort((a, b) => {
        if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
        if (b.chance_percentage !== a.chance_percentage) return b.chance_percentage - a.chance_percentage;
        if (a.gap_diff !== b.gap_diff) return b.gap_diff - a.gap_diff;
        return (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, 12);

    return {
      target_major: major,
      latest_result: result,
      is_passed_total: isPassedTotal,
      total_gap: totalGap,
      gaps,
      weakest_competency: weakest,
      alternative_majors: alternatives
    };
  }

  public setSupabaseCfg(url: string, key: string, enable: boolean) {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    localStorage.setItem('supabase_url', cleanUrl);
    localStorage.setItem('supabase_anon_key', cleanKey);

    if (enable) {
      setSupabaseCredentials(cleanUrl, cleanKey);
    }

    this.state.useRealSupabase = enable;
    this.state.supabaseUrl = cleanUrl;
    this.state.supabaseAnonKey = cleanKey;
    this.notify();
  }

  public async forceSeedDemoData(): Promise<{ success: boolean; text: string }> {
     return { success: false, text: "Silakan seed menggunakan SQL Blueprint di dashboard Supabase." };
  }
  
  // Ganti seluruh daftar prodi di state, sekaligus:
  //  1) membuang duplikat berdasarkan `code` (id terkecil dipertahankan, sama
  //     seperti cleanup SQL), dan
  //  2) memetakan ulang target prodi yang menunjuk ke id duplikat agar tidak
  //     hilang setelah dedupe.
  private applyMajors(rows: Major[]) {
    const previousById = new Map(this.state.majors.map(m => [m.id, m]));
    const kept: Major[] = [];
    const keptIdByCode = new Map<string, number>();
    const droppedCodeById = new Map<number, string>();

    for (const row of rows) {
      const code = (row.code || '').trim();
      if (!code) {
        kept.push(row);
        continue;
      }
      if (keptIdByCode.has(code)) {
        droppedCodeById.set(row.id, code);
        continue;
      }
      keptIdByCode.set(code, row.id);
      kept.push(row);
    }

    this.state.majors = kept;

    if (this.state.targetMajorIds.length > 0) {
      const present = new Set(kept.map(m => m.id));
      const remapped = this.state.targetMajorIds.map(id => {
        if (present.has(id)) return id;
        const code =
          droppedCodeById.get(id) ||
          ((previousById.get(id)?.code || '').trim() || undefined);
        if (!code) return id;
        return keptIdByCode.get(code) ?? id;
      });
      this.state.targetMajorIds = Array.from(new Set(remapped));
      if (
        this.state.activeTargetMajorId != null &&
        !this.state.targetMajorIds.includes(this.state.activeTargetMajorId)
      ) {
        this.state.activeTargetMajorId = this.state.targetMajorIds[0] ?? null;
      }
    }
  }

  // Satu fetch master pada satu waktu. Kalau ada permintaan baru saat fetch
  // berjalan (mis. sesi login baru siap), jalankan sekali lagi setelahnya agar
  // data yang terfilter RLS tidak tertinggal.
  public fetchMasterData(): Promise<void> {
    if (this._masterDataInFlight) {
      this._masterDataQueued = true;
      return this._masterDataInFlight;
    }
    const run = async () => {
      try {
        await this.loadMasterData();
      } finally {
        this._masterDataInFlight = null;
        if (this._masterDataQueued) {
          this._masterDataQueued = false;
          await this.fetchMasterData();
        } else if (!this.state.masterDataLoaded) {
          // Selesai tanpa data (mis. DB memang kosong) -> jangan biarkan UI
          // menampilkan loading selamanya.
          this.state.masterDataLoaded = true;
          this.notify();
        }
      }
    };
    this._masterDataInFlight = run();
    return this._masterDataInFlight;
  }

  private async loadMasterData() {
    let masterError: string | null = null;
    try {
      // Query prodi memakai join; kalau join gagal, ulangi tanpa join.
      const majorsPromise = (async () => {
        const joined = await fetchAllRows<any>(() =>
          supabase
            .from('majors')
            .select('*, institutions(name, type)')
            .order('id', { ascending: true }) as any,
        );
        if (!joined.error) return joined;
        console.warn('Error fetching majors master:', joined.error);
        const fallback = await fetchAllRows<any>(() =>
          supabase.from('majors').select('*').order('id', { ascending: true }) as any,
        );
        if (!fallback.error) return fallback;
        masterError = joined.error.message || fallback.error.message;
        return fallback;
      })();

      // Fetch independen dijalankan bersamaan supaya waktu load tidak menumpuk.
      const [tryoutsRes, instRes, majorsRes, questionsRes, tutoringRes, compRes] = await Promise.all([
        supabase.from('tryouts').select('*').order('id', { ascending: false }),
        fetchAllRows<Institution>(() =>
          supabase.from('institutions').select('*').order('id', { ascending: true }) as any,
        ),
        majorsPromise,
        supabase.from('penjurusan_questions').select('*').order('id', { ascending: true }),
        supabase.from('tutoring_centers').select('*').order('id', { ascending: true }),
        supabase.from('competencies').select('*').order('code', { ascending: true }),
      ]);

      if (tryoutsRes.data && tryoutsRes.data.length > 0) this.state.tryouts = tryoutsRes.data;

      const instData = dedupeByKey(instRes.data, (row) => String(row.id));
      if (instData.length > 0) this.state.institutions = instData;

      const majorsData = majorsRes.data;
      if (majorsData.length > 0) {
        this.applyMajors(majorsData.map((m: any) => ({
          ...m,
          institution_name: m.institutions?.name,
          institution_type: m.institutions?.type,
        })));
      }

      if (questionsRes.data && questionsRes.data.length > 0) {
        this.state.questions = questionsRes.data;
      }

      if (tutoringRes.data && tutoringRes.data.length > 0) {
        this.state.tutoringCenters = tutoringRes.data;
      }

      if (compRes.data && compRes.data.length > 0) {
        this.state.competencies = compRes.data;
      }

      // fetch ini MENGGANTI state.majors, sehingga resolve target yang berjalan lebih
      // awal saat login bisa tertimpa. Reconcile ulang di akhir agar prodi target
      // selalu hadir (dan dashboard tidak kosong sampai membuka halaman Target).
      if (this.state.isLoggedIn && this.state.targetMajorIds.length > 0) {
        await this.resolveTargetMajors();
      }
    } catch (err) {
      masterError = err instanceof Error ? err.message : 'Gagal memuat data master.';
      console.warn('Gagal memuat data master dari Supabase:', err);
    } finally {
      this.state.masterDataError = masterError;
      if (this.state.majors.length > 0) {
        this.state.masterDataLoaded = true;
        writeMasterCache({
          institutions: this.state.institutions,
          majors: this.state.majors,
          questions: this.state.questions,
        });
      }
      this.notify();
    }
  }

  public async syncFromSupabase(authUserId?: string) {
    try {
      const targetAuthId = authUserId || this.state.profile.id;
      
      // Query profiles by auth_uid OR id just in case we already have the real id
      let profData;
      const { data: profByAuth, error: pErr1 } = await supabase.from('profiles').select('*').eq('auth_uid', targetAuthId).limit(1);
      
      if (!pErr1 && profByAuth && profByAuth.length > 0) {
        profData = profByAuth[0];
      } else {
        // Fallback to query by id (if no auth_uid match)
        const { data: profById, error: pErr2 } = await supabase.from('profiles').select('*').eq('id', targetAuthId).limit(1);
        if (!pErr2 && profById && profById.length > 0) {
          profData = profById[0];
        }
      }

      if (profData) {
        this.state.profile = { 
          ...this.state.profile, 
          ...profData
        };
      }

      // Tabel tryout_results sudah dihapus (sumber nilai tunggal = utbk_scores),
      // jadi daftar hasil tryout sengaja dibiarkan kosong.
      this.state.results = [];

      const { data: utbkData, error: uErr } = await supabase.from('utbk_scores').select('*').eq('user_id', targetAuthId).order('recorded_on', { ascending: false });
      if (!uErr && utbkData) {
        this.state.utbkScores = utbkData;
      }

      await this.ensureTargetMajorsLoaded();

      this.notify();
    } catch (err) {
      console.warn('Gagal sinkron data Live Supabase:', err);
    }
  }

  public getTargetMajors(): Major[] {
    return this.state.targetMajorIds
      .map(id => this.state.majors.find(m => m.id === id))
      .filter((m): m is Major => !!m);
  }

  // Pastikan semua prodi yang terdaftar sebagai target tersedia di state global.
  // Diperlukan karena badge di Navbar membaca targetMajorIds (sejak awal), sedangkan
  // daftar Halaman Target bergantung pada resolution terhadap state.majors yang bisa
  // tertinggal karena timing fetch master data (anon vs authenticated) / RLS.
  public async resolveTargetMajors(): Promise<void> {
    const ids = [...this.state.targetMajorIds];
    if (ids.length === 0) return;
    const missingIds = ids.filter(id => !this.state.majors.some(m => m.id === id));
    if (missingIds.length === 0) return;
    try {
      const { data, error } = await fetchAllRows<any>(() =>
        supabase
          .from('majors')
          .select('*, institutions(name, type)')
          .in('id', missingIds)
          .order('id', { ascending: true }) as any,
        { maxRows: 5000 },
      );
      if (error) {
        console.warn('Gagal menyelesaikan prodi target dari Supabase:', error.message);
        return;
      }
      if (data.length === 0) return;
      const mapped: Major[] = dedupeByKey(
        data.map((m: any) => ({
          ...m,
          institution_name: m.institutions?.name,
          institution_type: m.institutions?.type,
        })),
        (m) => m.code || String(m.id),
      );
      const known = new Set(this.state.majors.map(x => x.id));
      const merged = mapped.filter(x => !known.has(x.id));
      if (merged.length > 0) {
        this.state.majors = [...this.state.majors, ...merged];
        this.notify();
      }
    } catch (err) {
      console.warn('Gagal menyelesaikan prodi target dari Supabase:', err);
    }
  }

  // Muat data Target Institut (target_institutions) + resolve prodi target ke state.
  // Dipanggil di syncFromSupabase saat login dan dipicu ulang dari DashboardView
  // agar ringkasan "Pilihan Prodi Anda" langsung terisi tanpa membuka halaman Target.
  // Query memakai auth uid agar konsisten dengan RLS (own_select membandingkan
  // user_id dengan auth.uid(); profile.id bisa berbeda dari auth.uid).
  public async ensureTargetMajorsLoaded(): Promise<void> {
    try {
      let ownerUid = this.state.profile.id;
      try {
        const { data: sData } = await supabase.auth.getUser();
        if (sData?.user?.id) ownerUid = sData.user.id;
      } catch { /* backend non-supabase */ }

      if (ownerUid) {
        const { data: targetsData } = await supabase.from('target_institutions')
          .select('*')
          .eq('user_id', ownerUid)
          .order('priority', { ascending: true });
        if (targetsData && targetsData.length > 0) {
          this.state.targetMajorIds = targetsData.map(t => t.major_id);
          if (!this.state.activeTargetMajorId && this.state.targetMajorIds.length > 0) {
            this.state.activeTargetMajorId = this.state.targetMajorIds[0];
          }
        }
      }

      // Pastikan row prodi target sudah ada di state sebelum snapshot & render.
      await this.resolveTargetMajors();
      this.persistTargetsSnapshot();
      this.notify();
    } catch (err) {
      console.warn('Gagal memuat target institut dari Supabase:', err);
    }
  }

  // Admin Management Methods
  public async addTryout(tryout: Tryout) {
    this.state.tryouts = [tryout, ...this.state.tryouts];
    this.notify();
    try { await supabase.from('tryouts').insert(tryout); } catch (e) {}
  }

  public async deleteTryout(id: number) {
    this.state.tryouts = this.state.tryouts.filter(t => t.id !== id);
    this.notify();
    try { await supabase.from('tryouts').delete().eq('id', id); } catch (e) {}
  }

  public async addMajor(major: Major) {
    const { id, ...majorWithoutId } = major as any;
    const { data, error } = await supabase.from('majors').insert(majorWithoutId).select().single();
    if (!error && data) {
      this.state.majors = [data, ...this.state.majors];
      this.notify();
    }
  }

  public async deleteMajor(id: number) {
    const { error } = await supabase.from('majors').delete().eq('id', id);
    if (!error) {
      this.state.majors = this.state.majors.filter(m => m.id !== id);
      this.notify();
    }
  }

  public async updateMajor(major: Major) {
    this.state.majors = this.state.majors.map(m => (m.id === major.id ? { ...major } : m));
    this.notify();
    try {
      const { id, institution_name, institution_type, ...rest } = major as any;
      const { error } = await supabase.from('majors').update(rest).eq('id', id);
      if (error) console.warn('Gagal update prodi:', error.message);
    } catch (e) {
      console.warn('Gagal update prodi:', e);
    }
  }

  // Load prodi untuk satu kampus (dipanggil saat kampus tujuan dipilih).
  // Mengembalikan daftar prodi lengkap kampus tsb & menggabungkannya ke state global (dedup).
  public async loadMajorsForInstitution(institutionId: number): Promise<Major[]> {
    try {
      const { data, error } = await fetchAllRows<any>(() =>
        supabase
          .from('majors')
          .select('*, institutions(name, type)')
          .eq('institution_id', institutionId)
          .order('id', { ascending: true }) as any,
      );
      if (error) {
        console.warn('Gagal memuat prodi kampus:', error.message);
        return this.state.majors.filter(m => m.institution_id === institutionId);
      }
      const existing = this.state.majors.filter(m => m.institution_id === institutionId);
      if (data.length === 0) return existing;
      const mapped: Major[] = dedupeByKey(
        data.map((m: any) => ({
          ...m,
          institution_name: m.institutions?.name,
          institution_type: m.institutions?.type,
        })),
        (m) => m.code || String(m.id),
      );
      const known = new Set(this.state.majors.map(x => x.id));
      const merged = mapped.filter(x => !known.has(x.id));
      if (merged.length > 0) {
        this.state.majors = [...this.state.majors, ...merged];
        this.notify();
      }
      return [...mapped].sort(
        (a, b) => (a.passing_grade_total || 0) - (b.passing_grade_total || 0),
      );
    } catch (err) {
      console.warn('Gagal memuat prodi kampus:', err);
      return this.state.majors.filter(m => m.institution_id === institutionId);
    }
  }

  // Admin: Kelola Kampus & Grade Campus / Range Nilai
  public async addInstitution(inst: Omit<Institution, 'id'> & { id?: number }) {
    const { id: _ignored, ...payload } = inst as any;
    const { data, error } = await supabase.from('institutions').insert(payload).select().single();
    if (!error && data) {
      this.state.institutions = [...this.state.institutions, data];
      this.notify();
      return data;
    }
    if (error) console.warn('Gagal tambah kampus:', error.message);
    return null;
  }

  public async updateInstitution(inst: Institution) {
    const { data, error } = await supabase.from('institutions')
      .update({
        name: inst.name,
        type: inst.type,
        grade: inst.grade ?? null,
        range_min: inst.range_min ?? null,
        range_max: inst.range_max ?? null,
      })
      .eq('id', inst.id)
      .select()
      .single();
    if (!error && data) {
      this.state.institutions = this.state.institutions.map(i => i.id === data.id ? data : i);
      this.notify();
    }
    if (error) console.warn('Gagal update kampus:', error.message);
  }

  public async deleteInstitution(id: number) {
    const { error } = await supabase.from('institutions').delete().eq('id', id);
    if (!error) {
      this.state.institutions = this.state.institutions.filter(i => i.id !== id);
      this.notify();
    }
    if (error) console.warn('Gagal hapus kampus:', error.message);
  }

  // Admin: Bank Soal Penjurusan
  public async addQuestion(q: Omit<PenjurusanQuestion, 'id' | 'created_at'> & { id?: number }) {
    const { id: _ignored, created_at: __ignored, ...payload } = q as any;
    const { data, error } = await supabase.from('penjurusan_questions').insert(payload).select().single();
    if (!error && data) {
      this.state.questions = [...this.state.questions, data];
      this.notify();
      return data;
    }
    if (error) console.warn('Gagal tambah soal:', error.message);
    return null;
  }

  public async updateOptionWeight(id: number, option: 'a' | 'b' | 'c' | 'd', weight: number) {
    const w = Math.min(5, Math.max(1, Math.round(weight)));
    const patch = { [`weight_${option}`]: w } as Record<string, number>;
    const { error } = await supabase.from('penjurusan_questions').update(patch).eq('id', id);
    if (!error) {
      this.state.questions = this.state.questions.map(q => q.id === id ? { ...q, ...patch } : q);
      this.notify();
      return true;
    }
    if (error) console.warn('Gagal update bobot jawaban:', error.message);
    return false;
  }

  public async toggleQuestionActive(id: number, isActive: boolean) {
    const { error } = await supabase.from('penjurusan_questions').update({ is_active: isActive }).eq('id', id);
    if (!error) {
      this.state.questions = this.state.questions.map(q => q.id === id ? { ...q, is_active: isActive } : q);
      this.notify();
    }
  }

  public async deleteQuestion(id: number) {
    const { error } = await supabase.from('penjurusan_questions').delete().eq('id', id);
    if (!error) {
      this.state.questions = this.state.questions.filter(q => q.id !== id);
      this.notify();
    }
    if (error) console.warn('Gagal hapus soal:', error.message);
  }
}

// Admin utama (super admin). Satu-satunya akun yang boleh mengubah peran
// pengguna dan melihat riwayat login seluruh akun (lihat is_super_admin() di DB).
export const SUPER_ADMIN_ID = '38f32ff8-1940-44ca-9457-0a52d0fbc2fe';

export const appStore = new AppStore();

export function useAppState() {
  const [state, setState] = useState<AppState>(appStore.getState());
  useEffect(() => {
    return appStore.subscribe(() => {
      setState({ ...appStore.getState() });
    });
  }, []);
  return state;
}
