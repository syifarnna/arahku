const fs = require('fs');
const path = require('path');

// ============================================================================
// GENERATOR: data/ptn_migrasi (format data PTN TERBARU dari Mediascanter)
// Sumber  : data/dataptn_mediascanter.sql  (Navicat dump, tabel `ptn`)
//          - 5150 baris | 146 universitas | 1439 prodi unik
//          - kolom terisi : kd_jurusan, ptn, jurusan, nilai, nm_univ
//            (kelas / tampung / maks / min / maks_k / min_k / kelompok / grade = NULL)
// Target  : Supabase (tabel institutions + majors)
// Output  : data/import_ptn_schema.sql, data/import_ptn_institutions.sql,
//           data/import_ptn_majors.sql, data/chunks/ptn_majors_chunk_*.sql
// Jalankan : node data/gen-ptn-import-sql.cjs
// ============================================================================

const SOURCE = path.join(__dirname, 'dataptn_mediascanter.sql');

// ---------- 1. Parse dump `ptn` ----------
function parseRows() {
  const raw = fs.readFileSync(SOURCE, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => /^\s*INSERT INTO /i.test(l));
  const rows = [];
  for (const l of lines) {
    const m = l.match(/INSERT INTO `ptn` VALUES \((.*)\);/i);
    if (!m) continue;
    const parts = [];
    let cur = '', inQ = false;
    for (let i = 0; i < m[1].length; i++) { const c = m[1][i]; if (c === "'") { inQ = !inQ; cur += c; } else if (c === ',' && !inQ) { parts.push(cur.trim()); cur = ''; } else cur += c; }
    if (cur.trim() !== '') parts.push(cur.trim());
    const g = (s) => (s == null || String(s).trim().toUpperCase() === 'NULL') ? null : String(s).trim().replace(/^'|'$/g, '');
    rows.push({
      id: +g(parts[0]),
      kd_jurusan: g(parts[1]),
      ptn: g(parts[2]),
      jurusan: g(parts[3]),
      nilai: g(parts[4]),
      kelas: g(parts[5]),
      tampung: g(parts[6]),
      maks: g(parts[7]),
      min: g(parts[8]),
      maks_k: g(parts[9]),
      min_k: g(parts[10]),
      kelompok: g(parts[11]),
      grade: g(parts[12]),
      nm_univ: g(parts[13]),
    });
  }
  return rows;
}

