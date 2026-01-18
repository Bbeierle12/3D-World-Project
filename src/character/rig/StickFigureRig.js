import * as THREE from 'three';
import { CHARACTER, ANIMATION } from '../../config/index.js';
import { lerp } from '../../utils/index.js';
import { MovementMode } from '../controller/MovementModes.js';
import { createCharacterMaterials } from './materials.js';
import { SkeletonBuilder } from './SkeletonBuilder.js';

/**
 * Stick figure visual rig
 * Builds Three.js skeleton and applies animations
 */
export class StickFigureRig {
  /**
   * @param {import('../../utils/disposal.js').DisposalTracker} tracker
   */
  constructor(tracker) {
    this.tracker = tracker;
    this.materials = createCharacterMaterials(tracker);
    this.builder = new SkeletonBuilder(this.materials, tracker);

    // Dimensions
    this.hipHeight = CHARACTER.HIP_HEIGHT;
    this.hipWidth = CHARACTER.HIP_WIDTH;
    this.upperLegLength = ANIMATION.UPPER_LEG_LENGTH;
    this.lowerLegLength = ANIMATION.LOWER_LEG_LENGTH;

    // Root group
    this.group = new THREE.Group();

    // Pivots and bones
    this.pivots = {};
    this.bones = {};

    // Debug
    this.debugEnabled = false;
    this.debugMarkers = {};

    this.buildSkeleton();
    this.createDebugMarkers();
  }

  buildSkeleton() {
    const b = this.builder;

    // Root at hip level
    const root = b.createPivot('root');
    root.position.y = this.hipHeight;
    this.group.add(root);
    this.pivots.root = root;

    // Spine
    const spine = b.createPivot('spine');
    root.add(spine);
    this.pivots.spine = spine;

    // Torso
    this.bones.torso = b.createLimb(2.5, 0.15);
    this.bones.torso.position.y = 2.5 / 2;
    this.bones.torso.geometry.translate(0, 0, 0);
    spine.add(this.bones.torso);

    // Neck
    const neck = b.createPivot('neck');
    neck.position.y = 2.5;
    spine.add(neck);
    this.pivots.neck = neck;

    // Head
    this.bones.head = b.createJoint(0.5);
    this.bones.head.position.y = 0.6;
    neck.add(this.bones.head);

    // Hip joint
    this.bones.hip = b.createJoint(0.25);
    root.add(this.bones.hip);

    // Build arms
    this.buildArm('left', spine, -0.6);
    this.buildArm('right', spine, 0.6);

    // Build legs
    this.buildLeg('left', root, -this.hipWidth / 2);
    this.buildLeg('right', root, this.hipWidth / 2);
  }

  buildArm(side, parent, xOffset) {
    const b = this.builder;
    const prefix = side;

    // Shoulder
    const shoulder = b.createPivot(`${prefix}Shoulder`);
    shoulder.position.set(xOffset, 2.3, 0);
    parent.add(shoulder);
    this.pivots[`${prefix}Shoulder`] = shoulder;

    this.bones[`${prefix}Shoulder`] = b.createJoint(0.2);
    shoulder.add(this.bones[`${prefix}Shoulder`]);

    // Upper arm
    const upperArm = b.createPivot(`${prefix}UpperArm`);
    shoulder.add(upperArm);
    this.pivots[`${prefix}UpperArm`] = upperArm;

    this.bones[`${prefix}UpperArm`] = b.createLimb(1.2);
    upperArm.add(this.bones[`${prefix}UpperArm`]);

    // Elbow
    const elbow = b.createPivot(`${prefix}Elbow`);
    elbow.position.y = -1.2;
    upperArm.add(elbow);
    this.pivots[`${prefix}Elbow`] = elbow;

    this.bones[`${prefix}Elbow`] = b.createJoint(0.18);
    elbow.add(this.bones[`${prefix}Elbow`]);

    // Lower arm
    const lowerArm = b.createPivot(`${prefix}LowerArm`);
    elbow.add(lowerArm);
    this.pivots[`${prefix}LowerArm`] = lowerArm;

    this.bones[`${prefix}LowerArm`] = b.createLimb(1.0);
    lowerArm.add(this.bones[`${prefix}LowerArm`]);

    // Hand
    this.bones[`${prefix}Hand`] = b.createJoint(0.2);
    this.bones[`${prefix}Hand`].position.y = -1.0;
    lowerArm.add(this.bones[`${prefix}Hand`]);
  }

