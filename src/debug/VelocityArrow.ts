import * as THREE from 'three';
import { DEBUG, COM } from '../config/index.js';
import type { DisposalTracker } from '../utils/disposal.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Visualizes velocity as an arrow originating from CoM
 */
export class VelocityArrow {
  private scene: THREE.Scene | null = null;

  // Visual element
  private arrow: THREE.ArrowHelper | null = null;

  // Reusable vectors
  private direction: THREE.Vector3;
  private origin: THREE.Vector3;

  // State
  private visible: boolean = false;

  constructor(tracker: DisposalTracker) {
    // Initialize reusable vectors
    this.direction = new THREE.Vector3(0, 0, 1);
    this.origin = new THREE.Vector3(0, 0, 0);

    // Create arrow helper
    this.arrow = new THREE.ArrowHelper(
      this.direction,
      this.origin,
      1, // Initial length
      DEBUG.VELOCITY_COLOR,
      COM.VELOCITY_ARROW.HEAD_LENGTH,
      COM.VELOCITY_ARROW.HEAD_WIDTH
    );
    this.arrow.visible = false;

    // Track materials for disposal
    if (this.arrow.line instanceof THREE.Line) {
      const lineMat = this.arrow.line.material as THREE.Material;
      if (lineMat) tracker.trackMaterial(lineMat);
    }
    if (this.arrow.cone instanceof THREE.Mesh) {
      const coneMat = this.arrow.cone.material as THREE.Material;
      if (coneMat) tracker.trackMaterial(coneMat);
    }
  }

  /**
   * Add visualizer to scene
   */
  addToScene(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.arrow) scene.add(this.arrow);
  }

  /**
   * Remove visualizer from scene
   */
  removeFromScene(): void {
    if (this.scene && this.arrow) {
      this.scene.remove(this.arrow);
    }
    this.scene = null;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.arrow) {
      this.arrow.visible = visible && DEBUG.SHOW_VELOCITY_ARROW;
    }
  }

  /**
   * Update arrow with current position and velocity
   */
  update(position: Vector3Like, velocity: Vector3Like): void {
    if (!this.arrow || !this.visible || !DEBUG.SHOW_VELOCITY_ARROW) {
      return;
    }

    // Calculate velocity magnitude
    const speed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );

    // Hide arrow if velocity is too small
    if (speed < 0.01) {
      this.arrow.visible = false;
      return;
    }

    // Calculate arrow length (clamped)
    const length = Math.min(
      Math.max(speed * COM.VELOCITY_ARROW.SCALE, COM.VELOCITY_ARROW.MIN_LENGTH),
      COM.VELOCITY_ARROW.MAX_LENGTH
    );

    // Set direction (normalized velocity)
    this.direction.set(
      velocity.x / speed,
      velocity.y / speed,
      velocity.z / speed
    );

    // Set origin
    this.origin.set(position.x, position.y, position.z);

    // Update arrow
    this.arrow.position.copy(this.origin);
    this.arrow.setDirection(this.direction);
    this.arrow.setLength(
      length,
      COM.VELOCITY_ARROW.HEAD_LENGTH,
      COM.VELOCITY_ARROW.HEAD_WIDTH
    );

    this.arrow.visible = true;
  }

  /**
   * Set arrow color
   */
  setColor(color: number): void {
    if (this.arrow) {
      this.arrow.setColor(color);
    }
  }

  /**
   * Check if arrow is currently visible
   */
  isVisible(): boolean {
    return this.visible;
  }
}

export default VelocityArrow;
