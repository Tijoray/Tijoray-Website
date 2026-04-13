// Pre-optimization script for heart/pear pendants.
// Identifies the bail cabochon by Y-position (it sits highest in the scene)
// and assigns it a distinct "Bail_Gem" material so the gltf-transform `join`
// step does not merge it with the main gem stone.
//
// Usage: node scripts/mark-bail-gem.mjs <input.glb> <output.glb>

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const [,, inputPath, outputPath] = process.argv
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/mark-bail-gem.mjs <input.glb> <output.glb>')
  process.exit(1)
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc  = await io.read(inputPath)

// Gem detection: same dark-red heuristic used in the Three.js configurator.
// Base color factor is linear — r>0.2, g<0.1, b<0.1 catches all gem reds/crimson.
function isGemMaterial(mat) {
  if (!mat) return false
  const [r, g, b] = mat.getBaseColorFactor()
  return r > 0.2 && g < 0.1 && b < 0.1
}

// For each node that has gem primitives, compute the average Y of all vertices
// in local space (plus the node's own Y translation for world approximation).
const gemNodes = []
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh()
  if (!mesh) continue

  let isGem = false
  let totalY = 0
  let count  = 0

  for (const prim of mesh.listPrimitives()) {
    if (!isGemMaterial(prim.getMaterial())) continue
    isGem = true
    const pos = prim.getAttribute('POSITION')
    if (!pos) continue
    const tmp = [0, 0, 0]
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, tmp)
      totalY += tmp[1]
      count++
    }
  }

  if (isGem && count > 0) {
    const nodeY = (node.getTranslation() ?? [0, 0, 0])[1]
    gemNodes.push({ node, avgY: totalY / count + nodeY })
  }
}

console.log(`Found ${gemNodes.length} gem node(s):`)
gemNodes.sort((a, b) => b.avgY - a.avgY)
gemNodes.forEach((g, i) => {
  const prims = g.node.getMesh()?.listPrimitives().length ?? 0
  console.log(`  [${i}] avgY=${g.avgY.toFixed(4)}  prims=${prims}  node="${g.node.getName()}"`)
})

if (gemNodes.length < 2) {
  console.log('Only one gem group found — no bail marking needed.')
} else {
  const bail    = gemNodes[0]
  const srcMat  = bail.node.getMesh().listPrimitives()[0].getMaterial()

  // Clone the source material under the new name so all other properties
  // (roughness, metalness, etc.) are preserved — just the name differs.
  const bailMat = doc.createMaterial('Bail_Gem')
  if (srcMat) {
    bailMat.setBaseColorFactor(srcMat.getBaseColorFactor())
    bailMat.setRoughnessFactor(srcMat.getRoughnessFactor())
    bailMat.setMetallicFactor(srcMat.getMetallicFactor())
    bailMat.setDoubleSided(srcMat.getDoubleSided())
    bailMat.setAlphaMode(srcMat.getAlphaMode())
  }

  for (const prim of bail.node.getMesh().listPrimitives()) {
    prim.setMaterial(bailMat)
  }

  console.log(`✔ Bail gem marked: node="${bail.node.getName()}" avgY=${bail.avgY.toFixed(4)}`)
}

await io.write(outputPath, doc)
console.log(`Written: ${outputPath}`)
