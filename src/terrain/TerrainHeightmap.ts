import { TERRAIN } from '../config/index.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Generates and stores terrain heightmap data
 * Pure data class - no Three.js dependency
 */
export class TerrainHeightmap {
  size: number;
  segments: number;
  heights: Float32Array;

  constructor(size: number = TERRAIN.SIZE, segments: number = TERRAIN.SEGMENTS) {
    this.size = size;
    this.segments = segments;
    this.heights = new Float32Array((segments + 1) * (segments + 1));

    this.generate();
  }

  /**
   * Generate heightmap using sine waves
   * Can be overridden for different terrain types
   */
  generate(): void {
    const { size, segments, heights } = this;
    const scale = TERRAIN.HEIGHT_SCALE;

    for (let z = 0; z <= segments; z++) {
      for (let x = 0; x <= segments; x++) {
        const worldX = (x / segments - 0.5) * size;
        const worldZ = (z / segments - 0.5) * size;

        // Multi-octave sine wave terrain
        const height =
          Math.sin(worldX * TERRAIN.NOISE_SCALE_1) * Math.cos(worldZ * TERRAIN.NOISE_SCALE_1) * scale +
          Math.sin(worldX * TERRAIN.NOISE_SCALE_2 + 1) * Math.cos(worldZ * TERRAIN.NOISE_SCALE_2 * 0.8) * (scale * 0.5) +
          Math.sin(worldX * TERRAIN.NOISE_SCALE_3) * Math.sin(worldZ * TERRAIN.NOISE_SCALE_3) * scale;

        heights[z * (segments + 1) + x] = height;
      }
    }
  }

  /**
   * Get height at world position using bilinear interpolation
   */
  getHeight(worldX: number, worldZ: number): number {
    const { size, segments, heights } = this;

    // Convert world coords to normalized [0, 1]
    const u = (worldX + size / 2) / size;
    const v = (worldZ + size / 2) / size;

    // Out of bounds check
    if (u < 0 || u > 1 || v < 0 || v > 1) return 0;

    // Grid coordinates
    const gridX = u * segments;
    const gridZ = v * segments;
    const x0 = Math.floor(gridX);
    const z0 = Math.floor(gridZ);
    const x1 = Math.min(x0 + 1, segments);
    const z1 = Math.min(z0 + 1, segments);

    // Interpolation factors
    const fx = gridX - x0;
    const fz = gridZ - z0;

    // Sample four corners
    const idx = (x: number, z: number): number => z * (segments + 1) + x;
    const h00 = heights[idx(x0, z0)] || 0;
    const h10 = heights[idx(x1, z0)] || 0;
    const h01 = heights[idx(x0, z1)] || 0;
    const h11 = heights[idx(x1, z1)] || 0;

    // Bilinear interpolation
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }

  /**
   * Get surface normal at world position using finite difference
   */
  getNormal(worldX: number, worldZ: number): Vector3Like {
    const delta = 0.5;
    const hLeft = this.getHeight(worldX - delta, worldZ);
    const hRight = this.getHeight(worldX + delta, worldZ);
    const hBack = this.getHeight(worldX, worldZ - delta);
    const hFront = this.getHeight(worldX, worldZ + delta);

    // Cross product of tangent vectors
    const nx = (hLeft - hRight) / (2 * delta);
    const nz = (hBack - hFront) / (2 * delta);
    const ny = 1;

    // Normalize
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return {
      x: nx / len,
      y: ny / len,
      z: nz / len
    };
  }
}

export default TerrainHeightmap;
