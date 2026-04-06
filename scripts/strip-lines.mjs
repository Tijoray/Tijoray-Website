import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

const [,, inputPath, outputPath] = process.argv
if (!inputPath || !outputPath) {
  console.error('Usage: node strip-lines.mjs <input.glb> <output.glb>')
  process.exit(1)
}

await MeshoptDecoder.ready
await MeshoptEncoder.ready

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
io.registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(inputPath)

let removed = 0
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    // GLTF modes: 0=POINTS 1=LINES 2=LINE_LOOP 3=LINE_STRIP 4=TRIANGLES(default)
    const mode = prim.getMode()
    if (mode !== 4 && mode !== undefined) {
      prim.dispose()
      removed++
    }
  }
  // Remove mesh if it now has no primitives
  if (mesh.listPrimitives().length === 0) mesh.dispose()
}

console.log(`Removed ${removed} non-triangle primitive(s)`)
await io.write(outputPath, doc)
console.log(`Written: ${outputPath}`)
