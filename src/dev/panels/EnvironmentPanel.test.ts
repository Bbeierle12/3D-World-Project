import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { EnvironmentPanel } from './EnvironmentPanel.js';
import type { GUI, Controller } from 'lil-gui';
import type { FollowCamera } from '../../camera/FollowCamera.js';
import type { CameraConfig, TerrainConfig } from '../../types/index.js';

// =============================================================================
// Mock Factories
// =============================================================================

function createMockController(): Controller {
  const div = document.createElement('div');
  div.innerHTML = '<div class="controller"><span class="name"></span></div>';

  return {
    name: vi.fn().mockReturnThis(),
    onChange: vi.fn().mockReturnThis(),
    setValue: vi.fn().mockReturnThis(),
    domElement: div.querySelector('.controller')!,
  } as unknown as Controller;
}

function createMockFolder(): GUI {
  return {
    add: vi.fn(() => createMockController()),
    addColor: vi.fn(() => createMockController()),
    addFolder: vi.fn(() => createMockFolder()),
    close: vi.fn(),
  } as unknown as GUI;
}

function createMockGui(): GUI {
  return {
    addFolder: vi.fn(() => createMockFolder()),
  } as unknown as GUI;
}

function createMockFollowCamera(): FollowCamera {
  return {
    camera: {
      position: { x: 0, y: 0, z: 0 },
      lookAt: vi.fn(),
      fov: 60,
      updateProjectionMatrix: vi.fn(),
    },
    offset: { x: 0, y: 8, z: 15 },
    lookAtOffset: { x: 0, y: 3, z: 0 },
    positionSmoothing: 0.05,
    yaw: 0,
    targetYaw: 0,
    yawSpeed: 0.05,
    update: vi.fn(),
    setSmoothing: vi.fn(),
    setOffset: vi.fn(),
    setYaw: vi.fn(),
    addYaw: vi.fn(),
    getYaw: vi.fn(() => 0),
  } as unknown as FollowCamera;
}

function createMockConfig(): { camera: CameraConfig; terrain: TerrainConfig } {
  return {
    camera: {
      FOV: 60,
      NEAR: 0.1,
      FAR: 1000,
      OFFSET_X: 0,
      OFFSET_Y: 8,
      OFFSET_Z: 15,
      LOOK_AT_Y: 3,
      POSITION_LERP: 0.05,
      ROTATION_LERP: 0.05,
      MIN_DISTANCE: 5,
      MAX_DISTANCE: 50,
      MIN_POLAR_ANGLE: 0.1,
      MAX_POLAR_ANGLE: 1.47,
    },
    terrain: {
      SIZE: 100,
      SEGMENTS: 64,
      HEIGHT_SCALE: 5,
      NOISE_SCALE_1: 0.05,
      NOISE_SCALE_2: 0.1,
      NOISE_SCALE_3: 0.02,
      COLOR: 0x3d9140,
      ROUGHNESS: 0.8,
      METALNESS: 0.1,
      GRID_DIVISIONS: 50,
      GRID_COLOR_CENTER: 0x000000,
      GRID_COLOR_LINES: 0x444444,
    },
  };
}

// Helper to get onChange handler from mock chain
function getOnChangeHandler(mockGui: GUI, controllerName: string): (v: number) => void {
  const environmentFolder = (mockGui.addFolder as Mock).mock.results[0]!.value as GUI;
  const cameraFolder = (environmentFolder.addFolder as Mock).mock.results[0]!.value as GUI;
  const addMock = cameraFolder.add as Mock;
  const addCalls = addMock.mock.calls as unknown[][];

  const callIndex = addCalls.findIndex((call) => call[1] === controllerName);
  if (callIndex === -1) throw new Error(`Controller ${controllerName} not found`);

  const controller = addMock.mock.results[callIndex]!.value as Controller;
  const onChangeMock = controller.onChange as Mock;
  return onChangeMock.mock.calls[0]![0] as (v: number) => void;
}

// =============================================================================
// Tests
// =============================================================================

