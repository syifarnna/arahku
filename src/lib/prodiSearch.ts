import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { Major } from '../types';

export interface SearchMajorsParams {
  search?: string;
  jenjang?: string;
  rumpun?: string;
  institutionId?: number | null;
  sort?: 'pg' | 'name';
  page?: number;
  pageSize?: number;
}

export interface SearchMajorsResult {
  data: Major[];
  total: number;
}

export interface MajorsStats {
  universitas: number;
  totalProdi: number;
  s1: number;
  d4: number;
  d3: number;
  saintek: number;
  soshum: number;
  campuran: number;
}

export interface CampusPassingGradeRange {
  institution_id: number;
  institution_name: string;
  grade_campus: number | null;
  nilai_min: number | null;
  nilai_max: number | null;
  /** Format string "NilaiMin – NilaiMax" (mis. "75 – 92"), atau "-" jika belum ada data. */
  range: string;
}

// Backend: hitung rentang passing grade (MIN/MAX) per PTN dari seluruh prodi
// yang terhubung, lalu format jadi string "NilaiMin – NilaiMax" (atau "-").
export async function getCampusPassingGradeRanges(): Promise<CampusPassingGradeRange[]> {
  const { data, error } = await supabase.rpc('get_campus_pg_ranges');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  return rows.map((r) => {
    const nilaiMin = r.nilai_min != null ? Number(r.nilai_min) : null;
    const nilaiMax = r.nilai_max != null ? Number(r.nilai_max) : null;
    const range = nilaiMin != null && nilaiMax != null ? `${nilaiMin} – ${nilaiMax}` : '-';
    return {
      institution_id: Number(r.institution_id),
      institution_name: String(r.institution_name ?? ''),
      grade_campus: r.grade_campus != null ? Number(r.grade_campus) : null,
      nilai_min: nilaiMin,
      nilai_max: nilaiMax,
      range,
    };
  });
}


// Server-side search + pagination via RPC search_majors.
// total dikembalikan oleh RPC (count seluruh baris yang cocok sebelum offset).
export async function searchMajors(p: SearchMajorsParams = {}): Promise<SearchMajorsResult> {
  const { data, error } = await supabase.rpc('search_majors', {
    p_search: p.search?.trim() ?? '',
    p_jenjang: p.jenjang ?? '',
    p_rumpun: p.rumpun ?? '',
    p_institution_id: p.institutionId ?? null,
    p_sort: p.sort ?? 'pg',
    p_page: p.page ?? 1,
    p_page_size: p.pageSize ?? 25,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  const total = rows.length > 0 ? Number(rows[0].total) : 0;
  const majors: Major[] = rows.map((r: any) => {
    const { total: _t, ...rest } = r;
    return rest as Major;
  });
  return { data: majors, total };
}

// Statistik agregat global via RPC stats_majors.
export async function getMajorsStats(): Promise<MajorsStats | null> {
  const { data, error } = await supabase.rpc('stats_majors');
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : null) as Record<string, any> | null;
  if (!row) return null;
  return {
    universitas: Number(row.universitas ?? 0),
    totalProdi: Number(row.total_prodi ?? 0),
    s1: Number(row.s1 ?? 0),
    d4: Number(row.d4 ?? 0),
    d3: Number(row.d3 ?? 0),
    saintek: Number(row.saintek ?? 0),
    soshum: Number(row.soshum ?? 0),
    campuran: Number(row.campuran ?? 0),
  };
}

// Menunda nilai input search sampai user berhenti mengetik (missal 500ms),
// agar tidak melakukan hit RPC/DB di setiap ketukan keyboard.
export async function getPopularMajors(limit = 10): Promise<Major[]> {
  const { data, error } = await supabase.rpc('popular_majors', { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as Major[];
}

export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}