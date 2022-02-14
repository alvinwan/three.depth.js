# three.depth.js

Easily display and download depth maps for a `three.js` scene, using just a few lines of code. Includes built-in support for 360 depth maps and Aframe scenes. See [examples](https://alvinwan.com/three.depth.js/examples).

![preview](https://user-images.githubusercontent.com/2068077/153742846-6ae61a83-77d3-479e-ba59-a999c801f6d8.jpg)

## Getting Started

Add a script tag to bring in all `three.depth.js` utilities.

```html
<script src="https://cdn.jsdelivr.net/gh/alvinwan/three.depth.js@b37fb20/build/three.depth.js">
```

Then, display a depth map in 3 steps. Our custom `WebGLDepthExporter` is used just like a standard renderer.

```javascript
// 1. Initialize depth exporter
const depthExporter = new THREE.WebGLDepthExporter(renderer);

// 2. Update the depth exporter size
depthExporter.setSize(canvas.width, canvas.height);

// 3. Render depth to the canvas
depthExporter.setRenderTarget(null);
depthExporter.render(scene, camera);

// optionally, download the depth map
depthExporter.download(scene, camera);
```

See [example](https://alvinwan.com/three.depth.js/examples/download.html).

## Aframe Usage

We provide 3 different Aframe components out of the box:

- `download-depth-map-onload`: Downloads a 2d depth map as soon as the scene loads.
- `preview-depth-map`: Creates a depth map preview on top of the aframe scene.
- `download-depth-map`: Allows you to download depth maps in either 2d (`p`) or 3d (equirectangular, `space`)

You can specify the `packing` variable to be either `basic` or `rgba` (higher precision) for all components. For example,

```html
<a-scene download-depth-map-on-load="packing: rgba"
         download-depth-map="packing: rgba"
         preview-depth-map="packing: basic">
</a-scene>
```

See [example](https://alvinwan.com/three.depth.js/examples/aframe.html).

## 360 Depth Map Usage

To download 360 depth maps, render depth in all directions to a cube camera's render target. Then, conver the cubemap depth to equirectangular format, and download, as shown below:

```javascript
// 1. Initialize depth exporter
const cubeDepthExporter = new THREE.WebGLCubeDepthExporter(renderer);

// 2. Create cube camera to generate a cubmap of depths, tracking the original
// camera.
const cubeCamera = THREE.CubePerspectiveCamera.fromPerspectiveCamera(camera);
scene.add(cubeCamera); // !!IMPORTANT!! Do not forget. Otherwise, every face sees the same thing.

// 3. Update the depth exporter size
cubeDepthExporter.setSize(canvas.width, canvas.height);

// 4. Update camera intrinsics for export (extrinsics already up-to-date)
cubeCamera.updateIntrinsicsForExport();

// 5. Render depth in all directions to a cubemap
cubeDepthExporter.setRenderTarget(cubeCamera.renderTarget);
cubeDepthExporter.render(scene, cubeCamera);
cubeDepthExporter.setRenderTarget(null);

// 6. Download equirectangular depth map
const equi = new CubemapToEquirectangular(renderer, false);
equi.convert(cubeCamera);
```

See [example](https://alvinwan.com/three.depth.js/examples/download360.html).

## Examples

See these examples for working demos and annotated source code:

- [Hello World](https://alvinwan.com/three.depth.js/examples/basic.html) - basic 3 steps to extract depth from a scene
- [Download Depth Map](https://alvinwan.com/three.depth.js/examples/download.html) - download a depth map
- [Higher-Precision Depth](https://alvinwan.com/three.depth.js/examples/precision.html) - download a higher-precision depth map by packing depth into RGB
- [Download 360 Depth Map](https://alvinwan.com/three.depth.js/examples/download360.html) - download 360 depth map in equirectangular format
- [Aframe](https://alvinwan.com/three.depth.js/examples/aframe.html) - aframe hello world scene with both rectilinear and equirectangular depth map downloads

Preview all examples [here](https://alvinwan.com/three.depth.js/examples).

## How it Works

The technique to grab depth is used in the [official three.js examples](https://threejs.org/examples/?q=depth#webgl_depth_texture) and by [three.js pros](https://stackoverflow.com/a/58946651/4855984). This repository simply packages up that solution in an interface for you to use, but the idea is the same. 

The nice part is that three.js already computes the depth of each pixel, from a given camera, when rendering. However, the problem is that this depth is not directly accessible. Instead, (1) the depth texture can be rendered as a color texture in a second scene, and (2) that color texture can then be read.

1. The depth texture loses precision during the translation into discretized color values, so for higher precision ([example](https://alvinwan.com/three.depth.js/examples/precision.html)), you can use a base 256 representation for depth.

2. The color texture in your second scene is applied to a flat plane. The camera in this scene is an orthographic camera pointed at the flat plane. Once this second scene is rendered to a render target your choice, you then have a depth map to do whatever you want with!

## "Deploy"

```bash
rm -f build/three.depth.js
for files in js/{a,C,D}*.js js/WebGLDepthExporter.js js/WebGLCubeDepthExporter.js; do awk '{print $0}' ${files} >> build/three.depth.js; done;
```
