import type * as THREE from 'three';

/**
 * Tracks Three.js disposable resources for cleanup
 */
export class DisposalTracker {
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
  textures: THREE.Texture[];
  renderTargets: THREE.WebGLRenderTarget[];

  constructor() {
    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.renderTargets = [];
  }

  /**
   * Register a geometry for disposal
   */
  trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  /**
   * Register a material for disposal
   */
  trackMaterial<T extends THREE.Material>(material: T): T {
    this.materials.push(material);
    return material;
  }

  /**
   * Register a texture for disposal
   */
  trackTexture<T extends THREE.Texture>(texture: T): T {
    this.textures.push(texture);
    return texture;
  }

  /**
   * Register a render target for disposal
   */
  trackRenderTarget<T extends THREE.WebGLRenderTarget>(target: T): T {
    this.renderTargets.push(target);
    return target;
  }

  /**
   * Dispose all tracked resources
   */
  dispose(): void {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    this.textures.forEach(t => t.dispose());
    this.renderTargets.forEach(rt => rt.dispose());

    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.renderTargets = [];
  }
}

export default DisposalTracker;
