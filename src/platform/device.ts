import { CONFIG, type QualityPreset } from '../config';

export interface DeviceProfile {
  formFactor: 'desktop' | 'tablet' | 'phone';
  primaryInput: 'keyboardMouse' | 'touch' | 'gamepad';
  hasTouch: boolean;
  finePointer: boolean;
  refreshRateHz: number;
  dpr: number;
  gpuTier: 'low' | 'mid' | 'high';
}

export function detectDevice(): DeviceProfile {
  const hasTouch = (navigator.maxTouchPoints ?? 0) > 0 || 'ontouchstart' in window;
  const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? true;
  const shortEdge = Math.min(window.screen?.width ?? window.innerWidth, window.screen?.height ?? window.innerHeight);
  let formFactor: DeviceProfile['formFactor'] = 'desktop';
  if (hasTouch && !finePointer) formFactor = shortEdge < CONFIG.phoneShortEdge ? 'phone' : 'tablet';
  else if (hasTouch && shortEdge < CONFIG.phoneShortEdge) formFactor = 'phone';
  return {
    formFactor,
    primaryInput: formFactor === 'desktop' ? 'keyboardMouse' : 'touch',
    hasTouch,
    finePointer,
    refreshRateHz: 60,
    dpr: window.devicePixelRatio || 1,
    gpuTier: 'mid',
  };
}

/** Measure the display refresh rate over ~60 frames (median interval). */
export function measureRefreshRate(frames = 60): Promise<number> {
  return new Promise((resolve) => {
    const deltas: number[] = [];
    let last = 0;
    const step = (t: number) => {
      if (last) deltas.push(t - last);
      last = t;
      if (deltas.length < frames) requestAnimationFrame(step);
      else {
        deltas.sort((a, b) => a - b);
        const med = deltas[deltas.length >> 1] || 16.7;
        const hz = 1000 / med;
        const common = [30, 48, 50, 60, 75, 90, 100, 120, 144, 165, 240];
        let best = 60;
        for (const c of common) if (Math.abs(c - hz) < Math.abs(best - hz)) best = c;
        resolve(best);
      }
    };
    requestAnimationFrame(step);
    // Background tabs never fire rAF; don't hang boot.
    setTimeout(() => resolve(60), 3000);
  });
}

/** Classify the GPU from its renderer string plus a measured benchmark (ms/frame). */
export function classifyGpu(rendererString: string, benchMs: number, isCanvas: boolean): DeviceProfile['gpuTier'] {
  if (isCanvas) return 'low';
  const s = rendererString.toLowerCase();
  if (/swiftshader|llvmpipe|software|mali-[4t]|adreno \(tm\) [34]\d\d|powervr sgx|intel\(r\) hd graphics [2-5]\d{2,3}/.test(s)) return 'low';
  if (benchMs > 14) return 'low';
  if (benchMs > 7) return 'mid';
  if (/rtx|radeon rx|apple m\d|geforce gtx 1[06-9]|arc a/.test(s)) return 'high';
  return benchMs < 4 ? 'high' : 'mid';
}

export function choosePreset(d: DeviceProfile, isCanvas: boolean): QualityPreset {
  if (isCanvas) return 'low';
  if (d.formFactor === 'desktop') return d.gpuTier === 'high' ? 'ultra' : d.gpuTier === 'mid' ? 'high' : 'medium';
  return d.gpuTier === 'high' ? 'high' : d.gpuTier === 'mid' ? 'medium' : 'low';
}

export function getWebglRendererString(canvas: HTMLCanvasElement): string {
  try {
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  } catch {
    return '';
  }
}

export function uiScaleFor(adj: number): number {
  const short = Math.min(window.innerWidth, window.innerHeight);
  const base = Math.max(CONFIG.uiScaleMin, Math.min(CONFIG.uiScaleMax, short / CONFIG.uiScaleBase));
  return base * (1 + adj);
}
