import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ASSETS } from '../lib/assets'

type Shape      = 'square' | 'circle' | 'heart' | 'pear'
type Metal      = 'steel' | 'silver' | '10k' | '18k'
type MetalColor = 'white' | 'gold' | 'rose'

const CHAIN_PATH = ASSETS.chain

const PENDANT_PATHS: Record<Shape, string> = {
  square: ASSETS.pendantSquare,
  circle: ASSETS.pendantCircle,
  heart:  ASSETS.pendantHeart,
  pear:   ASSETS.pendantPear,
}

const METAL_COLOR_HEX: Record<MetalColor, string> = {
  white: '#D0CFCD', gold: '#D4AF37', rose: '#C4786A',
}

const ROUGHNESS: Record<Metal, number> = {
  steel: 0.45, silver: 0.28, '10k': 0.28, '18k': 0.18,
}

const STEEL_COLOR = '#8A8A8A'

const GEM_PROPS = [
  { color: '#A01520', ior: 1.78, transmission: 0.70, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#C02030', attenuationDistance: 1.0  },
  { color: '#8B3FBB', ior: 1.54, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#A855CC', attenuationDistance: 1.5  },
  { color: '#7ECFE0', ior: 1.57, transmission: 0.93, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#A0E0EE', attenuationDistance: 3.0  },
  { color: '#E8EEFF', ior: 1.62, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#F0F2FF', attenuationDistance: 4.0  },
  { color: '#22873A', ior: 1.58, transmission: 0.62, thickness: 0.4, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05, attenuationColor: '#38A850', attenuationDistance: 0.8 },
  { color: '#F5EFE0', ior: 1.53, transmission: 0.00, thickness: 0.5, roughness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.10, attenuationColor: '#FFFFFF', attenuationDistance: 4.0 },
  { color: '#B80010', ior: 1.77, transmission: 0.68, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#D81828', attenuationDistance: 1.0  },
  { color: '#7DC040', ior: 1.67, transmission: 0.85, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#A8D868', attenuationDistance: 2.0  },
  { color: '#1840C0', ior: 1.77, transmission: 0.65, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#2858E0', attenuationDistance: 1.2  },
  { color: '#D85080', ior: 1.63, transmission: 0.80, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#F078A8', attenuationDistance: 1.8  },
  { color: '#D4980A', ior: 1.54, transmission: 0.86, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, attenuationColor: '#F0B820', attenuationDistance: 2.0  },
  { color: '#30AEAE', ior: 1.61, transmission: 0.00, thickness: 0.5, roughness: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.30, attenuationColor: '#FFFFFF', attenuationDistance: 4.0 },
] as const

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

      const isGem = GEM_RE.test(std.name) || GEM_RE.test(child.name)
        || (col.r < 0.12 && col.g < 0.12 && col.b < 0.12)

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

export default function PendantThumbnail({ shape, metal, metalColor, birthstoneIndex, size = 240 }: Props) {
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

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    loader.setMeshoptDecoder(MeshoptDecoder)

    let destroyed = false
    let chainGltf: THREE.Group | null = null
    let pendantGltf: THREE.Group | null = null

    const bodyColor = metal === 'steel'
      ? new THREE.Color(STEEL_COLOR)
      : new THREE.Color(METAL_COLOR_HEX[metalColor])
    const roughness = ROUGHNESS[metal]

    function tryRender() {
      if (!chainGltf || !pendantGltf || destroyed) return

      // ── Build scene mirroring configurator logic ──────────────────────────
      const chainModel = chainGltf.clone(true)
      chainModel.rotation.x = Math.PI / 2
      chainModel.updateMatrixWorld(true)

      const chainBox1  = new THREE.Box3().setFromObject(chainModel)
      const chainSize  = chainBox1.getSize(new THREE.Vector3())
      const maxDim     = Math.max(chainSize.x, chainSize.y, chainSize.z)
      const scale      = maxDim > 0 ? 2.5 / maxDim : 1
      chainModel.scale.setScalar(scale)
      chainModel.updateMatrixWorld(true)

      const chainBox2  = new THREE.Box3().setFromObject(chainModel)
      chainModel.position.sub(chainBox2.getCenter(new THREE.Vector3()))
      chainModel.updateMatrixWorld(true)

      const chainBox3  = new THREE.Box3().setFromObject(chainModel)
      const attachPt   = new THREE.Vector3(
        (chainBox3.min.x + chainBox3.max.x) / 2,
        chainBox3.min.y,
        (chainBox3.min.z + chainBox3.max.z) / 2,
      )

      const pendantModel = pendantGltf.clone(true)
      pendantModel.rotation.x = Math.PI / 2
      pendantModel.scale.setScalar(scale)
      pendantModel.updateMatrixWorld(true)

      // Position pendant bail at chain attach point
      const pendantBox  = new THREE.Box3().setFromObject(pendantModel)
      const pendantSize = pendantBox.getSize(new THREE.Vector3())
      const pendantTop  = new THREE.Vector3(
        (pendantBox.min.x + pendantBox.max.x) / 2,
        pendantBox.max.y,
        (pendantBox.min.z + pendantBox.max.z) / 2,
      )
      const offset = attachPt.clone().sub(pendantTop)
      offset.y += pendantSize.y * 0.21
      offset.z -= pendantSize.x * -0.05
      pendantModel.position.add(offset)
      pendantModel.updateMatrixWorld(true)

      applyMaterials(chainModel,   bodyColor, roughness, birthstoneIndex)
      applyMaterials(pendantModel, bodyColor, roughness, birthstoneIndex)

      scene.add(chainModel)
      scene.add(pendantModel)

      // Centre camera on the pendant medallion — chain drapes above and clips naturally
      const medalBox      = new THREE.Box3().setFromObject(pendantModel)
      const pendantCenter = medalBox.getCenter(new THREE.Vector3())
      const medalSize     = medalBox.getSize(new THREE.Vector3())
      const halfFov  = (camera.fov * Math.PI / 180) / 2
      const fitDist  = (Math.max(medalSize.x, medalSize.y) / 2) / Math.tan(halfFov) * 1.5
      camera.position.set(pendantCenter.x, pendantCenter.y, fitDist)
      camera.lookAt(pendantCenter.x, pendantCenter.y, 0)

      // Render a single frame — static screenshot
      renderer.render(scene, camera)

      // Tear down Three.js but keep the pixel data on the canvas
      envTexture.dispose()
      renderer.dispose()
      dracoLoader.dispose()
    }

    loader.load(CHAIN_PATH, (gltf) => {
      if (destroyed) return
      chainGltf = gltf.scene
      tryRender()
    })

    loader.load(PENDANT_PATHS[shape], (gltf) => {
      if (destroyed) return
      pendantGltf = gltf.scene
      tryRender()
    })

    return () => { destroyed = true }
  }, [shape, metal, metalColor, birthstoneIndex, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
