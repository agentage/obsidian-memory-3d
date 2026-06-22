// Builds media/demo.gif - a seamless 360 deg orbit of the graph (agentage vault, labels
// off). Orbits the camera manually (auto-rotate off) so the loop is perfect, captures
// frames, then ffmpeg palette-encodes a small looping gif.
//   node scripts/capture-gif.mjs   (server up on :8731)
import { createRequire } from 'node:module';
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/home/vreshch/projects/agentage/e2e/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = path.join(ROOT, 'media');
const TMP = '/tmp/m3d-gif';
const URL = 'http://localhost:8731/preview/index.html';
const VAULT = '/home/vreshch/vaults/agentage';
const N = 72; // frames per full orbit
const FPS = 12; // 72/12 = 6s per orbit -> gentle, default-like speed (was 2.4s = too fast)
const WIDTH = 800;

const check = (id, val) =>
  `(()=>{const e=document.getElementById('${id}'); if(e&&e.checked!==${val}){e.checked=${val}; e.dispatchEvent(new Event('change',{bubbles:true}));}})()`;
const HIDE = `for(const s of ['#count','#settings-btn','#center-btn','.scene-nav-info']){document.querySelectorAll(s).forEach(e=>e.style.display='none');}`;

execFileSync('node', [path.join(ROOT, 'scripts', 'build-sample.mjs'), VAULT], { cwd: ROOT });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({
  args: ['--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.goto(`${URL}?t=${Date.now()}`, { waitUntil: 'load' });
await page.waitForTimeout(10000);
await page.evaluate(check('d-labels', false));
await page.evaluate(check('r-rotate', false)); // manual orbit -> perfect loop
await page.evaluate(check('f-orphans', true)); // ALL nodes
await page.evaluate(check('f-tags', true)); // + tags
await page.evaluate(check('f-attach', true)); // + attachments
await page.waitForTimeout(8000); // more nodes -> longer settle
await page.evaluate(HIDE);

// Fit ALL nodes (incl. orphans/tags/attachments) via the underlying instance (no
// connected-only filter), then dolly in slightly. The point cloud is ~spherical, so a
// single fit stays in frame through a full orbit.
await page.evaluate(() => document.getElementById('graph').__forceGraph.zoomToFit(600, 40));
await page.waitForTimeout(900);
const cam = await page.evaluate(() => {
  const G = document.getElementById('graph').__forceGraph;
  const c = G.cameraPosition();
  G.cameraPosition({ x: c.x * 0.9, y: c.y * 0.9, z: c.z * 0.9 }, undefined, 0);
  const n = G.cameraPosition();
  return { R: Math.hypot(n.x, n.z), y: n.y };
});
console.log('orbit radius', Math.round(cam.R), 'height', Math.round(cam.y));

for (let i = 0; i < N; i++) {
  const theta = (2 * Math.PI * i) / N;
  await page.evaluate(
    ({ R, y, theta }) => {
      const G = document.getElementById('graph').__forceGraph;
      G.cameraPosition({ x: R * Math.sin(theta), y, z: R * Math.cos(theta) }, undefined, 0);
    },
    { R: cam.R, y: cam.y, theta }
  );
  await page.waitForTimeout(110);
  await page.screenshot({ path: path.join(TMP, `f-${String(i).padStart(3, '0')}.png`) });
}
await browser.close();
console.log(`captured ${N} frames`);

const pal = path.join(TMP, 'pal.png');
const OUT = path.join(MEDIA, 'demo.gif');
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${TMP}/f-%03d.png" -vf "scale=${WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=128" "${pal}"`,
  { stdio: 'ignore' }
);
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${TMP}/f-%03d.png" -i "${pal}" -lavfi "scale=${WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=2:diff_mode=rectangle" -loop 0 "${OUT}"`,
  { stdio: 'ignore' }
);
console.log('wrote', OUT);
