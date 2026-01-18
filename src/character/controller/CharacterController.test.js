import { describe, expect, it } from 'vitest'
import { CharacterController } from './CharacterController.js'
import { MovementMode } from './MovementModes.js'
import { CHARACTER } from '../../config/character.js'

const createPhysics = () => ({
  probeGround: () => ({ height: 0, normal: { x: 0, y: 1, z: 0 } })
})

describe('character/controller/CharacterController', () => {
  it('grounds on flat terrain and remains idle without input', () => {
    const controller = new CharacterController(createPhysics())
    controller.position.y = 0

    controller.update(0.016, 0)

    expect(controller.isGrounded).toBe(true)
    expect(controller.gait).toBe('idle')
  })

  it('accelerates toward desired velocity and updates facing', () => {
    const controller = new CharacterController(createPhysics())
    controller.position.y = 0

    controller.setInput({ x: 0, y: 1 }, false, false)
    controller.update(0.1, 0)

    expect(controller.velocity.z).toBeLessThan(0)
    expect(controller.velocity.z).toBeGreaterThan(-CHARACTER.GROUND_ACCEL * 0.1 - 0.01)
    expect(controller.facing).toBeCloseTo(1, 2)
  })

  it('initiates a jump when grounded', () => {
    const controller = new CharacterController(createPhysics())
    controller.position.y = 0

    controller.setInput({ x: 0, y: 0 }, false, true)
    controller.update(0.016, 0)

    expect(controller.movementMode).toBe(MovementMode.JUMPING)
    expect(controller.velocity.y).toBeGreaterThan(0)
    expect(controller.jumpConsumed).toBe(true)
  })

  it('enters landing state when falling onto ground', () => {
    const controller = new CharacterController(createPhysics())
    controller.position.y = 0
    controller.velocity.y = -1
    controller.isGrounded = false
    controller.movementMode = MovementMode.FALLING

    controller.update(0.016, 0)

    expect(controller.movementMode).toBe(MovementMode.LANDING)
    expect(controller.landingTimer).toBeCloseTo(CHARACTER.LANDING_DURATION - 0.016, 5)
  })

  it('snaps below-ground position back to ground', () => {
    const controller = new CharacterController(createPhysics())
    controller.position.y = -2
    controller.velocity.y = -5

    controller.update(0.016, 0)

    expect(controller.position.y).toBe(0)
    expect(controller.velocity.y).toBe(0)
  })
})
