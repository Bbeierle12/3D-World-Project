import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Core
import { Engine, SceneManager, InputManager } from '../core/index.js';

// Terrain
import { TerrainHeightmap, TerrainMesh } from '../terrain/index.js';

// Physics
import { RapierPhysics, SimplePhysics, CenterOfMassSystem, SupportPolygonCalculator } from '../physics/index.js';

// Character
import {
  CharacterController,
  FootIKSystem,
  ProceduralAnimation,
  StickFigureRig,
  MovementMode,
  BUILT_IN_POSE_PRESETS
} from '../character/index.js';

// Camera
import { FollowCamera } from '../camera/index.js';

// Config
import { CHARACTER, ANIMATION, DEBUG, CAMERA, RENDER } from '../config/index.js';

// Debug Visualizers
import {
  CoMVisualizer,
  SupportPolygonVisualizer,
  TrajectoryTrail,
  VelocityArrow
} from '../debug/index.js';

import { captureScreenshot, debugLogger } from '../utils/index.js';
import { TelemetryPanel } from './TelemetryPanel.jsx';
import { DebugOverlay } from './DebugOverlay.jsx';
import { QuickActions } from './QuickActions.jsx';

const CAMERA_SETTINGS_DEFAULTS = {
  rotateSpeed: CAMERA.ROTATE_SPEED,
  zoomSpeed: CAMERA.ZOOM_SPEED,
  panSpeed: CAMERA.PAN_SPEED,
  invertX: CAMERA.INVERT_X,
  invertY: CAMERA.INVERT_Y,
  invertZoom: CAMERA.INVERT_ZOOM,
  minDistance: CAMERA.MIN_DISTANCE,
  maxDistance: CAMERA.MAX_DISTANCE,
  minPitch: CAMERA.MIN_POLAR_ANGLE,
  maxPitch: CAMERA.MAX_POLAR_ANGLE,
  rotationLerp: CAMERA.ROTATION_LERP,
  positionLerp: CAMERA.POSITION_LERP,
  zoomLerp: CAMERA.ZOOM_LERP
};

const SETTINGS_STORAGE_KEY = 'stickFigureSettings';

/**
 * Main 3D canvas component
 */
