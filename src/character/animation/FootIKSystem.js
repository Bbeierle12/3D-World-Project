import { ANIMATION } from '../../config/index.js';
import { lerp } from '../../utils/index.js';
import { FootPhase, GaitType, MovementMode } from '../controller/MovementModes.js';
import { TwoBoneIK } from './TwoBoneIK.js';

/**
 * Foot IK system for procedural walking
 */
export class FootIKSystem {
  /**
   * @param {number} hipWidth
   * @param {number} upperLegLength
   * @param {number} lowerLegLength
   */
  constructor(hipWidth, upperLegLength, lowerLegLength) {
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

  createFootState() {
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
   * @param {number} cyclePhase
   */
  updateFootPhases(cyclePhase) {
    const leftInStance = cyclePhase < 0.5;
    this.leftFoot.phase = leftInStance ? FootPhase.STANCE : FootPhase.SWING;
    this.rightFoot.phase = leftInStance ? FootPhase.SWING : FootPhase.STANCE;
  }

  /**
   * Compute foot targets
   * @param {{x: number, y: number, z: number}} characterPos
   * @param {number} characterFacing
   * @param {{x: number, y: number, z: number}} velocity
   * @param {string} gait
   * @param {number} deltaTime
   * @param {function} getTerrainHeight - Function to sample terrain
   * @param {function} getTerrainNormal - Function to get terrain normal
   */
  computeFootTargets(characterPos, characterFacing, velocity, gait, deltaTime, getTerrainHeight, getTerrainNormal) {
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
    let moveDirX, moveDirZ;
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

  computeSingleFootTarget(foot, charPos, moveDirX, moveDirZ, perpX, perpZ, lateralOffset, strideLength, strideHeight, phase, speed, getHeight, getNormal) {
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

    let forwardOffset, heightOffset;

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
   * @param {{x: number, y: number, z: number}} _characterPos
   * @param {number} _groundHeight
   * @returns {number}
   */
  computePelvisOffset(_characterPos, _groundHeight) {
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
   * @param {{x: number, y: number, z: number}} hipWorldPos
   * @param {{x: number, y: number, z: number}} footTarget
   * @param {number} characterFacing
   * @returns {{upperAngle: number, lowerAngle: number, reachRatio: number}}
   */
  solveLegIK(hipWorldPos, footTarget, characterFacing) {
    return this.ikSolver.solve(hipWorldPos, footTarget, characterFacing);
  }

  /**
   * Get IK blend weight based on movement mode
   * @param {string} movementMode
   * @returns {number}
   */
  getIKBlendWeight(movementMode) {
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
   * @returns {{left: string, right: string}}
   */
  getFootPhases() {
    return {
      left: this.leftFoot.phase,
      right: this.rightFoot.phase
    };
  }
}

export default FootIKSystem;
