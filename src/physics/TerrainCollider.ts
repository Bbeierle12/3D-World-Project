import type { Vector3Like } from '../types/index.js';
import type { TerrainHeightmap } from '../terrain/TerrainHeightmap.js';

/**
 * Physics collider wrapping terrain heightmap
 * Provides physics queries without Three.js dependency
 */
export class TerrainCollider {
  heightmap: TerrainHeightmap;

  constructor(heightmap: TerrainHeightmap) {
    this.heightmap = heightmap;
  }

  /**
   * Get height at world position
   */
  getHeight(x: number, z: number): number {
    return this.heightmap.getHeight(x, z);
  }

  /**
   * Get normal at world position
   */
  getNormal(x: number, z: number): Vector3Like {
    return this.heightmap.getNormal(x, z);
  }

  /**
   * Get slope angle in degrees at world position
   */
  getSlopeAngle(x: number, z: number): number {
    const normal = this.getNormal(x, z);
    return Math.acos(normal.y) * (180 / Math.PI);
  }
}

export default TerrainCollider;
