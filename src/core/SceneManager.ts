import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { CAMERA, RENDER } from '../config/index.js';
import { DisposalTracker } from '../utils/index.js';

/**
 * Manages Three.js scene, renderer, and lights
 */
export class SceneManager {
  container: HTMLElement;
  tracker: DisposalTracker;

  resizeObserver: ResizeObserver | null;
  lastKnownSize: { width: number; height: number };

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rendererBackend: 'webgpu' | 'webgl';
  webgpuSupported: boolean;
  fallbackUsed: boolean;
  renderer: {
    domElement: HTMLCanvasElement;
    shadowMap: { enabled: boolean; type: number };
    getPixelRatio?: () => number;
    init?: () => Promise<void>;
    setSize: (width: number, height: number) => void;
    setPixelRatio: (ratio: number) => void;
    render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
    dispose: () => void;
  };
  initPromise: Promise<void> | null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.tracker = new DisposalTracker();

    this.resizeObserver = null;
    this.lastKnownSize = { width: 0, height: 0 };

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.rendererBackend = 'webgpu';
    this.webgpuSupported = false;
    this.fallbackUsed = false;
    this.renderer = this.createRenderer();
    this.initPromise = null;

    this.setupLights();

    // Append to container
    container.appendChild(this.renderer.domElement);

    // Initial size sync (use container if possible)
    this.updateSize();

    // Handle resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.container);
    }
  }

  createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    return scene;
  }

  createCamera(): THREE.PerspectiveCamera {
    const { width, height } = this.getContainerSize();
    const camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      width / height,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    camera.position.set(
      CAMERA.OFFSET_X,
      CAMERA.OFFSET_Y,
      CAMERA.OFFSET_Z
    );
    return camera;
  }

  createRenderer(): {
    domElement: HTMLCanvasElement;
    shadowMap: { enabled: boolean; type: number };
    init?: () => Promise<void>;
    setSize: (width: number, height: number) => void;
    setPixelRatio: (ratio: number) => void;
    render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
    dispose: () => void;
  } {
    const supportsWebGPU = SceneManager.supportsWebGPU();
    this.webgpuSupported = supportsWebGPU;

    const preferWebGPU = RENDER.PREFERRED_BACKEND === 'webgpu';
    const useWebGPU = preferWebGPU && supportsWebGPU;
    this.rendererBackend = useWebGPU ? 'webgpu' : 'webgl';
    this.fallbackUsed = preferWebGPU && !useWebGPU;

    let renderer: {
      domElement: HTMLCanvasElement;
      shadowMap: { enabled: boolean; type: number };
      getPixelRatio?: () => number;
      init?: () => Promise<void>;
      setSize: (width: number, height: number) => void;
      setPixelRatio: (ratio: number) => void;
      render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
      dispose: () => void;
    };

    if (useWebGPU) {
      renderer = new WebGPURenderer({ antialias: RENDER.ANTIALIAS });
    } else if (RENDER.ALLOW_WEBGL_FALLBACK) {
      renderer = new THREE.WebGLRenderer({ antialias: RENDER.ANTIALIAS });
    } else {
      throw new Error('WebGPU is not supported and WebGL fallback is disabled.');
    }

    const { width, height } = this.getContainerSize();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDER.PIXEL_RATIO_MAX));
    renderer.shadowMap.enabled = RENDER.SHADOWS_ENABLED;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  setupLights(): void {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Sun
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.scene.add(sun);
  }

  handleResize(): void {
    this.updateSize();
  }

  getContainerSize(): { width: number; height: number } {
    const width = Math.max(1, this.container?.clientWidth || window.innerWidth || 1);
    const height = Math.max(1, this.container?.clientHeight || window.innerHeight || 1);
    return { width, height };
  }

  updateSize(): void {
    const { width, height } = this.getContainerSize();
    if (width === this.lastKnownSize.width && height === this.lastKnownSize.height) return;
    this.lastKnownSize.width = width;
    this.lastKnownSize.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Add object to scene
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Render the scene
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Initialize renderer (required for WebGPU backend)
   */
  async init(): Promise<void> {
    if (!this.renderer.init) return;
    if (!this.initPromise) {
      this.initPromise = this.renderer.init();
    }
    await this.initPromise;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.tracker.dispose();
    this.renderer.dispose();

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  /**
   * Get disposal tracker for external use
   */
  getTracker(): DisposalTracker {
    return this.tracker;
  }

  getRendererInfo(): { backend: 'webgpu' | 'webgl'; supportsWebGPU: boolean; fallbackUsed: boolean } {
    return {
      backend: this.rendererBackend,
      supportsWebGPU: this.webgpuSupported,
      fallbackUsed: this.fallbackUsed
    };
  }

  static supportsWebGPU(): boolean {
    if (typeof WebGPURenderer !== 'undefined' && typeof WebGPURenderer.isAvailable === 'function') {
      return WebGPURenderer.isAvailable();
    }
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      return Boolean((navigator as { gpu?: unknown }).gpu);
    }
    return false;
  }
}

export default SceneManager;
