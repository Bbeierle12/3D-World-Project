import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { StickFigureRig } from './StickFigureRig.js'
import { DisposalTracker } from '../../utils/disposal.js'
import { MovementMode } from '../controller/MovementModes.js'

describe('character/rig/StickFigureRig', () => {
  it('builds required pivots and bones', () => {
    const rig = new StickFigureRig(new DisposalTracker())

    expect(rig.pivots.root).toBeDefined()
    expect(rig.pivots.spine).toBeDefined()
    expect(rig.pivots.leftUpperLeg).toBeDefined()
    expect(rig.pivots.rightUpperLeg).toBeDefined()
  })

  it('applies leg IK and upper body animation', () => {
    const rig = new StickFigureRig(new DisposalTracker())

    rig.applyLegIK('left', { upperAngle: 0.5, lowerAngle: 0.25 }, 1)
    expect(rig.pivots.leftUpperLeg.rotation.x).toBeCloseTo(0.5, 5)
    expect(rig.pivots.leftLowerLeg.rotation.x).toBeCloseTo(0.25, 5)

    rig.applyUpperBodyAnimation({
      torsoLean: 0.2,
      torsoTwist: 0.1,
      headBob: -0.05,
      hipSway: 0.03,
      leftArmSwing: 0.4,
      rightArmSwing: -0.4,
      leftElbowBend: -0.2,
      rightElbowBend: -0.2
    }, 1)

    expect(rig.pivots.spine.rotation.x).toBeCloseTo(0.2, 5)
    expect(rig.pivots.leftUpperArm.rotation.x).toBeCloseTo(0.4, 5)
  })

  it('applies airborne pose and debug markers', () => {
    const rig = new StickFigureRig(new DisposalTracker())
    const scene = new THREE.Scene()

    rig.setDebugVisible(true, scene)
    rig.updateDebugMarkers(
      { x: 1, y: 0, z: 2 },
      { x: 2, y: 0, z: 1 },
      'stance',
      'swing'
    )

    expect(rig.debugMarkers.leftFoot.position.x).toBeCloseTo(1, 5)
    expect(rig.debugMarkers.rightFoot.position.z).toBeCloseTo(1, 5)

    rig.applyAirbornePose(MovementMode.JUMPING, 1)
    expect(rig.pivots.leftUpperLeg.rotation.x).toBeGreaterThan(0.3)
  })

  it('computes hip world position', () => {
    const rig = new StickFigureRig(new DisposalTracker())
    const hip = rig.getHipWorldPosition('left', { x: 0, y: 0, z: 0 }, 0, 0)

    expect(hip.x).toBeLessThan(0)
    expect(hip.y).toBeCloseTo(rig.hipHeight, 5)
  })
})
