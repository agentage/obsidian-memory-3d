import type { GraphData, GraphFilters, RawNote, VaultGraphInput } from './types';
import { DEFAULT_FILTERS } from './types';
import { basename, graphFromVault, isMarkdown, MD_EXT } from './graph-data';

// Markdown-parsing path (browser harness + sample script). Parses [[wikilinks]] + #tags
// into the same VaultGraphInput shape metadataCache produces, so it exercises the exact
// graphFromVault builder the Obsidian plugin uses.

const WIKILINK = /\[\[([^\]]+?)\]\]/g;
const TAG = /(?:^|\s)#([A-Za-z0-9_/-]+)/g;

const linkTarget = (raw: string): string => raw.split('|')[0].split('#')[0].trim();

export const inputFromMarkdown = (notes: RawNote[]): VaultGraphInput => {
  const allPaths = notes.map((n) => n.path);
  const markdownPaths = allPaths.filter(isMarkdown);
  // Resolve [[links]] by full path first; fall back to basename only when that basename
  // is unique (Obsidian does not silently pick one of several same-named notes).
  const byBasename = new Map<string, string>();
  const byNoExt = new Map<string, string>();
  const basenameCount = new Map<string, number>();
  for (const p of allPaths) {
    const b = basename(p);
    basenameCount.set(b, (basenameCount.get(b) ?? 0) + 1);
  }
  for (const p of allPaths) {
    const b = basename(p);
    if (basenameCount.get(b) === 1) byBasename.set(b, p);
    byNoExt.set(p.replace(MD_EXT, ''), p);
  }

  const resolvedLinks: Record<string, Record<string, number>> = {};
  const unresolvedLinks: Record<string, Record<string, number>> = {};
  const tagsByFile: Record<string, string[]> = {};

  for (const note of notes) {
    if (!isMarkdown(note.path)) continue;
    const resolved: Record<string, number> = {};
    const unresolved: Record<string, number> = {};
    let m: RegExpExecArray | null;

    WIKILINK.lastIndex = 0;
    while ((m = WIKILINK.exec(note.content)) !== null) {
      const target = linkTarget(m[1]);
      if (!target) continue;
      const hit = byNoExt.get(target) ?? byBasename.get(target);
      if (hit) resolved[hit] = (resolved[hit] ?? 0) + 1;
      else unresolved[target] = (unresolved[target] ?? 0) + 1;
    }
    if (Object.keys(resolved).length) resolvedLinks[note.path] = resolved;
    if (Object.keys(unresolved).length) unresolvedLinks[note.path] = unresolved;

    const tags = new Set<string>();
    TAG.lastIndex = 0;
    while ((m = TAG.exec(note.content)) !== null) tags.add(`#${m[1]}`);
    if (tags.size) tagsByFile[note.path] = [...tags];
  }

  return { markdownPaths, allPaths, resolvedLinks, unresolvedLinks, tagsByFile };
};

export const graphFromMarkdown = (
  notes: RawNote[],
  filters: GraphFilters = DEFAULT_FILTERS
): GraphData => graphFromVault(inputFromMarkdown(notes), filters);
