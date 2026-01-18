/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Wrap an angle to [-PI, PI] range
 * @param {number} radians
 * @returns {number}
 */
export function wrapAngle(radians) {
  while (radians > Math.PI) radians -= Math.PI * 2;
  while (radians < -Math.PI) radians += Math.PI * 2;
  return radians;
}

/**
 * Normalize a 2D vector in place
 * @param {{x: number, y: number}} v
 * @returns {{x: number, y: number}}
 */
export function normalizeVector2(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len > 0) {
    v.x /= len;
    v.y /= len;
  }
  return v;
}

/**
 * Normalize a 3D vector in place
 * @param {{x: number, y: number, z: number}} v
 * @returns {{x: number, y: number, z: number}}
 */
export function normalizeVector3(v) {
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
 * @param {{x: number, y: number}} v
 * @returns {number}
 */
export function length2(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Get length of a 3D vector
 * @param {{x: number, y: number, z: number}} v
 * @returns {number}
 */
export function length3(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Get horizontal (XZ) speed from velocity
 * @param {{x: number, y: number, z: number}} velocity
 * @returns {number}
 */
export function horizontalSpeed(velocity) {
  return Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
}
