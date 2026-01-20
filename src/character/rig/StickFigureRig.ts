import * as THREE from 'three';
import { CHARACTER, ANIMATION } from '../../config/index.js';
import { lerp } from '../../utils/index.js';
import { MovementMode, type MovementModeType, type FootPhaseType } from '../controller/MovementModes.js';
import { createCharacterMaterials, type CharacterMaterials } from './materials.js';
import { SkeletonBuilder } from './SkeletonBuilder.js';
import type { DisposalTracker } from '../../utils/disposal.js';
import type { Vector3Like, BonePositions } from '../../types/index.js';
import type { IKSolution } from '../animation/TwoBoneIK.js';
import type { AnimationState } from '../animation/ProceduralAnimation.js';

// Define specific pivot and bone keys for type safety
interface Pivots {
  root: THREE.Group;
  spine: THREE.Group;
  neck: THREE.Group;
  leftShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  leftElbow: THREE.Group;
  leftLowerArm: THREE.Group;
  rightShoulder: THREE.Group;
  rightUpperArm: THREE.Group;
  rightElbow: THREE.Group;
  rightLowerArm: THREE.Group;
  leftHip: THREE.Group;
  leftUpperLeg: THREE.Group;
  leftKnee: THREE.Group;
  leftLowerLeg: THREE.Group;
  rightHip: THREE.Group;
  rightUpperLeg: THREE.Group;
  rightKnee: THREE.Group;
  rightLowerLeg: THREE.Group;
}

interface Bones {
  torso: THREE.Mesh;
  head: THREE.Mesh;
  hip: THREE.Mesh;
  leftShoulder: THREE.Mesh;
  leftUpperArm: THREE.Mesh;
  leftElbow: THREE.Mesh;
  leftLowerArm: THREE.Mesh;
  leftHand: THREE.Mesh;
  rightShoulder: THREE.Mesh;
  rightUpperArm: THREE.Mesh;
  rightElbow: THREE.Mesh;
  rightLowerArm: THREE.Mesh;
  rightHand: THREE.Mesh;
  leftUpperLeg: THREE.Mesh;
  leftKnee: THREE.Mesh;
  leftLowerLeg: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightUpperLeg: THREE.Mesh;
  rightKnee: THREE.Mesh;
  rightLowerLeg: THREE.Mesh;
  rightFoot: THREE.Mesh;
}

/**
 * Stick figure visual rig
 * Builds Three.js skeleton and applies animations
 */
export class StickFigureRig {
  tracker: DisposalTracker;
  materials: CharacterMaterials;
  builder: SkeletonBuilder;

  // Dimensions
  hipHeight: number;
  hipWidth: number;
  upperLegLength: number;
  lowerLegLength: number;

  // Root group
  group: THREE.Group;

  // Pivots and bones
  pivots: Pivots;
  bones: Bones;

  // Debug
  debugEnabled: boolean;
  debugMarkers: { leftFoot?: THREE.Mesh; rightFoot?: THREE.Mesh };

  constructor(tracker: DisposalTracker) {
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

    // Pivots and bones (built up in buildSkeleton)
    this.pivots = {} as Pivots;
    this.bones = {} as Bones;

    // Debug
    this.debugEnabled = false;
    this.debugMarkers = {};

    this.buildSkeleton();
    this.createDebugMarkers();
  }

