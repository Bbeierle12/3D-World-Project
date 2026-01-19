import { COM } from '../config/index.js';
import type { Vector3Like, CoMState, BonePositions, SegmentMasses } from '../types/index.js';

/**
 * Center of Mass calculation system
 * Computes weighted CoM from bone positions using biomechanics-based segment masses
 */
export class CenterOfMassSystem {
  private previousPosition: Vector3Like | null = null;
  private velocity: Vector3Like = { x: 0, y: 0, z: 0 };
  private segmentMasses: SegmentMasses;

  constructor() {
    this.segmentMasses = COM.SEGMENT_MASSES;
  }

  /**
   * Calculate weighted center of mass from bone positions
   */
  calculateWeightedCoM(bonePositions: BonePositions): Vector3Like {
    let comX = 0;
    let comY = 0;
    let comZ = 0;
    let totalWeight = 0;

    // Map bone names to segment mass keys
    const boneToSegment: Record<string, keyof SegmentMasses> = {
      'head': 'head',
      'torso': 'torso',
      'leftUpperArm': 'leftUpperArm',
      'rightUpperArm': 'rightUpperArm',
      'leftLowerArm': 'leftLowerArm',
      'rightLowerArm': 'rightLowerArm',
      'leftHand': 'leftHand',
      'rightHand': 'rightHand',
      'leftUpperLeg': 'leftUpperLeg',
      'rightUpperLeg': 'rightUpperLeg',
      'leftLowerLeg': 'leftLowerLeg',
      'rightLowerLeg': 'rightLowerLeg',
      'leftFoot': 'leftFoot',
      'rightFoot': 'rightFoot'
    };

    for (const [boneName, position] of bonePositions) {
      const segmentKey = boneToSegment[boneName];
      if (segmentKey && this.segmentMasses[segmentKey] !== undefined) {
        const mass = this.segmentMasses[segmentKey];
        comX += position.x * mass;
        comY += position.y * mass;
        comZ += position.z * mass;
        totalWeight += mass;
      }
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      comX /= totalWeight;
      comY /= totalWeight;
      comZ /= totalWeight;
    }

    return { x: comX, y: comY, z: comZ };
  }

  /**
   * Calculate velocity from position change
   */
  calculateVelocity(currentPosition: Vector3Like, deltaTime: number): Vector3Like {
    if (!this.previousPosition || deltaTime <= 0) {
      this.previousPosition = { ...currentPosition };
      return { x: 0, y: 0, z: 0 };
    }

    // Compute velocity as derivative
    const vx = (currentPosition.x - this.previousPosition.x) / deltaTime;
    const vy = (currentPosition.y - this.previousPosition.y) / deltaTime;
    const vz = (currentPosition.z - this.previousPosition.z) / deltaTime;

    // Smooth velocity with exponential moving average
    const smoothing = 0.3;
    this.velocity.x = this.velocity.x * (1 - smoothing) + vx * smoothing;
    this.velocity.y = this.velocity.y * (1 - smoothing) + vy * smoothing;
    this.velocity.z = this.velocity.z * (1 - smoothing) + vz * smoothing;

    this.previousPosition = { ...currentPosition };

    return { ...this.velocity };
  }

  /**
   * Project position to ground plane
   */
  projectToGround(position: Vector3Like, groundHeight: number): Vector3Like {
    return {
      x: position.x,
      y: groundHeight,
      z: position.z
    };
  }

  /**
   * Check if CoM projection is within support polygon
   * Uses point-in-polygon test with convex hull
   */
  isPointInPolygon(point: Vector3Like, polygon: Vector3Like[]): boolean {
    if (polygon.length < 3) {
      // For single-leg stance (point or small circle), use distance check
      if (polygon.length === 1) {
        const firstPoint = polygon[0];
        if (!firstPoint) return false;
        const dx = point.x - firstPoint.x;
        const dz = point.z - firstPoint.z;
        return Math.sqrt(dx * dx + dz * dz) < COM.SUPPORT_POLYGON.FOOT_WIDTH;
      }
      return false;
    }

    // Ray casting algorithm for point-in-polygon
    let inside = false;
    const n = polygon.length;
    let j = n - 1;

    for (let i = 0; i < n; i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      if (!pi || !pj) continue;

      const xi = pi.x;
      const zi = pi.z;
      const xj = pj.x;
      const zj = pj.z;

      if (((zi > point.z) !== (zj > point.z)) &&
          (point.x < (xj - xi) * (point.z - zi) / (zj - zi) + xi)) {
        inside = !inside;
      }
      j = i;
    }

    return inside;
  }

