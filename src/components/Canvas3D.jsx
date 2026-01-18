import React, { useRef, useEffect } from 'react';

// Core
import { Engine, SceneManager, InputManager } from '../core/index.js';

// Terrain
import { TerrainHeightmap, TerrainMesh } from '../terrain/index.js';

// Physics
import { SimplePhysics } from '../physics/index.js';

// Character
import {
  CharacterController,
  FootIKSystem,
  ProceduralAnimation,
  StickFigureRig,
  MovementMode,
  GaitType
} from '../character/index.js';

// Camera
import { FollowCamera } from '../camera/index.js';

// Config
import { CHARACTER, ANIMATION } from '../config/index.js';

// Dev Tools
import { DevTools } from '../dev/index.js';

/**
 * Main 3D canvas component
 */
export function Canvas3D() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    console.log('Canvas3D useEffect running, containerRef:', containerRef.current);
    if (!containerRef.current) return;

    // ========== INITIALIZATION ==========

    console.log('Creating SceneManager...');
    // Scene
    const sceneManager = new SceneManager(containerRef.current);
    console.log('SceneManager created, scene:', sceneManager.scene);
    const tracker = sceneManager.getTracker();

    // Terrain
    const heightmap = new TerrainHeightmap();
    const terrainMesh = new TerrainMesh(heightmap, tracker);
    terrainMesh.addToScene(sceneManager.scene);

    // Physics
    const physics = new SimplePhysics(heightmap);

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

    // Debug visualization
    let debugEnabled = true;
    rig.setDebugVisible(debugEnabled, sceneManager.scene);

    // Camera
    const followCamera = new FollowCamera(sceneManager.camera);

    // Input
    const input = new InputManager();
    input.attach();

    // Engine
    const engine = new Engine();

    // Dev Tools (only in development)
    let devTools = null;
    if (import.meta.env.DEV) {
      try {
        console.log('Initializing DevTools...');
        devTools = new DevTools({
          controller,
          rig,
          footIK,
          proceduralAnim,
          camera: followCamera,
          heightmap,
          terrainMesh,
          scene: sceneManager.scene,
          sceneManager  // Also pass sceneManager for camera FOV control
        });
        console.log('DevTools initialized successfully');
      } catch (e) {
        console.error('DevTools initialization failed:', e);
      }
    }

    // ========== GAME SYSTEM ==========

    const gameSystem = {
      update(deltaTime, elapsedTime) {
        // Toggle debug
        if (input.justPressed('debug')) {
          debugEnabled = !debugEnabled;
          rig.setDebugVisible(debugEnabled, sceneManager.scene);
        }

        // Get input
        const moveDir = input.getMovementDirection();
        const wantsRun = input.isHeld('run');
        const wantsJump = input.isPressed('jump');

        // Update controller
        controller.setInput(moveDir, wantsRun, wantsJump);
        controller.update(deltaTime, followCamera.getYaw());

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
            (x, z) => heightmap.getNormal(x, z)
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

        // Update camera
        followCamera.update(controller.position, deltaTime);

        // Update DevTools telemetry
        if (devTools) {
          const footPhases = footIK.getFootPhases();
          devTools.updateTelemetry({
            speed: controller.getSpeed().toFixed(1),
            state: controller.getDisplayState(),
            position: {
              x: controller.position.x.toFixed(1),
              y: controller.position.y.toFixed(1),
              z: controller.position.z.toFixed(1)
            },
            grounded: controller.isGrounded,
            slopeAngle: controller.slopeAngle.toFixed(0),
            leftFoot: footPhases.left,
            rightFoot: footPhases.right,
            facing: (controller.facing * 180 / Math.PI).toFixed(0),
            velocityY: controller.velocity.y.toFixed(1)
          });
        }
      }
    };

    engine.addSystem(gameSystem);
    engine.setRenderCallback(() => sceneManager.render());
    console.log('Starting engine...');
    engine.start();
    console.log('Engine started, terrain mesh:', terrainMesh.mesh, 'rig group:', rig.group);

    // Store ref for cleanup
    gameRef.current = {
      engine,
      sceneManager,
      input,
      devTools
    };

    // ========== CLEANUP ==========
    return () => {
      engine.stop();
      input.detach();
      if (devTools) devTools.dispose();
      sceneManager.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default Canvas3D;
