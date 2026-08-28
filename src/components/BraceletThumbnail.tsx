import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createGltfLoader } from '../3d/engine'
import { prepareBraceletChain, prepareBraceletGem } from '../3d/assemblies/bracelet'
import { BRACELET_CHAIN_PATH, BRACELET_PATHS } from '../data/product-types'
import type { Shape, Metal, MetalColor } from '../data/catalog'
import {
  METAL_COLOR_HEX,
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
        std.envMapIntensity = 3.0
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
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    const scene = new THREE.Scene()
    scene.environment = envTexture

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const key = new THREE.DirectionalLight(0xfff8f0, 2.0)
    key.position.set(1.5, 3, 2)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.8)
    fill.position.set(-2, 0, -1)
    scene.add(fill)

    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100)

    const { loader, dispose: disposeLoader } = createGltfLoader()

    let destroyed = false
    let chainGltf: THREE.Group | null = null
    let gemGltf: THREE.Group | null = null

    const bodyColor = new THREE.Color(METAL_COLOR_HEX[metalColor])
    const roughness = ROUGHNESS[metal]

    function tryRender() {
      if (!chainGltf || !gemGltf || destroyed) return

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
      envTexture.dispose()
      renderer.dispose()
      disposeLoader()
    }

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
