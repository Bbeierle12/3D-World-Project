import { ANIMATION } from '../../config/index.js';
import { lerp } from '../../utils/index.js';
import { FootPhase, GaitType, MovementMode, type GaitTypeType, type MovementModeType, type FootPhaseType } from '../controller/MovementModes.js';
import { TwoBoneIK, type IKSolution } from './TwoBoneIK.js';
import type { Vector3Like } from '../../types/index.js';

interface FootState {
  phase: FootPhaseType;
  worldTarget: Vector3Like;
  plantedPosition: Vector3Like;
  plantedNormalWorld: Vector3Like;
  terrainHeight: number;
  terrainNormal: Vector3Like;
  blendWeight: number;

  // Phase transition tracking for proper planting
  wasInStance: boolean;
  swingStartPosition: Vector3Like;
  swingEndTarget: Vector3Like;
}

type TerrainHeightFunction = (x: number, z: number) => number;
type TerrainNormalFunction = (x: number, z: number) => Vector3Like;

/**
 * Foot IK system for procedural walking
 */
export class FootIKSystem {
  hipWidth: number;
  upperLegLength: number;
  lowerLegLength: number;
  legLength: number;

  // IK solver
  ikSolver: TwoBoneIK;

  // Foot state
  leftFoot: FootState;
  rightFoot: FootState;

  // Gait
  cyclePhase: number;
  strideLength: number;
  strideHeight: number;

  // Pelvis
  pelvisOffset: number;
  targetPelvisOffset: number;

  // Distance tracking for step triggers
  lastCharacterPosition: Vector3Like;

  // Configuration for foot planting
  static readonly EARLY_STEP_DISTANCE_FACTOR = 0.8;
  static readonly SWING_RETARGET_MAX_SPEED = 2.0;
  static readonly SWING_EXTRAPOLATION_FACTOR = 0.3;

  constructor(hipWidth: number, upperLegLength: number, lowerLegLength: number) {
    this.hipWidth = hipWidth;
    this.upperLegLength = upperLegLength;
    this.lowerLegLength = lowerLegLength;
    this.legLength = upperLegLength + lowerLegLength;

    // IK solver
    this.ikSolver = new TwoBoneIK(upperLegLength, lowerLegLength);

    // Foot state
    this.leftFoot = this.createFootState();
    this.rightFoot = this.createFootState();

    // Gait
    this.cyclePhase = 0;
    this.strideLength = ANIMATION.WALK_STRIDE_LENGTH;
    this.strideHeight = ANIMATION.WALK_STRIDE_HEIGHT;

    // Pelvis
    this.pelvisOffset = 0;
    this.targetPelvisOffset = 0;

    // Distance tracking
    this.lastCharacterPosition = { x: 0, y: 0, z: 0 };
  }

  createFootState(): FootState {
    return {
      phase: FootPhase.STANCE,
      worldTarget: { x: 0, y: 0, z: 0 },
      plantedPosition: { x: 0, y: 0, z: 0 },
      plantedNormalWorld: { x: 0, y: 1, z: 0 },
      terrainHeight: 0,
      terrainNormal: { x: 0, y: 1, z: 0 },
      blendWeight: 1.0,
      wasInStance: true,
      swingStartPosition: { x: 0, y: 0, z: 0 },
      swingEndTarget: { x: 0, y: 0, z: 0 }
    };
  }

  /**
   * Check if we should force an early step
   * Returns true if the planted foot has "fallen behind" too much
   */
  shouldTriggerEarlyStep(
    foot: FootState,
    charPos: Vector3Like,
    strideLength: number
  ): boolean {
    if (foot.phase !== FootPhase.STANCE) return false;

    // Distance from planted position to current character position (projected)
    const dx = charPos.x - foot.plantedPosition.x;
    const dz = charPos.z - foot.plantedPosition.z;
    const distBehind = Math.sqrt(dx * dx + dz * dz);

    // Trigger early step if stance foot is more than threshold behind
    return distBehind > strideLength * FootIKSystem.EARLY_STEP_DISTANCE_FACTOR;
  }

  /**
   * Check if leg is near max extension (should release plant)
   */
  shouldReleasePlant(
    hipWorldPos: Vector3Like,
    plantedPos: Vector3Like,
    maxReach: number = this.legLength * 0.95
  ): boolean {
    const dx = plantedPos.x - hipWorldPos.x;
    const dy = plantedPos.y - hipWorldPos.y;
    const dz = plantedPos.z - hipWorldPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return dist >= maxReach;
  }

