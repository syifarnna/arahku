import type { PostgrestError } from '@supabase/supabase-js';

// Supabase/PostgREST membatasi jumlah baris per request (default 1000). Query
// dengan `.limit(10000)` TIDAK mengembalikan 10000 baris — sisanya terpotong
// diam-diam. Helper ini mengambil seluruh baris lewat `.range()` per halaman.
export const SUPABASE_PAGE_SIZE = 1000;

// Batas aman agar loop tidak pernah berjalan tanpa henti bila server
// mengabaikan header Range (mis. salah konfigurasi reverse proxy).
const MAX_PAGES = 500;

interface RangeQuery<T> {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;
}

export interface FetchAllRowsOptions {
  pageSize?: number;
  maxRows?: number;
}

export interface FetchAllRowsResult<T> {
  data: T[];
  error: PostgrestError | null;
}

// `build` harus membuat query BARU setiap dipanggil dan sebaiknya memakai
// `.order()` yang deterministik (mis. id) agar batas halaman tidak bergeser.
export async function fetchAllRows<T>(
  build: () => RangeQuery<T>,
  options: FetchAllRowsOptions = {},
): Promise<FetchAllRowsResult<T>> {
  const pageSize = Math.max(1, options.pageSize ?? SUPABASE_PAGE_SIZE);
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const rows: T[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (rows.length >= maxRows) break;

    const size = Math.min(pageSize, maxRows - rows.length);
    const { data, error } = await build().range(offset, offset + size - 1);
    if (error) return { data: rows, error };

    const batch = data ?? [];
    if (batch.length === 0) break;

    rows.push(...batch);
    offset += batch.length;
  }

  return { data: rows, error: null };
}

// Buang baris duplikat berdasarkan kunci tertentu, mempertahankan kemunculan
// pertama. Baris tanpa kunci (null/kosong) selalu dipertahankan.
export function dedupeByKey<T>(
  rows: T[],
  keyOf: (row: T) => string | null | undefined,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const raw = keyOf(row);
    const key = raw == null ? '' : String(raw).trim();
    if (!key) {
      out.push(row);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
