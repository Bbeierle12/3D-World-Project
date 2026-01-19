import type * as THREE from 'three';
import { CAMERA } from '../config/index.js';
import { lerp } from '../utils/index.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Third-person follow camera
 */
export class FollowCamera {
  camera: THREE.PerspectiveCamera;
  offset: Vector3Like;
  lookAtOffset: Vector3Like;
  yaw: number;
  targetYaw: number;
  pitch: number;
  targetPitch: number;
  rotationSmoothing: number;
  positionSmoothing: number;
  zoomSmoothing: number;
  distance: number;
  targetDistance: number;
  minDistance: number;
  maxDistance: number;
  minPitch: number;
  maxPitch: number;
  panOffset: Vector3Like;
  defaultOrbit: {
    yaw: number;
    pitch: number;
    distance: number;
    panOffset: Vector3Like;
  };

  constructor(camera: THREE.PerspectiveCamera) {
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

    // Orbit control (yaw/pitch/distance)
    const flatDistance = Math.hypot(this.offset.x, this.offset.z);
    const initialDistance = Math.hypot(flatDistance, this.offset.y);
    const initialYaw = Math.atan2(this.offset.x, this.offset.z);
    const initialPitch = Math.atan2(this.offset.y, Math.max(0.0001, flatDistance));

    this.yaw = initialYaw;
    this.targetYaw = initialYaw;
    this.pitch = initialPitch;
    this.targetPitch = initialPitch;
    this.distance = initialDistance;
    this.targetDistance = initialDistance;

    // Smoothing
    this.rotationSmoothing = CAMERA.ROTATION_LERP;
    this.positionSmoothing = CAMERA.POSITION_LERP;
    this.zoomSmoothing = CAMERA.ZOOM_LERP;

    // Orbit limits
    this.minDistance = CAMERA.MIN_DISTANCE;
    this.maxDistance = CAMERA.MAX_DISTANCE;
    this.minPitch = CAMERA.MIN_POLAR_ANGLE;
    this.maxPitch = CAMERA.MAX_POLAR_ANGLE;
    this.targetDistance = this.clamp(this.targetDistance, this.minDistance, this.maxDistance);
    this.distance = this.targetDistance;
    this.targetPitch = this.clamp(this.targetPitch, this.minPitch, this.maxPitch);
    this.pitch = this.targetPitch;

    // Pan offset
    this.panOffset = { x: 0, y: 0, z: 0 };
    this.defaultOrbit = {
      yaw: this.targetYaw,
      pitch: this.targetPitch,
      distance: this.targetDistance,
      panOffset: { x: 0, y: 0, z: 0 }
    };
  }

  /**
   * Update camera to follow target
   */
  update(targetPosition: Vector3Like, _deltaTime: number): void {
    void _deltaTime;
    // Smooth yaw/pitch/zoom
    this.yaw = lerp(this.yaw, this.targetYaw, this.rotationSmoothing);
    this.pitch = lerp(this.pitch, this.targetPitch, this.rotationSmoothing);
    this.distance = lerp(this.distance, this.targetDistance, this.zoomSmoothing);

    // Spherical offset
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    const rotatedOffsetX = this.distance * cosPitch * sinYaw;
    const rotatedOffsetY = this.distance * sinPitch;
    const rotatedOffsetZ = this.distance * cosPitch * cosYaw;

    const targetX = targetPosition.x + this.panOffset.x;
    const targetY = targetPosition.y + this.panOffset.y;
    const targetZ = targetPosition.z + this.panOffset.z;

    // Target camera position
    const targetCamX = targetX + rotatedOffsetX;
    const targetCamY = targetY + rotatedOffsetY;
    const targetCamZ = targetZ + rotatedOffsetZ;

    // Smooth interpolation
    this.camera.position.x = lerp(this.camera.position.x, targetCamX, this.positionSmoothing);
    this.camera.position.y = lerp(this.camera.position.y, targetCamY, this.positionSmoothing);
    this.camera.position.z = lerp(this.camera.position.z, targetCamZ, this.positionSmoothing);

    // Look at target
    const lookAtX = targetX + this.lookAtOffset.x;
    const lookAtY = targetY + this.lookAtOffset.y;
    const lookAtZ = targetZ + this.lookAtOffset.z;

    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }

