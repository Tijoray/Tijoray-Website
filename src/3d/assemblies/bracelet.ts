/**
 * Bracelet-band assembly — the 3D strategy for the "bracelet" product type.
 *
 * Sibling to `pendant.ts`: the configurator and the cart thumbnail both use these
 * steps to (a) normalise the bracelet chain/band and find where its single gem
 * station sits, and (b) seat the chosen gem at that station.
 *
 * Unlike the pendant (which hangs a medallion from the chain's bottom-centre),
 * the bracelet mounts one gem at the FRONT-CENTRE of the band, facing the camera.
 *
 * Pure functions over three.js objects: they clone, transform, and return models
 * but do not touch the scene, refs, lights, or camera. The caller owns those.
 *
 * NOTE: the transform constants below are geometry-specific and tuned against the
 * real GLBs. Adjust them if the band/gem orientation or seating looks off.
 */
import * as THREE from 'three'
import type { Shape } from '../../data/catalog'

/** World-space size the band is normalised to (longest dimension). */
const BAND_TARGET_SIZE = 2.5

/**
 * The band GLB is authored as a ring in the XY plane (opening faces the camera, +Z).
 * Left flat, it would ring the gem in the SAME plane as the stone face — like a
 * pendant's chain. Rotating +90° about X lays the loop down horizontally so it
 * wraps INTO the screen (perpendicular to the stone face), the way a bracelet sits
 * on a wrist. This also brings the band's authored top — where the gem station
 * mounts — round to the front (+Z), which is exactly where the gem seats.
 * Matches GEM_FACING_ROTATION so band and gem stay a rigid, consistent unit.
 */
const BAND_ROTATION_X = Math.PI / 2

/** Depth nudge so the gem's setting overlaps the band rather than floating off it. */
const GEM_SEAT_DEPTH = 0.18

/**
 * Fine alignment nudges between the gem's jump-rings and the chain's two ends.
 * The gem is seated by its bounding-box back-face centre, but the authored
 * jump-rings sit slightly forward of (and above) that reference, so the chain
 * ends up sitting a touch low and in front of where the rings actually are.
 * These world-space offsets pull the gem down and back so the rings meet the
 * chain ends. Same GLB convention across all four shapes, so one pair fixes all.
 * Positive Y raises the gem; positive Z pushes it toward the camera.
 */
const GEM_NUDGE_Y = -0.009
const GEM_NUDGE_Z = -0.039

/**
 * Per-shape extra nudge, on top of the global one above. Most gems author their
 * jump-rings at the bezel's vertical centre, so the global nudge seats them on
 * the chain axis. The pear is a teardrop — its rings sit ~0.046 BELOW its
 * bounding-box centre — so seating it by that centre drops the rings under the
 * chain and the stone floats above the links. Raising the pear lifts its rings
 * back onto the chain axis (value tuned at the pear's GEM_SHAPE_SCALE). Shapes
 * not listed use only the global nudge.
 */
const GEM_SHAPE_NUDGE: Partial<Record<Shape, { y?: number; z?: number }>> = {
  pear: { y: 0.054 },
}

/**
 * Per-shape size correction. The chain's two end links sit a fixed distance
 * apart, and circle, heart and asscher are all authored so their jump-rings
 * reach ±0.48 (band units) and hook those links. The pear GLB is authored
 * smaller — rings at ±0.41 — so at the shared scale its rings hang inside
 * the chain ends with a visible gap. Scaling it up to its siblings' span also
 * brings its stone to a comparable size (it was the smallest of the four).
 */
const GEM_SHAPE_SCALE: Partial<Record<Shape, number>> = {
  pear: 1.18,
}

export interface PreparedBand {
  /** Cloned, rotated, scaled, and centred band model — ready to add to a scene. */
  bandModel: THREE.Group
  /** Uniform scale applied — the gem must use the same scale. */
  scale: number
  /** Front-centre of the band: where the gem station mounts. */
  attach: THREE.Vector3
}

/**
 * Clone the bracelet chain GLB, orient it, normalise its size, centre it at the
 * origin, and compute the front-centre attach point for the gem station.
 */
export function prepareBraceletChain(chainSrc: THREE.Group): PreparedBand {
  const bandModel = chainSrc.clone(true)
  bandModel.rotation.x = BAND_ROTATION_X
  bandModel.updateMatrixWorld(true)

  const box1   = new THREE.Box3().setFromObject(bandModel)
  const size1  = box1.getSize(new THREE.Vector3())
  const maxDim = Math.max(size1.x, size1.y, size1.z)
  const scale  = maxDim > 0 ? BAND_TARGET_SIZE / maxDim : 1
  bandModel.scale.setScalar(scale)
  bandModel.updateMatrixWorld(true)

  // Centre the band, then read the final bbox once for the attach point.
  const box2 = new THREE.Box3().setFromObject(bandModel)
  bandModel.position.sub(box2.getCenter(new THREE.Vector3()))
  bandModel.updateMatrixWorld(true)

  const box3 = new THREE.Box3().setFromObject(bandModel)
  // Front-centre: horizontally/vertically centred on the frontmost (+Z) face.
  const attach = new THREE.Vector3(
    (box3.min.x + box3.max.x) / 2,
    (box3.min.y + box3.max.y) / 2,
    box3.max.z,
  )

  return { bandModel, scale, attach }
}

/**
 * Clone a bracelet gem GLB, scale it to match the band, and seat its back face at
 * the band's front-centre attach point so the gem sits on the band facing forward.
 * Returns the positioned model.
 */
/**
 * The gem GLBs are authored "as worn" — the stone's flat face points up (+Y).
 * Rotating +90° about X tips that face toward the camera (+Z) so the customer
 * sees the stone straight on.
 */
const GEM_FACING_ROTATION = new THREE.Euler(Math.PI / 2, 0, 0)

export function prepareBraceletGem(
  gemSrc: THREE.Group,
  scale: number,
  attach: THREE.Vector3,
  shape?: Shape,
): THREE.Group {
  const gemModel = gemSrc.clone(true)
  gemModel.rotation.copy(GEM_FACING_ROTATION)
  gemModel.scale.setScalar(scale * ((shape && GEM_SHAPE_SCALE[shape]) ?? 1))
  gemModel.updateMatrixWorld(true)

  const gemBox  = new THREE.Box3().setFromObject(gemModel)
  const gemSize = gemBox.getSize(new THREE.Vector3())
  // The gem's back face centre — the point that meets the band.
  const gemBack = new THREE.Vector3(
    (gemBox.min.x + gemBox.max.x) / 2,
    (gemBox.min.y + gemBox.max.y) / 2,
    gemBox.min.z,
  )
  const offset = attach.clone().sub(gemBack)
  // Sink the gem slightly into the band so its setting overlaps rather than floats.
  offset.z -= gemSize.z * GEM_SEAT_DEPTH
  // Fine alignment so the gem's jump-rings meet the chain ends (see constants).
  offset.y += GEM_NUDGE_Y
  offset.z += GEM_NUDGE_Z
  // Per-shape correction for gems whose rings aren't at their bbox centre (pear).
  const shapeNudge = shape ? GEM_SHAPE_NUDGE[shape] : undefined
  if (shapeNudge) {
    offset.y += shapeNudge.y ?? 0
    offset.z += shapeNudge.z ?? 0
  }
  gemModel.position.add(offset)
  gemModel.updateMatrixWorld(true)

  return gemModel
}
