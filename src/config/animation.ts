import type { AnimationConfig } from '../types/index.js';

// Animation parameters
export const ANIMATION: AnimationConfig = {
  // Walk cycle (legacy - now computed from speed/stride)
  WALK_CYCLE_SPEED: 8,
  RUN_CYCLE_SPEED: 12,

  // Stride - tuned for 3m leg length character
  // Longer strides = slower stepping frequency for more natural cadence
  // Walking: ~0.8x leg length, Running: ~1.2x leg length
  WALK_STRIDE_LENGTH: 2.4,
  RUN_STRIDE_LENGTH: 3.6,
  WALK_STRIDE_HEIGHT: 0.12,
  RUN_STRIDE_HEIGHT: 0.28,

  // IK
  IK_BLEND_SPEED: 8.0,
  FOOT_PLANT_TOLERANCE: 0.1,
  PELVIS_DROP_MAX: 0.4,

  // Leg dimensions
  UPPER_LEG_LENGTH: 1.5,
  LOWER_LEG_LENGTH: 1.5,

  // Arm swing - increased for more visible motion
  ARM_SWING_WALK: 0.6,
  ARM_SWING_RUN: 1.0,
  ELBOW_BEND_BASE: 0.15,

  // Torso - increased for natural body motion
  TORSO_LEAN_WALK: 0.05,
  TORSO_LEAN_RUN: 0.12,
  TORSO_LEAN_JUMP: -0.15,
  TORSO_LEAN_FALL: 0.1,
  TORSO_TWIST_AMOUNT: 0.1,

  // Head - subtle bob synced with steps
  HEAD_BOB_AMOUNT: 0.04,

  // Hip - increased lateral sway for natural gait
  HIP_SWAY_AMOUNT: 0.05,

  // Breathing
  BREATHE_SPEED: 2,
  BREATHE_AMPLITUDE: 0.02,

  // Landing
  LANDING_IMPACT: 0.15
};

export default ANIMATION;
