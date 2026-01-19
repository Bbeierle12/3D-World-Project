declare module 'three/webgpu' {
  export const WebGPURenderer: new (parameters?: Record<string, unknown>) => {
    domElement: HTMLCanvasElement;
    shadowMap: { enabled: boolean; type: number };
    init?: () => Promise<void>;
    setSize: (width: number, height: number) => void;
    setPixelRatio: (ratio: number) => void;
    render: (scene: unknown, camera: unknown) => void;
    dispose: () => void;
  };
}
