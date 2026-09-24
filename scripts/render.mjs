#!/usr/bin/env node
// Exporta el video instructivo HyFoSy a partir de video/hyfosy.html.
//
//   node scripts/render.mjs                 → video/hyfosy.webm + video/hyfosy.srt + guion/guion-hyfosy.md
//   node scripts/render.mjs --text-only     → solo subtítulos (.srt) y guion (.md)
//   node scripts/render.mjs --stills DIR    → una imagen PNG por escena (revisión rápida)
//   Opciones: --fps 30  --out video/hyfosy.webm  --bitrate 1500k
//
// Requiere Playwright (Chromium) y un ffmpeg con codificador VP8 (sirve el que trae Playwright).
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const flag = name => args.includes(name);

const FPS = Number(opt('--fps', 30));
const OUT = resolve(ROOT, opt('--out', 'video/hyfosy.webm'));
const BITRATE = opt('--bitrate', '1500k');
const STILLS = opt('--stills', null);

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return require('playwright'); } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return require(join(globalRoot, 'playwright'));
}

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const pwDir = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(pwDir)) {
    for (const d of readdirSync(pwDir).filter(d => d.startsWith('ffmpeg')).sort().reverse()) {
      for (const bin of ['ffmpeg-linux', 'ffmpeg-mac', 'ffmpeg-win64.exe']) {
        const p = join(pwDir, d, bin);
        if (existsSync(p)) return p;
      }
    }
  }
  return 'ffmpeg';
}

const ts = (s, sep = ',') => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function writeSrt(meta, file) {
  let n = 0, out = '';
  for (const sc of meta.scenes) for (const l of sc.lines) out += `${++n}\n${ts(l.start)} --> ${ts(l.end)}\n${l.text}\n\n`;
  writeFileSync(file, out);
}

function writeGuion(meta, file) {
  const words = meta.scenes.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.text.split(/\s+/).length, 0), 0);
  let md = `# Guion — Video instructivo HyFoSy

> Archivo generado automáticamente por \`scripts/render.mjs\` a partir de \`video/hyfosy.html\`.
> Para cambiar el texto o los tiempos, edite las escenas en el HTML y vuelva a ejecutar el script.

| | |
|---|---|
| **Título** | HyFoSy: histerosalpingo-sonografía con espuma |
| **Objetivo** | Que la paciente entienda qué es el examen, para qué sirve, cómo prepararse, qué sentirá y qué hacer después. |
| **Público** | Pacientes en estudio de fertilidad y sus parejas (lenguaje claro, trato de «usted»). |
| **Duración** | ${mmss(meta.TOTAL)} (${meta.scenes.length} escenas, ${words} palabras de narración) |
| **Formato** | 1280 × 720, ${FPS} fps, subtítulos incrustados + archivo .srt para locución o plataformas de video |

## Escenas

| # | Tiempo | Capítulo | Visual |
|---|---|---|---|
`;
  meta.scenes.forEach((s, i) => { md += `| ${i + 1} | ${mmss(s.start)}–${mmss(s.start + s.dur)} | ${s.chapter} | ${s.visual} |\n`; });
  md += `\n## Narración (locución en off)\n`;
  meta.scenes.forEach((s, i) => {
    md += `\n### ${i + 1}. ${s.chapter} · ${mmss(s.start)}\n\n*Visual:* ${s.visual}\n\n`;
    for (const l of s.lines) md += `- \`${mmss(l.start)}\` ${l.text}\n`;
  });
  md += `
## Notas de producción

- **Locución:** el texto de cada línea está pensado para leerse a un ritmo pausado (≈ 2,6 palabras/s). Si se graba una voz en off, el archivo \`video/hyfosy.srt\` sirve como pauta de tiempos.
- **Terminología:** «permeable» se explica siempre como «abierta»; se evita jerga sin traducir.
- **Revisión clínica:** antes de difundir, validar con el equipo tratante la ventana del ciclo, la analgesia recomendada y los criterios locales (p. ej., tamizaje de clamidia o profilaxis antibiótica según protocolo del centro).

## Respaldo de las afirmaciones clínicas

- Comparación con HSG (tasa de recién nacido vivo 46 % vs. 47 % a 12 meses; dolor EVA 3,0 vs. 5,4; 1.160 mujeres): van Welie N, van Rijswijk J, Dreyer K, et al. *Can hysterosalpingo-foam sonography replace hysterosalpingography as first-choice tubal patency test? A randomized non-inferiority trial.* Hum Reprod. 2022;37(5):969-79. doi:10.1093/humrep/deac034
- Menor dolor de la HyFoSy frente a la HSG: Dreyer K, et al. *Hysterosalpingo-foam sonography, a less painful procedure for tubal patency testing during fertility workup compared with (serial) hysterosalpingography: a randomized controlled trial.* Fertil Steril. 2014.
`;
  writeFileSync(file, md);
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('Error en la página:', e); process.exitCode = 1; });
await page.goto(pathToFileURL(join(ROOT, 'video/hyfosy.html')).href + '?render=1');
await page.evaluate(() => document.fonts.ready);
const meta = await page.evaluate(() => ({ TOTAL: window.HYFOSY.TOTAL, scenes: window.HYFOSY.scenes }));
console.log(`Duración: ${mmss(meta.TOTAL)} · ${meta.scenes.length} escenas`);

mkdirSync(join(ROOT, 'guion'), { recursive: true });
writeSrt(meta, OUT.replace(/\.[^.]+$/, '.srt'));
writeGuion(meta, join(ROOT, 'guion/guion-hyfosy.md'));
console.log('Subtítulos y guion actualizados.');

if (STILLS) {
  const dir = resolve(ROOT, STILLS);
  mkdirSync(dir, { recursive: true });
  for (const [i, s] of meta.scenes.entries()) {
    const at = s.start + s.dur * 0.8;
    const url = await page.evaluate(t => window.HYFOSY.frame(t, 0.95), at);
    writeFileSync(join(dir, `${String(i + 1).padStart(2, '0')}-${s.id}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`Imágenes por escena en ${dir}`);
} else if (!flag('--text-only')) {
  const ffmpeg = findFfmpeg();
  const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0',
    '-c:v', 'libvpx', '-b:v', BITRATE, '-crf', '10', '-qmin', '2', '-qmax', '42', '-deadline', 'good', '-cpu-used', '2',
    '-pix_fmt', 'yuv420p', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  let ffDone = false;
  const ffClosed = once(ff, 'close').then(([code]) => { ffDone = true; return code; });
  ff.stdin.on('error', () => {}); // si ffmpeg termina antes, el error se informa abajo con su código de salida
  const frames = Math.ceil(meta.TOTAL * FPS);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const url = await page.evaluate(t => window.HYFOSY.frame(t), f / FPS);
    if (ffDone) throw new Error(`ffmpeg terminó antes de tiempo (código ${await ffClosed})`);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await Promise.race([once(ff.stdin, 'drain'), ffClosed]);
    if (f % (FPS * 10) === 0) process.stdout.write(`\r  cuadro ${f}/${frames} (${Math.round((100 * f) / frames)} %)`);
  }
  ff.stdin.end();
  const code = await ffClosed;
  if (code !== 0) throw new Error(`ffmpeg terminó con código ${code}`);
  console.log(`\nVideo: ${OUT} (${frames} cuadros, ${Math.round((Date.now() - t0) / 1000)} s)`);
}
await browser.close();
