import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  addStudioLights,
  applyStudioEnvironment,
  configureStudioRenderer,
  BODY_ENV_INTENSITY,
  STUDIO_HDR_1K,
} from '../3d/environment'
import { createGltfLoader } from '../3d/engine'
import { prepareBraceletChain, prepareBraceletGem } from '../3d/assemblies/bracelet'
import { BRACELET_CHAIN_PATH, BRACELET_PATHS } from '../data/product-types'
import type { Shape, Metal, MetalColor } from '../data/catalog'
import {
  METAL_RENDER_HEX,
  ROUGHNESS,
  GEM_PROPS_THUMB as GEM_PROPS,
} from '../data/catalog'

const GEM_RE = /garnet|amethyst|aquamarine|diamond|emerald|pearl|ruby|peridot|sapphire|tourmaline|citrine|turquoise|gem|stone|crystal/i

function applyMaterials(
  group: THREE.Group,
  bodyColor: THREE.Color,
  roughness: number,
  gemIdx: number,
) {
  const g = GEM_PROPS[gemIdx]
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    mats.forEach((mat, idx) => {
      if (!mat) return
      const std = mat as THREE.MeshStandardMaterial
      const col = std.color ?? new THREE.Color(1, 1, 1)
      if (col.r < 0.3 && col.g > 0.45 && col.b > 0.45) { child.visible = false; return }

      // Gem placeholder colours differ across bracelet GLBs: circle/heart/pear are
      // near-black, asscher is desaturated green. No metal finish is green-dominant,
      // so near-black OR green-dominant reliably marks the gem.
      const isGem = GEM_RE.test(std.name) || GEM_RE.test(child.name)
        || (col.r < 0.12 && col.g < 0.12 && col.b < 0.12)
        || (col.g > col.r && col.g > col.b)

      if (isGem) {
        const gemMat = new THREE.MeshPhysicalMaterial({
          color:               new THREE.Color(g.color),
          ior:                 g.ior,
          transmission:        g.transmission,
          thickness:           g.thickness,
          roughness:           g.roughness,
          metalness:           0,
          clearcoat:           g.clearcoat,
          clearcoatRoughness:  g.clearcoatRoughness,
          attenuationColor:    new THREE.Color(g.attenuationColor),
          attenuationDistance: g.attenuationDistance,
          envMapIntensity:     4.0,
        })
        if (Array.isArray(child.material)) child.material[idx] = gemMat
        else child.material = gemMat
      } else {
        std.color.set(bodyColor)
        std.metalness      = 1.0
        std.roughness      = roughness
        std.envMapIntensity = BODY_ENV_INTENSITY
        std.needsUpdate    = true
      }
    })
  })
}

type Props = {
  shape:           Shape
  metal:           Metal
  metalColor:      MetalColor
  birthstoneIndex: number
  size?:           number
}

export default function BraceletThumbnail({ shape, metal, metalColor, birthstoneIndex, size = 240 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(size, size, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    configureStudioRenderer(renderer)

    const scene = new THREE.Scene()
    addStudioLights(scene)

    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100)

    const { loader, dispose: disposeLoader } = createGltfLoader()

    let destroyed = false
    let chainGltf: THREE.Group | null = null
    let gemGltf: THREE.Group | null = null
    // The thumbnail is a single frame, so it waits for the environment too. A
    // failed HDR fetch still renders (flat, but present) rather than blank.
    let envReady = false
    let disposeEnv: (() => void) | null = null

    const bodyColor = new THREE.Color(METAL_RENDER_HEX[metalColor])
    const roughness = ROUGHNESS[metal]

    function tryRender() {
      if (!chainGltf || !gemGltf || !envReady || destroyed) return

      // ── Build scene using the shared bracelet assembly ────────────────────
      const { bandModel, scale, attach } = prepareBraceletChain(chainGltf)
      const gemModel = prepareBraceletGem(gemGltf, scale, attach, shape)

      applyMaterials(bandModel, bodyColor, roughness, birthstoneIndex)
      applyMaterials(gemModel,  bodyColor, roughness, birthstoneIndex)

      scene.add(bandModel)
      scene.add(gemModel)

      // Frame the whole bracelet — band ring + gem station — so the chain is
      // visible (unlike the pendant, the band wraps at the gem's level, so
      // framing on the gem alone would crop it away).
      const box    = new THREE.Box3().setFromObject(bandModel).expandByObject(gemModel)
      const center = box.getCenter(new THREE.Vector3())
      const size   = box.getSize(new THREE.Vector3())
      const halfFov = (camera.fov * Math.PI / 180) / 2
      const fitDist = (Math.max(size.x, size.y) / 2) / Math.tan(halfFov) * 1.12
      camera.position.set(center.x, center.y, fitDist)
      camera.lookAt(center.x, center.y, 0)

      // Render a single frame — static screenshot
      renderer.render(scene, camera)

      // Tear down Three.js but keep the pixel data on the canvas
      disposeEnv?.()
      renderer.dispose()
      disposeLoader()
    }

    applyStudioEnvironment(renderer, scene, STUDIO_HDR_1K)
      .then((dispose) => {
        if (destroyed) { dispose(); return }
        disposeEnv = dispose
      })
      .catch((err) => console.error('[Tijoray Thumbnail] HDR load error:', err))
      .finally(() => { envReady = true; tryRender() })

    loader.load(BRACELET_CHAIN_PATH, (gltf) => {
      if (destroyed) return
      chainGltf = gltf.scene
      tryRender()
    })

    loader.load(BRACELET_PATHS[shape], (gltf) => {
      if (destroyed) return
      gemGltf = gltf.scene
      tryRender()
    })

    return () => { destroyed = true }
  }, [shape, metal, metalColor, birthstoneIndex, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}
