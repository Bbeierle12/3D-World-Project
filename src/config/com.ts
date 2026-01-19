import type { CoMConfig } from '../types/index.js';

/**
 * Center of Mass configuration
 * Segment masses based on biomechanics research (percentage of total body mass)
 */
export const COM: CoMConfig = {
  // Segment mass percentages (must sum to ~100%)
  SEGMENT_MASSES: {
    head: 0.08,           // 8%
    torso: 0.43,          // 43% (includes pelvis)
    leftUpperArm: 0.028,  // 2.8%
    rightUpperArm: 0.028, // 2.8%
    leftLowerArm: 0.016,  // 1.6%
    rightLowerArm: 0.016, // 1.6%
    leftHand: 0.006,      // 0.6%
    rightHand: 0.006,     // 0.6%
    leftUpperLeg: 0.10,   // 10%
    rightUpperLeg: 0.10,  // 10%
    leftLowerLeg: 0.0465, // 4.65%
    rightLowerLeg: 0.0465,// 4.65%
    leftFoot: 0.0145,     // 1.45%
    rightFoot: 0.0145     // 1.45%
  },

  // Trail configuration
  TRAIL: {
    MAX_POINTS: 60,       // 1 second @ 60fps
    FADE_START: 0.7,      // Start fading at 70% of trail
    LINE_WIDTH: 2,
    COLOR_START: 0xff0000, // Red (recent)
    COLOR_END: 0x330000    // Dark red (old)
  },

  // Stability thresholds
  STABILITY: {
    STABLE_MARGIN: 0.1,   // Meters - fully stable
    WARNING_MARGIN: 0.05, // Meters - warning zone
    UNSTABLE_MARGIN: 0    // Meters - unstable
  },

  // Velocity arrow configuration
  VELOCITY_ARROW: {
    SCALE: 0.5,           // Arrow length = velocity * scale
    MIN_LENGTH: 0.05,     // Minimum arrow length
    MAX_LENGTH: 2.0,      // Maximum arrow length
    HEAD_LENGTH: 0.1,
    HEAD_WIDTH: 0.05
  },

  // Support polygon
  SUPPORT_POLYGON: {
    FOOT_LENGTH: 0.25,    // Meters
    FOOT_WIDTH: 0.1,      // Meters
    LINE_WIDTH: 2,
    COLOR_STABLE: 0x00ffff,   // Cyan when stable
    COLOR_UNSTABLE: 0xff0000  // Red when unstable
  }
};

export default COM;