// ---------- 2. Klasifikasi rumpun (Saintek / Soshum / Campuran) ----------
//    Sumber kata kunci sama seperti data/classify-cluster.cjs.
const SAINTEK_PHRASES = [
  'KEDOKTERAN', 'DOKTER', 'KEPERAWATAN', 'FARMASI', 'FISIOTERAPI', 'FISOTERAPI', 'KEBIDANAN',
  'TEKNIK', 'TEKNOLOGI', 'INFORMATIKA', 'ILMU KOMPUTER', 'SISTEM KOMPUTER', 'SISTEM INFORMASI', 'KOMPUTER',
  'SAINS', 'MATEMATIKA', 'STATISTIK', 'FISIKA', 'KIMIA', 'BIOLOGI', 'BIOTEKNOLOGI', 'ILMU PENGETAHUAN ALAM',
  'GEOGRAFI', 'GEOLOGI', 'GEOFISIKA', 'METALURGI', 'PERMINYAKAN', 'PERTAMBANGAN', 'GEOMATIKA',
  'PERTANIAN', 'AGRO', 'PETERNAKAN', 'TERNAK', 'AKUAKULTUR', 'PERIKANAN', 'IKAN', 'KELAUTAN', 'KEHUTANAN',
  'PERAIRAN', 'AKUATIK', 'TANAMAN', 'TANAH', 'ARSITEKTUR', 'GIZI', 'KESEHATAN', 'LINGKUNGAN',
  'PANGAN', 'METROLOGI', 'INSTRUMENTASI',
  'REKAYASA', 'KESELAMATAN', 'SILVIKULTUR', 'METEOROLOGI', 'OSEANOGRAFI', 'OCEANOGRAFI', 'KARTOGRAFI', 'PENGINDERAAN',
  'AKTUARIA', 'PARAMEDIK', 'VETERINER', 'MINYAK', 'ELEKTRONIKA', 'ALAT BERAT', 'NAUTIKA', 'TRANSPORTASI',
  'MANUFAKTUR', 'MESIN', 'MEKANIK', 'PERKERETAAPIAN', 'KONSTRUKSI', 'JEMBATAN', 'PERUMAHAN', 'PEMUKIMAN',
  'MEKATRONIKA', 'KECERDASAN BUATAN', 'PERANGKAT LUNAK', 'SIBER', 'LISTRIK', 'ENERGI', 'BROADBAND',
  'HORTIKULTURA', 'PERKEBUNAN', 'BUDI DAYA', 'BUDIDAYA', 'KONSERVASI', 'HUTAN', 'KAYU',
  'GIGI', 'OKUPASI', 'BIOMEDIS', 'BIOMEDIK', 'HIGIENE', 'PENGOBAT',
  'PERKAPALAN', 'BANGUNAN', 'GEDUNG', 'LAHAN'
];
const SAINTEK_TOKENS = ['IPA', 'BIOSISTEM'];
const SOSHUM_PHRASES = [
  'HUKUM', 'EKONOMI', 'MANAJEMEN', 'MANJEMEN', 'AKUNTANSI', 'AKUTANSI', 'BISNIS', 'KEUANGAN', 'PERBANKAN', 'PERPAJAKAN',
  'KEWIRAUSAHAAN', 'SASTRA', 'BAHASA', 'LINGUISTIK', 'SEJARAH', 'SOSIOLOGI', 'ANTROPOLOGI',
  'ARKEOLOGI', 'INTERNASIONAL', 'POLITIK', 'PEMERINTAHAN', 'ADMINISTRASI', 'KOMUNIKASI', 'PSIKOLOGI',
  'KRIMINOLOGI', 'PARIWISATA', 'WISATA', 'PERHOTELAN', 'PERPUSTAKAAN', 'KESEKRETARIATAN', 'FILSAFAT',
  'SENI', 'MUSIK', 'TARI', 'OLAHRAGA', 'PENJASKES', 'KEPELATIHAN', 'BIMBINGAN', 'KONSELING',
  'MASYARAKAT', 'PENDIDIKAN', 'KHUSUS', 'DESAIN', 'SYARIAH', 'ISLAM', 'PANCASILA', 'KEWARGANEGARAAN',
  'AGAMA', 'NEGARA', 'PEMBANGUNAN', 'DAERAH', 'SEKOLAH DASAR', 'DASAR',
  'FOTOGRAFI', 'KARAWITAN', 'TEATER', 'KRIYA', 'KERIS', 'HUMANITAS', 'TRADISI', 'FILM', 'TELEVISI',
  'ANIMASI', 'JURNALISTIK', 'HUMAS', 'PENYIARAN', 'PERIKLANAN', 'PENERBITAN', 'ARSIP', 'MEDIA',
  'DEMOGRAFI', 'KESEJAHTERAAN', 'KELUARGA', 'REKREASI', 'KONVENSI', 'INCENTIVE',
  'TATA BOGA', 'TATA BUSANA', 'TATA RIAS', 'KECANTIKAN', 'PEMASARAN', 'LUAR BIASA', 'PENCATATAN SIPIL',
  'SENDRATASIK', 'ENTREPRENEURSHIP', 'ENTERPRENEURSHIP', 'DIGITAL', 'PAUD', 'MANAJEMAN', 'REKAMAN INFORMASI', 'KEWIRUSAHAAN'
];
const SOSHUM_TOKENS = ['PGSD', 'PGPAUD', 'IPS', 'ADM', 'BHS', 'PEND', 'EKO', 'IESP', 'PPKN', 'PKN', 'PLS', 'PLB'];

function classifyCluster(prodi) {
  const name = String(prodi || '').toUpperCase();
  const tokens = new Set(name.split(/[^A-Z0-9]+/).filter(Boolean));
  const has = (list) => list.some((k) => name.includes(k));
  const hasTok = (list) => list.some((k) => tokens.has(k));
  if (has(SAINTEK_PHRASES) || hasTok(SAINTEK_TOKENS)) return 'Saintek';
  if (has(SOSHUM_PHRASES) || hasTok(SOSHUM_TOKENS)) return 'Soshum';
  return 'Campuran';
}

// ---------- 3. Helpers SQL ----------
const q = (s) => `'${String(s == null ? '' : s).replace(/'/g, "''")}'`;
const num = (v, dp = 2) => {
  if (v == null || String(v).trim().toUpperCase() === 'NULL') return 'NULL';
  const n = parseFloat(v);
  if (isNaN(n)) return 'NULL';
  const fixed = n.toFixed(dp);
  const rounded = Number(fixed);
  return Number.isInteger(rounded) ? String(rounded) : String(Math.round(rounded * 100) / 100);
};

