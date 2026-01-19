/**
 * Movement mode enum
 */
export const MovementMode = {
  GROUNDED: 'grounded',
  JUMPING: 'jumping',
  FALLING: 'falling',
  LANDING: 'landing'
} as const;

export type MovementModeType = typeof MovementMode[keyof typeof MovementMode];

/**
 * Gait type enum
 */
export const GaitType = {
  IDLE: 'idle',
  WALKING: 'walking',
  RUNNING: 'running'
} as const;

export type GaitTypeType = typeof GaitType[keyof typeof GaitType];

/**
 * Foot phase enum (for IK)
 */
export const FootPhase = {
  STANCE: 'stance',
  SWING: 'swing'
} as const;

export type FootPhaseType = typeof FootPhase[keyof typeof FootPhase];

/**
 * Check if character is airborne
 */
export function isAirborne(mode: MovementModeType): boolean {
  return mode === MovementMode.JUMPING || mode === MovementMode.FALLING;
}

/**
 * Get display state string
 */
export function getDisplayState(movementMode: MovementModeType, gait: GaitTypeType): string {
  if (movementMode === MovementMode.JUMPING) return 'jumping';
  if (movementMode === MovementMode.FALLING) return 'falling';
  if (movementMode === MovementMode.LANDING) return 'landing';
  return gait;
}