  /**
   * Set camera yaw (rotation around Y)
   */
  setYaw(yaw: number): void {
    this.targetYaw = yaw;
  }

  /**
   * Add to camera yaw
   */
  addYaw(delta: number): void {
    this.targetYaw += delta;
  }

  /**
   * Add to camera pitch
   */
  addPitch(delta: number): void {
    this.targetPitch = this.clamp(this.targetPitch + delta, this.minPitch, this.maxPitch);
  }

  /**
   * Add to camera distance
   */
  addDistance(delta: number): void {
    this.targetDistance = this.clamp(this.targetDistance + delta, this.minDistance, this.maxDistance);
  }

  /**
   * Pan the camera target
   */
  addPan(deltaX: number, deltaY: number): void {
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);
    this.panOffset.x += deltaX * cosYaw;
    this.panOffset.z += -deltaX * sinYaw;
    this.panOffset.y += deltaY;
  }

  /**
   * Get current yaw
   */
  getYaw(): number {
    return this.yaw;
  }

  /**
   * Set offset
   */
  setOffset(x: number, y: number, z: number): void {
    this.offset.x = x;
    this.offset.y = y;
    this.offset.z = z;

    const flatDistance = Math.hypot(this.offset.x, this.offset.z);
    const nextDistanceRaw = Math.hypot(flatDistance, this.offset.y);
    const nextYaw = Math.atan2(this.offset.x, this.offset.z);
    const nextPitchRaw = Math.atan2(this.offset.y, Math.max(0.0001, flatDistance));
    const nextDistance = this.clamp(nextDistanceRaw, this.minDistance, this.maxDistance);
    const nextPitch = this.clamp(nextPitchRaw, this.minPitch, this.maxPitch);

    this.yaw = nextYaw;
    this.targetYaw = nextYaw;
    this.pitch = nextPitch;
    this.targetPitch = nextPitch;
    this.distance = nextDistance;
    this.targetDistance = nextDistance;

    this.defaultOrbit = {
      yaw: nextYaw,
      pitch: nextPitch,
      distance: nextDistance,
      panOffset: { x: 0, y: 0, z: 0 }
    };
  }

  /**
   * Set smoothing
   */
  setSmoothing(smoothing: number): void {
    this.positionSmoothing = smoothing;
  }

  /**
   * Set rotation smoothing
   */
  setRotationSmoothing(smoothing: number): void {
    this.rotationSmoothing = smoothing;
  }

  /**
   * Set zoom smoothing
   */
  setZoomSmoothing(smoothing: number): void {
    this.zoomSmoothing = smoothing;
  }

  /**
   * Set orbit limits
   */
  setOrbitLimits(minDistance: number, maxDistance: number, minPitch: number, maxPitch: number): void {
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.minPitch = minPitch;
    this.maxPitch = maxPitch;
    this.targetPitch = this.clamp(this.targetPitch, this.minPitch, this.maxPitch);
    this.targetDistance = this.clamp(this.targetDistance, this.minDistance, this.maxDistance);
  }

  /**
   * Reset orbit to defaults
   */
  resetOrbit(): void {
    this.yaw = this.defaultOrbit.yaw;
    this.targetYaw = this.defaultOrbit.yaw;
    this.pitch = this.defaultOrbit.pitch;
    this.targetPitch = this.defaultOrbit.pitch;
    this.distance = this.defaultOrbit.distance;
    this.targetDistance = this.defaultOrbit.distance;
    this.panOffset = { ...this.defaultOrbit.panOffset };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export default FollowCamera;
