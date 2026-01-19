import * as THREE from 'three';
import { COM } from '../config/index.js';
import type { DisposalTracker } from '../utils/disposal.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Ring buffer-based trajectory trail for CoM visualization
 * Uses vertex colors for fading effect
 */
export class TrajectoryTrail {
  private scene: THREE.Scene | null = null;

  // Visual elements
  private line: THREE.Line | null = null;
  private material: THREE.LineBasicMaterial;
  private geometry: THREE.BufferGeometry;

  // Ring buffer for positions
  private positions: Float32Array;
  private colors: Float32Array;
  private maxPoints: number;
  private currentIndex: number = 0;
  private pointCount: number = 0;

  // State
  private visible: boolean = false;
  private lastPosition: Vector3Like | null = null;
  private minDistance: number = 0.01; // Minimum distance to add new point

  // Color interpolation
  private colorStart: THREE.Color;
  private colorEnd: THREE.Color;

  constructor(tracker: DisposalTracker) {
    this.maxPoints = COM.TRAIL.MAX_POINTS;

    // Pre-allocate arrays
    this.positions = new Float32Array(this.maxPoints * 3);
    this.colors = new Float32Array(this.maxPoints * 3);

    // Setup colors
    this.colorStart = new THREE.Color(COM.TRAIL.COLOR_START);
    this.colorEnd = new THREE.Color(COM.TRAIL.COLOR_END);

    // Create material with vertex colors
    this.material = tracker.trackMaterial(
      new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: COM.TRAIL.LINE_WIDTH,
        transparent: true,
        opacity: 0.8
      })
    );

    // Create geometry
    this.geometry = tracker.trackGeometry(
      new THREE.BufferGeometry()
    );
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Create line
    this.line = new THREE.Line(this.geometry, this.material);
    this.line.frustumCulled = false; // Always render
    this.line.visible = false;
  }

  /**
   * Add visualizer to scene
   */
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.line) scene.add(this.line);
  }

  /**
   * Remove visualizer from scene
   */
  removeFromScene(): void {
    if (this.scene && this.line) {
      this.scene.remove(this.line);
    }
    this.scene = null;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.line) {
      this.line.visible = visible && this.pointCount > 1;
    }
  }

  /**
   * Add a new point to the trail
   */
  addPoint(position: Vector3Like): void {
    // Check minimum distance
    if (this.lastPosition) {
      const dx = position.x - this.lastPosition.x;
      const dy = position.y - this.lastPosition.y;
      const dz = position.z - this.lastPosition.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < this.minDistance) {
        return;
      }
    }

    // Add point to ring buffer
    const idx = this.currentIndex * 3;
    this.positions[idx] = position.x;
    this.positions[idx + 1] = position.y;
    this.positions[idx + 2] = position.z;

    // Update indices
    this.currentIndex = (this.currentIndex + 1) % this.maxPoints;
    this.pointCount = Math.min(this.pointCount + 1, this.maxPoints);

    // Update last position
    this.lastPosition = { ...position };

    // Update colors and geometry
    this.updateColors();
    this.updateGeometry();
  }

  /**
   * Update vertex colors for fading effect
   */
  private updateColors(): void {
    const fadeStart = COM.TRAIL.FADE_START;

    for (let i = 0; i < this.pointCount; i++) {
      // Calculate age (0 = newest, 1 = oldest)
      const age = i / Math.max(1, this.pointCount - 1);

      // Calculate fade factor (1 = full color, 0 = faded)
      let fade: number;
      if (age < fadeStart) {
        fade = 1;
      } else {
        fade = 1 - (age - fadeStart) / (1 - fadeStart);
      }

      // Interpolate color
      const color = new THREE.Color().lerpColors(this.colorEnd, this.colorStart, fade);

      // Get index in ring buffer (accounting for wrap-around)
      const bufferIdx = (this.currentIndex - this.pointCount + i + this.maxPoints) % this.maxPoints;
      const colorIdx = bufferIdx * 3;

      this.colors[colorIdx] = color.r;
      this.colors[colorIdx + 1] = color.g;
      this.colors[colorIdx + 2] = color.b;
    }
  }

  /**
   * Update geometry for rendering
   */
  private updateGeometry(): void {
    if (!this.line) return;

    // Create ordered position array from ring buffer
    const orderedPositions = new Float32Array(this.pointCount * 3);

    for (let i = 0; i < this.pointCount; i++) {
      // Get index in ring buffer (oldest to newest)
      const bufferIdx = (this.currentIndex - this.pointCount + i + this.maxPoints) % this.maxPoints;
      const srcIdx = bufferIdx * 3;
      const dstIdx = i * 3;

      orderedPositions[dstIdx] = this.positions[srcIdx] ?? 0;
      orderedPositions[dstIdx + 1] = this.positions[srcIdx + 1] ?? 0;
      orderedPositions[dstIdx + 2] = this.positions[srcIdx + 2] ?? 0;
    }

    // Create ordered color array
    const orderedColors = new Float32Array(this.pointCount * 3);

    for (let i = 0; i < this.pointCount; i++) {
      const bufferIdx = (this.currentIndex - this.pointCount + i + this.maxPoints) % this.maxPoints;
      const srcIdx = bufferIdx * 3;
      const dstIdx = i * 3;

      orderedColors[dstIdx] = this.colors[srcIdx] ?? 0;
      orderedColors[dstIdx + 1] = this.colors[srcIdx + 1] ?? 0;
      orderedColors[dstIdx + 2] = this.colors[srcIdx + 2] ?? 0;
    }

    // Update geometry
    this.geometry.setAttribute('position', new THREE.BufferAttribute(orderedPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(orderedColors, 3));

    this.line.visible = this.visible && this.pointCount > 1;
  }

  /**
   * Clear all trail points
   */
  clear(): void {
    this.currentIndex = 0;
    this.pointCount = 0;
    this.lastPosition = null;

    if (this.line) {
      this.line.visible = false;
    }
  }

  /**
   * Check if trail is currently visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Get current number of points in trail
   */
  getPointCount(): number {
    return this.pointCount;
  }
}

export default TrajectoryTrail;
