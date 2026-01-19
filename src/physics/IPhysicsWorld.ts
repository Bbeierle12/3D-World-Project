import type { Vector3Like } from '../types/index.js';

export interface GroundProbeResult {
  height: number;
  normal: Vector3Like;
}

export interface RaycastResult {
  hit: boolean;
  point?: Vector3Like;
  normal?: Vector3Like;
  distance?: number;
}

export interface ShapeCastResult {
  hit: boolean;
  point?: Vector3Like;
  normal?: Vector3Like;
}

export interface ShapeDefinition {
  type: 'capsule' | 'sphere';
  radius?: number;
  height?: number;
}

/**
 * Abstract interface for physics world
 * Implement this to swap physics engines (Simple, Rapier, etc.)
 */
export class IPhysicsWorld {
  /**
   * Probe the ground at a position
   */
  probeGround(_x: number, _z: number): GroundProbeResult {
    void _x;
    void _z;
    throw new Error('probeGround must be implemented');
  }

  /**
   * Cast a ray from origin in direction
   */
  raycast(_origin: Vector3Like, _direction: Vector3Like, _maxDistance: number): RaycastResult {
    void _origin;
    void _direction;
    void _maxDistance;
    throw new Error('raycast must be implemented');
  }

  /**
   * Cast a shape (capsule/sphere) from origin in direction
   */
  shapeCast(_origin: Vector3Like, _direction: Vector3Like, _distance: number, _shape: ShapeDefinition): ShapeCastResult {
    void _origin;
    void _direction;
    void _distance;
    void _shape;
    throw new Error('shapeCast must be implemented');
  }

  /**
   * Update physics simulation
   */
  update(_deltaTime: number): void {
    void _deltaTime;
    // Optional: override for physics engines that need stepping
  }
}

export default IPhysicsWorld;
