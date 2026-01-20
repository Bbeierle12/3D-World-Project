import { CHARACTER } from '../../config/index.js';
import { clamp, wrapAngle, horizontalSpeed } from '../../utils/index.js';
import { MovementMode, GaitType, isAirborne, getDisplayState, type MovementModeType, type GaitTypeType } from './MovementModes.js';
import type { CharacterShapeDefinition, IPhysicsWorld } from '../../physics/IPhysicsWorld.js';
import type { Vector3Like, CharacterConfig } from '../../types/index.js';

interface Vector2Like {
  x: number;
  y: number;
}

/**
 * Character controller handling movement physics
 * Uses plain objects for state - no Three.js dependency
 */
export class CharacterController {
  physics: IPhysicsWorld;

  // Position and velocity as plain objects
  position: Vector3Like;
  velocity: Vector3Like;

  // Orientation
  facing: number;
  targetFacing: number;

  // Movement state
  movementMode: MovementModeType;
  gait: GaitTypeType;
  landingTimer: number;

  // Ground info
  isGrounded: boolean;
  groundNormal: Vector3Like;
  groundHeight: number;
  slopeAngle: number;

  // Input state
  inputDirection: Vector2Like;
  wantsRun: boolean;
  wantsJump: boolean;
  jumpConsumed: boolean;

  // Config shortcuts
  config: CharacterConfig;

  constructor(physics: IPhysicsWorld) {
    this.physics = physics;

    // Position and velocity as plain objects
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };

    // Orientation
    this.facing = 0;
    this.targetFacing = 0;

    // Movement state
    this.movementMode = MovementMode.GROUNDED;
    this.gait = GaitType.IDLE;
    this.landingTimer = 0;

    // Ground info
    this.isGrounded = false;
    this.groundNormal = { x: 0, y: 1, z: 0 };
    this.groundHeight = 0;
    this.slopeAngle = 0;

    // Input state
    this.inputDirection = { x: 0, y: 0 };
    this.wantsRun = false;
    this.wantsJump = false;
    this.jumpConsumed = false;

