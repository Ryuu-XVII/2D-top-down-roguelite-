import type { Rng } from '../core/rng';
import type { Rect } from './grid';

export interface BspNode {
  rect: Rect;
  left?: BspNode;
  right?: BspNode;
  /** Carved room rectangle (leaves only). */
  room?: Rect;
  cavern?: boolean;
}

/** Recursively split `rect` until leaves reach the minimum size. */
export function buildBsp(rng: Rng, rect: Rect, minLeaf: number, maxDepth: number, depth = 0): BspNode {
  const node: BspNode = { rect };
  const canH = rect.h >= minLeaf * 2;
  const canV = rect.w >= minLeaf * 2;
  if (depth >= maxDepth || (!canH && !canV)) return node;
  // Past depth 2, occasionally stop early so leaves vary in size.
  if (depth > 2 && rng.chance(0.15)) return node;

  let vertical: boolean;
  const aspect = rect.w / rect.h;
  if (!canH) vertical = true;
  else if (!canV) vertical = false;
  else if (aspect > 1.25) vertical = true; // wide → split along x
  else if (aspect < 0.8) vertical = false;
  else vertical = rng.chance(0.5);

  if (vertical) {
    const s = rng.int(minLeaf, rect.w - minLeaf);
    node.left = buildBsp(rng, { x: rect.x, y: rect.y, w: s, h: rect.h }, minLeaf, maxDepth, depth + 1);
    node.right = buildBsp(rng, { x: rect.x + s, y: rect.y, w: rect.w - s, h: rect.h }, minLeaf, maxDepth, depth + 1);
  } else {
    const s = rng.int(minLeaf, rect.h - minLeaf);
    node.left = buildBsp(rng, { x: rect.x, y: rect.y, w: rect.w, h: s }, minLeaf, maxDepth, depth + 1);
    node.right = buildBsp(rng, { x: rect.x, y: rect.y + s, w: rect.w, h: rect.h - s }, minLeaf, maxDepth, depth + 1);
  }
  return node;
}

export function bspLeaves(node: BspNode, out: BspNode[] = []): BspNode[] {
  if (!node.left || !node.right) out.push(node);
  else {
    bspLeaves(node.left, out);
    bspLeaves(node.right, out);
  }
  return out;
}

/** Carve a random rectangle inside a leaf with minimum size and padding. */
export function carveRoomRect(rng: Rng, leaf: Rect, minSize: number, pad: number): Rect {
  const maxW = leaf.w - pad * 2;
  const maxH = leaf.h - pad * 2;
  const w = Math.max(Math.min(minSize, maxW), rng.int(Math.min(minSize, maxW), maxW));
  const h = Math.max(Math.min(minSize, maxH), rng.int(Math.min(minSize, maxH), maxH));
  const x = leaf.x + pad + rng.int(0, maxW - w);
  const y = leaf.y + pad + rng.int(0, maxH - h);
  return { x, y, w, h };
}