  /**
   * Calculate minimum distance from point to polygon edge (stability margin)
   */
  calculateStabilityMargin(point: Vector3Like, polygon: Vector3Like[]): number {
    if (polygon.length < 2) {
      if (polygon.length === 1) {
        const firstPoint = polygon[0];
        if (!firstPoint) return -1;
        const dx = point.x - firstPoint.x;
        const dz = point.z - firstPoint.z;
        return COM.SUPPORT_POLYGON.FOOT_WIDTH - Math.sqrt(dx * dx + dz * dz);
      }
      return -1; // No support
    }

    let minDistance = Infinity;
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const pi = polygon[i];
      const pj = polygon[j];
      if (!pi || !pj) continue;

      const dist = this.pointToSegmentDistance(point, pi, pj);
      minDistance = Math.min(minDistance, dist);
    }

    // Positive if inside, negative if outside
    const isInside = this.isPointInPolygon(point, polygon);
    return isInside ? minDistance : -minDistance;
  }

  /**
   * Calculate perpendicular distance from point to line segment
   */
  private pointToSegmentDistance(
    point: Vector3Like,
    segStart: Vector3Like,
    segEnd: Vector3Like
  ): number {
    const dx = segEnd.x - segStart.x;
    const dz = segEnd.z - segStart.z;
    const lengthSq = dx * dx + dz * dz;

    if (lengthSq === 0) {
      // Segment is a point
      const px = point.x - segStart.x;
      const pz = point.z - segStart.z;
      return Math.sqrt(px * px + pz * pz);
    }

    // Parameter along segment
    let t = ((point.x - segStart.x) * dx + (point.z - segStart.z) * dz) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    // Closest point on segment
    const closestX = segStart.x + t * dx;
    const closestZ = segStart.z + t * dz;

    // Distance from point to closest point
    const distX = point.x - closestX;
    const distZ = point.z - closestZ;

    return Math.sqrt(distX * distX + distZ * distZ);
  }

  /**
   * Determine stability level from margin
   */
  getStabilityLevel(margin: number): 'stable' | 'warning' | 'unstable' {
    if (margin >= COM.STABILITY.STABLE_MARGIN) {
      return 'stable';
    } else if (margin >= COM.STABILITY.WARNING_MARGIN) {
      return 'warning';
    } else {
      return 'unstable';
    }
  }

  /**
   * Main update method - computes full CoM state
   */
  update(
    bonePositions: BonePositions,
    groundHeight: number,
    supportPolygon: Vector3Like[],
    deltaTime: number
  ): CoMState {
    // Calculate weighted CoM
    const position = this.calculateWeightedCoM(bonePositions);

    // Calculate velocity
    const velocity = this.calculateVelocity(position, deltaTime);

    // Project to ground
    const groundProjection = this.projectToGround(position, groundHeight);

    // Calculate stability
    const stabilityMargin = this.calculateStabilityMargin(groundProjection, supportPolygon);
    const isStable = stabilityMargin >= 0;
    const stabilityLevel = this.getStabilityLevel(stabilityMargin);

    return {
      position,
      velocity,
      groundProjection,
      isStable,
      stabilityMargin,
      stabilityLevel
    };
  }

  /**
   * Get segment mass contribution for telemetry
   */
  getSegmentContribution(boneName: string): number {
    const segmentKey = boneName as keyof SegmentMasses;
    return this.segmentMasses[segmentKey] || 0;
  }

  /**
   * Reset velocity tracking (call when character teleports)
   */
  reset(): void {
    this.previousPosition = null;
    this.velocity = { x: 0, y: 0, z: 0 };
  }
}

export default CenterOfMassSystem;
