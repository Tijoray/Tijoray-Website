/**
 * Pendant-on-chain assembly — the 3D strategy for the "pendant" product type.
 *
 * These are the exact geometry steps the configurator and the cart thumbnail
 * both use to (a) normalise the chain and find where a pendant should hang, and
 * (b) align a pendant's bail to that point. Extracted verbatim so the two
 * renderers — and any future pendant-based collection — share one implementation.
 *
 * Pure functions over three.js objects: they clone, transform, and return models
 * but do not touch the scene, refs, lights, or camera. The caller owns those.
 */
import * as THREE from 'three'

/** World-space size the chain is normalised to (longest dimension). */
const CHAIN_TARGET_SIZE = 2.5

export interface PreparedChain {
  /** Cloned, rotated, scaled, and centred chain model — ready to add to a scene. */
  chainModel: THREE.Group
  /** Uniform scale applied — the pendant must use the same scale. */
  scale: number
  /** Bottom-centre of the chain: where the pendant bail attaches. */
  attach: THREE.Vector3
}

/**
 * Clone the chain GLB, stand it upright, normalise its size, centre it at the
 * origin, and compute the bottom-centre attach point for the pendant.
 */
export function prepareChain(chainSrc: THREE.Group): PreparedChain {
  const chainModel = chainSrc.clone(true)
  chainModel.rotation.x = Math.PI / 2
  chainModel.updateMatrixWorld(true)

  const box1   = new THREE.Box3().setFromObject(chainModel)
  const size1  = box1.getSize(new THREE.Vector3())
  const maxDim = Math.max(size1.x, size1.y, size1.z)
  const scale  = maxDim > 0 ? CHAIN_TARGET_SIZE / maxDim : 1
  chainModel.scale.setScalar(scale)
  chainModel.updateMatrixWorld(true)

  // Centre the chain, then read the final bbox once for the attach point.
  const box2 = new THREE.Box3().setFromObject(chainModel)
  chainModel.position.sub(box2.getCenter(new THREE.Vector3()))
  chainModel.updateMatrixWorld(true)

  const box3 = new THREE.Box3().setFromObject(chainModel)
  const attach = new THREE.Vector3(
    (box3.min.x + box3.max.x) / 2,
    box3.min.y,
    (box3.min.z + box3.max.z) / 2,
  )

  return { chainModel, scale, attach }
}

/**
 * Clone a pendant GLB, stand it upright, scale it to match the chain, and align
 * its top-centre (bail) to the chain's attach point. Returns the positioned model.
 */
export function preparePendant(
  pendantSrc: THREE.Group,
  scale: number,
  attach: THREE.Vector3,
): THREE.Group {
  const pendantModel = pendantSrc.clone(true)
  pendantModel.rotation.x = Math.PI / 2
  pendantModel.scale.setScalar(scale)
  pendantModel.updateMatrixWorld(true)

  const pendantBox  = new THREE.Box3().setFromObject(pendantModel)
  const pendantSize = pendantBox.getSize(new THREE.Vector3())
  const pendantTop  = new THREE.Vector3(
    (pendantBox.min.x + pendantBox.max.x) / 2,
    pendantBox.max.y,
    (pendantBox.min.z + pendantBox.max.z) / 2,
  )
  const offset = attach.clone().sub(pendantTop)
  offset.y += pendantSize.y * 0.21
  offset.z += pendantSize.x * 0.05
  pendantModel.position.add(offset)
  pendantModel.updateMatrixWorld(true)

  return pendantModel
}
