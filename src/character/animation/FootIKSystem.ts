import { ANIMATION } from '../../config/index.js';
import { lerp } from '../../utils/index.js';
import { FootPhase, GaitType, MovementMode, type GaitTypeType, type MovementModeType, type FootPhaseType } from '../controller/MovementModes.js';
import { TwoBoneIK, type IKSolution } from './TwoBoneIK.js';
import type { Vector3Like } from '../../types/index.js';

interface FootState {
  phase: FootPhaseType;
  worldTarget: Vector3Like;
  plantedPosition: Vector3Like;
  terrainHeight: number;
  terrainNormal: Vector3Like;
  blendWeight: number;
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
  }

  createFootState(): FootState {
    return {
      phase: FootPhase.STANCE,
      worldTarget: { x: 0, y: 0, z: 0 },
      plantedPosition: { x: 0, y: 0, z: 0 },
      terrainHeight: 0,
      terrainNormal: { x: 0, y: 1, z: 0 },
      blendWeight: 1.0
    };
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
    getTerrainNormal: TerrainNormalFunction
  ): void {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

    // Update cycle phase
    if (speed > 0.5) {
      const cycleSpeed = gait === GaitType.RUNNING
        ? ANIMATION.RUN_CYCLE_SPEED
        : ANIMATION.WALK_CYCLE_SPEED;
      const normalizedSpeed = gait === GaitType.RUNNING ? 8 : 4;
      const speedFactor = speed / normalizedSpeed;

      this.cyclePhase += deltaTime * cycleSpeed * speedFactor * 0.1;
      this.cyclePhase = this.cyclePhase % 1.0;
    }

    this.updateFootPhases(this.cyclePhase);

    // Stride parameters
    const strideLength = gait === GaitType.RUNNING
      ? ANIMATION.RUN_STRIDE_LENGTH
      : ANIMATION.WALK_STRIDE_LENGTH;
    const strideHeight = gait === GaitType.RUNNING
      ? ANIMATION.RUN_STRIDE_HEIGHT
      : ANIMATION.WALK_STRIDE_HEIGHT;

    // Movement direction
    const moveLen = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    let moveDirX: number, moveDirZ: number;
    if (moveLen > 0.01) {
      moveDirX = velocity.x / moveLen;
      moveDirZ = velocity.z / moveLen;
    } else {
      moveDirX = Math.sin(characterFacing);
      moveDirZ = Math.cos(characterFacing);
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
      getTerrainNormal
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
      getTerrainNormal
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
    getNormal: TerrainNormalFunction
  ): void {
    // Base position under hip
    const hipX = charPos.x + perpX * lateralOffset;
    const hipZ = charPos.z + perpZ * lateralOffset;

    if (speed < 0.5) {
      // Standing still
      foot.worldTarget.x = hipX;
      foot.worldTarget.z = hipZ;
      foot.worldTarget.y = getHeight(hipX, hipZ);
      foot.terrainHeight = foot.worldTarget.y;
      foot.terrainNormal = getNormal(hipX, hipZ);
      return;
    }

    let forwardOffset: number, heightOffset: number;

    if (phase < 0.5) {
      // Stance phase
      const stanceProgress = phase / 0.5;
      forwardOffset = lerp(strideLength / 2, -strideLength / 2, stanceProgress);
      heightOffset = 0;
    } else {
      // Swing phase
      const swingProgress = (phase - 0.5) / 0.5;
      forwardOffset = lerp(-strideLength / 2, strideLength / 2, swingProgress);
      heightOffset = Math.sin(swingProgress * Math.PI) * strideHeight;
    }

    foot.worldTarget.x = hipX + moveDirX * forwardOffset;
    foot.worldTarget.z = hipZ + moveDirZ * forwardOffset;
    foot.terrainHeight = getHeight(foot.worldTarget.x, foot.worldTarget.z);
    foot.terrainNormal = getNormal(foot.worldTarget.x, foot.worldTarget.z);
    foot.worldTarget.y = foot.terrainHeight + heightOffset;
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
}

export default FootIKSystem;
