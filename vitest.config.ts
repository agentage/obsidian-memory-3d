import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Excluded: Obsidian/WebGL-runtime files (ItemView/Setting/three.js scene) that
      // can't run under Node, plus type-only + test files. The pure engine
      // (graph-data, graph-from-markdown, settings) and the plugin wiring (main.ts,
      // exercised with a mocked Obsidian) ARE unit-tested.
      exclude: [
        '**/*.test.ts',
        'src/types.ts',
        'src/render.ts',
        'src/graph-view.ts',
        'src/controls-panel.ts',
        'src/settings-tab.ts',
      ],
      thresholds: { branches: 70, functions: 70, lines: 70, statements: 70 },
    },
  },
});
