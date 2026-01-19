import type { CameraConfig } from '../types/index.js';

// Camera parameters
export const CAMERA: CameraConfig = {
  // Field of view
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,

  // Follow offset
  OFFSET_X: 0,
  OFFSET_Y: 8,
  OFFSET_Z: 15,

  // Look-at offset
  LOOK_AT_Y: 3,

  // Smoothing
  POSITION_LERP: 0.05,
  ROTATION_LERP: 0.05,

  // Orbit controls (for dev tools)
  MIN_DISTANCE: 5,
  MAX_DISTANCE: 50,
  MIN_POLAR_ANGLE: 0.1,
  MAX_POLAR_ANGLE: Math.PI / 2 - 0.1
};

export default CAMERA;
