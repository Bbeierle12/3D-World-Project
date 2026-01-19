import * as THREE from 'three';
import { COM } from '../config/index.js';
import type { DisposalTracker } from '../utils/disposal.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Visualizes the support polygon (base of support) on the ground plane
 */
export class SupportPolygonVisualizer {
  private scene: THREE.Scene | null = null;

  // Visual elements
  private line: THREE.Line | null = null;
  private material: THREE.LineBasicMaterial;
  private geometry: THREE.BufferGeometry;

  // State
  private visible: boolean = false;
  private maxPoints: number = 10; // Max polygon vertices
  private currentPointCount: number = 0;

  constructor(tracker: DisposalTracker) {
    // Create material
    this.material = tracker.trackMaterial(
      new THREE.LineBasicMaterial({
        color: COM.SUPPORT_POLYGON.COLOR_STABLE,
        linewidth: COM.SUPPORT_POLYGON.LINE_WIDTH,
        transparent: true,
        opacity: 0.7
      })
    );

    // Create geometry with pre-allocated buffer
    this.geometry = tracker.trackGeometry(
      new THREE.BufferGeometry()
    );

    // Pre-allocate position buffer (max points + 1 for closing the loop)
    const positions = new Float32Array((this.maxPoints + 1) * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create line
    this.line = new THREE.Line(this.geometry, this.material);
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
      this.line.visible = visible && this.currentPointCount > 0;
    }
  }

  /**
   * Update polygon with new vertices
   */
  update(polygon: Vector3Like[], isStable: boolean): void {
    if (!this.line) return;

    const positions = this.geometry.attributes.position;
    if (!positions) return;

    const posArray = positions.array as Float32Array;

    // Update color based on stability
    this.material.color.setHex(
      isStable ? COM.SUPPORT_POLYGON.COLOR_STABLE : COM.SUPPORT_POLYGON.COLOR_UNSTABLE
    );

    // No polygon = hide
    if (polygon.length < 2) {
      this.line.visible = false;
      this.currentPointCount = 0;
      return;
    }

    // Update vertex positions
    const pointCount = Math.min(polygon.length, this.maxPoints);
    this.currentPointCount = pointCount;

    for (let i = 0; i < pointCount; i++) {
      const idx = i * 3;
      const point = polygon[i];
      if (!point) continue;
      posArray[idx] = point.x;
      posArray[idx + 1] = point.y + 0.02; // Slight offset above ground
      posArray[idx + 2] = point.z;
    }

    // Close the loop by repeating first point
    const closeIdx = pointCount * 3;
    const firstPoint = polygon[0];
    if (firstPoint) {
      posArray[closeIdx] = firstPoint.x;
      posArray[closeIdx + 1] = firstPoint.y + 0.02;
      posArray[closeIdx + 2] = firstPoint.z;
    }

    // Update draw range to only render active points
    this.geometry.setDrawRange(0, pointCount + 1);
    positions.needsUpdate = true;

    // Show if visible and has points
    this.line.visible = this.visible && pointCount >= 2;
  }

  /**
   * Check if visualizer is currently visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Get current polygon point count
   */
  getPointCount(): number {
    return this.currentPointCount;
  }
}

export default SupportPolygonVisualizer;
