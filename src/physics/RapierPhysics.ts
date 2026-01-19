import RAPIER from '@dimforge/rapier3d-compat';
import { CHARACTER } from '../config/index.js';
import type { TerrainHeightmap } from '../terrain/TerrainHeightmap.js';
import type { Vector3Like } from '../types/index.js';
import {
  IPhysicsWorld,
  type CharacterMovementResult,
  type CharacterShapeDefinition,
  type GroundProbeResult,
  type RaycastResult,
  type ShapeCastResult,
  type ShapeDefinition
} from './IPhysicsWorld.js';

const DEFAULT_NORMAL: Vector3Like = { x: 0, y: 1, z: 0 };
const EPSILON = 1e-6;

/**
 * Rapier-backed physics world for terrain queries and future rigid bodies.
 */
export class RapierPhysics extends IPhysicsWorld {
  world: RAPIER.World;
  terrainCollider: RAPIER.Collider;
  heightmap: TerrainHeightmap;
  characterController: RAPIER.KinematicCharacterController | null;
  characterCollider: RAPIER.Collider | null;
  characterBody: RAPIER.RigidBody | null;
  characterShapeKey: string | null;
  characterOffset: number;

  static async create(heightmap: TerrainHeightmap): Promise<RapierPhysics> {
    await RAPIER.init();
    return new RapierPhysics(heightmap);
  }

  constructor(heightmap: TerrainHeightmap) {
    super();
    this.heightmap = heightmap;
    this.world = new RAPIER.World({ x: 0, y: -CHARACTER.GRAVITY, z: 0 });
    this.characterController = null;
    this.characterCollider = null;
    this.characterBody = null;
    this.characterShapeKey = null;
    this.characterOffset = 0;

    const { vertices, indices } = this.buildTerrainMesh(heightmap);
    const colliderDesc = RAPIER.ColliderDesc.trimesh(
      vertices,
      indices,
      RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES
    );
    this.terrainCollider = this.world.createCollider(colliderDesc);
    this.world.step();
  }

  override probeGround(x: number, z: number): GroundProbeResult {
    const originY = Math.max(this.heightmap.size, CHARACTER.HEIGHT * 5, 50);
    const maxDistance = originY * 2;
    const ray = new RAPIER.Ray({ x, y: originY, z }, { x: 0, y: -1, z: 0 });

    const hit = this.world.castRayAndGetNormal(
      ray,
      maxDistance,
      true,
      undefined,
      undefined,
      this.characterCollider ?? undefined
    );
    if (hit) {
      const point = ray.pointAt(hit.timeOfImpact);
      return {
        height: point.y,
        normal: hit.normal
      };
    }

    return {
      height: this.heightmap.getHeight(x, z),
      normal: this.heightmap.getNormal(x, z) ?? DEFAULT_NORMAL
    };
  }

  override raycast(origin: Vector3Like, direction: Vector3Like, maxDistance: number): RaycastResult {
    if (maxDistance <= 0) {
      return { hit: false };
    }

    const length = Math.hypot(direction.x, direction.y, direction.z);
    if (length < EPSILON) {
      return { hit: false };
    }

    const dir = { x: direction.x / length, y: direction.y / length, z: direction.z / length };
    const ray = new RAPIER.Ray(origin, dir);
    const hit = this.world.castRayAndGetNormal(ray, maxDistance, true);

    if (!hit) {
      return { hit: false };
    }

    const point = ray.pointAt(hit.timeOfImpact);
    return {
      hit: true,
      point,
      normal: hit.normal,
      distance: hit.timeOfImpact
    };
  }

  override shapeCast(origin: Vector3Like, direction: Vector3Like, distance: number, shape: ShapeDefinition): ShapeCastResult {
    if (distance <= 0) {
      return { hit: false };
    }

    const length = Math.hypot(direction.x, direction.y, direction.z);
    if (length < EPSILON) {
      return { hit: false };
    }

    const dir = { x: direction.x / length, y: direction.y / length, z: direction.z / length };
    const castShape = this.createShape(shape);
    if (!castShape) {
      return { hit: false };
    }

    const rotation = RAPIER.RotationOps.identity();
    const hit = this.world.castShape(
      origin,
      rotation,
      dir,
      castShape,
      0,
      distance,
      true
    );

    if (!hit) {
      return { hit: false };
    }

    return {
      hit: true,
      point: this.transformColliderPoint(hit.collider, hit.witness2),
      normal: this.rotateColliderVector(hit.collider, hit.normal2)
    };
  }

  override update(deltaTime: number): void {
    if (deltaTime <= 0) return;
    this.world.timestep = deltaTime;
    this.world.step();
  }

  override supportsCharacterMovement(): boolean {
    return true;
  }

