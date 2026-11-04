import type { Institution } from '../types';

// Normalisasi teks untuk pencarian: lowercase + buang semua karakter non-alfanumerik.
// Contoh: "UPN \"VETERAN\" YOGYAKARTA" -> "upnveteranyogyakarta", "ITB" -> "itb".
export function normalizeForSearch(value?: string | null): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Daftar istilah pencarian sebuah kampus: nama, jenis, dan singkatan (boleh beberapa alias dipisah koma).
export function institutionSearchTerms(inst: Institution): string[] {
  const terms: string[] = [inst.name, inst.type].filter(
    (t): t is string => !!t
  );
  if (inst.abbreviation) {
    terms.push(
      ...inst.abbreviation
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
    );
  }
  return terms;
}

// Cek apakah kampus cocok dengan query (nama, jenis, atau singkatan).
export function matchesInstitution(inst: Institution, query: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return true;
  return institutionSearchTerms(inst).some((t) => normalizeForSearch(t).includes(q));
}

// Label tampilan kampus: "NAMA (SINGKATAN)" bila ada singkatan utama.
export function institutionLabel(inst: Institution): string {
  const primary = inst.abbreviation?.split(',')[0]?.trim();
  return primary ? `${inst.name} (${primary})` : inst.name;
}

// Singkatan utama (alias pertama) untuk ditampilkan sebagai badge.
export function primaryAbbreviation(inst: Institution): string | null {
  return inst.abbreviation?.split(',')[0]?.trim() || null;
}
