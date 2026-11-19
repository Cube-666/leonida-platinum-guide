// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Only the plumbing, not a winner: a plain checklist of the 55 trophies with a one-line hint each. Write a real guide
// for every trophy in your own words, a roadmap to the platinum, filters and a spoiler setting in app/, put 3 or 4 PNG
// or JPEG screenshots of it in screenshots/ (the first by name is the cover; shots.json says which views this
// starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
// Leonida Platinum Guide additions below (own code): a pre-flight gate check
// and a post-build summary. The starter's lines are left exactly as shipped.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ---- Leonida Platinum Guide: pre-flight gate checks (own code) -------------
// The scorer's caps, checked here before anything is copied, so a bad entry
// fails loudly on the builder's own machine instead of at submission.
const GATE = {
  appMaxFiles: 993,
  appMaxBytes: 48 * 1024 * 1024,
  indexMaxBytes: 1024 * 1024,
  screenshotsMin: 3,
  screenshotsMax: 4,
  screenshotMaxBytes: 256 * 1024,
  screenshotLongMax: 1280,
  screenshotShortMin: 480,
  trophiesMaxBytes: 2 * 1024 * 1024,
  trophyCount: 55,
};

function walkFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) found.push(...walkFiles(p));
    else if (st.isFile()) found.push(p);
  }
  return found;
}

function imageDimensions(buf) {
  // PNG: width/height are big-endian uint32 at offsets 16 and 20.
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: scan markers for a Start Of Frame (baseline or progressive).
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i += 1; continue; }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

function fail(msg) { throw new Error(`pre-flight check failed: ${msg}`); }

function preflightCheck() {
  const appDir = join(here, 'app');
  const files = walkFiles(appDir);
  const dirs = [];
  const stack = [appDir];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) { dirs.push(p); stack.push(p); }
    }
  }
  const entries = files.length + dirs.length;
  const appBytes = files.reduce((n, f) => n + statSync(f).size, 0);
  if (entries > GATE.appMaxFiles) fail(`app/ has ${entries} files+dirs, cap ${GATE.appMaxFiles}`);
  if (appBytes > GATE.appMaxBytes) fail(`app/ is ${appBytes} bytes, cap ${GATE.appMaxBytes}`);
  console.log(`pre-flight: app/ ${entries} entries, ${appBytes} bytes`);

  const indexBytes = statSync(join(appDir, 'index.html')).size;
  if (indexBytes > GATE.indexMaxBytes) fail(`app/index.html is ${indexBytes} bytes, cap ${GATE.indexMaxBytes}`);
  console.log(`pre-flight: app/index.html ${indexBytes} bytes`);

  const shotsDir = join(here, 'screenshots');
  const shots = readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort();
  if (shots.length < GATE.screenshotsMin || shots.length > GATE.screenshotsMax) {
    fail(`screenshots/ has ${shots.length} images, need ${GATE.screenshotsMin}-${GATE.screenshotsMax}`);
  }
  for (const name of shots) {
    const buf = readFileSync(join(shotsDir, name));
    if (buf.length > GATE.screenshotMaxBytes) fail(`${name} is ${buf.length} bytes, cap ${GATE.screenshotMaxBytes}`);
    const dim = imageDimensions(buf);
    if (!dim) fail(`${name} is not a readable PNG or JPEG`);
    const long = Math.max(dim.width, dim.height);
    const short = Math.min(dim.width, dim.height);
    if (long > GATE.screenshotLongMax || short < GATE.screenshotShortMin) {
      fail(`${name} is ${dim.width}x${dim.height}, long side must be <= ${GATE.screenshotLongMax} and short side >= ${GATE.screenshotShortMin}`);
    }
    console.log(`pre-flight: ${name} ${dim.width}x${dim.height}, ${buf.length} bytes`);
  }

  const trophiesPath = join(appDir, 'data', 'trophies.json');
  const trophiesBytes = statSync(trophiesPath).size;
  if (trophiesBytes > GATE.trophiesMaxBytes) fail(`trophies.json is ${trophiesBytes} bytes, cap ${GATE.trophiesMaxBytes}`);
  const trophies = JSON.parse(readFileSync(trophiesPath, 'utf8')).trophies;
  if (trophies.length !== GATE.trophyCount) fail(`trophies.json holds ${trophies.length} trophies, need ${GATE.trophyCount}`);
  const unguided = trophies.filter((t) => typeof t.guide !== 'string' || !t.guide.trim()).map((t) => t.name);
  if (unguided.length) fail(`trophies with no guide: ${unguided.join(', ')}`);
  console.log(`pre-flight: trophies.json ${trophiesBytes} bytes, ${trophies.length} trophies, every guide non-blank`);
  console.log('pre-flight: all gate checks pass');
}

preflightCheck();


mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// ---- Leonida Platinum Guide: post-build summary (own code) -----------------
// Confirm the output holds exactly what the scorer expects — nothing more.
{
  const dossierPath = join(out, 'dossier.json');
  const dossierBytes = statSync(dossierPath).size;
  const outEntries = readdirSync(out).sort();
  const expected = ['app', 'dossier.json', 'screenshots'];
  const extra = outEntries.filter((n) => !expected.includes(n));
  if (extra.length) fail(`unexpected output entries: ${extra.join(', ')}`);
  console.log(`built: dossier.json ${dossierBytes} bytes (cap 1572864)`);
  console.log(`built: /output holds exactly ${expected.join(', ')}`);
}