  buildSkeleton(): void {
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

  buildArm(side: 'left' | 'right', parent: THREE.Group, xOffset: number): void {
    const b = this.builder;

    // Shoulder
    const shoulder = b.createPivot(`${side}Shoulder`);
    shoulder.position.set(xOffset, 2.3, 0);
    parent.add(shoulder);

    const shoulderJoint = b.createJoint(0.2);
    shoulder.add(shoulderJoint);

    // Upper arm
    const upperArm = b.createPivot(`${side}UpperArm`);
    shoulder.add(upperArm);

    const upperArmBone = b.createLimb(1.2);
    upperArm.add(upperArmBone);

    // Elbow
    const elbow = b.createPivot(`${side}Elbow`);
    elbow.position.y = -1.2;
    upperArm.add(elbow);

    const elbowJoint = b.createJoint(0.18);
    elbow.add(elbowJoint);

    // Lower arm
    const lowerArm = b.createPivot(`${side}LowerArm`);
    elbow.add(lowerArm);

    const lowerArmBone = b.createLimb(1.0);
    lowerArm.add(lowerArmBone);

    // Hand
    const hand = b.createJoint(0.2);
    hand.position.y = -1.0;
    lowerArm.add(hand);

    // Assign to typed properties
    if (side === 'left') {
      this.pivots.leftShoulder = shoulder;
      this.pivots.leftUpperArm = upperArm;
      this.pivots.leftElbow = elbow;
      this.pivots.leftLowerArm = lowerArm;
      this.bones.leftShoulder = shoulderJoint;
      this.bones.leftUpperArm = upperArmBone;
      this.bones.leftElbow = elbowJoint;
      this.bones.leftLowerArm = lowerArmBone;
      this.bones.leftHand = hand;
    } else {
      this.pivots.rightShoulder = shoulder;
      this.pivots.rightUpperArm = upperArm;
      this.pivots.rightElbow = elbow;
      this.pivots.rightLowerArm = lowerArm;
      this.bones.rightShoulder = shoulderJoint;
      this.bones.rightUpperArm = upperArmBone;
      this.bones.rightElbow = elbowJoint;
      this.bones.rightLowerArm = lowerArmBone;
      this.bones.rightHand = hand;
    }
  }

  buildLeg(side: 'left' | 'right', parent: THREE.Group, xOffset: number): void {
    const b = this.builder;

    // Hip pivot
    const hip = b.createPivot(`${side}Hip`);
    hip.position.set(xOffset, 0, 0);
    parent.add(hip);

    // Upper leg
    const upperLeg = b.createPivot(`${side}UpperLeg`);
    hip.add(upperLeg);

    const upperLegBone = b.createLimb(this.upperLegLength, 0.12);
    upperLeg.add(upperLegBone);

    // Knee
    const knee = b.createPivot(`${side}Knee`);
    knee.position.y = -this.upperLegLength;
    upperLeg.add(knee);

    const kneeJoint = b.createJoint(0.2);
    knee.add(kneeJoint);

    // Lower leg
    const lowerLeg = b.createPivot(`${side}LowerLeg`);
    knee.add(lowerLeg);

    const lowerLegBone = b.createLimb(this.lowerLegLength, 0.1);
    lowerLeg.add(lowerLegBone);

    // Foot
    const foot = b.createJoint(0.22);
    foot.position.y = -this.lowerLegLength;
    lowerLeg.add(foot);

    // Assign to typed properties
    if (side === 'left') {
      this.pivots.leftHip = hip;
      this.pivots.leftUpperLeg = upperLeg;
      this.pivots.leftKnee = knee;
      this.pivots.leftLowerLeg = lowerLeg;
      this.bones.leftUpperLeg = upperLegBone;
      this.bones.leftKnee = kneeJoint;
      this.bones.leftLowerLeg = lowerLegBone;
      this.bones.leftFoot = foot;
    } else {
      this.pivots.rightHip = hip;
      this.pivots.rightUpperLeg = upperLeg;
      this.pivots.rightKnee = knee;
      this.pivots.rightLowerLeg = lowerLeg;
      this.bones.rightUpperLeg = upperLegBone;
      this.bones.rightKnee = kneeJoint;
      this.bones.rightLowerLeg = lowerLegBone;
      this.bones.rightFoot = foot;
    }
  }

  createDebugMarkers(): void {
    this.debugMarkers.leftFoot = this.builder.createDebugMarker(this.materials.debugStance);
    this.debugMarkers.rightFoot = this.builder.createDebugMarker(this.materials.debugSwing);
  }

  /**
   * Set debug visibility
   */
  setDebugVisible(visible: boolean, scene: THREE.Scene): void {
    this.debugEnabled = visible;
    if (visible) {
      if (this.debugMarkers.leftFoot) scene.add(this.debugMarkers.leftFoot);
      if (this.debugMarkers.rightFoot) scene.add(this.debugMarkers.rightFoot);
    } else {
      if (this.debugMarkers.leftFoot) scene.remove(this.debugMarkers.leftFoot);
      if (this.debugMarkers.rightFoot) scene.remove(this.debugMarkers.rightFoot);
    }
  }

  /**
   * Sync rig position to controller
   */
  syncToController(position: Vector3Like, facing: number): void {
    this.group.position.set(position.x, position.y, position.z);
    this.group.rotation.y = facing;
  }

  /**
   * Apply leg IK results
   */
  applyLegIK(side: 'left' | 'right', ik: IKSolution, blendSpeed: number): void {
    const upperPivot = side === 'left' ? this.pivots.leftUpperLeg : this.pivots.rightUpperLeg;
    const lowerPivot = side === 'left' ? this.pivots.leftLowerLeg : this.pivots.rightLowerLeg;

    upperPivot.rotation.x = lerp(upperPivot.rotation.x, ik.upperAngle, blendSpeed);
    lowerPivot.rotation.x = lerp(lowerPivot.rotation.x, ik.lowerAngle, blendSpeed);
  }

  /**
   * Apply upper body animation
   */
  applyUpperBodyAnimation(animState: AnimationState, blendSpeed: number): void {
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
   */
  applyPelvisOffset(offset: number): void {
    this.pivots.root.position.y = this.hipHeight + offset;
  }

  /**
   * Apply landing compression
   */
  applyLandingCompression(compression: number): void {
    this.pivots.root.position.y -= compression;
  }

  /**
   * Apply airborne leg pose
   */
  applyAirbornePose(movementMode: MovementModeType, blendSpeed: number): void {
    let upperAngle: number, lowerAngle: number;

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
   */
  updateDebugMarkers(leftTarget: Vector3Like, rightTarget: Vector3Like, leftPhase: FootPhaseType, rightPhase: FootPhaseType): void {
    if (!this.debugEnabled) return;

    if (this.debugMarkers.leftFoot) {
      this.debugMarkers.leftFoot.position.set(leftTarget.x, leftTarget.y, leftTarget.z);
      this.debugMarkers.leftFoot.material = leftPhase === 'stance'
        ? this.materials.debugStance
        : this.materials.debugSwing;
    }
    if (this.debugMarkers.rightFoot) {
      this.debugMarkers.rightFoot.position.set(rightTarget.x, rightTarget.y, rightTarget.z);
      this.debugMarkers.rightFoot.material = rightPhase === 'stance'
        ? this.materials.debugStance
        : this.materials.debugSwing;
    }
  }

  /**
   * Get available joint names for debug/telemetry.
   */
  getJointNames(): string[] {
    return Object.keys(this.pivots);
  }

  /**
   * Get a joint's world transform and local rotation.
   */
  getJointTransform(jointName: string): {
    position: Vector3Like;
    localRotation: Vector3Like;
    quaternion: { x: number; y: number; z: number; w: number };
  } | null {
    const pivot = this.pivots[jointName as keyof Pivots];
    if (!pivot) return null;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    pivot.getWorldPosition(worldPos);
    pivot.getWorldQuaternion(worldQuat);

    return {
      position: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      localRotation: { x: pivot.rotation.x, y: pivot.rotation.y, z: pivot.rotation.z },
      quaternion: { x: worldQuat.x, y: worldQuat.y, z: worldQuat.z, w: worldQuat.w }
    };
  }

  /**
   * Get hip world position for IK
   */
  getHipWorldPosition(side: 'left' | 'right', charPos: Vector3Like, facing: number, pelvisOffset: number): Vector3Like {
    const offset = side === 'left' ? -this.hipWidth / 2 : this.hipWidth / 2;
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);

    return {
      x: charPos.x + offset * cos,
      y: charPos.y + this.hipHeight + pelvisOffset,
      z: charPos.z + offset * -sin
    };
  }

  /**
   * Get world positions of all bones for CoM calculation
   * Returns a Map of bone names to their world positions
   */
  getBoneWorldPositions(): BonePositions {
    const positions: BonePositions = new Map();

    // Helper to get world position of a mesh
    const getWorldPos = (mesh: THREE.Mesh): Vector3Like => {
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      return { x: worldPos.x, y: worldPos.y, z: worldPos.z };
    };

    // Head
    positions.set('head', getWorldPos(this.bones.head));

    // Torso (use center of torso bone)
    positions.set('torso', getWorldPos(this.bones.torso));

    // Arms - left
    positions.set('leftUpperArm', getWorldPos(this.bones.leftUpperArm));
    positions.set('leftLowerArm', getWorldPos(this.bones.leftLowerArm));
    positions.set('leftHand', getWorldPos(this.bones.leftHand));

    // Arms - right
    positions.set('rightUpperArm', getWorldPos(this.bones.rightUpperArm));
    positions.set('rightLowerArm', getWorldPos(this.bones.rightLowerArm));
    positions.set('rightHand', getWorldPos(this.bones.rightHand));

    // Legs - left
    positions.set('leftUpperLeg', getWorldPos(this.bones.leftUpperLeg));
    positions.set('leftLowerLeg', getWorldPos(this.bones.leftLowerLeg));
    positions.set('leftFoot', getWorldPos(this.bones.leftFoot));

    // Legs - right
    positions.set('rightUpperLeg', getWorldPos(this.bones.rightUpperLeg));
    positions.set('rightLowerLeg', getWorldPos(this.bones.rightLowerLeg));
    positions.set('rightFoot', getWorldPos(this.bones.rightFoot));

    return positions;
  }

  /**
   * Get world position of a specific foot
   */
  getFootWorldPosition(side: 'left' | 'right'): Vector3Like {
    const foot = side === 'left' ? this.bones.leftFoot : this.bones.rightFoot;
    const worldPos = new THREE.Vector3();
    foot.getWorldPosition(worldPos);
    return { x: worldPos.x, y: worldPos.y, z: worldPos.z };
  }

  /**
   * Apply joint rotations from a pose preset
   */
  applyPose(jointAngles: Record<string, Vector3Like>): void {
    const pivots = this.pivots as Record<string, THREE.Group>;
    for (const [jointName, angles] of Object.entries(jointAngles)) {
      const pivot = pivots[jointName];
      if (pivot) {
        pivot.rotation.set(angles.x, angles.y, angles.z);
      }
    }
  }

  /**
   * Capture current joint rotations for pose saving
   */
  getPose(): Record<string, Vector3Like> {
    const pivots = this.pivots as Record<string, THREE.Group>;
    const pose: Record<string, Vector3Like> = {};
    for (const [jointName, pivot] of Object.entries(pivots)) {
      pose[jointName] = {
        x: pivot.rotation.x,
        y: pivot.rotation.y,
        z: pivot.rotation.z
      };
    }
    return pose;
  }
}

export default StickFigureRig;
