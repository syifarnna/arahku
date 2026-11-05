import type { Institution, Major, PenjurusanQuestion } from '../types';

// Cache ringan master data agar blok rekomendasi tidak kosong saat reload.
// Hanya field yang dipakai UI yang disimpan supaya tetap di bawah kuota
// localStorage. Data dari server tetap menggantikan cache setelah fetch selesai.
const CACHE_KEY = 'tryoutku_master_v1';
const CACHE_VERSION = 1;

export interface MasterCacheSnapshot {
  institutions: Institution[];
  majors: Major[];
  questions: PenjurusanQuestion[];
}

interface StoredSnapshot extends MasterCacheSnapshot {
  version: number;
  saved_at: number;
}

const compactInstitution = (i: Institution): Institution => ({
  id: i.id,
  name: i.name,
  abbreviation: i.abbreviation,
  type: i.type,
  grade: i.grade,
  range_min: i.range_min,
  range_max: i.range_max,
});

const compactMajor = (m: Major): Major => ({
  id: m.id,
  institution_id: m.institution_id,
  institution_name: m.institution_name,
  institution_type: m.institution_type,
  code: m.code,
  name: m.name,
  cluster: m.cluster,
  jenjang: m.jenjang,
  daya_tampung: m.daya_tampung,
  peminat: m.peminat,
  passing_grade_total: m.passing_grade_total,
  year: m.year,
});

const isArray = (value: unknown): value is any[] => Array.isArray(value);

export function readMasterCache(): MasterCacheSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: any = JSON.parse(raw);
    if (!parsed || parsed.version !== CACHE_VERSION) return null;
    if (!isArray(parsed.institutions) || !isArray(parsed.majors) || !isArray(parsed.questions)) {
      return null;
    }
    if (parsed.majors.length === 0) return null;
    return {
      institutions: parsed.institutions,
      majors: parsed.majors,
      questions: parsed.questions,
    };
  } catch {
    return null;
  }
}

export function writeMasterCache(snapshot: MasterCacheSnapshot): void {
  try {
    const stored: StoredSnapshot = {
      version: CACHE_VERSION,
      saved_at: Date.now(),
      institutions: snapshot.institutions.map(compactInstitution),
      majors: snapshot.majors.map(compactMajor),
      questions: snapshot.questions,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(stored));
  } catch {
    // Kuota penuh / mode privat: cache bersifat opsional, jangan ganggu app.
  }
}
