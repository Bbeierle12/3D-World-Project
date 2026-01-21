import type { CharacterConfig } from '../types/index.js';

// Character controller parameters
export const CHARACTER: CharacterConfig = {
  // Dimensions
  HEIGHT: 6,
  HIP_HEIGHT: 3,
  HIP_WIDTH: 0.8,

  // Movement speeds - scaled for 6m character (3.43x human scale)
  // Human walk: 1.4 m/s, Human jog: 4 m/s
  WALK_SPEED: 4.5,
  RUN_SPEED: 8,

  // Acceleration - responsive but natural feeling
  GROUND_ACCEL: 25,   // Quick acceleration for responsive controls
  GROUND_DECEL: 35,   // Moderate deceleration for natural stops
  AIR_ACCEL: 4,
  AIR_DECEL: 1.5,

  // Turning - responsive rotation
  TURN_SPEED: 8,
  TURN_IN_PLACE_ANGULAR_THRESHOLD: 1.5,  // rad/s - above this angular velocity, consider turning
  TURN_IN_PLACE_SPEED_THRESHOLD: 1.0,    // m/s - below this forward speed, can turn in place
  TURN_IN_PLACE_EXIT_ANGLE: 0.15,        // radians - exit turning when remaining angle < this
  TURN_IN_PLACE_MIN_DURATION: 0.1,       // seconds - minimum time in turning state

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