  /**
   * Update foot phases based on cycle
   */
  updateFootPhases(cyclePhase: number): void {
    const leftInStance = cyclePhase < 0.5;
    this.leftFoot.phase = leftInStance ? FootPhase.STANCE : FootPhase.SWING;
    this.rightFoot.phase = leftInStance ? FootPhase.SWING : FootPhase.STANCE;
  }

  /**
   * Compute foot targets
   */
  computeFootTargets(
    characterPos: Vector3Like,
    characterFacing: number,
    velocity: Vector3Like,
    gait: GaitTypeType,
    deltaTime: number,
    getTerrainHeight: TerrainHeightFunction,
    getTerrainNormal: TerrainNormalFunction,
    moveIntent?: Vector3Like
  ): void {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

    // Stride parameters (needed for early step check)
    const strideLen = gait === GaitType.RUNNING
      ? ANIMATION.RUN_STRIDE_LENGTH
      : ANIMATION.WALK_STRIDE_LENGTH;

    // Update cycle phase
    if (speed > 0.5) {
      const cycleSpeed = gait === GaitType.RUNNING
        ? ANIMATION.RUN_CYCLE_SPEED
        : ANIMATION.WALK_CYCLE_SPEED;
      const normalizedSpeed = gait === GaitType.RUNNING ? 8 : 4;
      const speedFactor = speed / normalizedSpeed;

      // CHECK: Early step trigger (distance-based override)
      const leftNeedsStep = this.shouldTriggerEarlyStep(this.leftFoot, characterPos, strideLen);
      const rightNeedsStep = this.shouldTriggerEarlyStep(this.rightFoot, characterPos, strideLen);

      // Force phase to next step if stance foot has fallen too far behind
      if (leftNeedsStep && this.leftFoot.phase === FootPhase.STANCE && this.cyclePhase < 0.5) {
        this.cyclePhase = 0.5; // Force left foot to lift
      }
      if (rightNeedsStep && this.rightFoot.phase === FootPhase.STANCE && this.cyclePhase >= 0.5) {
        this.cyclePhase = 0.0; // Force right foot to lift (wrap)
      }

      this.cyclePhase += deltaTime * cycleSpeed * speedFactor * 0.1;
      this.cyclePhase = this.cyclePhase % 1.0;
    }

    this.updateFootPhases(this.cyclePhase);

    // Update last position for distance tracking
    this.lastCharacterPosition.x = characterPos.x;
    this.lastCharacterPosition.y = characterPos.y;
    this.lastCharacterPosition.z = characterPos.z;

    // Stride height (length already computed above for early step)
    const strideLength = strideLen;
    const strideHeight = gait === GaitType.RUNNING
      ? ANIMATION.RUN_STRIDE_HEIGHT
      : ANIMATION.WALK_STRIDE_HEIGHT;

    // Movement direction
    const facingDirX = Math.sin(characterFacing);
    const facingDirZ = Math.cos(characterFacing);
    const moveLen = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    let moveDirX = facingDirX;
    let moveDirZ = facingDirZ;
    if (moveLen > 0.01) {
      moveDirX = velocity.x / moveLen;
      moveDirZ = velocity.z / moveLen;
    }

    const intentLen = moveIntent ? Math.sqrt(moveIntent.x ** 2 + moveIntent.z ** 2) : 0;
    if (intentLen > 0.01 && moveIntent) {
      const intentDirX = moveIntent.x / intentLen;
      const intentDirZ = moveIntent.z / intentLen;
      let useIntent = moveLen < 0.1;
      if (!useIntent && moveLen > 0.01) {
        const facingDot = moveDirX * facingDirX + moveDirZ * facingDirZ;
        if (facingDot < 0.5) {
          useIntent = true;
        }
      }
      if (useIntent) {
        moveDirX = intentDirX;
        moveDirZ = intentDirZ;
      }
    }

    // Perpendicular for hip offset (points RIGHT relative to movement direction)
    // Must match StickFigureRig.getHipWorldPosition which uses (cos, -sin)
    const perpX = moveDirZ;
    const perpZ = -moveDirX;

    this.computeSingleFootTarget(
      this.leftFoot,
      characterPos,
      moveDirX, moveDirZ,
      perpX, perpZ,
      -this.hipWidth / 2,
      strideLength,
      strideHeight,
      this.cyclePhase,
      speed,
      getTerrainHeight,
      getTerrainNormal,
      deltaTime
    );

    this.computeSingleFootTarget(
      this.rightFoot,
      characterPos,
      moveDirX, moveDirZ,
      perpX, perpZ,
      this.hipWidth / 2,
      strideLength,
      strideHeight,
      (this.cyclePhase + 0.5) % 1.0,
      speed,
      getTerrainHeight,
      getTerrainNormal,
      deltaTime
    );
  }

