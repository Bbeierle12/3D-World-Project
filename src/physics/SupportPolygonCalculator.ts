import { COM } from '../config/index.js';
import type { Vector3Like } from '../types/index.js';

export interface FootState {
  position: Vector3Like;
  isGrounded: boolean;
  facing: number; // Foot orientation in radians
}

/**
 * Calculates the support polygon (base of support) from foot positions
 * Used for stability analysis
 */
export class SupportPolygonCalculator {
  private footLength: number;
  private footWidth: number;

  constructor() {
    this.footLength = COM.SUPPORT_POLYGON.FOOT_LENGTH;
    this.footWidth = COM.SUPPORT_POLYGON.FOOT_WIDTH;
  }

  /**
   * Calculate support polygon from foot states
   * Returns convex hull of grounded foot contact points
   */
  calculate(leftFoot: FootState, rightFoot: FootState): Vector3Like[] {
    const points: Vector3Like[] = [];

    // Add foot contact points for grounded feet
    if (leftFoot.isGrounded) {
      this.addFootPoints(points, leftFoot);
    }

    if (rightFoot.isGrounded) {
      this.addFootPoints(points, rightFoot);
    }

    // No grounded feet = no support
    if (points.length === 0) {
      return [];
    }

    // Single foot grounded - return foot outline
    if (points.length <= 4) {
      return this.orderPointsConvex(points);
    }

    // Both feet grounded - compute convex hull
    return this.computeConvexHull(points);
  }

  /**
   * Add corner points for a foot
   */
  private addFootPoints(points: Vector3Like[], foot: FootState): void {
    const cos = Math.cos(foot.facing);
    const sin = Math.sin(foot.facing);

    // Foot corners relative to ankle position
    // Front-left, front-right, back-left, back-right
    const halfLength = this.footLength / 2;
    const halfWidth = this.footWidth / 2;

    const corners = [
      { dx: halfLength, dz: -halfWidth },   // Front-left
      { dx: halfLength, dz: halfWidth },    // Front-right
      { dx: -halfLength * 0.3, dz: -halfWidth },  // Back-left (heel)
      { dx: -halfLength * 0.3, dz: halfWidth }    // Back-right (heel)
    ];

    for (const corner of corners) {
      // Rotate corner by foot facing
      const rotatedX = corner.dx * cos - corner.dz * sin;
      const rotatedZ = corner.dx * sin + corner.dz * cos;

      points.push({
        x: foot.position.x + rotatedX,
        y: foot.position.y,
        z: foot.position.z + rotatedZ
      });
    }
  }

  /**
   * Order points in convex order (counter-clockwise)
   */
  private orderPointsConvex(points: Vector3Like[]): Vector3Like[] {
    if (points.length <= 2) return points;

    // Find centroid
    let cx = 0, cz = 0;
    for (const p of points) {
      cx += p.x;
      cz += p.z;
    }
    cx /= points.length;
    cz /= points.length;

    // Sort by angle from centroid
    return points.slice().sort((a, b) => {
      const angleA = Math.atan2(a.z - cz, a.x - cx);
      const angleB = Math.atan2(b.z - cz, b.x - cx);
      return angleA - angleB;
    });
  }

  /**
   * Compute convex hull using Graham scan algorithm
   */
  private computeConvexHull(points: Vector3Like[]): Vector3Like[] {
    if (points.length < 3) return points;

    // Find lowest point (min y, then min x for tie-breaker)
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      const pi = points[i];
      const pl = points[lowest];
      if (!pi || !pl) continue;
      if (pi.z < pl.z || (pi.z === pl.z && pi.x < pl.x)) {
        lowest = i;
      }
    }

    // Swap lowest to first position
    const first = points[0];
    const lowestPoint = points[lowest];
    if (!first || !lowestPoint) return points;

    points[0] = lowestPoint;
    points[lowest] = first;
    const pivot = points[0];
    if (!pivot) return points;

    // Sort by polar angle with pivot
    const sorted = points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.z - pivot.z, a.x - pivot.x);
      const angleB = Math.atan2(b.z - pivot.z, b.x - pivot.x);
      if (angleA !== angleB) return angleA - angleB;
      // If same angle, closer point first
      const distA = (a.x - pivot.x) ** 2 + (a.z - pivot.z) ** 2;
      const distB = (b.x - pivot.x) ** 2 + (b.z - pivot.z) ** 2;
      return distA - distB;
    });

    // Graham scan
    const hull: Vector3Like[] = [pivot];

    for (const point of sorted) {
      // Remove points that make clockwise turn
      let h1 = hull[hull.length - 2];
      let h2 = hull[hull.length - 1];
      while (hull.length > 1 && h1 && h2 && this.crossProduct(h1, h2, point) <= 0) {
        hull.pop();
        h1 = hull[hull.length - 2];
        h2 = hull[hull.length - 1];
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * 2D cross product for turn direction
   * Positive = counter-clockwise, Negative = clockwise
   */
  private crossProduct(o: Vector3Like, a: Vector3Like, b: Vector3Like): number {
    return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  }

  /**
   * Get foot dimensions for visualization
   */
  getFootDimensions(): { length: number; width: number } {
    return {
      length: this.footLength,
      width: this.footWidth
    };
  }

  /**
   * Calculate area of support polygon
   */
  calculateArea(polygon: Vector3Like[]): number {
    if (polygon.length < 3) return 0;

    // Shoelace formula
    let area = 0;
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const pi = polygon[i];
      const pj = polygon[j];
      if (!pi || !pj) continue;
      area += pi.x * pj.z;
      area -= pj.x * pi.z;
    }

    return Math.abs(area) / 2;
  }
}

export default SupportPolygonCalculator;
