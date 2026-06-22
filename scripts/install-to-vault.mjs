// Copies the built plugin (manifest.json + main.js + styles.css) into a vault's
// .obsidian/plugins/agentage-graph-3d/ and lists it in community-plugins.json so it
// loads once Restricted Mode is off. Run after `npm run build`.
import { mkdir, copyFile, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_ID = 'agentage-graph-3d';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = process.argv[2] ? path.resolve(process.argv[2]) : path.join(repo, 'test-vault');

const exists = async (p) =>
  access(p).then(
    () => true,
    () => false
  );

if (!(await exists(path.join(repo, 'main.js')))) {
  console.error('main.js not found - run `npm run build` first.');
  process.exit(1);
}

const pluginDir = path.join(vault, '.obsidian', 'plugins', PLUGIN_ID);
await mkdir(pluginDir, { recursive: true });
for (const f of ['manifest.json', 'main.js', 'styles.css']) {
  await copyFile(path.join(repo, f), path.join(pluginDir, f));
}

// Enable the plugin (merge, don't clobber other enabled plugins).
const cpPath = path.join(vault, '.obsidian', 'community-plugins.json');
let enabled = [];
if (await exists(cpPath)) {
  try {
    enabled = JSON.parse(await readFile(cpPath, 'utf8'));
  } catch {
    enabled = [];
  }
}
if (!enabled.includes(PLUGIN_ID)) enabled.push(PLUGIN_ID);
await writeFile(cpPath, JSON.stringify(enabled, null, 2) + '\n');

console.log(`installed ${PLUGIN_ID} -> ${pluginDir}`);
console.log(`enabled in ${cpPath}`);
console.log('If the vault is in Restricted Mode, turn it off: Settings → Community plugins.');
