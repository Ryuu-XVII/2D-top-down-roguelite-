// The simulation never touches the renderer directly; it emits effects into
// an FxSink that the render layer implements (and tests stub out).

export type SfxName =
  | 'shoot_slash'
  | 'shoot_orb'
  | 'shoot_dagger'
  | 'hit'
  | 'crit'
  | 'enemy_death'
  | 'player_hurt'
  | 'level_up'
  | 'card_pick'
  | 'door_unlock'
  | 'chest_open'
  | 'ui_tap'
  | 'pickup'
  | 'dash'
  | 'ability'
  | 'explosion'
  | 'enemy_shot'
  | 'boss_roar'
  | 'heal'
  | 'coin';

export type ParticleKind = 'glow' | 'spark' | 'star' | 'smoke' | 'debris' | 'blood' | 'ember';

export type HapticKind = 'hit' | 'levelup' | 'heavy';

export interface FxSink {
  burst(x: number, y: number, color: number, count: number, speed: number, size: number, life: number, kind: ParticleKind): void;
  particle(x: number, y: number, vx: number, vy: number, color: number, size: number, life: number, kind: ParticleKind): void;
  ring(x: number, y: number, color: number, radius: number, life: number, width?: number): void;
  slash(x: number, y: number, angle: number, radius: number, arc: number, color: number): void;
  lightning(x1: number, y1: number, x2: number, y2: number, color: number): void;
  text(x: number, y: number, str: string, color: number, big?: boolean): void;
  shake(intensity: number): void;
  flash(color: number, alpha: number): void;
  sfx(name: SfxName, x?: number): void;
  haptic(kind: HapticKind): void;
}

export class NullFx implements FxSink {
  burst(): void {}
  particle(): void {}
  ring(): void {}
  slash(): void {}
  lightning(): void {}
  text(): void {}
  shake(): void {}
  flash(): void {}
  sfx(): void {}
  haptic(): void {}
}
