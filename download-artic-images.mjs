import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';

const OUT_DIR = 'C:\\img';
const WORK_DIR = join(OUT_DIR, '_artic-work');
const DUMP_URL = 'https://artic-api-data.s3.amazonaws.com/artic-api-data.tar.bz2';
const DUMP_FILE = join(WORK_DIR, 'artic-api-data.tar.bz2');
const IIIF_BASE = 'https://www.artic.edu/iiif/2';
const TARGET_RATIO = 16 / 9;
const RATIO_TOLERANCE = 0.02;
const MIN_WIDTH = 3840;
const MIN_HEIGHT = 2160;
const API_DELAY_MS = 1100;
const DOWNLOAD_DELAY_MS = 1000;
const USER_AGENT = 'KeytechTestingView/1.0 (artic-image-downloader; contact@example.com)';

function is16x9(width, height) {
  if (!width || !height || width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(ratio - TARGET_RATIO) <= RATIO_TOLERANCE;
}

function is4kOrAbove(width, height) {
  if (!width || !height) return false;
  return width >= MIN_WIDTH && height >= MIN_HEIGHT;
}

function matchesFilters(width, height) {
  return is4kOrAbove(width, height) && is16x9(width, height);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'AIC-User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { 'AIC-User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...options });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.on('error', reject);
  });
}

async function ensureDataDump() {
  const candidates = [
    join(WORK_DIR, 'artic-api-data', 'json', 'images'),
    join(WORK_DIR, 'json', 'images'),
  ];
  const existing = candidates.find((dir) => existsSync(dir));
  if (existing) {
    console.log(`Using existing extracted data dump: ${existing}`);
    return existing;
  }

  mkdirSync(WORK_DIR, { recursive: true });

  if (!existsSync(DUMP_FILE)) {
    console.log('Downloading Art Institute data dump (~115 MB)...');
    await downloadFile(DUMP_URL, DUMP_FILE);
    console.log('Download complete.');
  }

  console.log('Extracting data dump...');
  await runCommand('tar', ['-xjf', DUMP_FILE, '-C', WORK_DIR]);
  const imagesDir = candidates.find((dir) => existsSync(dir));
  if (!imagesDir) {
    throw new Error(`Expected images directory not found under ${WORK_DIR}`);
  }
  console.log('Extraction complete.');
  return imagesDir;
}

function loadImagesFromDump(imagesDir) {
  const files = readdirSync(imagesDir).filter((f) => f.endsWith('.json'));
  const all = [];
  const matched = [];

  for (const file of files) {
    try {
      const record = JSON.parse(readFileSync(join(imagesDir, file), 'utf8'));
      const { id, width, height, iiif_url: iiifUrl, title } = record;
      if (!id || !iiifUrl) continue;
      all.push({ id, width, height, iiifUrl, title });
      if (matchesFilters(width, height)) {
        matched.push({ id, width, height, iiifUrl, title });
      }
    } catch {
      // skip malformed records
    }
  }

  return { all, matched };
}

async function loadImagesFromApi() {
  console.log('Falling back to API pagination (no aspect-ratio server filter available).');
  const all = [];
  const matched = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const url = `https://api.artic.edu/api/v1/images?page=${page}&limit=${limit}&fields=id,width,height,iiif_url,title`;
    const body = await fetchJson(url);
    const batch = body.data ?? [];
    if (batch.length === 0) break;

    for (const img of batch) {
      const { id, width, height, iiif_url: iiifUrl, title } = img;
      if (!id || !iiifUrl) continue;
      all.push({ id, width, height, iiifUrl, title });
      if (matchesFilters(width, height)) {
        matched.push({ id, width, height, iiifUrl, title });
      }
    }

    const totalPages = body.pagination?.total_pages ?? page;
    console.log(`API page ${page}/${totalPages} (${all.length} scanned, ${matched.length} matched)`);
    if (page >= totalPages) break;
    page += 1;
    await sleep(API_DELAY_MS);
  }

  return { all, matched };
}

