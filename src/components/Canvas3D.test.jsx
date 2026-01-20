import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const engineInstances = []
const inputInstances = []
const rigInstances = []

vi.mock('../core/index.js', () => {
  class Engine {
    constructor() {
      this.systems = []
      this.renderCallback = null
      this.start = vi.fn(() => {
        if (this.systems[0]?.update) {
          this.systems[0].update(0.016, 1)
        }
        if (this.renderCallback) {
          this.renderCallback()
        }
      })
      this.stop = vi.fn()
      engineInstances.push(this)
    }
    addSystem(system) {
      this.systems.push(system)
    }
    setRenderCallback(cb) {
      this.renderCallback = cb
    }
  }

  class SceneManager {
    constructor(container) {
      this.container = container
      this.scene = { add: vi.fn(), remove: vi.fn() }
      this.camera = {}
      this.tracker = {}
      this.renderer = { domElement: document.createElement('canvas') }
      container.appendChild(this.renderer.domElement)
    }
    init() {
      return Promise.resolve()
    }
    getTracker() {
      return this.tracker
    }
    add() {}
    render() {}
    dispose() {
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement)
      }
    }
  }

  class InputManager {
    constructor() {
      this.attach = vi.fn()
      this.detach = vi.fn()
      inputInstances.push(this)
    }
    getMovementDirection() {
      return { x: 0, y: 0 }
    }
    isPressed() {
      return false
    }
    isHeld() {
      return false
    }
    justPressed() {
      return true
    }
  }

  return { Engine, SceneManager, InputManager }
})

vi.mock('../terrain/index.js', () => ({
  TerrainHeightmap: class {
    getHeight() {
      return 0
    }
    getNormal() {
      return { x: 0, y: 1, z: 0 }
    }
  },
  TerrainMesh: class {
    constructor() {
      this.addToScene = vi.fn()
    }
  }
}))

vi.mock('../physics/index.js', () => ({
  RapierPhysics: class {
    static async create() {
      return new this()
    }
    probeGround() {
      return { height: 0, normal: { x: 0, y: 1, z: 0 } }
    }
    update() {}
    dispose() {}
  },
  SimplePhysics: class {
    probeGround() {
      return { height: 0, normal: { x: 0, y: 1, z: 0 } }
    }
    update() {}
  },
  CenterOfMassSystem: class {
    update() {
      return {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        groundProjection: { x: 0, y: 0, z: 0 },
        isStable: true,
        stabilityMargin: 0,
        stabilityLevel: 'stable'
      }
    }
  },
  SupportPolygonCalculator: class {
    calculate() {
      return []
    }
  }
}))

vi.mock('../debug/index.js', () => ({
  CoMVisualizer: class {
    addToScene() {}
    removeFromScene() {}
    setVisible() {}
    update() {}
  },
  SupportPolygonVisualizer: class {
    addToScene() {}
    removeFromScene() {}
    setVisible() {}
    update() {}
  },
  TrajectoryTrail: class {
    addToScene() {}
    removeFromScene() {}
    setVisible() {}
    addPoint() {}
  },
  VelocityArrow: class {
    addToScene() {}
    removeFromScene() {}
    setVisible() {}
    update() {}
  }
}))

vi.mock('../character/index.js', () => {
  const MovementMode = {
    GROUNDED: 'grounded',
    JUMPING: 'jumping',
    FALLING: 'falling',
    LANDING: 'landing'
  }

  class CharacterController {
    constructor() {
      this.position = { x: 1, y: 0, z: 2 }
      this.velocity = { x: 0, y: 0, z: 0 }
      this.facing = 0
      this.gait = 'walking'
      this.movementMode = MovementMode.GROUNDED
      this.slopeAngle = 0
      this.isGrounded = true
      this.groundHeight = 0
      this.landingTimer = 0
      this.setInput = vi.fn()
      this.update = vi.fn()
    }
    getSpeed() {
      return 2.5
    }
    getDisplayState() {
      return 'walking'
    }
  }

  class FootIKSystem {
    constructor() {
      this.leftFoot = { worldTarget: { x: 0, y: 0, z: 0 } }
      this.rightFoot = { worldTarget: { x: 0, y: 0, z: 0 } }
      this.cyclePhase = 0
      this.computeFootTargets = vi.fn()
      this.computePelvisOffset = vi.fn(() => 0)
      this.getIKBlendWeight = vi.fn(() => 1)
      this.solveLegIK = vi.fn(() => ({ upperAngle: 0, lowerAngle: 0 }))
      this.getFootPhases = vi.fn(() => ({ left: 'stance', right: 'swing' }))
    }
  }

  class ProceduralAnimation {
    constructor() {
      this.update = vi.fn()
    }
    getState() {
      return {
        torsoLean: 0,
        torsoTwist: 0,
        headBob: 0,
        hipSway: 0,
        leftArmSwing: 0,
        rightArmSwing: 0,
        leftElbowBend: 0,
        rightElbowBend: 0
      }
    }
  }

  class StickFigureRig {
    constructor() {
      this.group = {}
      this.setDebugVisible = vi.fn()
      this.applyPelvisOffset = vi.fn()
      this.applyLegIK = vi.fn()
      this.applyLandingCompression = vi.fn()
      this.updateDebugMarkers = vi.fn()
      this.applyAirbornePose = vi.fn()
      this.applyUpperBodyAnimation = vi.fn()
      this.syncToController = vi.fn()
      this.applyPose = vi.fn()
      this.getPose = vi.fn(() => ({}))
      this.getHipWorldPosition = vi.fn(() => ({ x: 0, y: 0, z: 0 }))
      this.getBoneWorldPositions = vi.fn(() => new Map())
      this.getFootWorldPosition = vi.fn(() => ({ x: 0, y: 0, z: 0 }))
      this.getJointNames = vi.fn(() => ['root'])
      this.getJointTransform = vi.fn(() => ({
        position: { x: 0, y: 0, z: 0 },
        localRotation: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }
      }))
      rigInstances.push(this)
    }
  }

  return {
    CharacterController,
    FootIKSystem,
    ProceduralAnimation,
    StickFigureRig,
    MovementMode,
    GaitType: { IDLE: 'idle', WALKING: 'walking', RUNNING: 'running' },
    BUILT_IN_POSE_PRESETS: []
  }
})

vi.mock('../camera/index.js', () => ({
  FollowCamera: class {
    constructor() {
      this.update = vi.fn()
      this.setOrbitLimits = vi.fn()
      this.setRotationSmoothing = vi.fn()
      this.setZoomSmoothing = vi.fn()
      this.setSmoothing = vi.fn()
      this.addYaw = vi.fn()
      this.addPitch = vi.fn()
      this.addPan = vi.fn()
      this.addDistance = vi.fn()
      this.resetOrbit = vi.fn()
    }
    getYaw() {
      return 0
    }
  }
}))

import { Canvas3D } from './Canvas3D.jsx'

describe('components/Canvas3D', () => {
  it('initializes engine, input, and rig', async () => {
    const { unmount } = render(<Canvas3D />)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(engineInstances[0].start).toHaveBeenCalled()
    expect(inputInstances[0].attach).toHaveBeenCalled()
    expect(rigInstances[0].setDebugVisible).toHaveBeenCalledWith(true, expect.any(Object))
    expect(rigInstances[0].setDebugVisible).toHaveBeenCalledWith(false, expect.any(Object))

    unmount()

    expect(engineInstances[0].stop).toHaveBeenCalled()
    expect(inputInstances[0].detach).toHaveBeenCalled()
  })
})
