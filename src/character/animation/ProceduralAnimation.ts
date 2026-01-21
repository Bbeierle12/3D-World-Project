import { ANIMATION } from '../../config/index.js';
import { lerp } from '../../utils/index.js';
import { GaitType, MovementMode, type GaitTypeType, type MovementModeType } from '../controller/MovementModes.js';

export interface AnimationState {
  torsoLean: number;
  torsoTwist: number;
  headBob: number;
  hipSway: number;
  leftArmSwing: number;
  rightArmSwing: number;
  leftElbowBend: number;
  rightElbowBend: number;
}

/**
 * Procedural animation for upper body (FK)
 */
export class ProceduralAnimation {
  // Current rotations
  torsoLean: number;
  torsoTwist: number;
  headBob: number;
  hipSway: number;

  leftArmSwing: number;
  rightArmSwing: number;
  leftElbowBend: number;
  rightElbowBend: number;

  constructor() {
    // Current rotations
    this.torsoLean = 0;
    this.torsoTwist = 0;
    this.headBob = 0;
    this.hipSway = 0;

    this.leftArmSwing = 0;
    this.rightArmSwing = 0;
    this.leftElbowBend = 0;
    this.rightElbowBend = 0;
  }

  /**
   * Update upper body animation
   */
  update(movementMode: MovementModeType, gait: GaitTypeType, cyclePhase: number, time: number, deltaTime: number): void {
    const blendSpeed = 10 * deltaTime;
    const phase = cyclePhase * Math.PI * 2;

    // Calculate targets
    const targets = this.calculateTargets(movementMode, gait, phase, time);

    // Smooth interpolation
    this.torsoLean = lerp(this.torsoLean, targets.torsoLean, blendSpeed);
    this.torsoTwist = lerp(this.torsoTwist, targets.torsoTwist, blendSpeed);
    this.headBob = lerp(this.headBob, targets.headBob, blendSpeed);
    this.hipSway = lerp(this.hipSway, targets.hipSway, blendSpeed);

    this.leftArmSwing = lerp(this.leftArmSwing, targets.leftArmSwing, blendSpeed);
    this.rightArmSwing = lerp(this.rightArmSwing, targets.rightArmSwing, blendSpeed);
    this.leftElbowBend = lerp(this.leftElbowBend, targets.leftElbowBend, blendSpeed);
    this.rightElbowBend = lerp(this.rightElbowBend, targets.rightElbowBend, blendSpeed);
  }

  calculateTargets(movementMode: MovementModeType, gait: GaitTypeType, phase: number, time: number): AnimationState {
    let torsoLean = 0;
    let torsoTwist = 0;
    let headBob = 0;
    let hipSway = 0;
    let leftArmSwing = 0.05;
    let rightArmSwing = 0.05;
    let leftElbowBend = -0.1;
    let rightElbowBend = -0.1;

    // Torso based on movement mode and gait
    if (movementMode === MovementMode.GROUNDED || movementMode === MovementMode.LANDING) {
      if (gait === GaitType.RUNNING) {
        // Forward lean with vertical bounce at each foot strike (cos peaks at touchdown)
        torsoLean = ANIMATION.TORSO_LEAN_RUN + Math.abs(Math.cos(phase)) * 0.04;
        // Torso twists opposite to hips - use cos so twist is at max at touchdown
        // At cyclePhase=0 (left forward): twist right (positive)
        torsoTwist = Math.cos(phase) * ANIMATION.TORSO_TWIST_AMOUNT * 1.5;
        // Head dips at foot strikes (cyclePhase 0 and 0.5)
        headBob = -Math.abs(Math.cos(phase)) * ANIMATION.HEAD_BOB_AMOUNT * 2;
        // Hip sway - lateral shift follows leg cycle
        hipSway = Math.cos(phase) * ANIMATION.HIP_SWAY_AMOUNT;
      } else if (gait === GaitType.WALKING) {
        // Subtle forward lean with gentle bob at each step
        torsoLean = ANIMATION.TORSO_LEAN_WALK + Math.abs(Math.cos(phase)) * 0.02;
        // Counter-rotation of torso - in sync with leg cycle
        torsoTwist = Math.cos(phase) * ANIMATION.TORSO_TWIST_AMOUNT;
        // Head dips at foot strikes
        headBob = -Math.abs(Math.cos(phase)) * ANIMATION.HEAD_BOB_AMOUNT;
        // Hip sway toward stance leg
        hipSway = Math.cos(phase) * ANIMATION.HIP_SWAY_AMOUNT;
      } else {
        // Idle breathing
        torsoLean = Math.sin(time * ANIMATION.BREATHE_SPEED) * ANIMATION.BREATHE_AMPLITUDE;
      }
    } else if (movementMode === MovementMode.JUMPING) {
      torsoLean = ANIMATION.TORSO_LEAN_JUMP;
    } else if (movementMode === MovementMode.FALLING) {
      torsoLean = ANIMATION.TORSO_LEAN_FALL;
    }

    // Arms based on gait - contralateral to legs for natural walking motion
    // When left leg steps forward (cyclePhase=0), left arm goes back, right arm forward
    if (gait !== GaitType.IDLE) {
      const armSwingAmount = gait === GaitType.RUNNING
        ? ANIMATION.ARM_SWING_RUN
        : ANIMATION.ARM_SWING_WALK;

      // Use cosine for correct phase alignment with leg touchdown
      // At cyclePhase=0 (left leg touchdown): leftArm=-1 (back), rightArm=+1 (forward)
      // At cyclePhase=0.5 (right leg touchdown): leftArm=+1 (forward), rightArm=-1 (back)
      leftArmSwing = -Math.cos(phase) * armSwingAmount;
      rightArmSwing = Math.cos(phase) * armSwingAmount;

      // Elbow bends more when arm is back (pumping motion)
      const elbowIntensity = gait === GaitType.RUNNING ? 0.5 : 0.3;
      // Left elbow max bend when cos(phase)=1 (arm back), min when cos(phase)=-1 (arm forward)
      leftElbowBend = -(ANIMATION.ELBOW_BEND_BASE + (1 + Math.cos(phase)) * elbowIntensity);
      // Right elbow max bend when cos(phase)=-1 (arm back), min when cos(phase)=1 (arm forward)
      rightElbowBend = -(ANIMATION.ELBOW_BEND_BASE + (1 - Math.cos(phase)) * elbowIntensity);
    }

    // Airborne arms
    if (movementMode === MovementMode.JUMPING || movementMode === MovementMode.FALLING) {
      leftArmSwing = -0.6;
      rightArmSwing = -0.6;
      leftElbowBend = -0.5;
      rightElbowBend = -0.5;
    }

    return {
      torsoLean,
      torsoTwist,
      headBob,
      hipSway,
      leftArmSwing,
      rightArmSwing,
      leftElbowBend,
      rightElbowBend
    };
  }

  /**
   * Get current animation state for rig
   */
  getState(): AnimationState {
    return {
      torsoLean: this.torsoLean,
      torsoTwist: this.torsoTwist,
      headBob: this.headBob,
      hipSway: this.hipSway,
      leftArmSwing: this.leftArmSwing,
      rightArmSwing: this.rightArmSwing,
      leftElbowBend: this.leftElbowBend,
      rightElbowBend: this.rightElbowBend
    };
  }
}

export default ProceduralAnimation;
