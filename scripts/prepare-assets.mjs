import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(projectRoot, 'spec', 'assets.json'), 'utf8'));
const log = [];

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const checksum = (buffer) => createHash('sha256').update(buffer).digest('hex');

async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'ASCENT educational asset preparation/0.1' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? 'unknown';
      if (contentType.includes('text/html')) throw new Error(`Unexpected HTML response (${contentType})`);
      return { buffer: Buffer.from(await response.arrayBuffer()), contentType };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(750 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function verifyGlb(buffer) {
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error('Downloaded model is not a binary GLB file.');
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) throw new Error(`GLB length mismatch: header ${declaredLength}, file ${buffer.length}.`);
}

async function writeImageVariants(asset, input) {
  const localPath = path.join(projectRoot, asset.local);
  await mkdir(path.dirname(localPath), { recursive: true });
  const extension = path.extname(localPath).toLowerCase();
  const isTiffSource = asset.url.toLowerCase().endsWith('.tif') || asset.url.toLowerCase().endsWith('.tiff');
  const pipeline = sharp(input, { failOn: 'error', limitInputPixels: 120_000_000 }).rotate();
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) throw new Error('Image decoder returned no dimensions.');
  if (isTiffSource || extension === '.png') await pipeline.png({ compressionLevel: 9 }).toFile(localPath);
  else await pipeline.jpeg({ quality: 92, mozjpeg: true }).toFile(localPath);

  for (const width of [1024, 2048, 4096]) {
    if (metadata.width < width) continue;
    const directory = path.join(path.dirname(localPath), `${width / 1024}k`);
    await mkdir(directory, { recursive: true });
    const output = path.join(directory, path.basename(localPath));
    const resized = sharp(input, { failOn: 'error', limitInputPixels: 120_000_000 }).rotate().resize({ width, withoutEnlargement: true });
    if (isTiffSource || extension === '.png') await resized.png({ compressionLevel: 9 }).toFile(output);
    else await resized.jpeg({ quality: 90, mozjpeg: true }).toFile(output);
  }
  return { width: metadata.width, height: metadata.height, format: metadata.format };
}

function fallbackSvg(id) {
  const palettes = {
    'earth-day': ['#173047', '#38688b', '#547b52', '#b7ad82'],
    moon: ['#252627', '#77797a', '#aaa9a4', '#4b4c4c'],
    mars: ['#3c1f17', '#9a4e31', '#c4724a', '#66301f'],
  };
  const colors = palettes[id] ?? palettes['earth-day'];
  const seed = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
  const marks = Array.from({ length: 34 }, (_, index) => {
    const x = (seed * (index + 3) * 47) % 2048;
    const y = (seed * (index + 7) * 29) % 1024;
    const rx = 22 + ((seed + index * 31) % 180);
    const ry = 12 + ((seed + index * 17) % 85);
    const color = colors[(index + seed) % colors.length];
    return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="0.68" transform="rotate(${(index * 23) % 180} ${x} ${y})"/>`;
  }).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 2048 1024"><rect width="2048" height="1024" fill="${colors[0]}"/><g>${marks}</g><g opacity=".12">${Array.from({ length: 24 }, (_, i) => `<path d="M0 ${i * 44}h2048" stroke="#fff"/>`).join('')}</g></svg>`);
}

async function generateFallback(asset, reason) {
  if (!asset.fallback.startsWith('generate deterministic schematic body texture')) {
    log.push({ id: asset.id, status: 'omitted', reason, fallback: asset.fallback });
    return;
  }
  const localPath = path.join(projectRoot, asset.local);
  await mkdir(path.dirname(localPath), { recursive: true });
  const svg = fallbackSvg(asset.id);
  const image = sharp(svg).jpeg({ quality: 91, mozjpeg: true });
  await image.toFile(localPath);
  const buffer = await readFile(localPath);
  log.push({ id: asset.id, status: 'generated-fallback', reason, local: asset.local, sha256: checksum(buffer), approximate: true });
}

for (const asset of manifest.assets) {
  try {
    const { buffer, contentType } = await fetchWithRetry(asset.url);
    let decoded;
    if (asset.local.toLowerCase().endsWith('.glb')) {
      verifyGlb(buffer);
      const localPath = path.join(projectRoot, asset.local);
      await mkdir(path.dirname(localPath), { recursive: true });
      await writeFile(localPath, buffer);
      decoded = { format: 'glb' };
    } else {
      decoded = await writeImageVariants(asset, buffer);
    }
    log.push({ id: asset.id, status: 'downloaded', url: asset.url, local: asset.local, contentType, bytes: buffer.length, sha256: checksum(buffer), decoded });
  } catch (error) {
    await generateFallback(asset, error instanceof Error ? error.message : String(error));
  }
}

const outputRoot = path.join(projectRoot, 'public', 'assets');
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, 'asset-log.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), schemaVersion: manifest.schemaVersion, entries: log }, null, 2)}\n`);

const credits = [
  '# ASCENT asset credits',
  '',
  'Generated from `spec/assets.json`. Application source and original procedural geometry are MIT licensed. External files retain the terms below and are not relicensed as MIT.',
  '',
  ...manifest.assets.flatMap((asset) => [
    `## ${asset.id}`,
    '',
    `- Credit: ${asset.credit}`,
    `- License/terms: ${asset.license}`,
    `- Source: ${asset.source}`,
    `- License URL: ${asset.licenseUrl}`,
    `- Processing: ${asset.processing}`,
    '',
  ]),
  'No endorsement by NASA, rocket manufacturers, Solar System Scope, or any other source is implied.',
  '',
];
await writeFile(path.join(outputRoot, 'ASSET_CREDITS.md'), credits.join('\n'));

const failures = log.filter((entry) => entry.status !== 'downloaded');
console.log(`Prepared ${log.length - failures.length}/${log.length} external assets; ${failures.length} used documented fallback/omission.`);
for (const failure of failures) console.log(`- ${failure.id}: ${failure.status} (${failure.reason})`);
