import { describe, expect, it, vi } from 'vitest'
import { Engine } from './Engine.js'

describe('core/Engine', () => {
  it('updates systems and calls render', () => {
    const raf = vi.fn()
    const caf = vi.fn()
    globalThis.requestAnimationFrame = raf
    globalThis.cancelAnimationFrame = caf

    const engine = new Engine()
    const update = vi.fn()
    engine.addSystem({ update })

    const render = vi.fn()
    engine.setRenderCallback(render)

    engine.isRunning = true
    engine.lastTime = 0

    engine.loop(1000)

    expect(raf).toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0]).toBeCloseTo(0.1, 5)
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('skips updates when paused but still renders', () => {
    globalThis.requestAnimationFrame = vi.fn()

    const engine = new Engine()
    const update = vi.fn()
    const render = vi.fn()

    engine.addSystem({ update })
    engine.setRenderCallback(render)
    engine.isRunning = true
    engine.isPaused = true
    engine.lastTime = 0

    engine.loop(1000)

    expect(update).not.toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('starts and stops the loop', () => {
    const raf = vi.fn(() => 123)
    const caf = vi.fn()
    globalThis.requestAnimationFrame = raf
    globalThis.cancelAnimationFrame = caf

    const engine = new Engine()
    engine.start()

    expect(engine.isRunning).toBe(true)
    expect(raf).toHaveBeenCalled()

    engine.stop()
    expect(engine.isRunning).toBe(false)
    expect(caf).toHaveBeenCalledWith(123)
  })
})
