/**
 * Movement mode enum
 */
export const MovementMode = {
  GROUNDED: 'grounded',
  JUMPING: 'jumping',
  FALLING: 'falling',
  LANDING: 'landing'
};

/**
 * Gait type enum
 */
export const GaitType = {
  IDLE: 'idle',
  WALKING: 'walking',
  RUNNING: 'running'
};

/**
 * Foot phase enum (for IK)
 */
export const FootPhase = {
  STANCE: 'stance',
  SWING: 'swing'
};

/**
 * Check if character is airborne
 * @param {string} mode
 * @returns {boolean}
 */
export function isAirborne(mode) {
  return mode === MovementMode.JUMPING || mode === MovementMode.FALLING;
}

/**
 * Get display state string
 * @param {string} movementMode
 * @param {string} gait
 * @returns {string}
 */
export function getDisplayState(movementMode, gait) {
  if (movementMode === MovementMode.JUMPING) return 'jumping';
  if (movementMode === MovementMode.FALLING) return 'falling';
  if (movementMode === MovementMode.LANDING) return 'landing';
  return gait;
}