async function tryFilteredApiSearch() {
  const params = encodeURIComponent(
    JSON.stringify({
      query: {
        bool: {
          must: [
            { range: { width: { gte: MIN_WIDTH } } },
            { range: { height: { gte: MIN_HEIGHT } } },
          ],
        },
      },
      limit: 100,
      fields: 'id,width,height,iiif_url,title',
    })
  );

  const matched = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 100) {
    const url = `https://api.artic.edu/api/v1/images/search?params=${params}&page=${page}`;
    const body = await fetchJson(url);
    totalPages = body.pagination?.total_pages ?? 1;
    const batch = body.data ?? [];

    for (const img of batch) {
      const { id, width, height, iiif_url: iiifUrl, title } = img;
      if (!id || !iiifUrl) continue;
      if (is16x9(width, height)) {
        matched.push({ id, width, height, iiifUrl, title });
      }
    }

    console.log(`4K API search page ${page}/${Math.min(totalPages, 100)} (${matched.length} matched 16:9)`);
    if (page >= totalPages || page >= 100) break;
    page += 1;
    await sleep(API_DELAY_MS);
  }

  return matched;
}

function buildImageUrls(iiifPath, width, height) {
  const id = iiifPath.startsWith('/') ? iiifPath.slice(1) : iiifPath;
  const urls = [
    `${IIIF_BASE}/${id}/full/3840,/0/default.jpg`,
    `${IIIF_BASE}/${id}/full/!,2160/0/default.jpg`,
    `${IIIF_BASE}/${id}/full/full/0/default.jpg`,
  ];
  if (width && height) {
    urls.unshift(`${IIIF_BASE}/${id}/full/${width},${height}/0/default.jpg`);
  }
  return [...new Set(urls)];
}

async function downloadOneImage(img, dest) {
  const urls = buildImageUrls(img.iiifUrl, img.width, img.height);
  let lastError = null;

  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'AIC-User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
        return { ok: true, url };
      } catch (err) {
        lastError = err;
        if (attempt < 3) await sleep(2000 * attempt);
      }
    }
  }

  return { ok: false, error: lastError };
}

function safeFilename(img) {
  const base = (img.title || img.id).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 120);
  return `${base}_${img.id}.jpg`;
}

async function downloadImages(images) {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = join(OUT_DIR, 'manifest.json');
  const existing = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { downloaded: [] };
  const done = new Set(existing.downloaded);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const filename = safeFilename(img);
    const dest = join(OUT_DIR, filename);

    if (done.has(img.id) && existsSync(dest)) {
      skipped += 1;
      continue;
    }

    process.stdout.write(`[${i + 1}/${images.length}] ${filename} ... `);

    const result = await downloadOneImage(img, dest);
    if (result.ok) {
      done.add(img.id);
      success += 1;
      console.log(`ok (${result.url})`);
    } else {
      failed += 1;
      console.log(`failed (${result.error?.message ?? 'unknown error'})`);
    }

    if (i < images.length - 1) await sleep(DOWNLOAD_DELAY_MS);
  }

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        downloaded: [...done],
        stats: { success, skipped, failed, total: images.length },
        filters: { minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT, aspectRatio: '16:9', ratioTolerance: RATIO_TOLERANCE },
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  return { success, skipped, failed };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  let source = 'data-dump';
  let allCount = 0;
  let toDownload = [];

  try {
    const imagesDir = await ensureDataDump();
    const { all, matched } = loadImagesFromDump(imagesDir);
    allCount = all.length;
    toDownload = matched;
    console.log(`Data dump: ${allCount} images total, ${matched.length} match 16:9 + 4K filters.`);
  } catch (err) {
    console.warn(`Data dump approach failed: ${err.message}`);
    source = 'api';

    const apiMatched = await tryFilteredApiSearch();
    if (apiMatched.length > 0) {
      toDownload = apiMatched;
      console.log(`API 4K search + client 16:9 filter: ${apiMatched.length} images (max 10,000 4K records scanned).`);
    } else {
      const { all, matched } = await loadImagesFromApi();
      allCount = all.length;
      toDownload = matched.length > 0 ? matched : all;
      console.log(`API full scan: ${allCount} images, downloading ${toDownload.length}.`);
    }
  }

  if (toDownload.length === 0) {
    console.log('No images matched filters. Nothing to download.');
    return;
  }

  console.log(`Downloading ${toDownload.length} images to ${OUT_DIR} (source: ${source})...`);
  const stats = await downloadImages(toDownload);
  console.log('Done.', stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
