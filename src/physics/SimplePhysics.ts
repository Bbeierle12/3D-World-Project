import type { Vector3Like } from '../types/index.js';
import type { TerrainHeightmap } from '../terrain/TerrainHeightmap.js';
import { IPhysicsWorld, type GroundProbeResult, type RaycastResult, type ShapeCastResult, type ShapeDefinition } from './IPhysicsWorld.js';
import { TerrainCollider } from './TerrainCollider.js';

/**
 * Simple physics implementation using terrain heightmap
 * No rigid bodies or collision response - just queries
 */
export class SimplePhysics extends IPhysicsWorld {
  terrain: TerrainCollider;

  constructor(heightmap: TerrainHeightmap) {
    super();
    this.terrain = new TerrainCollider(heightmap);
  }

  override probeGround(x: number, z: number): GroundProbeResult {
    return {
      height: this.terrain.getHeight(x, z),
      normal: this.terrain.getNormal(x, z)
    };
  }

  override raycast(origin: Vector3Like, direction: Vector3Like, maxDistance: number): RaycastResult {
    // Simple vertical raycast for terrain
    if (direction.y < 0) {
      const height = this.terrain.getHeight(origin.x, origin.z);
      const distance = origin.y - height;

      if (distance <= maxDistance && distance >= 0) {
        return {
          hit: true,
          point: { x: origin.x, y: height, z: origin.z },
          normal: this.terrain.getNormal(origin.x, origin.z),
          distance
        };
      }
    }

    return { hit: false };
  }

  override shapeCast(origin: Vector3Like, direction: Vector3Like, distance: number, _shape: ShapeDefinition): ShapeCastResult {
    void _shape;
    // Simplified: treat as point cast for now
    const targetX = origin.x + direction.x * distance;
    const targetZ = origin.z + direction.z * distance;
    const height = this.terrain.getHeight(targetX, targetZ);

    return {
      hit: true,
      point: { x: targetX, y: height, z: targetZ },
      normal: this.terrain.getNormal(targetX, targetZ)
    };
  }

  override update(_deltaTime: number): void {
    void _deltaTime;
    // No-op for simple physics
  }
}

export default SimplePhysics;