  buildLeg(side, parent, xOffset) {
    const b = this.builder;
    const prefix = side;

    // Hip pivot
    const hip = b.createPivot(`${prefix}Hip`);
    hip.position.set(xOffset, 0, 0);
    parent.add(hip);
    this.pivots[`${prefix}Hip`] = hip;

    // Upper leg
    const upperLeg = b.createPivot(`${prefix}UpperLeg`);
    hip.add(upperLeg);
    this.pivots[`${prefix}UpperLeg`] = upperLeg;

    this.bones[`${prefix}UpperLeg`] = b.createLimb(this.upperLegLength, 0.12);
    upperLeg.add(this.bones[`${prefix}UpperLeg`]);

    // Knee
    const knee = b.createPivot(`${prefix}Knee`);
    knee.position.y = -this.upperLegLength;
    upperLeg.add(knee);
    this.pivots[`${prefix}Knee`] = knee;

    this.bones[`${prefix}Knee`] = b.createJoint(0.2);
    knee.add(this.bones[`${prefix}Knee`]);

    // Lower leg
    const lowerLeg = b.createPivot(`${prefix}LowerLeg`);
    knee.add(lowerLeg);
    this.pivots[`${prefix}LowerLeg`] = lowerLeg;

    this.bones[`${prefix}LowerLeg`] = b.createLimb(this.lowerLegLength, 0.1);
    lowerLeg.add(this.bones[`${prefix}LowerLeg`]);

    // Foot
    this.bones[`${prefix}Foot`] = b.createJoint(0.22);
    this.bones[`${prefix}Foot`].position.y = -this.lowerLegLength;
    lowerLeg.add(this.bones[`${prefix}Foot`]);
  }

  createDebugMarkers() {
    this.debugMarkers.leftFoot = this.builder.createDebugMarker(this.materials.debugStance);
    this.debugMarkers.rightFoot = this.builder.createDebugMarker(this.materials.debugSwing);
  }

  /**
   * Set debug visibility
   * @param {boolean} visible
   * @param {THREE.Scene} scene
   */
  setDebugVisible(visible, scene) {
    this.debugEnabled = visible;
    if (visible) {
      scene.add(this.debugMarkers.leftFoot);
      scene.add(this.debugMarkers.rightFoot);
    } else {
      scene.remove(this.debugMarkers.leftFoot);
      scene.remove(this.debugMarkers.rightFoot);
    }
  }

  /**
   * Sync rig position to controller
   * @param {{x: number, y: number, z: number}} position
   * @param {number} facing
   */
  syncToController(position, facing) {
    this.group.position.set(position.x, position.y, position.z);
    this.group.rotation.y = facing;
  }

  /**
   * Apply leg IK results
   * @param {string} side - 'left' or 'right'
   * @param {{upperAngle: number, lowerAngle: number}} ik
   * @param {number} blendSpeed
   */
  applyLegIK(side, ik, blendSpeed) {
    const upperPivot = this.pivots[`${side}UpperLeg`];
    const lowerPivot = this.pivots[`${side}LowerLeg`];

    upperPivot.rotation.x = lerp(upperPivot.rotation.x, ik.upperAngle, blendSpeed);
    lowerPivot.rotation.x = lerp(lowerPivot.rotation.x, ik.lowerAngle, blendSpeed);
  }

