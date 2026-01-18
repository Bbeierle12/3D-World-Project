import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { TerrainHeightmap } from './TerrainHeightmap.js'
import { TerrainMesh } from './TerrainMesh.js'
import { DisposalTracker } from '../utils/disposal.js'

describe('terrain/TerrainMesh', () => {
  it('builds mesh using heightmap and tracks resources', () => {
    const heightmap = new TerrainHeightmap(10, 2)
    const tracker = new DisposalTracker()
    const terrain = new TerrainMesh(heightmap, tracker)

    expect(tracker.geometries).toHaveLength(1)
    expect(tracker.materials).toHaveLength(1)

    const positions = terrain.mesh.geometry.attributes.position
    expect(positions.count).toBe(heightmap.heights.length)
    expect(positions.getZ(0)).toBe(heightmap.heights[0])
    expect(positions.getZ(positions.count - 1)).toBe(heightmap.heights[positions.count - 1])
  })

  it('adds and removes mesh and grid to scene', () => {
    const heightmap = new TerrainHeightmap(10, 2)
    const tracker = new DisposalTracker()
    const terrain = new TerrainMesh(heightmap, tracker)
    const scene = new THREE.Scene()

    terrain.addToScene(scene)
    expect(scene.children).toContain(terrain.mesh)
    expect(scene.children).toContain(terrain.grid)

    terrain.removeFromScene(scene)
    expect(scene.children).not.toContain(terrain.mesh)
    expect(scene.children).not.toContain(terrain.grid)
  })
})
