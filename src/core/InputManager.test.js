import { describe, expect, it } from 'vitest'
import { InputManager } from './InputManager.js'

describe('core/InputManager', () => {
  it('maps keys to actions and movement direction', () => {
    const input = new InputManager()
    input.attach()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))
    expect(input.isPressed('forward')).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }))
    const dir = input.getMovementDirection()
    expect(dir.x).toBeCloseTo(Math.SQRT1_2, 5)
    expect(dir.y).toBeCloseTo(Math.SQRT1_2, 5)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }))
    expect(input.isPressed('forward')).toBe(false)

    input.detach()
  })

  it('tracks justPressed events per action', () => {
    const input = new InputManager()
    input.attach()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }))
    expect(input.justPressed('debug')).toBe(true)
    expect(input.justPressed('debug')).toBe(false)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyV' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }))
    expect(input.justPressed('debug')).toBe(true)

    input.detach()
  })
})