  /**
   * Apply upper body animation
   * @param {object} animState - From ProceduralAnimation.getState()
   * @param {number} blendSpeed
   */
  applyUpperBodyAnimation(animState, blendSpeed) {
    this.pivots.spine.rotation.x = lerp(this.pivots.spine.rotation.x, animState.torsoLean, blendSpeed);
    this.pivots.spine.rotation.y = lerp(this.pivots.spine.rotation.y, animState.torsoTwist, blendSpeed);
    this.pivots.neck.rotation.x = lerp(this.pivots.neck.rotation.x, animState.headBob, blendSpeed);
    this.pivots.root.rotation.z = lerp(this.pivots.root.rotation.z, animState.hipSway, blendSpeed);

    // Arms
    this.pivots.leftUpperArm.rotation.x = lerp(this.pivots.leftUpperArm.rotation.x, animState.leftArmSwing, blendSpeed);
    this.pivots.rightUpperArm.rotation.x = lerp(this.pivots.rightUpperArm.rotation.x, animState.rightArmSwing, blendSpeed);
    this.pivots.leftLowerArm.rotation.x = lerp(this.pivots.leftLowerArm.rotation.x, animState.leftElbowBend, blendSpeed);
    this.pivots.rightLowerArm.rotation.x = lerp(this.pivots.rightLowerArm.rotation.x, animState.rightElbowBend, blendSpeed);
  }

  /**
   * Apply pelvis offset
   * @param {number} offset
   */
  applyPelvisOffset(offset) {
    this.pivots.root.position.y = this.hipHeight + offset;
  }

  /**
   * Apply landing compression
   * @param {number} compression
   */
  applyLandingCompression(compression) {
    this.pivots.root.position.y -= compression;
  }

  /**
   * Apply airborne leg pose
   * @param {string} movementMode
   * @param {number} blendSpeed
   */
  applyAirbornePose(movementMode, blendSpeed) {
    let upperAngle, lowerAngle;

    if (movementMode === MovementMode.JUMPING) {
      upperAngle = 0.4;
      lowerAngle = 0.6;
    } else {
      upperAngle = 0.1;
      lowerAngle = 0.2;
    }

    this.pivots.leftUpperLeg.rotation.x = lerp(this.pivots.leftUpperLeg.rotation.x, upperAngle, blendSpeed);
    this.pivots.rightUpperLeg.rotation.x = lerp(this.pivots.rightUpperLeg.rotation.x, upperAngle, blendSpeed);
    this.pivots.leftLowerLeg.rotation.x = lerp(this.pivots.leftLowerLeg.rotation.x, lowerAngle, blendSpeed);
    this.pivots.rightLowerLeg.rotation.x = lerp(this.pivots.rightLowerLeg.rotation.x, lowerAngle, blendSpeed);
  }

  /**
   * Update debug markers
   * @param {{x: number, y: number, z: number}} leftTarget
   * @param {{x: number, y: number, z: number}} rightTarget
   * @param {string} leftPhase
   * @param {string} rightPhase
   */
  updateDebugMarkers(leftTarget, rightTarget, leftPhase, rightPhase) {
    if (!this.debugEnabled) return;

    this.debugMarkers.leftFoot.position.set(leftTarget.x, leftTarget.y, leftTarget.z);
    this.debugMarkers.rightFoot.position.set(rightTarget.x, rightTarget.y, rightTarget.z);

    this.debugMarkers.leftFoot.material = leftPhase === 'stance'
      ? this.materials.debugStance
      : this.materials.debugSwing;
    this.debugMarkers.rightFoot.material = rightPhase === 'stance'
      ? this.materials.debugStance
      : this.materials.debugSwing;
  }

  /**
   * Get hip world position for IK
   * @param {string} side
   * @param {{x: number, y: number, z: number}} charPos
   * @param {number} facing
   * @param {number} pelvisOffset
   * @returns {{x: number, y: number, z: number}}
   */
  getHipWorldPosition(side, charPos, facing, pelvisOffset) {
    const offset = side === 'left' ? -this.hipWidth / 2 : this.hipWidth / 2;
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);

    return {
      x: charPos.x + offset * cos,
      y: charPos.y + this.hipHeight + pelvisOffset,
      z: charPos.z + offset * -sin
    };
  }
}

export default StickFigureRig;
