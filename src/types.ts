// Shared, Obsidian-free types. Used by the pure graph builder + renderer, the
// Obsidian view, and the standalone browser harness.

// Mirrors the node kinds Obsidian's built-in graph view distinguishes.
export type NodeKind = 'file' | 'attachment' | 'tag' | 'unresolved';

export interface GraphNode {
  id: string; // file path, "#tag", or unresolved link text
  name: string; // display label
  folder: string; // top-level folder, "" for vault root / non-file kinds
  kind: NodeKind;
  val: number; // size weight = 1 + link degree
  neighbors?: string[]; // ids of connected nodes (filled by the builder)
}

export interface GraphLink {
  source: string; // node id
  target: string; // node id
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Filter set mirrored from Obsidian's built-in graph view (global graph defaults
// shown in comments).
export interface GraphFilters {
  showTags: boolean; // false
  showAttachments: boolean; // false
  hideUnresolved: boolean; // false  -> "Existing files only"
  showOrphans: boolean; // true
  search: string; // "" -> substring match on node name/path
}

export const DEFAULT_FILTERS: GraphFilters = {
  showTags: false,
  showAttachments: false,
  hideUnresolved: false,
  showOrphans: true,
  search: '',
};

// Force tuning, mirrored from the built-in "Forces" panel (built-in defaults in
// comments; 3D scene uses adapted defaults set in settings.ts).
export interface GraphForces {
  centerStrength: number; // built-in 0.1
  repelStrength: number; // built-in 10
  linkStrength: number; // built-in 1
  linkDistance: number; // built-in 250
}

// Raw vault inputs for the Obsidian builder (lifted straight off metadataCache).
export interface VaultGraphInput {
  markdownPaths: string[];
  allPaths: string[]; // every file (used when showAttachments)
  resolvedLinks: Record<string, Record<string, number>>; // src -> {destPath: count}
  unresolvedLinks: Record<string, Record<string, number>>; // src -> {linkText: count}
  tagsByFile: Record<string, string[]>; // path -> ["#tag", ...]
}

// A minimal note shape the markdown builder needs (used by the harness + sample script).
export interface RawNote {
  path: string; // vault-relative, ends in .md (or any ext for attachments)
  content: string;
}

// Colors are injected so render.ts stays theme-agnostic: the Obsidian view feeds
// it computed CSS-variable colors; the harness feeds a fixed dark palette.
export interface GraphPalette {
  background: string;
  link: string;
  text: string;
  file: string; // base color for note nodes (folders shift hue off this)
  tag: string;
  attachment: string;
  unresolved: string;
}

// Styled after vasturiano's large-graph example: near-black background, light links,
// node colors come from nodeAutoColorBy (these are only fallbacks).
export const DEFAULT_PALETTE: GraphPalette = {
  background: '#000011',
  link: '#9aa0c8',
  text: '#e8e8f4',
  file: '#5b8ff9',
  tag: '#e0a234',
  attachment: '#3bbd6e',
  unresolved: '#5a5a72',
};

export interface RenderOptions {
  autoRotate: boolean;
  rotateSpeed: number; // OrbitControls.autoRotateSpeed
  nodeSize: number; // nodeRelSize
  linkThickness: number; // linkWidth
  showArrows: boolean;
  showLabels: boolean;
  forces: GraphForces;
  palette: GraphPalette;
}
