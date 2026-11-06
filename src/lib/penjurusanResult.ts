import type { ClusterType } from '../types';

// Hasil Tes Penjurusan disimpan di localStorage agar rekomendasi terakhir tetap
// tampil setelah reload. Data lama bisa saja memiliki bentuk yang berbeda, jadi
// selalu divalidasi sebelum dipakai supaya view tidak crash / tampil kosong.
export const PENJURUSAN_STORAGE_KEY = 'arahku_penjurusan_v3';
const OLD_PENJURUSAN_STORAGE_KEY = 'tryoutku_penjurusan_v3';

function migratePenjurusanKey() {
  try {
    if (localStorage.getItem(PENJURUSAN_STORAGE_KEY) != null) return;
    const old = localStorage.getItem(OLD_PENJURUSAN_STORAGE_KEY);
    if (old == null) return;
    localStorage.setItem(PENJURUSAN_STORAGE_KEY, old);
    localStorage.removeItem(OLD_PENJURUSAN_STORAGE_KEY);
  } catch {
    // Penyimpanan lokal bisa gagal (mode privat / kuota penuh); abaikan.
  }
}

export interface SavedPenjurusanResult {
  dominant: ClusterType;
  tally: Record<ClusterType, number>;
}

const CLUSTERS: ClusterType[] = ['Saintek', 'Soshum', 'Campuran'];

const isCluster = (value: unknown): value is ClusterType =>
  typeof value === 'string' && (CLUSTERS as string[]).includes(value);

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

export function readPenjurusanResult(): SavedPenjurusanResult | null {
  migratePenjurusanKey();
  try {
    const raw = localStorage.getItem(PENJURUSAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: any = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isCluster(parsed.dominant)) return null;

    const tally: Record<ClusterType, number> = {
      Saintek: toCount(parsed.tally?.Saintek),
      Soshum: toCount(parsed.tally?.Soshum),
      Campuran: toCount(parsed.tally?.Campuran),
    };
    if (tally.Saintek + tally.Soshum + tally.Campuran === 0) return null;

    return { dominant: parsed.dominant, tally };
  } catch {
    return null;
  }
}

export function savePenjurusanResult(result: SavedPenjurusanResult): void {
  try {
    localStorage.setItem(PENJURUSAN_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Penyimpanan lokal bisa gagal (mode privat / kuota penuh); abaikan.
  }
}
