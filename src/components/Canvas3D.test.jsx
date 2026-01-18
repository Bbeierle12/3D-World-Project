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
  SimplePhysics: class {
    probeGround() {
      return { height: 0, normal: { x: 0, y: 1, z: 0 } }
    }
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
      this.getHipWorldPosition = vi.fn(() => ({ x: 0, y: 0, z: 0 }))
      rigInstances.push(this)
    }
  }

  return {
    CharacterController,
    FootIKSystem,
    ProceduralAnimation,
    StickFigureRig,
    MovementMode,
    GaitType: { IDLE: 'idle', WALKING: 'walking', RUNNING: 'running' }
  }
})

vi.mock('../camera/index.js', () => ({
  FollowCamera: class {
    constructor() {
      this.update = vi.fn()
    }
    getYaw() {
      return 0
    }
  }
}))

vi.mock('../dev/index.js', () => ({
  DevTools: class {
    constructor() {
      this.updateTelemetry = vi.fn()
      this.dispose = vi.fn()
    }
  }
}))

import { Canvas3D } from './Canvas3D.jsx'

describe('components/Canvas3D', () => {
  it('initializes engine, input, and rig', () => {
    const { unmount } = render(<Canvas3D />)

    expect(engineInstances[0].start).toHaveBeenCalled()
    expect(inputInstances[0].attach).toHaveBeenCalled()
    expect(rigInstances[0].setDebugVisible).toHaveBeenCalledWith(true, expect.any(Object))
    expect(rigInstances[0].setDebugVisible).toHaveBeenCalledWith(false, expect.any(Object))

    unmount()

    expect(engineInstances[0].stop).toHaveBeenCalled()
    expect(inputInstances[0].detach).toHaveBeenCalled()
  })
})
