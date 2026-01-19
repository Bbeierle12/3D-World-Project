import type { Vector3Like } from '../types/index.js';

interface Vector2Like {
  x: number;
  y: number;
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Wrap an angle to [-PI, PI] range
 */
export function wrapAngle(radians: number): number {
  while (radians > Math.PI) radians -= Math.PI * 2;
  while (radians < -Math.PI) radians += Math.PI * 2;
  return radians;
}

/**
 * Normalize a 2D vector in place
 */
export function normalizeVector2(v: Vector2Like): Vector2Like {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len > 0) {
    v.x /= len;
    v.y /= len;
  }
  return v;
}

/**
 * Normalize a 3D vector in place
 */
export function normalizeVector3(v: Vector3Like): Vector3Like {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len > 0) {
    v.x /= len;
    v.y /= len;
    v.z /= len;
  }
  return v;
}

/**
 * Get length of a 2D vector
 */
export function length2(v: Vector2Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Get length of a 3D vector
 */
export function length3(v: Vector3Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Get horizontal (XZ) speed from velocity
 */
export function horizontalSpeed(velocity: Vector3Like): number {
  return Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
}
