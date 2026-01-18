/**
 * Tracks Three.js disposable resources for cleanup
 */
export class DisposalTracker {
  constructor() {
    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.renderTargets = [];
  }

  /**
   * Register a geometry for disposal
   * @param {THREE.BufferGeometry} geometry
   * @returns {THREE.BufferGeometry}
   */
  trackGeometry(geometry) {
    this.geometries.push(geometry);
    return geometry;
  }

  /**
   * Register a material for disposal
   * @param {THREE.Material} material
   * @returns {THREE.Material}
   */
  trackMaterial(material) {
    this.materials.push(material);
    return material;
  }

  /**
   * Register a texture for disposal
   * @param {THREE.Texture} texture
   * @returns {THREE.Texture}
   */
  trackTexture(texture) {
    this.textures.push(texture);
    return texture;
  }

  /**
   * Register a render target for disposal
   * @param {THREE.WebGLRenderTarget} target
   * @returns {THREE.WebGLRenderTarget}
   */
  trackRenderTarget(target) {
    this.renderTargets.push(target);
    return target;
  }

  /**
   * Dispose all tracked resources
   */
  dispose() {
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
