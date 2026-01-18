/**
 * Abstract interface for physics world
 * Implement this to swap physics engines (Simple, Rapier, etc.)
 */
export class IPhysicsWorld {
  /**
   * Probe the ground at a position
   * @param {number} _x - World X coordinate
   * @param {number} _z - World Z coordinate
   * @returns {{height: number, normal: {x: number, y: number, z: number}}}
   */
  probeGround(_x, _z) {
    void _x;
    void _z;
    throw new Error('probeGround must be implemented');
  }

  /**
   * Cast a ray from origin in direction
   * @param {{x: number, y: number, z: number}} _origin
   * @param {{x: number, y: number, z: number}} _direction
   * @param {number} _maxDistance
   * @returns {{hit: boolean, point?: {x: number, y: number, z: number}, normal?: {x: number, y: number, z: number}, distance?: number}}
   */
  raycast(_origin, _direction, _maxDistance) {
    void _origin;
    void _direction;
    void _maxDistance;
    throw new Error('raycast must be implemented');
  }

  /**
   * Cast a shape (capsule/sphere) from origin in direction
   * @param {{x: number, y: number, z: number}} _origin
   * @param {{x: number, y: number, z: number}} _direction
   * @param {number} _distance
   * @param {object} _shape - Shape definition
   * @returns {{hit: boolean, point?: {x: number, y: number, z: number}, normal?: {x: number, y: number, z: number}}}
   */
  shapeCast(_origin, _direction, _distance, _shape) {
    void _origin;
    void _direction;
    void _distance;
    void _shape;
    throw new Error('shapeCast must be implemented');
  }

  /**
   * Update physics simulation
   * @param {number} _deltaTime
   */
  update(_deltaTime) {
    void _deltaTime;
    // Optional: override for physics engines that need stepping
  }
}

export default IPhysicsWorld;
