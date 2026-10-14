import type { QualityPreset } from '../config';

export interface Settings {
  version: 1;
  quality: 'auto' | QualityPreset;
  batterySaver: boolean;
  screenShake: boolean;
  haptics: boolean;
  autoAim: boolean;
  aimAssist: boolean;
  stickSize: number;
  stickOpacity: number;
  leftHanded: boolean;
  uiScaleAdj: number;
  volMaster: number;
  volSfx: number;
  volMusic: number;
  showFps: boolean;
}

export function defaultSettings(isPhone: boolean): Settings {
  return {
    version: 1,
    quality: 'auto',
    batterySaver: isPhone,
    screenShake: true,
    haptics: true,
    autoAim: false,
    aimAssist: true,
    stickSize: 1,
    stickOpacity: 0.55,
    leftHanded: false,
    uiScaleAdj: 0,
    volMaster: 0.8,
    volSfx: 0.8,
    volMusic: 0.5,
    showFps: false,
  };
}
