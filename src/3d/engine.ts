/**
 * Reusable, product-agnostic 3D engine primitives shared by every jewelry
 * renderer (the interactive configurator and the static cart/checkout thumbnail).
 *
 * Scene/lighting setups differ between contexts (the configurator uses an HDR
 * studio environment; the thumbnail uses a RoomEnvironment), so those stay with
 * each caller. What is genuinely identical — and lives here — is GLB loading.
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

/**
 * Create a GLTF loader wired with the project's DRACO + Meshopt decoders.
 * Call `dispose()` when done to release the DRACO worker pool.
 */
export function createGltfLoader(): { loader: GLTFLoader; dispose: () => void } {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)
  loader.setMeshoptDecoder(MeshoptDecoder)
  return { loader, dispose: () => dracoLoader.dispose() }
}