export function Canvas3D() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const systemsRef = useRef({});

  const [hudVisible, setHudVisible] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [telemetry, setTelemetry] = useState(() => ({
    state: 'idle',
    speed: '0.00',
    position: { x: '0.00', y: '0.00', z: '0.00' },
    grounded: true,
    slopeAngle: '0.0',
    leftFoot: '',
    rightFoot: '',
    facing: '0',
    velocityY: '0.00',
    input: { x: 0, y: 0 },
    inputWorld: { x: 0, z: 0 },
    velocity: { x: 0, z: 0 },
    directionDot: 0
  }));
  const [comTelemetry, setComTelemetry] = useState(null);
  const [poseJointNames, setPoseJointNames] = useState([]);
  const [poseJoint, setPoseJoint] = useState('');
  const [poseTelemetry, setPoseTelemetry] = useState(null);
  const posePrevRef = useRef(null);
  const poseJointRef = useRef(poseJoint);
  const poseJointNamesRef = useRef(poseJointNames);
  const [perfStats, setPerfStats] = useState(() => ({
    fps: '0',
    frameTime: '0.0',
    backend: 'unknown',
    pixelRatio: '1.0'
  }));
  const [showPerf, setShowPerf] = useState(RENDER.SHOW_PERF_STATS);
  const [rendererInfo, setRendererInfo] = useState(() => ({
    backend: 'webgpu',
    supportsWebGPU: false,
    fallbackUsed: false
  }));
  const rendererInfoRef = useRef(rendererInfo);
  const [rayTraceEnabled, setRayTraceEnabled] = useState(RENDER.RAYTRACE_ENABLED);
  const rayTraceEnabledRef = useRef(rayTraceEnabled);
  const rayTraceCanvasRef = useRef(null);

  const [customPresets, setCustomPresets] = useState([]);
  const [poseLock, setPoseLock] = useState(false);
  const poseLockRef = useRef(poseLock);
  const poseOverrideRef = useRef(null);

  const [debugFlags, setDebugFlags] = useState(() => ({
    showFootTargets: DEBUG.SHOW_FOOT_TARGETS,
    showComMarker: DEBUG.SHOW_COM_MARKER,
    showPlumbLine: DEBUG.SHOW_PLUMB_LINE,
    showVelocityArrow: DEBUG.SHOW_VELOCITY_ARROW,
    showSupportPolygon: DEBUG.SHOW_SUPPORT_POLYGON,
    showComTrail: DEBUG.SHOW_COM_TRAIL
  }));
  const debugRef = useRef(debugFlags);

  const [cameraSettings, setCameraSettings] = useState(CAMERA_SETTINGS_DEFAULTS);
  const cameraSettingsRef = useRef(cameraSettings);
  const settingsReadyRef = useRef(false);
  const cameraYawLockRef = useRef(0);
  const wasCameraInteractingRef = useRef(false);

  const updateDebugFlags = (updater) => {
    setDebugFlags((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      debugRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      settingsReadyRef.current = true;
      return;
    }
    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.hudVisible === 'boolean') setHudVisible(parsed.hudVisible);
          if (typeof parsed.showTelemetry === 'boolean') setShowTelemetry(parsed.showTelemetry);
          if (typeof parsed.showPerf === 'boolean') setShowPerf(parsed.showPerf);
          if (typeof parsed.rayTraceEnabled === 'boolean') setRayTraceEnabled(parsed.rayTraceEnabled);
          if (parsed.cameraSettings && typeof parsed.cameraSettings === 'object') {
            setCameraSettings((prev) => ({ ...prev, ...parsed.cameraSettings }));
          }
          if (parsed.debugFlags && typeof parsed.debugFlags === 'object') {
            updateDebugFlags((prev) => ({ ...prev, ...parsed.debugFlags }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
    settingsReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (!settingsReadyRef.current) return;
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const payload = {
        hudVisible,
        showTelemetry,
        showPerf,
        rayTraceEnabled,
        cameraSettings,
        debugFlags
      };
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to save settings:', err);
    }
  }, [hudVisible, showTelemetry, showPerf, rayTraceEnabled, cameraSettings, debugFlags]);

  const toggleDebugFlag = (key) => {
    updateDebugFlags((prev) => {
      const nextValue = !prev[key];
      const next = { ...prev, [key]: nextValue };
      const { rig, scene, trajectoryTrail } = systemsRef.current;

      if (key === 'showFootTargets' && rig && scene) {
        rig.setDebugVisible(nextValue, scene);
      }
      if (key === 'showComTrail' && !nextValue && trajectoryTrail) {
        trajectoryTrail.clear();
      }

      debugLogger.log('ui', 'info', `Debug ${key} ${nextValue ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  const handleScreenshot = () => {
    const { sceneManager } = systemsRef.current;
    if (!sceneManager) return;
    captureScreenshot(sceneManager.renderer, sceneManager.scene, sceneManager.camera, {
      filename: `stick-figure-${Date.now()}`
    });
    debugLogger.log('ui', 'info', 'Screenshot captured');
  };

  const handleResetPosition = () => {
    const { controller, comSystem, heightmap, physics } = systemsRef.current;
    if (!controller) return;
    controller.position.x = 0;
    controller.position.z = 0;
    const ground = physics?.probeGround(0, 0);
    const groundHeight = ground?.height ?? heightmap?.getHeight(0, 0) ?? 0;
    controller.position.y = groundHeight;
    controller.groundHeight = groundHeight;
    controller.isGrounded = true;
    if (comSystem) {
      comSystem.reset();
    }
    debugLogger.log('ui', 'info', 'Reset character location');
  };

  const handleResetCamera = () => {
    const { followCamera } = systemsRef.current;
    if (followCamera) {
      followCamera.resetOrbit();
      debugLogger.log('ui', 'info', 'Reset camera');
    }
  };

  const handleResetCameraSettings = () => {
    setCameraSettings(CAMERA_SETTINGS_DEFAULTS);
    debugLogger.log('ui', 'info', 'Reset camera settings');
  };

  const handleToggleHud = () => {
    setHudVisible((prev) => {
      const next = !prev;
      debugLogger.log('ui', 'info', `HUD ${next ? 'shown' : 'hidden'}`);
      return next;
    });
  };

  const handleToggleTelemetry = () => {
    setShowTelemetry((prev) => {
      const next = !prev;
      debugLogger.log('ui', 'info', `Telemetry ${next ? 'shown' : 'hidden'}`);
      return next;
    });
  };

  const handleTogglePerf = () => {
    setShowPerf((prev) => {
      const next = !prev;
      debugLogger.log('render', 'info', `Perf stats ${next ? 'shown' : 'hidden'}`);
      return next;
    });
  };

  const handleToggleRayTrace = () => {
    setRayTraceEnabled((prev) => {
      const next = !prev;
      debugLogger.log('render', 'info', `Ray trace preview ${next ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  const handleApplyPreset = (preset) => {
    const { rig } = systemsRef.current;
    if (!rig || !preset) return;
    poseOverrideRef.current = preset.jointAngles;
    rig.applyPose(preset.jointAngles);
    poseLockRef.current = true;
    setPoseLock(true);
    debugLogger.log('animation', 'info', `Applied pose preset "${preset.name}"`);
  };

  const handleSavePreset = (name) => {
    const trimmed = name.trim();
    const { rig } = systemsRef.current;
    if (!trimmed || !rig) return;
    const preset = {
      name: trimmed,
      description: `Custom pose saved at ${new Date().toLocaleString()}`,
      jointAngles: rig.getPose(),
      timestamp: Date.now()
    };

    setCustomPresets((prev) => {
      const filtered = prev.filter((entry) => entry.name !== trimmed);
      return [...filtered, preset];
    });
    debugLogger.log('animation', 'info', `Saved pose preset "${trimmed}"`);
  };

  const handleDeletePreset = (name) => {
    setCustomPresets((prev) => prev.filter((entry) => entry.name !== name));
    debugLogger.log('animation', 'info', `Deleted pose preset "${name}"`);
  };

  const handleClearCustomPresets = () => {
    setCustomPresets([]);
    debugLogger.log('animation', 'info', 'Cleared custom pose presets');
  };

  const handleTogglePoseLock = () => {
    const { rig } = systemsRef.current;
    setPoseLock((prev) => {
      const next = !prev;
      poseLockRef.current = next;
      if (next && !poseOverrideRef.current && rig) {
        poseOverrideRef.current = rig.getPose();
      }
      debugLogger.log('animation', 'info', `Pose lock ${next ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  const handleClearPoseOverride = () => {
    poseOverrideRef.current = null;
    poseLockRef.current = false;
    setPoseLock(false);
    debugLogger.log('animation', 'info', 'Cleared pose override');
  };

  const updateCameraSetting = (key, value) => {
    setCameraSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (next.minDistance > next.maxDistance) {
        if (key === 'minDistance') {
          next.maxDistance = next.minDistance;
        } else {
          next.minDistance = next.maxDistance;
        }
      }
      if (next.minPitch > next.maxPitch) {
        if (key === 'minPitch') {
          next.maxPitch = next.minPitch;
        } else {
          next.minPitch = next.maxPitch;
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const STORAGE_KEY = 'stickFigurePosePresets';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomPresets(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load custom presets:', err);
    }
  }, []);

  useEffect(() => {
    const STORAGE_KEY = 'stickFigurePosePresets';
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
    } catch (err) {
      console.warn('Failed to save custom presets:', err);
    }
  }, [customPresets]);

  useEffect(() => {
    debugRef.current = debugFlags;
    const { rig, scene, trajectoryTrail } = systemsRef.current;
    if (rig && scene) {
      rig.setDebugVisible(debugFlags.showFootTargets, scene);
    }
    if (!debugFlags.showComTrail && trajectoryTrail) {
      trajectoryTrail.clear();
    }
  }, [debugFlags]);

  useEffect(() => {
    rendererInfoRef.current = rendererInfo;
  }, [rendererInfo]);

  useEffect(() => {
    rayTraceEnabledRef.current = rayTraceEnabled;
  }, [rayTraceEnabled]);

  useEffect(() => {
    poseLockRef.current = poseLock;
  }, [poseLock]);

  useEffect(() => {
    posePrevRef.current = null;
  }, [poseJoint]);

  useEffect(() => {
    poseJointRef.current = poseJoint;
  }, [poseJoint]);

  useEffect(() => {
    poseJointNamesRef.current = poseJointNames;
  }, [poseJointNames]);

  useEffect(() => {
    cameraSettingsRef.current = cameraSettings;
    const { followCamera } = systemsRef.current;
    if (followCamera) {
      followCamera.setOrbitLimits(
        cameraSettings.minDistance,
        cameraSettings.maxDistance,
        cameraSettings.minPitch,
        cameraSettings.maxPitch
      );
      followCamera.setRotationSmoothing(cameraSettings.rotationLerp);
      followCamera.setZoomSmoothing(cameraSettings.zoomLerp);
      followCamera.setSmoothing(cameraSettings.positionLerp);
    }
  }, [cameraSettings]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isInputTarget = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isInputTarget) return;

      if (event.code === 'KeyH') {
        handleToggleHud();
      }
      if (event.code === 'KeyP') {
        handleScreenshot();
      }
      if (event.code === 'KeyO') {
        handleTogglePoseLock();
      }
      if (event.code === 'KeyR') {
        handleResetCamera();
      }
      if (event.code === 'KeyL') {
        handleResetPosition();
      }
      if (event.code === 'KeyT') {
        handleToggleTelemetry();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cleanup = null;

    const init = async () => {
      console.log('Canvas3D useEffect running, containerRef:', containerRef.current);
      if (!containerRef.current) return;

      // ========== INITIALIZATION ==========

      console.log('Creating SceneManager...');
      // Scene
      const sceneManager = new SceneManager(containerRef.current);
      console.log('SceneManager created, scene:', sceneManager.scene);
      const tracker = sceneManager.getTracker();

      await sceneManager.init();
      if (cancelled) {
        sceneManager.dispose();
        return;
      }
      debugLogger.log('system', 'info', 'SceneManager initialized');
      const rendererName = sceneManager.renderer?.constructor?.name || 'Renderer';
      const info = sceneManager.getRendererInfo?.() || {
        backend: 'webgpu',
        supportsWebGPU: false,
        fallbackUsed: false
      };
      setRendererInfo(info);
      rendererInfoRef.current = info;
      debugLogger.log('render', 'info', `Renderer ready (${rendererName}, backend: ${info.backend})`);

      // Terrain
      const heightmap = new TerrainHeightmap();
      const terrainMesh = new TerrainMesh(heightmap, tracker);
      terrainMesh.addToScene(sceneManager.scene);

      // Physics
      let physics = null;
      try {
        physics = await RapierPhysics.create(heightmap);
        debugLogger.log('physics', 'info', 'Rapier physics initialized');
      } catch (err) {
        console.warn('Rapier init failed, falling back to SimplePhysics:', err);
        physics = new SimplePhysics(heightmap);
        debugLogger.log('physics', 'warn', 'Rapier init failed, using SimplePhysics', {
          error: String(err)
        });
      }

      // Character controller
      const controller = new CharacterController(physics);

      // Initialize character at ground level
      const startGround = physics.probeGround(0, 0);
      controller.position.y = startGround.height;
      controller.groundHeight = startGround.height;
      controller.isGrounded = true;

      // Animation systems
      const footIK = new FootIKSystem(
        CHARACTER.HIP_WIDTH,
        ANIMATION.UPPER_LEG_LENGTH,
        ANIMATION.LOWER_LEG_LENGTH
      );
      const proceduralAnim = new ProceduralAnimation();

      // Visual rig
      const rig = new StickFigureRig(tracker);
      sceneManager.add(rig.group);
      const jointNames = typeof rig.getJointNames === 'function'
        ? rig.getJointNames()
        : [];
      if (jointNames.length > 0) {
        setPoseJointNames(jointNames);
        poseJointNamesRef.current = jointNames;
        setPoseJoint((prev) => {
          const next = prev || jointNames[0];
          poseJointRef.current = next;
          return next;
        });
      }

      // Debug visualization
      rig.setDebugVisible(debugRef.current.showFootTargets, sceneManager.scene);

      // Center of Mass systems
      const comSystem = new CenterOfMassSystem();
      const supportPolygonCalc = new SupportPolygonCalculator();

      // CoM visualizers
      const comVisualizer = new CoMVisualizer(tracker);
      const supportPolygonVis = new SupportPolygonVisualizer(tracker);
      const trajectoryTrail = new TrajectoryTrail(tracker);
      const velocityArrow = new VelocityArrow(tracker);

      // Add visualizers to scene
      comVisualizer.addToScene(sceneManager.scene);
      supportPolygonVis.addToScene(sceneManager.scene);
      trajectoryTrail.addToScene(sceneManager.scene);
      velocityArrow.addToScene(sceneManager.scene);

      // Camera
      const followCamera = new FollowCamera(sceneManager.camera);
      followCamera.setOrbitLimits(
        cameraSettingsRef.current.minDistance,
        cameraSettingsRef.current.maxDistance,
        cameraSettingsRef.current.minPitch,
        cameraSettingsRef.current.maxPitch
      );
      followCamera.setRotationSmoothing(cameraSettingsRef.current.rotationLerp);
      followCamera.setZoomSmoothing(cameraSettingsRef.current.zoomLerp);
      followCamera.setSmoothing(cameraSettingsRef.current.positionLerp);
      cameraYawLockRef.current = followCamera.getYaw();

      systemsRef.current = {
        sceneManager,
        physics,
        controller,
        rig,
        scene: sceneManager.scene,
        followCamera,
        comSystem,
        supportPolygonCalc,
        trajectoryTrail,
        comVisualizer,
        supportPolygonVis,
        velocityArrow,
        heightmap
      };

      // Set initial visibility from config
      const initialDebug = debugRef.current;
      comVisualizer.setVisible(initialDebug.showComMarker || initialDebug.showPlumbLine);
      supportPolygonVis.setVisible(initialDebug.showSupportPolygon);
      trajectoryTrail.setVisible(initialDebug.showComTrail);
      velocityArrow.setVisible(initialDebug.showVelocityArrow);

      // Input
      const input = new InputManager();
      input.attach();
      debugLogger.log('input', 'debug', 'Input attached');

      const pointerState = {
        mode: null,
        lastX: 0,
        lastY: 0,
        pointerId: null
      };

      const raycaster = new THREE.Raycaster();
      const rayTraceLight = new THREE.Vector3(0.4, 1, 0.2).normalize();
      const rayTraceColor = new THREE.Color();
      const rayTraceNormal = new THREE.Vector3();
      const rayTraceScreen = new THREE.Vector2();

      const onPointerDown = (event) => {
        if (!containerRef.current) return;
        const shouldPan = event.button === 1 || (event.button === 0 && event.shiftKey);
        const shouldOrbit = event.button === 2 || (event.button === 0 && !event.shiftKey);

        if (!shouldPan && !shouldOrbit) return;
        event.preventDefault();
        pointerState.mode = shouldPan ? 'pan' : 'orbit';
        pointerState.lastX = event.clientX;
        pointerState.lastY = event.clientY;
        pointerState.pointerId = event.pointerId;
        containerRef.current.setPointerCapture?.(event.pointerId);
        // Disable character-follow mode when user starts orbiting
        if (shouldOrbit) {
          followCamera.setFollowCharacterFacing(false);
        }
        debugLogger.log('camera', 'debug', `Camera ${pointerState.mode} start`);
      };

      const onPointerMove = (event) => {
        if (!pointerState.mode) return;
        const dx = event.clientX - pointerState.lastX;
        const dy = event.clientY - pointerState.lastY;
        pointerState.lastX = event.clientX;
        pointerState.lastY = event.clientY;

        const settings = cameraSettingsRef.current;
        if (pointerState.mode === 'orbit') {
          const yawFactor = settings.invertX ? -1 : 1;
          followCamera.addYaw(dx * settings.rotateSpeed * yawFactor);
          const pitchFactor = settings.invertY ? 1 : -1;
          followCamera.addPitch(dy * settings.rotateSpeed * pitchFactor);
        } else if (pointerState.mode === 'pan') {
          followCamera.addPan(-dx * settings.panSpeed, dy * settings.panSpeed);
        }
      };

      const onPointerUp = (event) => {
        if (pointerState.pointerId !== null && event.pointerId !== pointerState.pointerId) {
          return;
        }
        if (pointerState.mode) {
          // Re-enable character-follow mode when orbit ends
          if (pointerState.mode === 'orbit') {
            followCamera.setFollowCharacterFacing(true);
          }
          debugLogger.log('camera', 'debug', 'Camera interaction end');
        }
        pointerState.mode = null;
        pointerState.pointerId = null;
        containerRef.current?.releasePointerCapture?.(event.pointerId);
      };

      const onWheel = (event) => {
        event.preventDefault();
        const settings = cameraSettingsRef.current;
        const zoomFactor = settings.invertZoom ? -1 : 1;
        followCamera.addDistance(event.deltaY * settings.zoomSpeed * zoomFactor);
      };

      const onContextMenu = (event) => {
        event.preventDefault();
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('wheel', onWheel, { passive: false });
        container.addEventListener('contextmenu', onContextMenu);
      }
      window.addEventListener('pointerup', onPointerUp);

      // Engine
      const engine = new Engine();

      // ========== GAME SYSTEM ==========
      let telemetryAccumulator = 0;
      let perfAccumulator = 0;
      let perfFrames = 0;
      let perfFrameSum = 0;
      let rayTraceAccumulator = 0;
      let lastMovementMode = controller.movementMode;
      let lastGait = controller.gait;
      let lastGrounded = controller.isGrounded;

      const gameSystem = {
        update(deltaTime, elapsedTime) {
        physics.update?.(deltaTime);
        // Toggle foot target debug
        if (input.justPressed('debug')) {
          toggleDebugFlag('showFootTargets');
        }

        // Get input
        const moveDir = input.getMovementDirection();
        const wantsRun = input.isHeld('run');
        const wantsJump = input.isPressed('jump');
        const isCameraInteracting = Boolean(pointerState.mode);
        if (isCameraInteracting && !wasCameraInteractingRef.current) {
          cameraYawLockRef.current = followCamera.getYaw();
        }
        wasCameraInteractingRef.current = isCameraInteracting;
        const cameraYaw = isCameraInteracting
          ? cameraYawLockRef.current
          : followCamera.getYaw();
        const inputLen = Math.hypot(moveDir.x, moveDir.y);
        let moveIntent = null;
        if (inputLen > 0.01) {
          const inputX = moveDir.x / inputLen;
          const inputY = moveDir.y / inputLen;
          const cos = Math.cos(cameraYaw);
          const sin = Math.sin(cameraYaw);
          const forwardX = -sin;
          const forwardZ = -cos;
          const rightX = cos;
          const rightZ = -sin;
          moveIntent = {
            x: rightX * inputX + forwardX * inputY,
            y: 0,
            z: rightZ * inputX + forwardZ * inputY
          };
        }

        // Update controller
        controller.setInput(moveDir, wantsRun, wantsJump);
        controller.update(deltaTime, cameraYaw);

        if (controller.movementMode !== lastMovementMode) {
          debugLogger.log('animation', 'info', `Movement mode -> ${controller.movementMode}`);
          lastMovementMode = controller.movementMode;
        }
        if (controller.gait !== lastGait) {
          debugLogger.log('animation', 'info', `Gait -> ${controller.gait}`);
          lastGait = controller.gait;
        }
        if (controller.isGrounded !== lastGrounded) {
          debugLogger.log('physics', 'debug', `Grounded ${controller.isGrounded ? 'true' : 'false'}`);
          lastGrounded = controller.isGrounded;
        }

        // Animation
        const isGrounded = controller.movementMode === MovementMode.GROUNDED ||
                          controller.movementMode === MovementMode.LANDING;

        if (isGrounded) {
          // Foot IK
          footIK.computeFootTargets(
            controller.position,
            controller.facing,
            controller.velocity,
            controller.gait,
            deltaTime,
            (x, z) => heightmap.getHeight(x, z),
            (x, z) => heightmap.getNormal(x, z),
            moveIntent
          );

          const pelvisOffset = footIK.computePelvisOffset(
            controller.position,
            controller.groundHeight
          );

          rig.applyPelvisOffset(pelvisOffset);

          // Solve leg IK
          const ikBlend = footIK.getIKBlendWeight(controller.movementMode);
          const blendSpeed = 10 * deltaTime * ikBlend;

          if (ikBlend > 0) {
            const leftHip = rig.getHipWorldPosition('left', controller.position, controller.facing, pelvisOffset);
            const rightHip = rig.getHipWorldPosition('right', controller.position, controller.facing, pelvisOffset);

            const leftIK = footIK.solveLegIK(leftHip, footIK.leftFoot.worldTarget, controller.facing);
            const rightIK = footIK.solveLegIK(rightHip, footIK.rightFoot.worldTarget, controller.facing);

            rig.applyLegIK('left', leftIK, blendSpeed);
            rig.applyLegIK('right', rightIK, blendSpeed);
          }

          // Landing compression
          if (controller.movementMode === MovementMode.LANDING) {
            const progress = 1 - (controller.landingTimer / CHARACTER.LANDING_DURATION);
            const compression = Math.sin(progress * Math.PI) * 0.15;
            rig.applyLandingCompression(compression);
          }

          // Update debug markers
          const phases = footIK.getFootPhases();
          rig.updateDebugMarkers(
            footIK.leftFoot.worldTarget,
            footIK.rightFoot.worldTarget,
            phases.left,
            phases.right
          );
        } else {
          // Airborne pose
          rig.applyAirbornePose(controller.movementMode, 10 * deltaTime);
        }

        // Upper body animation
        proceduralAnim.update(
          controller.movementMode,
          controller.gait,
          footIK.cyclePhase,
          elapsedTime,
          deltaTime
        );
        rig.applyUpperBodyAnimation(proceduralAnim.getState(), 10 * deltaTime);

        // Sync rig to controller
        rig.syncToController(controller.position, controller.facing);

        // ===== Center of Mass Update =====
        // Update visualizer visibility based on debug config
        const debugState = debugRef.current;
        comVisualizer.setVisible(debugState.showComMarker || debugState.showPlumbLine);
        supportPolygonVis.setVisible(debugState.showSupportPolygon);
        trajectoryTrail.setVisible(debugState.showComTrail);
        velocityArrow.setVisible(debugState.showVelocityArrow);

        if (poseLockRef.current && poseOverrideRef.current) {
          rig.applyPose(poseOverrideRef.current);
        }

        // Get bone positions from rig
        const bonePositions = rig.getBoneWorldPositions();

        // Calculate support polygon from foot positions
        const leftFootPos = rig.getFootWorldPosition('left');
        const rightFootPos = rig.getFootWorldPosition('right');
        const footPhases = footIK.getFootPhases();

        const supportPolygon = supportPolygonCalc.calculate(
          {
            position: leftFootPos,
            isGrounded: footPhases.left === 'stance',
            facing: controller.facing
          },
          {
            position: rightFootPos,
            isGrounded: footPhases.right === 'stance',
            facing: controller.facing
          }
        );

        // Update CoM system
        const comState = comSystem.update(
          bonePositions,
          controller.groundHeight,
          supportPolygon,
          deltaTime
        );

        // Update visualizers
        comVisualizer.update(comState);
        supportPolygonVis.update(supportPolygon, comState.isStable);
        velocityArrow.update(comState.position, comState.velocity);

        // Add point to trajectory trail
        if (debugState.showComTrail) {
          trajectoryTrail.addPoint(comState.position);
        }

        // Update telemetry at 10 Hz
        telemetryAccumulator += deltaTime;
        if (telemetryAccumulator >= 0.1) {
          const sampleDt = telemetryAccumulator;
          telemetryAccumulator = 0;
          const speed = typeof controller.getSpeed === 'function'
            ? controller.getSpeed()
            : Math.hypot(controller.velocity.x, controller.velocity.z);
          const stateLabel = typeof controller.getDisplayState === 'function'
            ? controller.getDisplayState()
            : controller.movementMode;
          const facingDeg = (controller.facing * 180 / Math.PI) % 360;
          const velocityLen = Math.hypot(controller.velocity.x, controller.velocity.z);
          const velocityDir = velocityLen > 0.001
            ? { x: controller.velocity.x / velocityLen, z: controller.velocity.z / velocityLen }
            : { x: 0, z: 0 };
          const inputWorldDir = moveIntent
            ? { x: moveIntent.x, z: moveIntent.z }
            : { x: 0, z: 0 };
          const directionDot = moveIntent && velocityLen > 0.001
            ? velocityDir.x * inputWorldDir.x + velocityDir.z * inputWorldDir.z
            : 0;

          setTelemetry({
            state: stateLabel,
            speed: speed.toFixed(2),
            position: {
              x: controller.position.x.toFixed(2),
              y: controller.position.y.toFixed(2),
              z: controller.position.z.toFixed(2)
            },
            grounded: controller.isGrounded,
            slopeAngle: Number(controller.slopeAngle || 0).toFixed(1),
            leftFoot: footPhases.left,
            rightFoot: footPhases.right,
            facing: facingDeg.toFixed(0),
            velocityY: controller.velocity.y.toFixed(2),
            input: { x: moveDir.x, y: moveDir.y },
            inputWorld: inputWorldDir,
            velocity: { x: controller.velocity.x, z: controller.velocity.z },
            directionDot
          });

          setComTelemetry({
            position: {
              x: comState.position.x.toFixed(3),
              y: comState.position.y.toFixed(3),
              z: comState.position.z.toFixed(3)
            },
            velocity: {
              x: comState.velocity.x.toFixed(2),
              y: comState.velocity.y.toFixed(2),
              z: comState.velocity.z.toFixed(2)
            },
            speed: Math.sqrt(
              comState.velocity.x ** 2 +
              comState.velocity.y ** 2 +
              comState.velocity.z ** 2
            ).toFixed(2),
            stabilityMargin: comState.stabilityMargin.toFixed(3),
            stabilityLevel: comState.stabilityLevel
          });

          const jointName = poseJointRef.current || poseJointNamesRef.current[0];
          if (jointName && typeof rig.getJointTransform === 'function') {
            const jointTransform = rig.getJointTransform(jointName);
            if (jointTransform) {
              const safeDt = Math.max(sampleDt, 0.001);
              const prev = posePrevRef.current;
              let velocity = { x: 0, y: 0, z: 0 };
              let speed3 = 0;
              let angularSpeed = 0;

              if (prev && prev.name === jointName) {
                velocity = {
                  x: (jointTransform.position.x - prev.position.x) / safeDt,
                  y: (jointTransform.position.y - prev.position.y) / safeDt,
                  z: (jointTransform.position.z - prev.position.z) / safeDt
                };
                speed3 = Math.sqrt(
                  velocity.x ** 2 +
                  velocity.y ** 2 +
                  velocity.z ** 2
                );

                const qPrev = new THREE.Quaternion(
                  prev.quaternion.x,
                  prev.quaternion.y,
                  prev.quaternion.z,
                  prev.quaternion.w
                );
                const qCur = new THREE.Quaternion(
                  jointTransform.quaternion.x,
                  jointTransform.quaternion.y,
                  jointTransform.quaternion.z,
                  jointTransform.quaternion.w
                );
                const dq = qPrev.conjugate().multiply(qCur);
                const w = Math.max(-1, Math.min(1, dq.w));
                const angle = 2 * Math.acos(w);
                angularSpeed = angle / safeDt;
              }

              const worldEuler = new THREE.Euler().setFromQuaternion(
                new THREE.Quaternion(
                  jointTransform.quaternion.x,
                  jointTransform.quaternion.y,
                  jointTransform.quaternion.z,
                  jointTransform.quaternion.w
                ),
                'YXZ'
              );

              setPoseTelemetry({
                joint: jointName,
                position: jointTransform.position,
                localRotation: jointTransform.localRotation,
                worldRotation: { x: worldEuler.x, y: worldEuler.y, z: worldEuler.z },
                velocity,
                speed: speed3,
                angularSpeed
              });

              posePrevRef.current = {
                name: jointName,
                position: { ...jointTransform.position },
                quaternion: { ...jointTransform.quaternion }
              };
            }
          }
        }

        if (showPerf) {
          perfAccumulator += deltaTime;
          perfFrames += 1;
          perfFrameSum += deltaTime;

          if (perfAccumulator >= 0.5) {
            const fps = perfFrames / perfAccumulator;
            const avgFrame = (perfFrameSum / Math.max(perfFrames, 1)) * 1000;
            const pixelRatio = sceneManager.renderer?.getPixelRatio?.() ?? window.devicePixelRatio ?? 1;

            setPerfStats({
              fps: fps.toFixed(0),
              frameTime: avgFrame.toFixed(2),
              backend: rendererInfoRef.current.backend,
              pixelRatio: pixelRatio.toFixed(2)
            });

            perfAccumulator = 0;
            perfFrames = 0;
            perfFrameSum = 0;
          }
        }

        if (rayTraceEnabledRef.current) {
          rayTraceAccumulator += deltaTime;
          if (rayTraceAccumulator >= 1 / Math.max(RENDER.RAYTRACE_UPDATE_HZ, 1)) {
            rayTraceAccumulator = 0;
            const rayCanvas = rayTraceCanvasRef.current;
            const container = containerRef.current;
            if (rayCanvas && container) {
              const targetWidth = Math.max(1, Math.floor(container.clientWidth * RENDER.RAYTRACE_SCALE));
              const targetHeight = Math.max(1, Math.floor(container.clientHeight * RENDER.RAYTRACE_SCALE));

              if (rayCanvas.width !== targetWidth) rayCanvas.width = targetWidth;
              if (rayCanvas.height !== targetHeight) rayCanvas.height = targetHeight;

              const ctx = rayCanvas.getContext('2d');
              if (ctx) {
                const imageData = ctx.createImageData(targetWidth, targetHeight);
                const data = imageData.data;
                const background = sceneManager.scene.background;
                const bgColor = background && background.isColor ? background : null;

                raycaster.far = RENDER.RAYTRACE_MAX_DISTANCE;

                for (let y = 0; y < targetHeight; y += 1) {
                  const ndcY = 1 - (y + 0.5) / targetHeight * 2;
                  for (let x = 0; x < targetWidth; x += 1) {
                    const ndcX = (x + 0.5) / targetWidth * 2 - 1;
                    rayTraceScreen.set(ndcX, ndcY);
                    raycaster.setFromCamera(rayTraceScreen, sceneManager.camera);

                    const hits = raycaster.intersectObjects(sceneManager.scene.children, true);
                    let r = 135;
                    let g = 206;
                    let b = 235;

                    if (hits.length > 0) {
                      const hit = hits[0];
                      const material = Array.isArray(hit.object.material) ? hit.object.material[0] : hit.object.material;
                      rayTraceColor.set(material?.color ?? 0xcccccc);

                      if (hit.face?.normal) {
                        rayTraceNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
                      } else {
                        rayTraceNormal.set(0, 1, 0);
                      }

                      const intensity = Math.max(rayTraceNormal.dot(rayTraceLight), 0.15);
                      r = Math.floor(rayTraceColor.r * 255 * intensity);
                      g = Math.floor(rayTraceColor.g * 255 * intensity);
                      b = Math.floor(rayTraceColor.b * 255 * intensity);
                    } else if (bgColor) {
                      r = Math.floor(bgColor.r * 255);
                      g = Math.floor(bgColor.g * 255);
                      b = Math.floor(bgColor.b * 255);
                    }

                    const idx = (y * targetWidth + x) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 255;
                  }
                }

                ctx.putImageData(imageData, 0, 0);
              }
            }
          }
        }

        // Update camera - sync to character facing
        followCamera.setCharacterFacing(controller.facing);
        followCamera.update(controller.position, deltaTime);
        }
      };

      engine.addSystem(gameSystem);
      engine.setRenderCallback(() => sceneManager.render());
      console.log('Starting engine...');
      engine.start();
      console.log('Engine started, terrain mesh:', terrainMesh.mesh, 'rig group:', rig.group);
      debugLogger.log('system', 'info', 'Engine started');

      // Store ref for cleanup
      gameRef.current = {
        engine,
        sceneManager,
        input
      };

      // ========== CLEANUP ==========
      cleanup = () => {
        engine.stop();
        debugLogger.log('system', 'info', 'Engine stopped');
        input.detach();
        debugLogger.log('input', 'debug', 'Input detached');
        if (physics?.dispose) {
          physics.dispose();
        }
        if (container) {
          container.removeEventListener('pointerdown', onPointerDown);
          container.removeEventListener('pointermove', onPointerMove);
          container.removeEventListener('wheel', onWheel);
          container.removeEventListener('contextmenu', onContextMenu);
        }
        window.removeEventListener('pointerup', onPointerUp);
        // Remove CoM visualizers from scene
        comVisualizer.removeFromScene();
        supportPolygonVis.removeFromScene();
        trajectoryTrail.removeFromScene();
        velocityArrow.removeFromScene();
        sceneManager.dispose();
        systemsRef.current = {};
      };
    };

    init();

    return () => {
      cancelled = true;
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const posePresets = {
    builtIn: BUILT_IN_POSE_PRESETS,
    custom: customPresets
  };

  return (
    <>
      <div className="relative w-full h-full">
        <div ref={containerRef} className="h-full w-full" />
        <canvas
          ref={rayTraceCanvasRef}
          className={`absolute inset-0 h-full w-full pointer-events-none ${rayTraceEnabled ? 'opacity-100' : 'opacity-0'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      {hudVisible && showTelemetry && (
        <TelemetryPanel
          stats={telemetry}
          com={comTelemetry}
          perf={showPerf ? perfStats : null}
          pose={{
            joints: poseJointNames,
            selected: poseJoint,
            data: poseTelemetry
          }}
          onSelectPoseJoint={setPoseJoint}
        />
      )}
      <QuickActions
        onResetCamera={handleResetCamera}
        onResetPosition={handleResetPosition}
        onScreenshot={handleScreenshot}
      />
      <DebugOverlay
        visible={hudVisible}
        debugFlags={debugFlags}
        poseLock={poseLock}
        posePresets={posePresets}
        showTelemetry={showTelemetry}
        showPerf={showPerf}
        rendererInfo={rendererInfo}
        rayTraceEnabled={rayTraceEnabled}
        cameraSettings={cameraSettings}
        onToggleVisible={handleToggleHud}
        onToggleDebugFlag={toggleDebugFlag}
        onScreenshot={handleScreenshot}
        onResetPosition={handleResetPosition}
        onResetCamera={handleResetCamera}
        onResetCameraSettings={handleResetCameraSettings}
        onApplyPreset={handleApplyPreset}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onClearCustomPresets={handleClearCustomPresets}
        onTogglePoseLock={handleTogglePoseLock}
        onClearPoseOverride={handleClearPoseOverride}
        onToggleTelemetry={handleToggleTelemetry}
        onTogglePerf={handleTogglePerf}
        onToggleRayTrace={handleToggleRayTrace}
        onUpdateCameraSetting={updateCameraSetting}
      />
    </>
  );
}

export default Canvas3D;
