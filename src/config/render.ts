import type { RenderConfig } from '../types/index.js';

// Render parameters
export const RENDER: RenderConfig = {
  PREFERRED_BACKEND: 'webgpu',
  ALLOW_WEBGL_FALLBACK: true,
  ANTIALIAS: true,
  PIXEL_RATIO_MAX: 2,
  SHADOWS_ENABLED: true,
  SHOW_PERF_STATS: true,
  RAYTRACE_ENABLED: false,
  RAYTRACE_SCALE: 0.25,
  RAYTRACE_MAX_DISTANCE: 200,
  RAYTRACE_UPDATE_HZ: 5
};

export default RENDER;
