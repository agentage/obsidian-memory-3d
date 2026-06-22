# Agentage Memory 3D

See your memory as a 3D, rotating force-graph. Your notes are nodes, your links are
edges, and a toolbar click flies you through the whole vault in three dimensions.

It is a 3D take on Obsidian's built-in graph view: the same data model (files, tags,
attachments, unresolved links) and the same filters (search, tags, attachments, existing
files only, orphans) and force controls (center, repel, link, distance), rendered with
[3d-force-graph](https://github.com/vasturiano/3d-force-graph) (three.js), auto-orbit, and
a large-graph look (near-black background, colorful clusters).

## Use it

1. Click the **brain** icon in the left ribbon (tooltip: "Open Memory 3D"), or run the
   command **Open 3D graph**.
2. The graph opens in a new tab and starts rotating. Left-drag to rotate, scroll to zoom
   toward the cursor, right-drag to pan, click a node to open that note.
3. Top-right of the view: the **gear** toggles the controls panel (filters, display,
   forces, rotation); the **center** button resets the camera to fit.

## Node colors

Nodes are auto-colored into clusters by their top-level folder (like the large-graph
example colors by group). Tags, attachments, and unresolved `[[links]]` each form their
own colored group. Node size grows gently with the number of links.

## agentage Memory

This plugin visualizes your local Obsidian vault. It is part of **agentage Memory** - a
shared memory layer for every AI: one set of plain-Markdown notes that Claude, ChatGPT,
Cursor, and any MCP client can read and write, mirrored locally as files you own.

> One memory. Every AI. Owned by you.

- AI clients connect over the Model Context Protocol at
  [memory.agentage.io](https://memory.agentage.io) - the MCP endpoint is
  `https://memory.agentage.io/mcp` (Streamable HTTP + OAuth 2.1).
- The companion [Agentage Sync](https://github.com/agentage/obsidian-sync) plugin syncs your
  vault to your private memory; **Agentage Memory 3D** gives you a 3D view of it.

Learn more at [memory.agentage.io](https://memory.agentage.io).

## Develop

```bash
npm install
npm run dev            # esbuild watch -> main.js
npm run build          # production main.js
npm test               # vitest (pure graph builder + plugin wiring)
npm run verify         # type-check + test + build

# Standalone browser preview (the real render path, no Obsidian needed):
npm run build:preview && npm run sample
npx http-server preview -p 8731   # or: python3 -m http.server 8731 --directory preview

# Install into a vault and enable it:
npm run install:vault [path/to/vault]   # defaults to ./test-vault
```

`src/render.ts` and `src/graph-data.ts` are Obsidian-free, so the browser harness in
`preview/` drives the exact rendering and graph-building code the plugin uses.

Desktop only (`isDesktopOnly: true`): three.js + WebGL.

## Credits

Built on [three.js](https://github.com/mrdoob/three.js),
[3d-force-graph](https://github.com/vasturiano/3d-force-graph), and
[three-spritetext](https://github.com/vasturiano/three-spritetext). See
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## License

MIT - see [LICENSE](LICENSE).