// ---------- 4. Build ----------
const rows = parseRows();
const sortedUnivs = [...new Set(rows.map(r => (r.nm_univ || '').trim()).filter(Boolean))].sort();
const univId = new Map(sortedUnivs.map((u, i) => [u, i + 1]));

const instLines = sortedUnivs.map((u) => {
  // singkatan PTN: ambil dari kolom `ptn` yang paling sering muncul di prodi kampus ini
  const abbrs = rows.filter(r => (r.nm_univ || '').trim() === u).map(r => (r.ptn || '').trim()).filter(Boolean);
  const abbr = abbrs.length ? abbrs.sort((a, b) => abbrs.filter(x => x === b).length - abbrs.filter(x => x === a).length)[0] : '';
  const abbrLit = abbr || 'PTN';
  return `    (${univId.get(u)}, ${q(u)}, ${q(abbrLit)}, 'PTN', NULL)`;
});

const majorInserts = [];
for (const r of rows) {
  const nm = (r.nm_univ || '').trim();
  const jur = (r.jurusan || '').trim();
  const instId = univId.get(nm);
  const pm = jur.match(/\(([^)]+)\)\s*$/);
  const jenjang = pm ? pm[1].trim().toUpperCase().replace(/\s+/g, ' ') : 'S1';
  const name = pm ? jur.slice(0, pm.index).trim() : jur;
  const pg = parseFloat(r.nilai);
  const pct = isNaN(pg) ? null : Math.round((pg / 10) * 100) / 100;
  majorInserts.push({
    instId,
    code: r.kd_jurusan,
    name,
    cluster: classifyCluster(jur),
    jenjang: ['S1', 'D-III', 'D-IV'].includes(jenjang.toUpperCase()) ? jenjang.toUpperCase() : 'S1',
    daya_tampung: r.tampung ? parseInt(r.tampung, 10) : null,
    peminat: r.maks ? parseInt(r.maks, 10) : null,
    passing_grade_total: isNaN(pg) ? null : Math.round(pg * 100) / 100,
    passing_grade_percentage: pct,
    year: 2026,
  });
}

const majorsValues = majorInserts.map(m => `    (${m.instId}, ${q(m.code)}, ${q(m.name)}, ${q(m.cluster)}, ${q(m.jenjang)}, ${num(m.daya_tampung)}, ${num(m.peminat)}, ${num(m.passing_grade_total)}, ${num(m.passing_grade_percentage)}, ${m.year})`);
const majorsChunks = [];
const CH = 500;
for (let i = 0; i < majorsValues.length; i += CH) majorsChunks.push(majorsValues.slice(i, i + CH).join(',\n'));

const schema = `-- =========================================================================
-- MIGRASI DATA PTN TERBARU (SOURCE: data/dataptn_mediascanter.sql)
-- Dump Navicat: tabel ptn (DB LIVE BE) - 5150 baris, 146 universitas, 1439 prodi
-- =========================================================================

-- 1) Backup data lama
DROP TABLE IF EXISTS backup_institutions_2025;
CREATE TABLE backup_institutions_2025 AS SELECT * FROM institutions;
DROP TABLE IF EXISTS backup_majors_2025;
CREATE TABLE backup_majors_2025 AS SELECT * FROM majors;
DROP TABLE IF EXISTS backup_target_institutions_2025;
CREATE TABLE backup_target_institutions_2025 AS SELECT * FROM target_institutions;

-- 2) Pastikan kolom format data baru tersedia (idempotent)
ALTER TABLE majors ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE majors ADD COLUMN IF NOT EXISTS jenjang text;
ALTER TABLE majors ADD COLUMN IF NOT EXISTS daya_tampung integer;
ALTER TABLE majors ADD COLUMN IF NOT EXISTS peminat integer;
ALTER TABLE majors ADD COLUMN IF NOT EXISTS passing_grade_percentage double precision;
ALTER TABLE majors ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE majors ADD COLUMN IF NOT EXISTS cluster text;

-- 3) Reset data master PTN
TRUNCATE TABLE target_institutions, majors, institutions CASCADE;
ALTER SEQUENCE institutions_id_seq RESTART WITH 1;
ALTER SEQUENCE majors_id_seq RESTART WITH 1;

-- 4) INSERT UNIVERSITAS
INSERT INTO institutions (id, name, abbreviation, type, location) VALUES
${instLines.join(',\n')};

-- 5) INSERT PRODI
-- passing_grade_total            = nilai (skor passing dari dump)
-- passing_grade_percentage       = passing_grade_total / 10
-- cluster                         = hasil klasifikasi rumpun (Saintek/Soshum/Campuran) dari nama prodi
-- jenjang                         = dari akhiran (D-IV)/(D-III) pada nama prodi, default S1
${majorsChunks.map((c, i) => `-- Chunk ${i + 1}\nINSERT INTO majors (institution_id, code, name, cluster, jenjang, daya_tampung, peminat, passing_grade_total, passing_grade_percentage, year) VALUES\n${c};`).join('\n\n')}
`;

