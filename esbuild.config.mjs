import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';

const banner = `/*
Agentage Memory 3D - Obsidian plugin
This is a generated bundle. Source lives in src/. Do not edit directly.
*/`;

const mode = process.argv[2]; // undefined (watch) | 'production' | 'preview'

// The standalone browser harness: same render.ts path the plugin uses, but mounted
// against sample JSON instead of the Obsidian vault. Lets us verify the real 3D
// render code in a plain browser (no Obsidian needed).
if (mode === 'preview') {
  await esbuild.build({
    entryPoints: ['preview/harness.ts'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2024',
    logLevel: 'info',
    sourcemap: 'inline',
    outfile: 'preview/harness.js',
  });
  process.exit(0);
}

const prod = mode === 'production';

const context = await esbuild.context({
  banner: { js: banner },
  entryPoints: ['src/main.ts'],
  bundle: true,
  // three + 3d-force-graph are bundled in; only Obsidian/Electron/node builtins stay external.
  external: ['obsidian', 'electron', ...builtins, ...builtins.map((m) => `node:${m}`)],
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
  },
  format: 'cjs',
  target: 'es2024',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