  override computeCharacterMovement(
    position: Vector3Like,
    desiredMovement: Vector3Like,
    shape: CharacterShapeDefinition
  ): CharacterMovementResult {
    this.ensureCharacterController(shape);

    if (!this.characterController || !this.characterCollider || !this.characterBody) {
      return {
        movement: desiredMovement,
        grounded: false,
        groundHeight: position.y,
        groundNormal: DEFAULT_NORMAL
      };
    }

    const offset = this.characterOffset;
    const currentTranslation = {
      x: position.x,
      y: position.y + offset,
      z: position.z
    };

    this.characterBody.setTranslation(currentTranslation, true);
    this.world.propagateModifiedBodyPositionsToColliders();

    this.characterController.computeColliderMovement(
      this.characterCollider,
      desiredMovement
    );

    const movement = this.characterController.computedMovement();
    const nextPosition = {
      x: position.x + movement.x,
      y: position.y + movement.y,
      z: position.z + movement.z
    };
    const nextTranslation = {
      x: nextPosition.x,
      y: nextPosition.y + offset,
      z: nextPosition.z
    };

    this.characterBody.setTranslation(nextTranslation, true);
    this.world.propagateModifiedBodyPositionsToColliders();

    const ground = this.probeGround(nextPosition.x, nextPosition.z);

    return {
      movement,
      grounded: this.characterController.computedGrounded(),
      groundHeight: ground.height,
      groundNormal: ground.normal
    };
  }

  dispose(): void {
    this.world.free();
  }

  private buildTerrainMesh(heightmap: TerrainHeightmap): {
    vertices: Float32Array;
    indices: Uint32Array;
  } {
    const { size, segments, heights } = heightmap;
    const gridSize = segments + 1;
    const vertexCount = gridSize * gridSize;
    const vertices = new Float32Array(vertexCount * 3);

    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const worldX = (x / segments - 0.5) * size;
        const worldZ = (z / segments - 0.5) * size;
        const height = heights[z * gridSize + x] ?? 0;
        const index = (z * gridSize + x) * 3;

        vertices[index] = worldX;
        vertices[index + 1] = height;
        vertices[index + 2] = worldZ;
      }
    }

    const indexCount = segments * segments * 6;
    const indices = new Uint32Array(indexCount);
    let writeIndex = 0;

    for (let z = 0; z < segments; z++) {
      for (let x = 0; x < segments; x++) {
        const a = z * gridSize + x;
        const b = a + 1;
        const c = a + gridSize;
        const d = c + 1;

        indices[writeIndex++] = a;
        indices[writeIndex++] = c;
        indices[writeIndex++] = b;
        indices[writeIndex++] = b;
        indices[writeIndex++] = c;
        indices[writeIndex++] = d;
      }
    }

    return { vertices, indices };
  }

  private createShape(shape: ShapeDefinition): RAPIER.Shape | null {
    if (shape.type === 'sphere') {
      const radius = shape.radius ?? 0.5;
      return new RAPIER.Ball(radius);
    }
    if (shape.type === 'capsule') {
      const radius = shape.radius ?? 0.5;
      const height = shape.height ?? radius * 2;
      const halfHeight = Math.max(0, height / 2);
      return new RAPIER.Capsule(halfHeight, radius);
    }
    return null;
  }

  private transformColliderPoint(collider: RAPIER.Collider, localPoint: Vector3Like): Vector3Like {
    const translation = collider.translation();
    const rotated = this.rotateVector(localPoint, collider.rotation());
    return {
      x: translation.x + rotated.x,
      y: translation.y + rotated.y,
      z: translation.z + rotated.z
    };
  }

  private rotateColliderVector(collider: RAPIER.Collider, vector: Vector3Like): Vector3Like {
    return this.rotateVector(vector, collider.rotation());
  }

  private rotateVector(vector: Vector3Like, rotation: RAPIER.Rotation): Vector3Like {
    const { x: qx, y: qy, z: qz, w: qw } = rotation;
    const { x, y, z } = vector;

    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    return {
      x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
      y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
      z: iz * qw + iw * -qz + ix * -qy - iy * -qx
    };
  }

  private ensureCharacterController(shape: CharacterShapeDefinition): void {
    const radius = Math.max(shape.radius, EPSILON);
    const halfHeight = Math.max(0, shape.height / 2 - radius);
    const shapeKey = `${radius}:${halfHeight}`;

    if (this.characterCollider && this.characterShapeKey === shapeKey) {
      return;
    }

    if (this.characterController) {
      this.world.removeCharacterController(this.characterController);
      this.characterController = null;
    }

    if (this.characterCollider) {
      this.world.removeCollider(this.characterCollider, true);
      this.characterCollider = null;
    }

    if (this.characterBody) {
      this.world.removeRigidBody(this.characterBody);
      this.characterBody = null;
    }

    this.characterBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
    );

    const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius);
    this.characterCollider = this.world.createCollider(colliderDesc, this.characterBody);

    this.characterController = this.world.createCharacterController(CHARACTER.SKIN_WIDTH);
    this.characterController.setSlideEnabled(true);
    this.characterController.setMaxSlopeClimbAngle((CHARACTER.SLOPE_LIMIT * Math.PI) / 180);
    this.characterController.setMinSlopeSlideAngle((CHARACTER.SLOPE_LIMIT * Math.PI) / 180);
    this.characterController.enableSnapToGround(CHARACTER.SNAP_DISTANCE);

    if (CHARACTER.STEP_OFFSET > 0) {
      const minWidth = Math.max(radius * 0.5, 0.15);
      this.characterController.enableAutostep(
        CHARACTER.STEP_OFFSET,
        minWidth,
        false
      );
    } else {
      this.characterController.disableAutostep();
    }

    this.characterOffset = halfHeight + radius;
    this.characterShapeKey = shapeKey;
  }
}

export default RapierPhysics;
