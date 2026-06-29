/**
 * The two plug-points of the jewelry 3D engine.
 *
 * The engine (renderer, lights, HDR, loop, orbit controls, metal materials) is
 * product-agnostic. Everything that varies by product is expressed through one
 * of these two strategies:
 *
 *   • AssemblyStrategy  — varies by PRODUCT TYPE (pendant, bracelet, ring).
 *     Owns which GLB parts to load, how to position/scale them relative to one
 *     another, where to aim the camera, and which meshes are the "design slots"
 *     (where a gem/glyph goes) vs the metal body.
 *
 *   • DesignApplicator  — varies by COLLECTION (birthstone, diamond, initial).
 *     Given the design slots and the customer's chosen variant, it realises the
 *     design: tint a gem (gemstone collections) or swap in a letter glyph
 *     (initial collection). Metal application is handled by the shared engine.
 *
 * A configurator instance = one AssemblyStrategy (its product type) composed with
 * one DesignApplicator (its collection). This is the seam that lets the Diamond
 * collection render as both a pendant and a bracelet, and lets a pendant host
 * both a gemstone and an engraved letter, with no engine changes.
 */
import type * as THREE from 'three'

/** The result of assembling a product's meshes into the scene. */
export interface AssembledModel {
  /** Root group added to the scene (pendant pivot, bracelet band, etc.). */
  root:        THREE.Group
  /** Meshes that take the metal material (colour/roughness driven by metal choice). */
  bodyMeshes:  THREE.Mesh[]
  /** Meshes that host the design (gem cavity, letter plate, …). */
  designSlots: THREE.Mesh[]
}

export interface AssemblyContext {
  scene:    THREE.Scene
  camera:   THREE.PerspectiveCamera
}

/** Per-product-type strategy: how to build and frame this physical form. */
export interface AssemblyStrategy {
  id: string
  /** GLB urls this assembly needs (body parts, chain, band, …). */
  parts(form: Record<string, string>): string[]
  /** Compose loaded GLBs into the scene and report body/design meshes. */
  assemble(loaded: THREE.Group[], ctx: AssemblyContext): AssembledModel
  /** Aim the camera + orbit target at this form's focal point. */
  frameCamera(model: AssembledModel, ctx: AssemblyContext): { target: THREE.Vector3 }
}

/** Per-collection strategy: how the chosen design variant is realised on the slots. */
export interface DesignApplicator {
  id: string
  /** Apply the variant (stone index, letter, …) to the design slot meshes. */
  apply(slots: THREE.Mesh[], variant: string | number, form: Record<string, string>): void
  /** Cheap in-place update when only the variant changes (no reload). */
  update(slots: THREE.Mesh[], variant: string | number, form: Record<string, string>): void
}