  computeSingleFootTarget(
    foot: FootState,
    charPos: Vector3Like,
    moveDirX: number,
    moveDirZ: number,
    perpX: number,
    perpZ: number,
    lateralOffset: number,
    strideLength: number,
    strideHeight: number,
    phase: number,
    speed: number,
    getHeight: TerrainHeightFunction,
    getNormal: TerrainNormalFunction,
    deltaTime: number = 0.016
  ): void {
    const wasStance = foot.wasInStance;
    const isStance = phase < 0.5;

    // Base hip position
    const hipX = charPos.x + perpX * lateralOffset;
    const hipZ = charPos.z + perpZ * lateralOffset;

    // Standing still - no pinning needed, feet under hips
    if (speed < 0.5) {
      foot.worldTarget.x = hipX;
      foot.worldTarget.z = hipZ;
      foot.worldTarget.y = getHeight(hipX, hipZ);
      foot.terrainHeight = foot.worldTarget.y;
      foot.terrainNormal = getNormal(hipX, hipZ);
      foot.wasInStance = true;
      // Update planted position for smooth transition when starting to move
      foot.plantedPosition.x = foot.worldTarget.x;
      foot.plantedPosition.z = foot.worldTarget.z;
      foot.plantedPosition.y = foot.worldTarget.y;
      return;
    }

    // STANCE PHASE - Pin foot in world space
    if (isStance) {
      // TRANSITION: SWING → STANCE (touchdown)
      if (!wasStance) {
        // Compute initial plant position (where foot lands)
        const plantX = hipX + moveDirX * (strideLength / 2);
        const plantZ = hipZ + moveDirZ * (strideLength / 2);
        const plantY = getHeight(plantX, plantZ);

        foot.plantedPosition.x = plantX;
        foot.plantedPosition.y = plantY;
        foot.plantedPosition.z = plantZ;
        foot.plantedNormalWorld = getNormal(plantX, plantZ);
      }

      // USE PLANTED POSITION (true world-space pinning)
      // XZ stays fixed, only Y follows terrain for slight height changes
      foot.worldTarget.x = foot.plantedPosition.x;
      foot.worldTarget.z = foot.plantedPosition.z;
      foot.worldTarget.y = getHeight(foot.plantedPosition.x, foot.plantedPosition.z);

      foot.terrainHeight = foot.worldTarget.y;
      foot.terrainNormal = getNormal(foot.plantedPosition.x, foot.plantedPosition.z);
      foot.wasInStance = true;

    // SWING PHASE - Compute arc trajectory to locked target
    } else {
      // TRANSITION: STANCE → SWING (lift-off)
      if (wasStance) {
        // Store where swing starts
        foot.swingStartPosition.x = foot.worldTarget.x;
        foot.swingStartPosition.y = foot.worldTarget.y;
        foot.swingStartPosition.z = foot.worldTarget.z;

        // Compute swing end target ONCE at lift-off
        const targetX = hipX + moveDirX * (strideLength / 2);
        const targetZ = hipZ + moveDirZ * (strideLength / 2);
        const targetY = getHeight(targetX, targetZ);

        foot.swingEndTarget.x = targetX;
        foot.swingEndTarget.y = targetY;
        foot.swingEndTarget.z = targetZ;
      }

      // Interpolate XZ along arc from start to end
      const swingProgress = (phase - 0.5) / 0.5;
      const heightOffset = Math.sin(swingProgress * Math.PI) * strideHeight;

      // Allow LIMITED mid-swing retargeting for responsiveness
      const newTargetX = hipX + moveDirX * (strideLength / 2);
      const newTargetZ = hipZ + moveDirZ * (strideLength / 2);

      const maxDelta = FootIKSystem.SWING_RETARGET_MAX_SPEED * deltaTime;
      const retargetDx = newTargetX - foot.swingEndTarget.x;
      const retargetDz = newTargetZ - foot.swingEndTarget.z;
      const retargetDist = Math.sqrt(retargetDx * retargetDx + retargetDz * retargetDz);

      if (retargetDist > 0.01 && retargetDist > maxDelta) {
        const scale = maxDelta / retargetDist;
        foot.swingEndTarget.x += retargetDx * scale;
        foot.swingEndTarget.z += retargetDz * scale;
        foot.swingEndTarget.y = getHeight(foot.swingEndTarget.x, foot.swingEndTarget.z);
      } else if (retargetDist > 0.01) {
        foot.swingEndTarget.x = newTargetX;
        foot.swingEndTarget.z = newTargetZ;
        foot.swingEndTarget.y = getHeight(newTargetX, newTargetZ);
      }

      foot.worldTarget.x = lerp(foot.swingStartPosition.x, foot.swingEndTarget.x, swingProgress);
      foot.worldTarget.z = lerp(foot.swingStartPosition.z, foot.swingEndTarget.z, swingProgress);
      foot.terrainHeight = getHeight(foot.worldTarget.x, foot.worldTarget.z);
      foot.worldTarget.y = foot.terrainHeight + heightOffset;

      foot.terrainNormal = getNormal(foot.worldTarget.x, foot.worldTarget.z);
      foot.wasInStance = false;
    }
  }

