import { clamp } from '../../utils/index.js';

/**
 * Generic two-bone IK solver
 * Works for legs and arms
 */
export class TwoBoneIK {
  /**
   * @param {number} upperLength - Length of upper bone
   * @param {number} lowerLength - Length of lower bone
   */
  constructor(upperLength, lowerLength) {
    this.upperLength = upperLength;
    this.lowerLength = lowerLength;
    this.totalLength = upperLength + lowerLength;
  }

  /**
   * Solve IK for target position
   * @param {{x: number, y: number, z: number}} rootPos - Root joint world position
   * @param {{x: number, y: number, z: number}} targetPos - End effector target
   * @param {number} characterFacing - Character facing angle (radians)
   * @returns {{upperAngle: number, lowerAngle: number, reachRatio: number}}
   */
  solve(rootPos, targetPos, characterFacing) {
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
