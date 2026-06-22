// Reads the test vault and emits preview/sample-data.js (a global the harness reads),
// so the browser harness graphs the same notes Obsidian would, with no server/fetch.
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'test-vault');
const out = path.join(root, 'preview', 'sample-data.js');

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
};

const files = await walk(vault);
const notes = [];
for (const full of files) {
  const rel = path.relative(vault, full).split(path.sep).join('/');
  const isMd = rel.toLowerCase().endsWith('.md');
  const info = await stat(full);
  if (info.size > 512 * 1024) continue; // skip big binaries
  const content = isMd ? await readFile(full, 'utf8') : '';
  notes.push({ path: rel, content });
}

await writeFile(out, `globalThis.AGENTAGE_3D_SAMPLE = ${JSON.stringify(notes, null, 2)};\n`);
console.log(`wrote ${out} (${notes.length} notes from ${vault})`);
