import { describe, expect, it } from 'vitest'
import { SkeletonBuilder } from './SkeletonBuilder.js'
import { createCharacterMaterials } from './materials.js'
import { DisposalTracker } from '../../utils/disposal.js'

describe('character/rig/SkeletonBuilder', () => {
  it('creates joints, limbs, pivots, and debug markers', () => {
    const tracker = new DisposalTracker()
    const materials = createCharacterMaterials(tracker)
    const builder = new SkeletonBuilder(materials, tracker)

    const joint = builder.createJoint(0.5)
    const limb = builder.createLimb(2, 0.2)
    const pivot = builder.createPivot('root')
    const marker = builder.createDebugMarker(materials.debugStance)

    expect(joint.castShadow).toBe(true)
    expect(limb.position.y).toBe(-1)
    expect(pivot.name).toBe('root')
    expect(marker.material).toBe(materials.debugStance)
    expect(tracker.geometries.length).toBeGreaterThan(0)
  })
})
