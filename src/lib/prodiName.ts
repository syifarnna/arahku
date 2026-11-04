// Normalisasi nama prodi dari dataset PTN (dump Mediascanter).
// Format data bisa berbeda-beda:
//   - data lama : "TEKNIK INFORMATIKA - UGM"
//   - data baru : "TEKNIK INFORMATIKA"
//   - variasi   : "TEKNIK GRAFIKA (PSDKU MEDAN) (D-III)"
//   - variasi   : "ANIRY ACEH - ARSITEKTUR"
//   - variasi   : "FAKULTAS TEKNIK SIPIL DAN LINGKUNGAN - INFRASTRUKTUR SIPIL"
// Helper ini menghasilkan kunci yang konsisten untuk pengelompokan & pencarian,
// sekaligus nama tampilan yang rapi (Title Case).

// Penanda bahwa salah satu segmen "A - B" adalah nama kampus/fakultas, bukan prodi.
// Sengaja memakai kata utuh agar prodi seperti "PENDIDIKAN GURU SEKOLAH DASAR"
// tidak ikut terdeteksi sebagai kampus.
const CAMPUS_PART_RE =
  /\b(FAKULTAS|KAMPUS|PSDKU|UPBJJ|UNIVERSITAS|INSTITUT|POLITEKNIK|AKADEMI|SEKOLAH TINGGI|UIN|IAIN|STAIN|STKIP|STIE|ISBI|ISI|ANIRY|UT)\b/;

// Anotasi dalam kurung yang bukan bagian nama prodi:
// jenjang (D-III/D-IV/S1), cabang (KAMPUS/PSDKU/UT), dan varian (NK/PGSD/PGPAUD).
const isStrippableAnnotation = (inner: string): boolean =>
  /^(KAMPUS|PSDKU|UPBJJ|UT)\b/i.test(inner) ||
  /^D-?(III|IV)$/i.test(inner) ||
  /^S[123]$/i.test(inner) ||
  /^(NK|PGSD|PGPAUD)$/i.test(inner);

const stripAnnotations = (value: string): string => {
  let s = value.replace(/\s+/g, ' ').trim();
  // Ulangi karena anotasi bisa bertingkat / berurutan, mis. "(PSDKU MEDAN) (D-III)".
  for (;;) {
    const next = s
      .replace(/\(([^()]*)\)/g, (full, inner) =>
        isStrippableAnnotation(String(inner).trim()) ? ' ' : full
      )
      .replace(/\s+/g, ' ')
      .trim();
    if (next === s) return s;
    s = next;
  }
};

// Ambil bagian nama prodi dari format "KAMPUS/FAKULTAS - PRODI".
const pickProdiPart = (value: string): string => {
  if (!value.includes(' - ')) return value;
  const parts = value
    .split(/\s+-\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return parts[0] || value;

  const prodiParts = parts.filter((part) => !CAMPUS_PART_RE.test(part));
  if (prodiParts.length > 0 && prodiParts.length < parts.length) {
    return prodiParts.join(' - ');
  }
  // Tidak ada segmen yang jelas kampus: asumsikan format lama "PRODI - KAMPUS"
  // (prodi berada di depan).
  return parts[0];
};

const normalizeBase = (name?: string | null): string => {
  let s = String(name || '')
    .replace(/\s+/g, ' ')
    .trim();

  // Pola "PRODI (PGSD) KEBUMEN" / "PRODI (PGSD) S1": anotasi diikuti satu kata
  // penanda cabang/jenjang di belakang -> buang kata tersebut juga.
  s = s.replace(/\(([^()]*)\)\s+([A-Za-z0-9.]+)\s*$/, (full, inner) =>
    isStrippableAnnotation(String(inner).trim()) ? ' ' : full
  );

  s = stripAnnotations(s);
  s = pickProdiPart(s);

  // Penanda cabang di depan nama prodi, mis. "PSDKU TEKNIK INFORMATIKA KAB. NGANJUK".
  s = s.replace(/^(KAMPUS|PSDKU|UPBJJ)\s+/i, '');

  // Buang sisa penanda cabang di belakang, mis. "- KAMPUS CIREBON",
  // "PSDKU PANGANDARAN", atau "KAMPUS BUMI SILIWANGI".
  s = s.replace(/\s*[-–]?\s*\b(KAMPUS|PSDKU|UPBJJ)\b.*$/i, '');

  // Buang jenjang yang tertulis tanpa tanda kurung di akhir nama.
  s = s.replace(/\s+(S[123]|D-?(III|IV))$/i, '');

  // Samakan singkatan umum agar variannya tergabung.
  s = s.replace(/\bPEND\.\s*/gi, 'PENDIDIKAN ');
  s = s.replace(/\bPEND\b/gi, 'PENDIDIKAN');

  return s.replace(/\s+/g, ' ').trim();
};

// Kunci pengelompokan: uppercase, tanpa tanda baca.
export function normalizeProdiKey(name?: string | null): string {
  return normalizeBase(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

// Nama tampilan: Title Case dari nama yang sudah dibersihkan.
export function displayProdiName(name?: string | null): string {
  const base = normalizeBase(name);
  if (!base) return '';
  return base
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
}
