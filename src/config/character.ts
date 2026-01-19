import type { CharacterConfig } from '../types/index.js';

// Character controller parameters
export const CHARACTER: CharacterConfig = {
  // Dimensions
  HEIGHT: 6,
  HIP_HEIGHT: 3,
  HIP_WIDTH: 0.8,

  // Movement speeds
  WALK_SPEED: 5,
  RUN_SPEED: 10,

  // Acceleration
  GROUND_ACCEL: 30,
  GROUND_DECEL: 40,
  AIR_ACCEL: 5,
  AIR_DECEL: 2,

  // Turning
  TURN_SPEED: 10,

  // Jumping & Gravity
  JUMP_VELOCITY: 12,
  GRAVITY: 25,

  // Ground detection
  SKIN_WIDTH: 0.1,
  STEP_OFFSET: 0.5,
  SLOPE_LIMIT: 45,
  SNAP_DISTANCE: 0.3,

  // Collider
  CAPSULE_RADIUS: 0.35,
  CAPSULE_HEIGHT: 5.2,

  // Landing
  LANDING_DURATION: 0.15,

  // Bounds
  WORLD_BOUNDS: 45,

  // Center of Mass
  COM_OFFSET_X: 0,
  COM_OFFSET_Y: 0,
  COM_OFFSET_Z: 0,
  COM_BALANCE_INFLUENCE: 0.5,
  COM_LEAN_COMPENSATION: 1.0,

  // Skeleton proportions
  SKELETON: {
    TORSO_LENGTH: 2.5,
    UPPER_ARM_LENGTH: 1.2,
    LOWER_ARM_LENGTH: 1.0,
    HEAD_RADIUS: 0.5,
    JOINT_RADIUS: 0.2,
    LIMB_RADIUS: 0.12
  }
};

export default CHARACTER;
