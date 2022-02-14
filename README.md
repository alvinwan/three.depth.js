# Three.js Depth

Easily export depth maps from a three.js scene, using just a few lines of code. This is a more efficient alternative to replacing all materials in your scene with a `DepthMaterial`. Includes examples for:

- downloading depth maps
- exporting 360 depth maps in equirectangular format
- integrating with AFrame

![preview](https://user-images.githubusercontent.com/2068077/153742846-6ae61a83-77d3-479e-ba59-a999c801f6d8.jpg)

## Getting Started

Add a script tag to bring in all `three.depth.js` utilities.

```html
<script src="https://cdn.jsdelivr.net/gh/alvinwan/three.depth.js@51a2745/build/three.depth.js">
```

Then, export depth in 3 steps.

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

## Aframe Usage

We provide 3 different Aframe components out of the box:

- `download-depth-map-onload`: Downloads a 2d depth map as soon as the scene loads.
- `preview-depth-map`: Creates a depth map preview on top of the aframe scene.
- `download-depth-map`: Allows you to download depth maps in either 2d (`p`) or 3d (equirectangular, `space`)

You can specify the `packing` variable to be either `basic` or `rgba` (higher precision) for all components. 

## 360 Depth Map Usage

To download a 360 depth map in equirectangular format, follow the steps below.

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

## Examples

See these examples for working demos and annotated source code:

- [Hello World](http://alvinwan.com/threejs.depth/examples/basic.html) - basic 3 steps to extract depth from a scene
- [Higher-Precision Depth](http://alvinwan.com/threejs.depth/examples/precision.html) - export a higher-precision depth using base 256 numbers encoded in RGB channels
- [Download Depth Map](http://alvinwan.com/threejs.depth/examples/export.html) - export and download a depth map
- [Download 360 Depth Map](http://alvinwan.com/threejs.depth/examples/export360.html) - export 360 depth using a cube camera and download an equirectangular depth map
- [Aframe](http://alvinwan.com/threejs.depth/examples/aframe.html) - aframe hello world scene with both rectilinear and equirectangular depth map downloads

## How it Works

The technique to grab depth is used in the [official three.js examples](https://threejs.org/examples/?q=depth#webgl_depth_texture) and by [three.js pros](https://stackoverflow.com/a/58946651/4855984). This repository simply packages up that solution in an interface for you to use, but the idea is the same. 

The nice part is that three.js already computes the depth of each pixel, from a given camera, when rendering. However, the problem is that this depth is not directly accessible. Instead, (1) the depth texture can be rendered as a color texture in a second scene, and (2) that color texture can then be read.

1. The depth texture loses precision during the translation into discretized color values, so for higher precision ([example](http://alvinwan.com/threejs.depth/examples/precision.html)), you can use a base 256 representation for depth.

2. The color texture in your second scene is applied to a flat plane. The camera in this scene is an orthographic camera pointed at the flat plane. Once this second scene is rendered to a render target your choice, you then have a depth map to do whatever you want with!

In the examples above, we show how to display this depth map ([example](http://alvinwan.com/threejs.depth/examples/basic.html)), download the depth map ([example](http://alvinwan.com/threejs.depth/examples/export.html)), and download a 360 depth map in equirectangular format ([example](http://alvinwan.com/threejs.depth/examples/export360.html))

## "Deploy"

```
awk '{print $0}' js/*.js > build/three.depth.js
```