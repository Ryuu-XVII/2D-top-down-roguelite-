import { CONFIG } from '../config';
import { floorSeed, roomSeed, seedToString } from '../core/rng';
import { generateFloorGraph, type FloorGraph } from '../gen/graph';
import { generateRoom, type RoomMap } from '../gen/room';
import type { PlayerSave } from './player';

export interface RunSave {
  version: 1;
  runSeed: number;
  attempt: number;
  floor: number;
  nodeId: number;
  visited: number[];
  roomCleared: boolean;
  player: PlayerSave;
  daily: boolean;
  elapsed: number;
}

/** Floor/graph bookkeeping for one run. Rooms regenerate from seeds on demand. */
export class Run {
  floor = 0;
  graph!: FloorGraph;
  fSeed = 0;
  nodeId = 0;
  visited: number[] = [];
  elapsed = 0;

  constructor(
    readonly runSeed: number,
    readonly attempt: number,
    readonly daily = false,
  ) {}

  get seedLabel(): string {
    return `${seedToString(this.runSeed)}-${this.attempt}`;
  }

  get isFinalFloor(): boolean {
    return this.floor >= CONFIG.floors - 1;
  }

  enterFloor(floor: number): void {
    this.floor = floor;
    this.fSeed = floorSeed(this.runSeed, floor, this.attempt);
    this.graph = generateFloorGraph(this.fSeed);
    this.nodeId = this.graph.startId;
    this.visited = [this.nodeId];
  }

  get node() {
    return this.graph.nodes[this.nodeId];
  }

  roomFor(nodeId: number): RoomMap {
    const n = this.graph.nodes[nodeId];
    return generateRoom(roomSeed(this.fSeed, nodeId), n.type, n.next, this.floor);
  }

  currentRoom(): RoomMap {
    return this.roomFor(this.nodeId);
  }

  moveTo(nodeId: number): void {
    if (!this.node.next.includes(nodeId)) throw new Error(`Node ${nodeId} is not adjacent to ${this.nodeId}`);
    this.nodeId = nodeId;
    this.visited.push(nodeId);
  }

  /** Index of this room within the floor (for "Room 3/7" style HUD labels). */
  get roomNumber(): number {
    return this.node.col + 1;
  }

  get roomsOnFloor(): number {
    return this.graph.columns.length;
  }

  toSave(player: PlayerSave, roomCleared: boolean): RunSave {
    return {
      version: 1,
      runSeed: this.runSeed,
      attempt: this.attempt,
      floor: this.floor,
      nodeId: this.nodeId,
      visited: this.visited.slice(),
      roomCleared,
      player,
      daily: this.daily,
      elapsed: this.elapsed,
    };
  }

  static fromSave(s: RunSave): Run {
    const r = new Run(s.runSeed, s.attempt, s.daily);
    r.enterFloor(s.floor);
    r.nodeId = s.nodeId;
    r.visited = s.visited.slice();
    r.elapsed = s.elapsed;
    return r;
  }
}
