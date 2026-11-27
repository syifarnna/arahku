// Ditulis otomatis oleh `postbuild` setiap kali aplikasi di-build/deploy.
// Isi log = pesan commit Git yang memicu deploy tersebut.
//
// Env yang dipakai (di Vercel):
//   VERCEL_GIT_COMMIT_MESSAGE  -> pesan commit (dari system env Vercel)
//   VERCEL_GIT_COMMIT_SHA      -> SHA commit, dipakai sebagai penanda unik
//   SUPABASE_SERVICE_ROLE_KEY  -> secret, jangan pakai awalan VITE_
//   VITE_SUPABASE_URL          -> URL project Supabase (sudah ada di Vercel)
//
// Script sengaja tidak menggagalkan build bila log gagal ditulis.

import { execFileSync } from 'node:child_process';

const git = (args) => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).trim();
  } catch {
    return '';
  }
};

const cleanMessage = (raw) =>
  String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 2000);

const message = cleanMessage(
  process.env.VERCEL_GIT_COMMIT_MESSAGE || git(['log', '-1', '--pretty=%B']),
);
const commitSha = (process.env.VERCEL_GIT_COMMIT_SHA || git(['rev-parse', 'HEAD'])).trim();

if (!message) {
  console.log('[record-deploy] dilewati: pesan commit tidak ditemukan.');
  process.exit(0);
}

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!rawUrl || !serviceKey) {
  console.log('[record-deploy] dilewati: SUPABASE_SERVICE_ROLE_KEY belum diset di environment build.');
  process.exit(0);
}

const endpoint = `${rawUrl.trim().replace(/\/+$/, '')}/rest/v1/web_updates`;

try {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      //commit SHA yang sama tidak membuat baris dobel saat build diulang.
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({
      message,
      commit_sha: commitSha || null,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.warn(`[record-deploy] gagal menulis log: ${res.status} ${detail}`);
  } else {
    console.log(`[record-deploy] update tercatat: ${message}`);
  }
} catch (error) {
  console.warn('[record-deploy] gagal menulis log:', error);
}
