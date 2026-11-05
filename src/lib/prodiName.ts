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
  /\b(KAMPUS|PSDKU|UPBJJ)\b/i.test(inner) ||
  /^(KAMPUS|PSDKU|UPBJJ|UT)\b/i.test(inner) ||
  /^D-?(III|IV)$/i.test(inner) ||
  /^S[123]$/i.test(inner) ||
  /^(NK|PGSD|PG\s?-?PAUD)$/i.test(inner);

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

// Kunci mentah: uppercase, tanpa tanda baca. Dipakai sebelum alias diterapkan.
const rawProdiKey = (name?: string | null): string =>
  normalizeBase(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

// Gabungkan nama prodi yang sebenarnya merujuk ke program studi yang sama.
// Sengaja memakai daftar alias eksplisit (bukan fuzzy matching) agar prodi yang
// mirip tetapi berbeda — mis. "Pendidikan Matematika" vs "Matematika", atau
// "Kedokteran" vs "Kedokteran Gigi" — tidak ikut tergabung.
type AliasGroup = { canonical: string; variants: string[] };

const ALIAS_GROUPS: AliasGroup[] = [
  {
    canonical: 'Ilmu Hukum',
    variants: ['HUKUM', 'IL. HUKUM', 'ILMU HUKUM (IH)'],
  },
  {
    canonical: 'Pendidikan Guru Sekolah Dasar',
    variants: ['PGSD', 'PGSD (PENDIDIKAN GURU SEKOLAH DASAR)'],
  },
  {
    canonical: 'Pendidikan Guru PAUD',
    variants: [
      'PAUD',
      'PG PAUD',
      'PGPAUD',
      'PENDIDIKAN GURU PENDIDIKAN ANAK USIA DINI',
      'PENDIDIKAN ANAK USIA DINI',
    ],
  },
  {
    canonical: 'Ilmu Gizi',
    variants: ['GIZI'],
  },
  {
    canonical: 'Kedokteran',
    variants: ['PEND. KEDOKTERAN', 'KEDOKTERAN (FIKKIA BANYUWANGI)'],
  },
  {
    canonical: 'Ilmu Administrasi Negara',
    variants: [
      'ADM. NEGARA',
      'IL. ADM. NEGARA',
      'ILMU ADM NEGARA',
      'ILMU ADM. NEGARA',
      'ADMINISTRASI NEGARA',
    ],
  },
  {
    canonical: 'Ilmu Administrasi Niaga/Bisnis',
    variants: [
      'ILMU ADM.NIAGA',
      'ILMU ADM. NIAGA/BISNIS',
      'ILMU ADMINISTRASI NIAGA',
      'ILMU ADMINISTRASI BISNIS',
    ],
  },
  {
    canonical: 'Desain Komunikasi Visual',
    variants: ['DESAIN DAN KOMUNIKASI VISUAL'],
  },
  {
    canonical: 'Pendidikan Teknik Informatika dan Komputer',
    variants: [
      'PENDIDIKAN TEKNIK INFORMATIKA',
      'PENDIDIKAN TEKNIK INFORMATIKA & KOMPUTER',
      'PENDIDIKAN TEKNOLOGI INFORMATIKA DAN KOMPUTER',
    ],
  },
  {
    canonical: 'Teknik Informatika',
    variants: [
      'INFORMATIKA',
      'PSDKU TEKNIK INFORMATIKA KAB. NGANJUK (D-IV)',
      'PSDKU TEKNIK INFORMATIKA KAB. SIDOARJO (D-IV)',
    ],
  },
  {
    canonical: 'Manajemen',
    variants: ['MANAJEMEN BISNIS'],
  },
  {
    canonical: 'Ilmu Komunikasi',
    variants: ['SAINS KOMUNIKASI'],
  },
  {
    canonical: 'Ilmu Perpustakaan',
    variants: ['ILMU INFORMASI DAN PERPUSTAKAAN', 'ILMU PERPUSTAKAAN (IP)'],
  },
];

const ALIAS_BY_KEY = new Map<string, { key: string; label: string }>();
ALIAS_GROUPS.forEach((group) => {
  const key = rawProdiKey(group.canonical);
  ALIAS_BY_KEY.set(key, { key, label: group.canonical });
  group.variants.forEach((variant) => {
    ALIAS_BY_KEY.set(rawProdiKey(variant), { key, label: group.canonical });
  });
});

// Singkatan yang harus tetap uppercase saat ditampilkan.
const TITLE_CASE_ACRONYMS = new Set([
  'PG', 'PGSD', 'PGPAUD', 'PAUD', 'DKV', 'NK', 'IH', 'IP', 'UT',
  'S1', 'S2', 'S3', 'III', 'IV',
]);

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (!word) return '';
      return word
        .split('-')
        .map((part) => {
          if (!part) return '';
          const upper = part.toUpperCase();
          if (TITLE_CASE_ACRONYMS.has(upper)) return upper;
          return part[0].toUpperCase() + part.slice(1);
        })
        .join('-');
    })
    .join(' ');

// Kunci pengelompokan: uppercase, tanpa tanda baca, sudah dipetakan ke nama kanonik.
export function normalizeProdiKey(name?: string | null): string {
  const key = rawProdiKey(name);
  return ALIAS_BY_KEY.get(key)?.key ?? key;
}

// Nama tampilan: label kanonik bila prodi termasuk grup alias, selain itu
// Title Case dari nama yang sudah dibersihkan.
export function displayProdiName(name?: string | null): string {
  const alias = ALIAS_BY_KEY.get(rawProdiKey(name));
  if (alias) return alias.label;
  return toTitleCase(normalizeBase(name));
}

// Kunci untuk lookup ke database: coba kunci kanonik lebih dulu, lalu kunci
// mentah agar deskripsi prodi varian lama tetap ditemukan.
export function prodiLookupKeys(name?: string | null): string[] {
  const canonical = normalizeProdiKey(name);
  const raw = rawProdiKey(name);
  return Array.from(new Set([canonical, raw])).filter(Boolean);
}
