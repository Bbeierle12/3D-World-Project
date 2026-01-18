import { describe, expect, it, vi } from 'vitest'
import { DisposalTracker } from './disposal.js'

describe('utils/disposal', () => {
  it('tracks and disposes resources', () => {
    const tracker = new DisposalTracker()
    const geometry = { dispose: vi.fn() }
    const material = { dispose: vi.fn() }
    const texture = { dispose: vi.fn() }
    const target = { dispose: vi.fn() }

    tracker.trackGeometry(geometry)
    tracker.trackMaterial(material)
    tracker.trackTexture(texture)
    tracker.trackRenderTarget(target)

    tracker.dispose()

    expect(geometry.dispose).toHaveBeenCalledTimes(1)
    expect(material.dispose).toHaveBeenCalledTimes(1)
    expect(texture.dispose).toHaveBeenCalledTimes(1)
    expect(target.dispose).toHaveBeenCalledTimes(1)
    expect(tracker.geometries).toHaveLength(0)
    expect(tracker.materials).toHaveLength(0)
  })
})
