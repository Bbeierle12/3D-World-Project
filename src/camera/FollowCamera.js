import { CAMERA } from '../config/index.js';
import { lerp } from '../utils/index.js';

/**
 * Third-person follow camera
 */
export class FollowCamera {
  /**
   * @param {THREE.Camera} camera
   */
  constructor(camera) {
    this.camera = camera;

    // Offset from target
    this.offset = {
      x: CAMERA.OFFSET_X,
      y: CAMERA.OFFSET_Y,
      z: CAMERA.OFFSET_Z
    };

    // Look-at offset
    this.lookAtOffset = {
      x: 0,
      y: CAMERA.LOOK_AT_Y,
      z: 0
    };

    // Yaw control (future: mouse input)
    this.yaw = 0;
    this.targetYaw = 0;
    this.yawSpeed = 0.05;

    // Smoothing
    this.positionSmoothing = CAMERA.POSITION_LERP;
  }

  /**
   * Update camera to follow target
   * @param {{x: number, y: number, z: number}} targetPosition
   * @param {number} _deltaTime
   */
  update(targetPosition, _deltaTime) {
    void _deltaTime;
    // Smooth yaw
    this.yaw = lerp(this.yaw, this.targetYaw, this.yawSpeed);

    // Rotate offset around Y axis
    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);

    const rotatedOffsetX = this.offset.x * cos - this.offset.z * sin;
    const rotatedOffsetZ = this.offset.x * sin + this.offset.z * cos;

    // Target camera position
    const targetCamX = targetPosition.x + rotatedOffsetX;
    const targetCamY = targetPosition.y + this.offset.y;
    const targetCamZ = targetPosition.z + rotatedOffsetZ;

    // Smooth interpolation
    this.camera.position.x = lerp(this.camera.position.x, targetCamX, this.positionSmoothing);
    this.camera.position.y = lerp(this.camera.position.y, targetCamY, this.positionSmoothing);
    this.camera.position.z = lerp(this.camera.position.z, targetCamZ, this.positionSmoothing);

    // Look at target
    const lookAtX = targetPosition.x + this.lookAtOffset.x;
    const lookAtY = targetPosition.y + this.lookAtOffset.y;
    const lookAtZ = targetPosition.z + this.lookAtOffset.z;

    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }

  /**
   * Set camera yaw (rotation around Y)
   * @param {number} yaw - Radians
   */
  setYaw(yaw) {
    this.targetYaw = yaw;
  }

  /**
   * Add to camera yaw
   * @param {number} delta - Radians
   */
  addYaw(delta) {
    this.targetYaw += delta;
  }

  /**
   * Get current yaw
   * @returns {number}
   */
  getYaw() {
    return this.yaw;
  }

  /**
   * Set offset
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setOffset(x, y, z) {
    this.offset.x = x;
    this.offset.y = y;
    this.offset.z = z;
  }

  /**
   * Set smoothing
   * @param {number} smoothing - 0 to 1
   */
  setSmoothing(smoothing) {
    this.positionSmoothing = smoothing;
  }
}

export default FollowCamera;
