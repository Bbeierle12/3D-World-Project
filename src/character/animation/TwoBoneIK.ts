import { clamp } from '../../utils/index.js';
import type { Vector3Like } from '../../types/index.js';

export interface IKSolution {
  upperAngle: number;
  lowerAngle: number;
  reachRatio: number;
}

/**
 * Generic two-bone IK solver
 * Works for legs and arms
 */
export class TwoBoneIK {
  upperLength: number;
  lowerLength: number;
  totalLength: number;

  constructor(upperLength: number, lowerLength: number) {
    this.upperLength = upperLength;
    this.lowerLength = lowerLength;
    this.totalLength = upperLength + lowerLength;
  }

  /**
   * Solve IK for target position
   */
  solve(rootPos: Vector3Like, targetPos: Vector3Like, characterFacing: number): IKSolution {
    // Vector from root to target
    const dx = targetPos.x - rootPos.x;
    const dy = targetPos.y - rootPos.y;
    const dz = targetPos.z - rootPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const a = this.upperLength;
    const b = this.lowerLength;
    const maxReach = this.totalLength - 0.05;
    const minReach = Math.abs(a - b) + 0.05;
    const c = clamp(distance, minReach, maxReach);

    // Transform to character local space
    const cos = Math.cos(-characterFacing);
    const sin = Math.sin(-characterFacing);
    const localY = dy;
    const localZ = dx * sin + dz * cos;

    // Angle from straight down to target (in sagittal plane)
    const angleToTarget = Math.atan2(-localZ, -localY);

    // Law of cosines for hip offset angle
    const cosHipOffset = (a * a + c * c - b * b) / (2 * a * c);
    const hipOffset = Math.acos(clamp(cosHipOffset, -1, 1));

    // Law of cosines for knee interior angle
    const cosKneeInterior = (a * a + b * b - c * c) / (2 * a * b);
    const kneeInteriorAngle = Math.acos(clamp(cosKneeInterior, -1, 1));

    // Upper bone pitch
    const upperAngle = angleToTarget + hipOffset;

    // Lower bone pitch (relative to upper)
    // Knee only bends backward (positive)
    const lowerAngle = Math.max(0, Math.PI - kneeInteriorAngle);

    return {
      upperAngle,
      lowerAngle,
      reachRatio: c / maxReach
    };
  }
}

export default TwoBoneIK;
