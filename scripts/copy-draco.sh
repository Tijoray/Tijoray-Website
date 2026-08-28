#!/usr/bin/env bash
# Copies the Draco glTF decoder out of the three package into public/, so the
# configurator loads it from our own origin rather than gstatic.com.
# Re-run after upgrading three.
set -euo pipefail
cd "$(dirname "$0")/.."
src=node_modules/three/examples/jsm/libs/draco/gltf
mkdir -p public/assets/draco
cp "$src/draco_decoder.js" "$src/draco_decoder.wasm" "$src/draco_wasm_wrapper.js" public/assets/draco/
echo "Draco decoder copied to public/assets/draco/"