describe('EnvironmentPanel', () => {
  let panel: EnvironmentPanel;
  let followCam: FollowCamera;
  let mockGui: GUI;
  let mockConfig: ReturnType<typeof createMockConfig>;

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    followCam = createMockFollowCamera();
    mockGui = createMockGui();
    mockConfig = createMockConfig();

    panel = new EnvironmentPanel(mockGui, mockConfig, { camera: followCam });
  });

  describe('Camera control bindings', () => {
    it('Look At Y updates lookAtOffset.y only, not the whole object', () => {
      const onChangeHandler = getOnChangeHandler(mockGui, 'LOOK_AT_Y');

      // Call the handler with a new value
      onChangeHandler(7);

      // CRITICAL: Verify lookAtOffset is still an object with x, y, z
      expect(typeof followCam.lookAtOffset).toBe('object');
      expect(followCam.lookAtOffset).toEqual({ x: 0, y: 7, z: 0 });

      // Verify only y changed
      expect(followCam.lookAtOffset.x).toBe(0);
      expect(followCam.lookAtOffset.z).toBe(0);
    });

    it('Position Smooth updates positionSmoothing (not positionLerp)', () => {
      const onChangeHandler = getOnChangeHandler(mockGui, 'POSITION_LERP');

      // Call the handler
      onChangeHandler(0.15);

      // CRITICAL: Verify the correct property was updated
      expect(followCam.positionSmoothing).toBe(0.15);

      // Verify no 'positionLerp' property was accidentally created
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((followCam as any).positionLerp).toBeUndefined();
    });

    it('Offset X updates offset.x correctly', () => {
      const onChangeHandler = getOnChangeHandler(mockGui, 'OFFSET_X');

      onChangeHandler(5);

      expect(followCam.offset.x).toBe(5);
      expect(followCam.offset.y).toBe(8); // Unchanged
      expect(followCam.offset.z).toBe(15); // Unchanged
    });
  });

  describe('resetCamera', () => {
    it('restores all camera values to defaults', () => {
      // Set extreme values
      followCam.offset.x = 50;
      followCam.offset.y = -10;
      followCam.offset.z = 100;
      followCam.lookAtOffset.y = -20;
      followCam.positionSmoothing = 1;

      panel.resetCamera();

      expect(followCam.offset).toEqual({ x: 0, y: 8, z: 15 });
      expect(followCam.lookAtOffset.y).toBe(3);
      expect(followCam.positionSmoothing).toBe(0.05);
    });

    it('preserves lookAtOffset object structure after reset', () => {
      followCam.lookAtOffset.y = 999;

      panel.resetCamera();

      // Verify it's still an object, not a scalar
      expect(typeof followCam.lookAtOffset).toBe('object');
      expect(followCam.lookAtOffset.x).toBe(0);
      expect(followCam.lookAtOffset.y).toBe(3);
      expect(followCam.lookAtOffset.z).toBe(0);
    });
  });

  describe('Range warnings', () => {
    it('has correct safe ranges defined', () => {
      expect(EnvironmentPanel.SAFE_RANGES.LOOK_AT_Y).toEqual({ min: 0, max: 10 });
      expect(EnvironmentPanel.SAFE_RANGES.FOV).toEqual({ min: 30, max: 90 });
      expect(EnvironmentPanel.SAFE_RANGES.POSITION_LERP).toEqual({ min: 0.01, max: 0.2 });
    });

    it('has extended ranges for experimentation', () => {
      expect(EnvironmentPanel.EXTENDED_RANGES.FOV.max).toBe(170);
      expect(EnvironmentPanel.EXTENDED_RANGES.LOOK_AT_Y.min).toBe(-20);
    });
  });

  describe('Style injection', () => {
    it('injects warning styles into document head', () => {
      const styleElement = document.getElementById('env-panel-warning-styles');
      expect(styleElement).not.toBeNull();
      expect(styleElement?.tagName).toBe('STYLE');
    });

    it('does not duplicate styles on multiple panel instances', () => {
      // Create second panel
      new EnvironmentPanel(createMockGui(), createMockConfig(), { camera: followCam });

      const styleElements = document.querySelectorAll('#env-panel-warning-styles');
      expect(styleElements.length).toBe(1);
    });
  });
});

describe('Type safety verification', () => {
  it('FollowCamera has Vector3Like offset property', () => {
    const cam = createMockFollowCamera();

    // These should all be numbers (Vector3Like interface)
    expect(typeof cam.offset.x).toBe('number');
    expect(typeof cam.offset.y).toBe('number');
    expect(typeof cam.offset.z).toBe('number');
  });

  it('FollowCamera has Vector3Like lookAtOffset property', () => {
    const cam = createMockFollowCamera();

    // This is the property that was being incorrectly overwritten
    expect(typeof cam.lookAtOffset).toBe('object');
    expect(typeof cam.lookAtOffset.x).toBe('number');
    expect(typeof cam.lookAtOffset.y).toBe('number');
    expect(typeof cam.lookAtOffset.z).toBe('number');
  });

  it('FollowCamera has positionSmoothing (not positionLerp)', () => {
    const cam = createMockFollowCamera();

    // Correct property exists
    expect(typeof cam.positionSmoothing).toBe('number');

    // Wrong property does not exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((cam as any).positionLerp).toBeUndefined();
  });
});
