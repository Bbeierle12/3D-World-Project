import { CHARACTER } from '../../config/index.js';
import { clamp, wrapAngle, horizontalSpeed } from '../../utils/index.js';
import { MovementMode, GaitType, isAirborne, getDisplayState } from './MovementModes.js';

/**
 * Character controller handling movement physics
 * Uses plain objects for state - no Three.js dependency
 */
export class CharacterController {
  /**
   * @param {import('../../physics/IPhysicsWorld.js').IPhysicsWorld} physics
   */
  constructor(physics) {
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
   * @param {{x: number, y: number}} direction - Normalized input direction
   * @param {boolean} wantsRun
   * @param {boolean} wantsJump
   */
  setInput(direction, wantsRun, wantsJump) {
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
   * @param {number} deltaTime
   * @param {number} cameraYaw - Camera yaw for relative movement
   */
  update(deltaTime, cameraYaw = 0) {
    this.probeGround();
    this.updateMovementMode(deltaTime);

    const desiredVelocity = this.computeDesiredVelocity(cameraYaw);
    this.applyAcceleration(desiredVelocity, deltaTime);
    this.handleJump();
    this.applyGravity(deltaTime);

    if (this.movementMode === MovementMode.GROUNDED) {
      this.projectVelocityOntoSlope();
    }

    // Integrate position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Snap to ground when grounded or landing
    if (this.movementMode === MovementMode.GROUNDED ||
        this.movementMode === MovementMode.LANDING ||
        this.isGrounded) {
      this.snapToGround();
    }

    this.updateFacing(deltaTime);
    this.updateGait();

    // Clamp to world bounds
    const bounds = this.config.WORLD_BOUNDS;
    this.position.x = clamp(this.position.x, -bounds, bounds);
    this.position.z = clamp(this.position.z, -bounds, bounds);
  }

  probeGround() {
    const ground = this.physics.probeGround(this.position.x, this.position.z);
    this.groundHeight = ground.height;
    this.groundNormal = ground.normal;
    const safeNormalY = clamp(ground.normal.y, -1, 1);
    const angle = Math.acos(safeNormalY) * (180 / Math.PI);
    this.slopeAngle = Number.isFinite(angle) ? angle : 0;

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

  updateMovementMode(deltaTime) {
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

  computeDesiredVelocity(cameraYaw) {
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

  applyAcceleration(desiredVelocity, deltaTime) {
    const airborne = isAirborne(this.movementMode);
    const desiredLen = Math.sqrt(desiredVelocity.x ** 2 + desiredVelocity.z ** 2);

    let accel;
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

  handleJump() {
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

  applyGravity(deltaTime) {
    if (!this.isGrounded) {
      this.velocity.y -= this.config.GRAVITY * deltaTime;
    }
  }

  projectVelocityOntoSlope() {
    if (this.slopeAngle < 1) return;

    // Project horizontal velocity onto slope tangent
    const nx = this.groundNormal.x;
    const ny = this.groundNormal.y;
    const nz = this.groundNormal.z;

    // Cross(normal, up) for slope right
    const rightX = nz;
    const rightZ = -nx;
    const rightLen = Math.sqrt(rightX ** 2 + rightZ ** 2);

    if (rightLen < 0.001) return;

    // Normalize
    const rX = rightX / rightLen;
    const rZ = rightZ / rightLen;

    // Cross(right, normal) for slope tangent
    const tangentX = rZ * ny;
    const tangentZ = -rX * ny;

    // Project velocity onto tangent
    const dot = this.velocity.x * tangentX + this.velocity.z * tangentZ;
    this.velocity.x = tangentX * dot;
    this.velocity.z = tangentZ * dot;
  }

  snapToGround() {
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

  updateFacing(deltaTime) {
    let diff = wrapAngle(this.targetFacing - this.facing);
    const maxTurn = this.config.TURN_SPEED * deltaTime;
    this.facing += clamp(diff, -maxTurn, maxTurn);
  }

  updateGait() {
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
   * @returns {string}
   */
  getDisplayState() {
    return getDisplayState(this.movementMode, this.gait);
  }

  /**
   * Get current speed
   * @returns {number}
   */
  getSpeed() {
    return horizontalSpeed(this.velocity);
  }
}

export default CharacterController;
