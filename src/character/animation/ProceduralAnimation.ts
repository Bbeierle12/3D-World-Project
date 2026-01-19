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
        torsoLean = ANIMATION.TORSO_LEAN_RUN + Math.sin(phase * 2) * 0.03;
        torsoTwist = Math.sin(phase) * 0.08;
        headBob = -Math.sin(phase * 2) * 0.06;
        hipSway = Math.sin(phase) * 0.04;
      } else if (gait === GaitType.WALKING) {
        torsoLean = ANIMATION.TORSO_LEAN_WALK + Math.sin(phase * 2) * 0.02;
        torsoTwist = Math.sin(phase) * 0.05;
        headBob = -Math.sin(phase * 2) * 0.03;
        hipSway = Math.sin(phase) * 0.04;
      } else {
        // Idle breathing
        torsoLean = Math.sin(time * ANIMATION.BREATHE_SPEED) * ANIMATION.BREATHE_AMPLITUDE;
      }
    } else if (movementMode === MovementMode.JUMPING) {
      torsoLean = ANIMATION.TORSO_LEAN_JUMP;
    } else if (movementMode === MovementMode.FALLING) {
      torsoLean = ANIMATION.TORSO_LEAN_FALL;
    }

    // Arms based on gait
    if (gait !== GaitType.IDLE) {
      const intensity = gait === GaitType.RUNNING ? 1.3 : 0.8;
      leftArmSwing = Math.sin(phase + Math.PI) * 0.7 * intensity;
      rightArmSwing = Math.sin(phase) * 0.7 * intensity;
      leftElbowBend = -((Math.cos(phase + Math.PI) + 1) * 0.35 * intensity + 0.1);
      rightElbowBend = -((Math.cos(phase) + 1) * 0.35 * intensity + 0.1);
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
