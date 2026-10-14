import { CONFIG } from '../config';
import { hashCombine, Rng } from '../core/rng';

export type NodeType = 'start' | 'combat' | 'elite' | 'event' | 'shop' | 'rest' | 'boss';

export interface GraphNode {
  id: number;
  col: number;
  row: number;
  rowsInCol: number;
  type: NodeType;
  next: number[];
  prev: number[];
}

export interface FloorGraph {
  nodes: GraphNode[];
  columns: number[][];
  startId: number;
  bossId: number;
}

function crosses(edges: Array<[number, number]>, i: number, j: number): boolean {
  for (const [a, b] of edges) {
    if ((a < i && b > j) || (a > i && b < j)) return true;
  }
  return false;
}

/** Build the node map for one floor (Sample 2 topology). */
export function generateFloorGraph(fSeed: number): FloorGraph {
  const rng = new Rng(hashCombine(fSeed, 0x6a09e667));
  const totalCols = rng.int(CONFIG.graphColumnsMin, CONFIG.graphColumnsMax);
  const nodes: GraphNode[] = [];
  const columns: number[][] = [];

  const addNode = (col: number, row: number, rowsInCol: number, type: NodeType): number => {
    const id = nodes.length;
    nodes.push({ id, col, row, rowsInCol, type, next: [], prev: [] });
    return id;
  };

  for (let c = 0; c < totalCols; c++) {
    const isEnd = c === 0 || c === totalCols - 1;
    const count = isEnd ? 1 : rng.int(CONFIG.nodesPerColumnMin, CONFIG.nodesPerColumnMax);
    const ids: number[] = [];
    for (let r = 0; r < count; r++) ids.push(addNode(c, r, count, 'combat'));
    columns.push(ids);
  }
  const startId = columns[0][0];
  const bossId = columns[totalCols - 1][0];
  nodes[startId].type = 'start';
  nodes[bossId].type = 'boss';

  // ── Edges: non-crossing nearest-neighbour links plus a few extra branches ──
  for (let c = 0; c < totalCols - 1; c++) {
    const A = columns[c];
    const B = columns[c + 1];
    const k = A.length;
    const m = B.length;
    const edges: Array<[number, number]> = [];
    const has = (i: number, j: number) => edges.some(([a, b]) => a === i && b === j);
    const pos = (idx: number, n: number) => (idx + 0.5) / n;
    for (let i = 0; i < k; i++) {
      let best = 0;
      let bd = Infinity;
      for (let j = 0; j < m; j++) {
        const d = Math.abs(pos(i, k) - pos(j, m));
        if (d < bd - 1e-9) {
          bd = d;
          best = j;
        }
      }
      if (!has(i, best)) edges.push([i, best]);
    }
    for (let j = 0; j < m; j++) {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < k; i++) {
        const d = Math.abs(pos(i, k) - pos(j, m));
        if (d < bd - 1e-9) {
          bd = d;
          best = i;
        }
      }
      if (!has(best, j) && !crosses(edges, best, j)) edges.push([best, j]);
    }
    // Guarantee every node in B has an incoming edge.
    for (let j = 0; j < m; j++) {
      if (!edges.some(([, b]) => b === j)) {
        const i = Math.min(k - 1, Math.floor(pos(j, m) * k));
        edges.push([i, j]);
      }
    }
    // Branching choice: extra links to adjacent rows.
    for (let i = 0; i < k; i++) {
      if (!rng.chance(0.45)) continue;
      const near = edges.filter(([a]) => a === i).map(([, b]) => b);
      const cand = [near[0] - 1, near[near.length - 1] + 1].filter((j) => j >= 0 && j < m);
      if (!cand.length) continue;
      const j = rng.pick(cand);
      if (!has(i, j) && !crosses(edges, i, j)) edges.push([i, j]);
    }
    for (const [i, j] of edges) {
      const a = A[i];
      const b = B[j];
      nodes[a].next.push(b);
      nodes[b].prev.push(a);
    }
    for (const id of A) nodes[id].next.sort((x, y) => nodes[x].row - nodes[y].row);
  }

  // ── Types ──
  const mid = columns.slice(1, totalCols - 1);
  const w = CONFIG.nodeWeights;
  mid.forEach((col, ci) => {
    for (const id of col) {
      nodes[id].type = ci === 0 ? 'combat' : rng.weighted(w);
    }
  });
  // Column before BOSS contains a Rest.
  const preBoss = mid[mid.length - 1];
  if (!preBoss.some((id) => nodes[id].type === 'rest')) nodes[rng.pick(preBoss)].type = 'rest';

  // No two Elites in a row on any path (also stops Elite→Boss chains feeling unfair).
  for (const n of nodes) {
    if (n.type !== 'elite') continue;
    for (const p of n.prev) if (nodes[p].type === 'elite') n.type = 'combat';
  }

  // At least one Shop (never in column 1, never replacing the guaranteed Rest).
  if (!nodes.some((n) => n.type === 'shop')) {
    const restsBeforeBoss = preBoss.filter((id) => nodes[id].type === 'rest').length;
    const cands = mid
      .slice(1)
      .flat()
      .filter((id) => !(preBoss.includes(id) && nodes[id].type === 'rest' && restsBeforeBoss === 1));
    nodes[rng.pick(cands)].type = 'shop';
  }
  // At least one Rest (already guaranteed in the pre-boss column, re-checked for safety).
  if (!nodes.some((n) => n.type === 'rest')) nodes[rng.pick(preBoss)].type = 'rest';

  return { nodes, columns, startId, bossId };
}

/** All node ids reachable going forward from `id` (inclusive). */
export function reachableFrom(g: FloorGraph, id: number): Set<number> {
  const seen = new Set<number>([id]);
  const stack = [id];
  while (stack.length) {
    const n = stack.pop()!;
    for (const m of g.nodes[n].next) {
      if (!seen.has(m)) {
        seen.add(m);
        stack.push(m);
      }
    }
  }
  return seen;
}