    // Config shortcuts
    this.config = CHARACTER;
  }

  /**
   * Set input state
   */
  setInput(direction: Vector2Like, wantsRun: boolean, wantsJump: boolean): void {
    this.inputDirection.x = direction.x;
    this.inputDirection.y = direction.y;
    this.wantsRun = wantsRun;

    if (wantsJump && !this.jumpConsumed) {
      this.wantsJump = true;
    }
    if (!wantsJump) {
      this.jumpConsumed = false;
    }
  }

  /**
   * Update controller
   */
  update(deltaTime: number, cameraYaw: number = 0): void {
    const useCharacterMovement = typeof this.physics.supportsCharacterMovement === 'function' &&
      this.physics.supportsCharacterMovement();

    if (!useCharacterMovement) {
      this.probeGround();
    }

    const desiredVelocity = this.computeDesiredVelocity(cameraYaw);
    this.applyAcceleration(desiredVelocity, deltaTime);
    this.handleJump();
    this.applyGravity(deltaTime);

    if (!useCharacterMovement && this.movementMode === MovementMode.GROUNDED) {
      this.projectVelocityOntoSlope();
    }

    const desiredMovement = {
      x: this.velocity.x * deltaTime,
      y: this.velocity.y * deltaTime,
      z: this.velocity.z * deltaTime
    };

    if (useCharacterMovement) {
      const movementResult = this.physics.computeCharacterMovement(
        this.position,
        desiredMovement,
        this.getCharacterShape()
      );

      this.position.x += movementResult.movement.x;
      this.position.y += movementResult.movement.y;
      this.position.z += movementResult.movement.z;

      if (deltaTime > 0) {
        this.velocity.x = movementResult.movement.x / deltaTime;
        this.velocity.y = movementResult.movement.y / deltaTime;
        this.velocity.z = movementResult.movement.z / deltaTime;
      }

      this.groundHeight = movementResult.groundHeight;
      this.groundNormal = movementResult.groundNormal;
      const computedGrounded = movementResult.grounded;
      this.isGrounded = computedGrounded;
      this.updateSlopeAngle();

      if (!computedGrounded) {
        const distanceToGround = this.position.y - this.groundHeight;
        const withinSnap =
          Math.abs(distanceToGround) <= this.config.SNAP_DISTANCE &&
          this.velocity.y < 5 &&
          this.slopeAngle <= this.config.SLOPE_LIMIT;
        const belowGround = distanceToGround < 0 && this.slopeAngle <= this.config.SLOPE_LIMIT;
        if (withinSnap || belowGround) {
          this.isGrounded = true;
        }
      }

      if (this.isGrounded && this.movementMode === MovementMode.FALLING) {
        this.movementMode = MovementMode.LANDING;
        this.landingTimer = this.config.LANDING_DURATION;
      }
    } else {
      // Integrate position
      this.position.x += desiredMovement.x;
      this.position.y += desiredMovement.y;
      this.position.z += desiredMovement.z;
    }

    // Snap to ground when grounded or landing
    if (this.movementMode === MovementMode.GROUNDED ||
        this.movementMode === MovementMode.LANDING ||
        this.isGrounded) {
      this.snapToGround();
    }

    if (this.isGrounded && this.velocity.y < 0) {
      this.velocity.y = 0;
    }

    this.updateMovementMode(deltaTime);
    this.updateFacing(deltaTime);
    this.updateGait();

    // Clamp to world bounds
    const bounds = this.config.WORLD_BOUNDS;
    this.position.x = clamp(this.position.x, -bounds, bounds);
    this.position.z = clamp(this.position.z, -bounds, bounds);
  }

  probeGround(): void {
    const ground = this.physics.probeGround(this.position.x, this.position.z);
    this.groundHeight = ground.height;
    this.groundNormal = ground.normal;
    this.updateSlopeAngle();

    const distanceToGround = this.position.y - this.groundHeight;
    const wasGrounded = this.isGrounded;

    // Ground check: close to or below ground, not jumping upward, slope is walkable
    // Math.abs handles being below ground (negative distance)
    this.isGrounded =
      Math.abs(distanceToGround) <= this.config.SNAP_DISTANCE &&
      this.velocity.y < 5 && // Allow grounding when falling or barely moving up
      this.slopeAngle <= this.config.SLOPE_LIMIT;

    // Also ground if clearly below ground level
    if (distanceToGround < 0 && this.slopeAngle <= this.config.SLOPE_LIMIT) {
      this.isGrounded = true;
    }

    if (!wasGrounded && this.isGrounded && this.movementMode !== MovementMode.GROUNDED) {
      this.movementMode = MovementMode.LANDING;
      this.landingTimer = this.config.LANDING_DURATION;
    }
  }

  updateSlopeAngle(): void {
    const safeNormalY = clamp(this.groundNormal.y, -1, 1);
    const angle = Math.acos(safeNormalY) * (180 / Math.PI);
    this.slopeAngle = Number.isFinite(angle) ? angle : 0;
  }

  updateMovementMode(deltaTime: number): void {
    switch (this.movementMode) {
      case MovementMode.LANDING:
        this.landingTimer -= deltaTime;
        if (this.landingTimer <= 0) {
          this.movementMode = MovementMode.GROUNDED;
        }
        break;

      case MovementMode.GROUNDED:
        if (!this.isGrounded) {
          this.movementMode = MovementMode.FALLING;
        }
        break;

      case MovementMode.JUMPING:
        if (this.velocity.y <= 0) {
          this.movementMode = MovementMode.FALLING;
        }
        break;

      case MovementMode.FALLING:
        if (this.isGrounded) {
          this.movementMode = MovementMode.LANDING;
          this.landingTimer = this.config.LANDING_DURATION;
        }
        break;
    }
  }

  computeDesiredVelocity(cameraYaw: number): Vector3Like {
    const inputLen = Math.sqrt(
      this.inputDirection.x ** 2 + this.inputDirection.y ** 2
    );

    if (inputLen < 0.1) {
      return { x: 0, y: 0, z: 0 };
    }

    const inputX = this.inputDirection.x / inputLen;
    const inputY = this.inputDirection.y / inputLen;

    const cos = Math.cos(cameraYaw);
    const sin = Math.sin(cameraYaw);

    // Camera-relative directions
    const forwardX = -sin;
    const forwardZ = -cos;
    const rightX = cos;
    const rightZ = -sin;

    const worldDirX = rightX * inputX + forwardX * inputY;
    const worldDirZ = rightZ * inputX + forwardZ * inputY;

    const targetSpeed = this.wantsRun
      ? this.config.RUN_SPEED
      : this.config.WALK_SPEED;

    this.targetFacing = Math.atan2(worldDirX, worldDirZ);

    return {
      x: worldDirX * targetSpeed,
      y: 0,
      z: worldDirZ * targetSpeed
    };
  }

  applyAcceleration(desiredVelocity: Vector3Like, deltaTime: number): void {
    const airborne = isAirborne(this.movementMode);
    const desiredLen = Math.sqrt(desiredVelocity.x ** 2 + desiredVelocity.z ** 2);

    let accel: number;
    if (desiredLen > 0.1) {
      accel = airborne ? this.config.AIR_ACCEL : this.config.GROUND_ACCEL;
    } else {
      accel = airborne ? this.config.AIR_DECEL : this.config.GROUND_DECEL;
    }

    const diffX = desiredVelocity.x - this.velocity.x;
    const diffZ = desiredVelocity.z - this.velocity.z;
    const diffLen = Math.sqrt(diffX ** 2 + diffZ ** 2);
    const maxDelta = accel * deltaTime;

    if (diffLen > maxDelta) {
      const scale = maxDelta / diffLen;
      this.velocity.x += diffX * scale;
      this.velocity.z += diffZ * scale;
    } else {
      this.velocity.x += diffX;
      this.velocity.z += diffZ;
    }
  }

  handleJump(): void {
    const canJump =
      (this.movementMode === MovementMode.GROUNDED ||
        this.movementMode === MovementMode.LANDING) &&
      this.wantsJump;

    if (canJump) {
      this.velocity.y = this.config.JUMP_VELOCITY;
      this.movementMode = MovementMode.JUMPING;
      this.isGrounded = false;
      this.wantsJump = false;
      this.jumpConsumed = true;
    }
  }

  applyGravity(deltaTime: number): void {
    if (!this.isGrounded) {
      this.velocity.y -= this.config.GRAVITY * deltaTime;
    }
  }

  projectVelocityOntoSlope(): void {
    if (this.slopeAngle < 1) return;

    const nx = this.groundNormal.x;
    const ny = this.groundNormal.y;
    const nz = this.groundNormal.z;
    const normalLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (normalLen < 0.001) return;

    const invLen = 1 / normalLen;
    const nX = nx * invLen;
    const nY = ny * invLen;
    const nZ = nz * invLen;

    // Project full velocity onto slope plane (removes normal component).
    const dot = this.velocity.x * nX + this.velocity.y * nY + this.velocity.z * nZ;
    this.velocity.x -= nX * dot;
    this.velocity.y -= nY * dot;
    this.velocity.z -= nZ * dot;
  }

  snapToGround(): void {
    if (this.position.y < this.groundHeight) {
      this.position.y = this.groundHeight;
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
      }
    } else if (this.position.y > this.groundHeight + this.config.SNAP_DISTANCE) {
      this.position.y += (this.groundHeight - this.position.y) * 0.2;
    } else {
      this.position.y = this.groundHeight;
    }
  }

  updateFacing(deltaTime: number): void {
    const diff = wrapAngle(this.targetFacing - this.facing);
    const maxTurn = this.config.TURN_SPEED * deltaTime;
    this.facing += clamp(diff, -maxTurn, maxTurn);
  }

  updateGait(): void {
    const speed = horizontalSpeed(this.velocity);

    if (speed < 0.5) {
      this.gait = GaitType.IDLE;
    } else if (speed < this.config.WALK_SPEED + 1) {
      this.gait = GaitType.WALKING;
    } else {
      this.gait = GaitType.RUNNING;
    }
  }

  /**
   * Get current display state
   */
  getDisplayState(): string {
    return getDisplayState(this.movementMode, this.gait);
  }

  /**
   * Get current speed
   */
  getSpeed(): number {
    return horizontalSpeed(this.velocity);
  }

  private getCharacterShape(): CharacterShapeDefinition {
    return {
      type: 'capsule',
      radius: this.config.CAPSULE_RADIUS,
      height: this.config.CAPSULE_HEIGHT
    };
  }
}

export default CharacterController;