const institutionsSql = `-- =========================================================================
-- DATA PTN TERBARU: INSERT UNIVERSITAS
-- Sumber: data/dataptn_mediascanter.sql (dump tabel ptn)
-- Total: ${sortedUnivs.length} universitas
-- =========================================================================
INSERT INTO institutions (id, name, abbreviation, type, location) VALUES
${instLines.join(',\n')};
`;

const majorsSql = `-- =========================================================================
-- DATA PTN TERBARU: INSERT PRODI
-- Sumber: data/dataptn_mediascanter.sql (dump tabel ptn)
-- Total: ${majorInserts.length} prodi
-- passing_grade_total = nilai (skor passing dari dump)
-- passing_grade_percentage = passing_grade_total / 10
-- cluster = hasil klasifikasi rumpun (Saintek/Soshum/Campuran) dari nama prodi
-- jenjang = dari akhiran (D-IV)/(D-III) pada nama prodi, default S1
-- year = tahun data SNBT (sesuaikan dengan tahun data terbaru)
-- =========================================================================
${majorsChunks.map((c, i) => `-- Chunk ${i + 1}
INSERT INTO majors (institution_id, code, name, cluster, jenjang, daya_tampung, peminat, passing_grade_total, passing_grade_percentage, year) VALUES
${c};`).join('\n\n')}

-- Indeks pencarian & optimisasi
CREATE INDEX IF NOT EXISTS idx_majors_code ON majors(code);
CREATE INDEX IF NOT EXISTS idx_majors_institution ON majors(institution_id);
CREATE INDEX IF NOT EXISTS idx_majors_jenjang ON majors(jenjang);
CREATE INDEX IF NOT EXISTS idx_majors_name_trgm ON majors USING gin (name gin_trgm_ops);

-- Sinkronisasi sequencer setelah insert eksplisit
SELECT setval('institutions_id_seq', (SELECT MAX(id) FROM institutions));
SELECT setval('majors_id_seq', (SELECT MAX(id) FROM majors));

NOTIFY pgrst, 'reload schema';
`;

fs.writeFileSync(path.join(__dirname, 'import_ptn_schema.sql'), schema);
fs.writeFileSync(path.join(__dirname, 'import_ptn_institutions.sql'), institutionsSql);
fs.writeFileSync(path.join(__dirname, 'import_ptn_majors.sql'), majorsSql);

const chunkDir = path.join(__dirname, 'chunks');
if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });
majorsChunks.forEach((c, i) => {
  fs.writeFileSync(path.join(chunkDir, `ptn_majors_chunk_${String(i + 1).padStart(2, '0')}.sql`), `-- Chunk ${i + 1}\nINSERT INTO majors (institution_id, code, name, cluster, jenjang, daya_tampung, peminat, passing_grade_total, passing_grade_percentage, year) VALUES\n${c};`);
});

// ---------- 5. Stats ----------
const byUniv = {};
for (const m of majorInserts) byUniv[m.instId] = (byUniv[m.instId] || 0) + 1;
console.log('Sumber      : ' + SOURCE);
console.log('Total baris : ' + rows.length);
console.log('Univ        : ' + sortedUnivs.length);
console.log('Prodi       : ' + majorInserts.length);
console.log('Jenjang     : ' + JSON.stringify(majorInserts.reduce((acc, m) => { acc[m.jenjang] = (acc[m.jenjang] || 0) + 1; return acc; }, {})));
console.log('Rumpun      : ' + JSON.stringify(majorInserts.reduce((acc, m) => { acc[m.cluster] = (acc[m.cluster] || 0) + 1; return acc; }, {})));
console.log('PG min/max  : ' + Math.min(...majorInserts.map(m => m.passing_grade_total).filter(v => v != null)) + ' / ' + Math.max(...majorInserts.map(m => m.passing_grade_total).filter(v => v != null)));
console.log('Institutions SQL bytes:', institutionsSql.length);
console.log('Majors SQL bytes   :', majorsSql.length);
console.log('Done.');
