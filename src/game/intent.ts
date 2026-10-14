/** Per-tick player intent, produced by the input layer (any device). */
export interface Intent {
  moveX: number;
  moveY: number;
  /** Unit aim vector. */
  aimX: number;
  aimY: number;
  /** World-space aim point when the device provides one (mouse). */
  aimPointX: number;
  aimPointY: number;
  hasAimPoint: boolean;
  fire: boolean;
  ability: boolean; // edge-triggered
  dash: boolean; // edge-triggered
  interact: boolean; // edge-triggered
  /** Soft-snap aim toward enemies inside a narrow cone (touch / gamepad). */
  aimAssist: boolean;
  /** One-thumb play: aim at the nearest enemy and fire automatically. */
  autoAim: boolean;
}

export const emptyIntent = (): Intent => ({
  moveX: 0,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  aimPointX: 0,
  aimPointY: 0,
  hasAimPoint: false,
  fire: false,
  ability: false,
  dash: false,
  interact: false,
  aimAssist: false,
  autoAim: false,
});
