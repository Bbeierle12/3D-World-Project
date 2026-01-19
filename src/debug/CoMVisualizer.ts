import * as THREE from 'three';
import { DEBUG } from '../config/index.js';
import type { DisposalTracker } from '../utils/disposal.js';
import type { CoMState } from '../types/index.js';

/**
 * Colors for stability levels
 */
const STABILITY_COLORS = {
  stable: 0x00ff00,    // Green
  warning: 0xffff00,   // Yellow
  unstable: 0xff0000   // Red
};

/**
 * Visualizes the Center of Mass position, plumb line, and ground projection
 */
export class CoMVisualizer {
  private tracker: DisposalTracker;
  private scene: THREE.Scene | null = null;

  // Visual elements
  private comMarker: THREE.Mesh | null = null;
  private plumbLine: THREE.Line | null = null;
  private groundProjection: THREE.Mesh | null = null;

  // Materials
  private comMaterial: THREE.MeshBasicMaterial;
  private plumbMaterial: THREE.LineBasicMaterial;
  private projectionMaterial: THREE.MeshBasicMaterial;

  // State
  private visible: boolean = false;

  constructor(tracker: DisposalTracker) {
    this.tracker = tracker;

    // Create materials
    this.comMaterial = tracker.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: STABILITY_COLORS.stable,
        transparent: true,
        opacity: 0.8
      })
    );

    this.plumbMaterial = tracker.trackMaterial(
      new THREE.LineBasicMaterial({
        color: DEBUG.PLUMB_COLOR,
        transparent: true,
        opacity: 0.6
      })
    );

    this.projectionMaterial = tracker.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: DEBUG.COM_COLOR,
        transparent: true,
        opacity: 0.4
      })
    );

    this.createGeometry();
  }

  /**
   * Create all visual elements
   */
  private createGeometry(): void {
    // CoM marker sphere
    const sphereGeometry = this.tracker.trackGeometry(
      new THREE.SphereGeometry(DEBUG.COM_MARKER_SIZE, 16, 12)
    );
    this.comMarker = new THREE.Mesh(sphereGeometry, this.comMaterial);
    this.comMarker.visible = false;

    // Plumb line (vertical line from CoM to ground)
    const lineGeometry = this.tracker.trackGeometry(
      new THREE.BufferGeometry()
    );
    // Initialize with two points
    const positions = new Float32Array(6); // 2 vertices * 3 components
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.plumbLine = new THREE.Line(lineGeometry, this.plumbMaterial);
    this.plumbLine.visible = false;

    // Ground projection marker (small flat ring/circle)
    const ringGeometry = this.tracker.trackGeometry(
      new THREE.RingGeometry(DEBUG.COM_MARKER_SIZE * 0.5, DEBUG.COM_MARKER_SIZE * 0.8, 16)
    );
    this.groundProjection = new THREE.Mesh(ringGeometry, this.projectionMaterial);
    this.groundProjection.rotation.x = -Math.PI / 2; // Lay flat on ground
    this.groundProjection.visible = false;
  }

  /**
   * Add visualizer to scene
   */
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.comMarker) scene.add(this.comMarker);
    if (this.plumbLine) scene.add(this.plumbLine);
    if (this.groundProjection) scene.add(this.groundProjection);
  }

  /**
   * Remove visualizer from scene
   */
  removeFromScene(): void {
    if (this.scene) {
      if (this.comMarker) this.scene.remove(this.comMarker);
      if (this.plumbLine) this.scene.remove(this.plumbLine);
      if (this.groundProjection) this.scene.remove(this.groundProjection);
    }
    this.scene = null;
  }

  /**
   * Set visibility of all elements
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.comMarker) this.comMarker.visible = visible && DEBUG.SHOW_COM_MARKER;
    if (this.plumbLine) this.plumbLine.visible = visible && DEBUG.SHOW_PLUMB_LINE;
    if (this.groundProjection) this.groundProjection.visible = visible && DEBUG.SHOW_PLUMB_LINE;
  }

  /**
   * Update visualizer with current CoM state
   */
  update(state: CoMState): void {
    if (!this.visible) return;

    // Update CoM marker position
    if (this.comMarker && DEBUG.SHOW_COM_MARKER) {
      this.comMarker.position.set(
        state.position.x,
        state.position.y,
        state.position.z
      );
      this.comMarker.visible = true;

      // Update color based on stability
      this.comMaterial.color.setHex(STABILITY_COLORS[state.stabilityLevel]);
    }

    // Update plumb line
    if (this.plumbLine && DEBUG.SHOW_PLUMB_LINE) {
      const positions = this.plumbLine.geometry.attributes.position;
      if (positions) {
        const posArray = positions.array as Float32Array;

        // Top point (CoM position)
        posArray[0] = state.position.x;
        posArray[1] = state.position.y;
        posArray[2] = state.position.z;

        // Bottom point (ground projection)
        posArray[3] = state.groundProjection.x;
        posArray[4] = state.groundProjection.y;
        posArray[5] = state.groundProjection.z;

        positions.needsUpdate = true;
      }
      this.plumbLine.visible = true;
    }

    // Update ground projection marker
    if (this.groundProjection && DEBUG.SHOW_PLUMB_LINE) {
      this.groundProjection.position.set(
        state.groundProjection.x,
        state.groundProjection.y + 0.01, // Slight offset to prevent z-fighting
        state.groundProjection.z
      );
      this.groundProjection.visible = true;

      // Update color based on stability
      this.projectionMaterial.color.setHex(STABILITY_COLORS[state.stabilityLevel]);
    }
  }

  /**
   * Get stability color for a given level
   */
  static getStabilityColor(level: 'stable' | 'warning' | 'unstable'): number {
    return STABILITY_COLORS[level];
  }

  /**
   * Check if visualizer is currently visible
   */
  isVisible(): boolean {
    return this.visible;
  }
}

export default CoMVisualizer;
