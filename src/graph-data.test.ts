import { describe, expect, it } from 'vitest';
import { graphFromVault } from './graph-data';
import { graphFromMarkdown, inputFromMarkdown } from './graph-from-markdown';
import { DEFAULT_FILTERS } from './types';
import type { GraphFilters, RawNote } from './types';

const filters = (over: Partial<GraphFilters> = {}): GraphFilters => ({
  ...DEFAULT_FILTERS,
  ...over,
});

const notes: RawNote[] = [
  { path: 'A.md', content: 'Links to [[B]] and [[C]]. Embeds ![[pics/diagram.png]].' },
  { path: 'B.md', content: 'Back to [[A]]. A tag #idea here.' },
  { path: 'C.md', content: 'Points at a [[Ghost]] note that does not exist.' },
  { path: 'Lonely.md', content: 'No links at all.' },
  { path: 'pics/diagram.png', content: '' }, // referenced by A
  { path: 'pics/orphan.png', content: '' }, // never referenced
];

const ids = (xs: { id: string }[]): string[] => xs.map((x) => x.id).sort();
const undirectedKey = (l: { source: string; target: string }): string =>
  [l.source, l.target].sort().join('~');

describe('graphFromMarkdown', () => {
  it('builds file nodes and dedupes the A<->B reciprocal link', () => {
    const g = graphFromMarkdown(notes, filters());
    const linkKeys = g.links.map(undirectedKey).sort();
    // A-B reciprocal collapses to one undirected edge.
    expect(linkKeys.filter((k) => k === ['A.md', 'B.md'].sort().join('~'))).toHaveLength(1);
    // A-C exists.
    expect(linkKeys).toContain(['A.md', 'C.md'].sort().join('~'));
  });

  it('creates an unresolved phantom node for [[Ghost]] by default', () => {
    const g = graphFromMarkdown(notes, filters());
    const ghost = g.nodes.find((n) => n.kind === 'unresolved');
    expect(ghost?.name).toBe('Ghost');
  });

  it('hides unresolved nodes with "Existing files only"', () => {
    const g = graphFromMarkdown(notes, filters({ hideUnresolved: true }));
    expect(g.nodes.some((n) => n.kind === 'unresolved')).toBe(false);
  });

  it('drops orphans when showOrphans is off', () => {
    const withOrphans = graphFromMarkdown(notes, filters());
    expect(withOrphans.nodes.some((n) => n.id === 'Lonely.md')).toBe(true);
    const without = graphFromMarkdown(notes, filters({ showOrphans: false }));
    expect(without.nodes.some((n) => n.id === 'Lonely.md')).toBe(false);
  });

  it('shows only REFERENCED attachments, and only when showAttachments', () => {
    const off = graphFromMarkdown(notes, filters());
    expect(off.nodes.some((n) => n.kind === 'attachment')).toBe(false);
    const on = graphFromMarkdown(notes, filters({ showAttachments: true }));
    // diagram.png is embedded by A -> shown; orphan.png is never referenced -> hidden
    // (matches Obsidian, which never shows unlinked files).
    expect(on.nodes.some((n) => n.id === 'pics/diagram.png')).toBe(true);
    expect(on.nodes.some((n) => n.id === 'pics/orphan.png')).toBe(false);
  });

  it('adds tag nodes only when showTags', () => {
    const off = graphFromMarkdown(notes, filters());
    expect(off.nodes.some((n) => n.kind === 'tag')).toBe(false);
    const on = graphFromMarkdown(notes, filters({ showTags: true }));
    const tag = on.nodes.find((n) => n.kind === 'tag');
    expect(tag?.id).toBe('#idea');
  });

  it('search narrows nodes by name/path substring', () => {
    const g = graphFromMarkdown(notes, filters({ search: 'lonely' }));
    expect(ids(g.nodes)).toEqual(['Lonely.md']);
  });

  it('computes degree-based size (val = 1 + degree)', () => {
    const g = graphFromMarkdown(notes, filters());
    const a = g.nodes.find((n) => n.id === 'A.md');
    expect(a?.val).toBe(3); // linked to B and C => degree 2
  });
});

describe('graphFromVault', () => {
  it('matches the markdown path via inputFromMarkdown', () => {
    const viaVault = graphFromVault(inputFromMarkdown(notes), DEFAULT_FILTERS);
    const viaMd = graphFromMarkdown(notes, DEFAULT_FILTERS);
    expect(ids(viaVault.nodes)).toEqual(ids(viaMd.nodes));
  });

  it('leaves an ambiguous bare [[Note]] unresolved but resolves the full path', () => {
    const dup: RawNote[] = [
      { path: 'a/Note.md', content: '' },
      { path: 'b/Note.md', content: '' },
      { path: 'Linker.md', content: 'See [[Note]] and [[a/Note]].' },
    ];
    const g = graphFromMarkdown(dup, filters());
    // [[Note]] basename is ambiguous -> unresolved node; [[a/Note]] resolves by full path.
    expect(g.nodes.some((n) => n.kind === 'unresolved' && n.name === 'Note')).toBe(true);
    expect(g.links.map(undirectedKey)).toContain(['Linker.md', 'a/Note.md'].sort().join('~'));
  });

  it('ignores self-links and edges to unknown nodes', () => {
    const g = graphFromVault(
      {
        markdownPaths: ['X.md'],
        allPaths: ['X.md'],
        resolvedLinks: { 'X.md': { 'X.md': 1, 'Missing.md': 1 } },
        unresolvedLinks: {},
        tagsByFile: {},
      },
      DEFAULT_FILTERS
    );
    expect(g.links).toHaveLength(0);
  });
});
