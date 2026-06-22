import ForceGraph3D from '3d-force-graph';
import type { ForceGraph3DInstance } from '3d-force-graph';
import SpriteText from 'three-spritetext';
import type { GraphData, GraphForces, GraphNode, RenderOptions } from './types';

// Pure 3D renderer over 3d-force-graph. No Obsidian import -> reused verbatim by the
// browser harness. The Obsidian view feeds it theme colors; the harness feeds a fixed
// dark palette.

// Minimal shape of the d3-force objects we tweak (lib types them loosely).
interface D3Force {
  strength?(s: number): D3Force;
  distance?(d: number): D3Force;
  distanceMax?(d: number): D3Force;
}

const REPEL_SCALE = 5; // built-in "repel" slider -> d3 charge strength
const REPEL_MAX_RANGE = 300; // cap charge range so orphans don't fly off to infinity
const NODE_RESOLUTION = 18; // sphere segments (default 8) -> smooth balls
const LINK_OPACITY = 0.5; // base link visibility

const colorForKind = (node: GraphNode, opts: RenderOptions): string => {
  switch (node.kind) {
    case 'tag':
      return opts.palette.tag;
    case 'attachment':
      return opts.palette.attachment;
    case 'unresolved':
      return opts.palette.unresolved;
    default:
      return opts.palette.file;
  }
};

// Group nodes the way the large-graph example colors by "user": files/attachments by
// their top folder, tags/unresolved by kind. Each group gets a distinct color from a
// categorical palette (d3 "Paired"-style), assigned per data load.
const groupOf = (node: GraphNode): string =>
  node.kind === 'file' || node.kind === 'attachment' ? node.folder || '/' : node.kind;

const CATEGORICAL = [
  '#a6cee3',
  '#1f78b4',
  '#b2df8a',
  '#33a02c',
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffd23f',
  '#b15928',
];

// node.val = 1 + link count. Radius = cbrt(nodeVal) * nodeRelSize, so a plain linear
// val gives a gentle size-with-degree (hubs a bit bigger, no extremes).
const nodeRadius = (node: GraphNode, relSize: number): number => Math.cbrt(node.val) * relSize;

export interface GraphRenderer {
  setData(data: GraphData): void;
  setOptions(opts: RenderOptions): void;
  resize(width: number, height: number): void;
  zoomToFit(): void;
  onNodeClick(cb: (node: GraphNode) => void): void;
  destroy(): void;
}

export const createGraphRenderer = (
  container: HTMLElement,
  initial: RenderOptions
): GraphRenderer => {
  let opts = initial;
  let clickCb: (node: GraphNode) => void = () => {};
  let fitted = false; // frame the camera once per data load, then leave it to the user
  let hasLinks = false; // fit to connected nodes when any exist, else to everything

  const nodeColorFn = (n: object): string =>
    (n as GraphNode & { __color?: string }).__color ?? colorForKind(n as GraphNode, opts);

  const graph: ForceGraph3DInstance = new ForceGraph3D(container, { controlType: 'orbit' })
    .backgroundColor(opts.palette.background)
    .nodeRelSize(opts.nodeSize)
    .nodeResolution(NODE_RESOLUTION)
    .nodeVal((n) => (n as GraphNode).val)
    .nodeColor(nodeColorFn)
    .nodeLabel((n) => (n as GraphNode).name)
    .linkColor(() => opts.palette.link)
    .linkWidth(() => opts.linkThickness)
    .linkOpacity(LINK_OPACITY)
    .linkDirectionalArrowLength(() => (opts.showArrows ? 3.5 : 0))
    .linkDirectionalArrowRelPos(1)
    .warmupTicks(20)
    .cooldownTicks(200)
    .onEngineStop(() => {
      if (!fitted) {
        fitted = true;
        fitView();
      }
    })
    .onNodeClick((n) => clickCb(n as GraphNode));

  // Default framing: fit the connected cluster (lone orphans, flung to the periphery
  // by repulsion, shouldn't shrink the whole view); fall back to all nodes.
  const fitView = (): void => {
    graph.zoomToFit(600, 60, (n) =>
      hasLinks ? ((n as GraphNode).neighbors?.length ?? 0) > 0 : true
    );
  };

  const applyLabels = (): void => {
    graph.nodeThreeObjectExtend(true).nodeThreeObject((n) => {
      if (!opts.showLabels) return undefined as unknown as never;
      const node = n as GraphNode;
      const sprite = new SpriteText(node.name);
      sprite.color = opts.palette.text;
      sprite.textHeight = 3;
      sprite.position.y = nodeRadius(node, opts.nodeSize) + 3; // sit just above the ball
      return sprite;
    });
  };

  const applyForces = (f: GraphForces): void => {
    const charge = graph.d3Force('charge') as unknown as D3Force | undefined;
    charge?.strength?.(-f.repelStrength * REPEL_SCALE);
    charge?.distanceMax?.(REPEL_MAX_RANGE);
    const link = graph.d3Force('link') as unknown as D3Force | undefined;
    link?.distance?.(f.linkDistance);
    link?.strength?.(f.linkStrength);
    const center = graph.d3Force('center') as unknown as D3Force | undefined;
    center?.strength?.(f.centerStrength);
  };

  const applyControls = (): void => {
    const controls = graph.controls() as {
      autoRotate?: boolean;
      autoRotateSpeed?: number;
      zoomToCursor?: boolean;
    };
    controls.autoRotate = opts.autoRotate;
    controls.autoRotateSpeed = opts.rotateSpeed;
    controls.zoomToCursor = true; // wheel zooms toward the cursor, not the scene center
  };

  applyLabels();
  applyForces(opts.forces);
  applyControls();

  return {
    setData(data: GraphData): void {
      fitted = false; // re-frame once after the new layout settles
      hasLinks = data.links.length > 0;
      // Assign a categorical color per group (folder / kind), like the large-graph
      // example's nodeAutoColorBy. Stable across renders via sorted group order.
      const groups = [...new Set(data.nodes.map(groupOf))].sort();
      const colorByGroup = new Map<string, string>();
      groups.forEach((gp, i) => colorByGroup.set(gp, CATEGORICAL[i % CATEGORICAL.length]));
      for (const node of data.nodes) {
        (node as GraphNode & { __color?: string }).__color = colorByGroup.get(groupOf(node));
      }
      graph.graphData({ nodes: data.nodes, links: data.links });
    },
    setOptions(next: RenderOptions): void {
      opts = next;
      graph
        .backgroundColor(opts.palette.background)
        .nodeRelSize(opts.nodeSize)
        .nodeColor(nodeColorFn)
        .linkColor(() => opts.palette.link)
        .linkWidth(() => opts.linkThickness)
        .linkDirectionalArrowLength(() => (opts.showArrows ? 3.5 : 0));
      applyLabels();
      applyForces(opts.forces);
      applyControls();
      graph.d3ReheatSimulation();
    },
    resize(width: number, height: number): void {
      graph.width(width).height(height);
    },
    zoomToFit(): void {
      fitView();
    },
    onNodeClick(cb: (node: GraphNode) => void): void {
      clickCb = cb;
    },
    destroy(): void {
      graph._destructor();
      container.empty?.();
      container.innerHTML = '';
    },
  };
};
