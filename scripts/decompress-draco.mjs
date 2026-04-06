// Read Draco-compressed GLB and write it back uncompressed
// so gltfpack can then recompress with meshopt
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const [,, inputPath, outputPath] = process.argv
if (!inputPath || !outputPath) {
  console.error('Usage: node decompress-draco.mjs <input.glb> <output.glb>')
  process.exit(1)
}

// Only register the DECODER — writing back will produce uncompressed output
const decoderModule = await draco3d.createDecoderModule()

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
io.registerDependencies({ 'draco3d.decoder': decoderModule })

console.log('Reading…')
const doc = await io.read(inputPath)

// Drop the Draco extension so the writer doesn't try to re-encode
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose()
}

console.log('Writing uncompressed…')
await io.write(outputPath, doc)
console.log(`Done: ${outputPath}`)