  /**
   * Compute pelvis offset for uneven terrain
   */
  computePelvisOffset(_characterPos: Vector3Like, _groundHeight: number): number {
    void _characterPos;
    void _groundHeight;
    const leftHeight = this.leftFoot.terrainHeight;
    const rightHeight = this.rightFoot.terrainHeight;
    const heightDiff = Math.abs(leftHeight - rightHeight);

    this.targetPelvisOffset = -Math.min(heightDiff * 0.5, ANIMATION.PELVIS_DROP_MAX);
    this.pelvisOffset = lerp(this.pelvisOffset, this.targetPelvisOffset, 0.1);

    return this.pelvisOffset;
  }

  /**
   * Solve IK for a leg
   */
  solveLegIK(hipWorldPos: Vector3Like, footTarget: Vector3Like, characterFacing: number): IKSolution {
    return this.ikSolver.solve(hipWorldPos, footTarget, characterFacing);
  }

  /**
   * Get IK blend weight based on movement mode
   */
  getIKBlendWeight(movementMode: MovementModeType): number {
    if (movementMode === MovementMode.JUMPING || movementMode === MovementMode.FALLING) {
      return 0;
    }
    if (movementMode === MovementMode.LANDING) {
      return 0.5;
    }
    return 1.0;
  }

  /**
   * Get current foot phases
   */
  getFootPhases(): { left: FootPhaseType; right: FootPhaseType } {
    return {
      left: this.leftFoot.phase,
      right: this.rightFoot.phase
    };
  }

  /**
   * Get planted positions for debug visualization
   */
  getPlantedPositions(): { left: Vector3Like; right: Vector3Like } {
    return {
      left: { ...this.leftFoot.plantedPosition },
      right: { ...this.rightFoot.plantedPosition }
    };
  }

  /**
   * Calculate debug metrics for monitoring foot drift
   */
  getDebugMetrics(): {
    leftStanceDrift: number;
    rightStanceDrift: number;
    cyclePhase: number;
    leftPhase: FootPhaseType;
    rightPhase: FootPhaseType;
  } {
    const leftDrift = this.leftFoot.phase === FootPhase.STANCE
      ? this.computeDrift(this.leftFoot.plantedPosition, this.leftFoot.worldTarget)
      : 0;
    const rightDrift = this.rightFoot.phase === FootPhase.STANCE
      ? this.computeDrift(this.rightFoot.plantedPosition, this.rightFoot.worldTarget)
      : 0;

    return {
      leftStanceDrift: leftDrift,
      rightStanceDrift: rightDrift,
      cyclePhase: this.cyclePhase,
      leftPhase: this.leftFoot.phase,
      rightPhase: this.rightFoot.phase
    };
  }

  private computeDrift(planted: Vector3Like, current: Vector3Like): number {
    const dx = current.x - planted.x;
    const dz = current.z - planted.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}

export default FootIKSystem;
