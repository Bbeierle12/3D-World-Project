/**
 * Physics collider wrapping terrain heightmap
 * Provides physics queries without Three.js dependency
 */
export class TerrainCollider {
  /**
   * @param {import('../terrain/TerrainHeightmap.js').TerrainHeightmap} heightmap
   */
  constructor(heightmap) {
    this.heightmap = heightmap;
  }

  /**
   * Get height at world position
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getHeight(x, z) {
    return this.heightmap.getHeight(x, z);
  }

  /**
   * Get normal at world position
   * @param {number} x
   * @param {number} z
   * @returns {{x: number, y: number, z: number}}
   */
  getNormal(x, z) {
    return this.heightmap.getNormal(x, z);
  }

  /**
   * Get slope angle in degrees at world position
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getSlopeAngle(x, z) {
    const normal = this.getNormal(x, z);
    return Math.acos(normal.y) * (180 / Math.PI);
  }
}

export default TerrainCollider;
