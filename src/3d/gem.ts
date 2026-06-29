/**
 * Gemstone material system — the reusable core of the "gemstone" design
 * applicator (used by the Birthstone and Diamond collections).
 *
 * Extracted verbatim from ConfiguratorPage so both the interactive configurator
 * and future product types/collections share one gem-rendering implementation.
 * Behaviour is intentionally unchanged.
 */
import * as THREE from 'three'
import type { Shape } from '../data/catalog'
import { GEM_PROPS } from '../data/catalog'

// Gem mesh detection — matched against material name, mesh name, and parent node name.
export const GEM_NAME_RE = /garnet|amethyst|aquamarine|diamond|emerald|pearl|ruby|peridot|sapphire|tourmaline|citrine|turquoise|gem|stone|crystal/i

// Heart/pear gem meshes may have inconsistent normals due to how they're modelled
// as inset cavities. DoubleSide ensures correct glass rendering regardless of normal direction.
export const BEZEL_SHAPES = new Set<Shape>(['heart', 'pear'])

export function createGemMaterial(stoneIdx: number, shape: Shape | null = null): THREE.MeshPhysicalMaterial {
  const g = GEM_PROPS[stoneIdx]
  const inset = shape !== null && BEZEL_SHAPES.has(shape)

  const baseColor = new THREE.Color(g.color)

  // Heart/pear gems: the mesh face may have inconsistent normals (inward-pointing)
  // because the gem is modelled as an inset cavity. DoubleSide ensures both the
  // front and back glass surfaces contribute to the render, which restores the
  // glassy refraction/caustic look regardless of normal direction.
  // We also boost envMapIntensity so the IOR-driven surface reflections are vivid.
  return new THREE.MeshPhysicalMaterial({
    color:               baseColor,
    ior:                 g.ior,
    transmission:        g.transmission,
    thickness:           g.thickness,
    roughness:           g.roughness,
    metalness:           0,
    clearcoat:           g.clearcoat,
    clearcoatRoughness:  g.clearcoatRoughness,
    envMapIntensity:     inset ? g.envMapIntensity * 2.0 : g.envMapIntensity,
    attenuationColor:    new THREE.Color(g.attenuationColor),
    attenuationDistance: g.attenuationDistance,
    iridescence:         g.iridescence,
    iridescenceIOR:      g.iridescenceIOR,
    side:                inset ? THREE.DoubleSide : THREE.FrontSide,
  })
}
