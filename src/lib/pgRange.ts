import type { Major } from '../types';
import { normalizeProdiKey } from './prodiName';

export interface PgRange {
  min: number;
  max: number;
}

// Rentang passing grade (terkecil-tertinggi) untuk tiap prodi. Prodi dengan nama
// yang sama dilihat sebagai satu prodi meski diberikan di beberapa kampus
// berbeda, sehingga rentang PG dihitung dari semua kampus yang menawarkan
// prodi tersebut.
export function buildProdiPgRanges(majors: Major[]): Map<string, PgRange> {
  const ranges = new Map<string, PgRange>();
  majors.forEach((m) => {
    const pg = m.passing_grade_total;
    if (pg == null || pg <= 0) return;
    const key = normalizeProdiKey(m.name);
    if (!key) return;
    const existing = ranges.get(key);
    if (!existing) {
      ranges.set(key, { min: pg, max: pg });
      return;
    }
    existing.min = Math.min(existing.min, pg);
    existing.max = Math.max(existing.max, pg);
  });
  return ranges;
}

// Format rentang PG untuk ditampilkan di kartu prodi, mis. "PG 540–620" atau
// "PG 620" bila semua kampus yang menawarkan prodi punya passing grade sama.
export function formatPgRange(range: PgRange | null | undefined, fallback?: string): string {
  if (!range) return fallback ?? '—';
  const value = range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
  return `PG ${value}`;
}
