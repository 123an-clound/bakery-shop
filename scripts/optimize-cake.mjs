import fs from "node:fs/promises";
import path from "node:path";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const input = process.argv[2] ?? "public/models/cake/cake.fbx";
const output = process.argv[3] ?? "public/models/cake/cake.glb";
const source = await fs.readFile(input);
const sourceBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const extension = path.extname(input).toLowerCase();
const object =
  extension === ".glb" || extension === ".gltf"
    ? await new Promise((resolve, reject) => {
        const resourcePath = `${path.dirname(input).replace(/\\/g, "/")}/`;
        new GLTFLoader().parse(sourceBuffer, resourcePath, (gltf) => resolve(gltf.scene), reject);
      })
    : new FBXLoader().parse(sourceBuffer, "");
const exporter = new GLTFExporter();
const glb = await new Promise((resolve, reject) => {
  exporter.parse(object, resolve, reject, { binary: true, onlyVisible: true });
});
await fs.writeFile(output, Buffer.from(glb));
console.log(`Wrote ${output}`);
