# Three.js Depth

Easily export depth maps from a three.js scene, using just a few lines of code. This is a more efficient alternative to replacing all materials in your scene with a `DepthMaterial`. Includes examples for:

- downloading depth maps
- exporting 360 depth maps in equirectangular format
- integrating with AFrame

![threejs.depth preview](https://user-images.githubusercontent.com/2068077/153713671-65a207a5-2e73-4db2-b7dd-d6f1a9c15093.jpg)

## Getting Started

First, include the source

```html
<script src="js/WebGLDepthExporter.js">
```

Then, export depth in 3 steps.

```javascript
...

// Initialize the usual stuff, along with a scene
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({canvas});

// 1. Initialize a depth exporter
const depthExporter = new THREE.WebGLDepthExporter(renderer);

// 2. Update the depth exporter size on init
depthExporter.setSize(canvas.width, canvas.height);

// 3. Render the depth map to canvas
depthExporter.setRenderTarget(null);
depthExporter.render(scene, camera);

// optionally, download the depth map
depthExporter.download(scene, camera);
```

See these examples for working demos and annotated source code:

- [Hello World](http://alvinwan.com/threejsdepth/examples/helloworld.html) - basic 3 steps to extract depth from a scene
- [Higher-Precision Depth](http://alvinwan.com/threejsdepth/examples/precision.html) - export a higher-precision depth using base 256 numbers encoded in RGB channels
- [Download Depth Map](http://alvinwan.com/threejs.depth/examples/export.html) - export and download a depth map
- [Download 360 Depth Map](http://alvinwan.com/threejsdepth/examples/export360.html) - export 360 depth using a cube camera and download an equirectangular depth map

## How it Works

The technique to grab depth is used in the [official three.js examples](https://threejs.org/examples/?q=depth#webgl_depth_texture) and by [three.js pros](https://stackoverflow.com/a/58946651/4855984). This repository simply packages up that solution in an interface for you to use, but the idea is the same. 

The nice part is that three.js already computes the depth of each pixel, from a given camera, when rendering. However, the problem is that this depth is not directly accessible. Instead, (1) the depth texture can be rendered as a color texture in a second scene, and (2) that color texture can then be read.

1. The depth texture loses precision during the translation into discretized color values, so for higher precision ([example](http://alvinwan.com/threejsdepth/examples/precision.html)), you can use a base 256 representation for depth.

2. The color texture in your second scene is applied to a flat plane. The camera in this scene is an orthographic camera pointed at the flat plane. Once this second scene is rendered to a render target your choice, you then have a depth map to do whatever you want with!

In the examples above, we show how to display this depth map ([example](http://alvinwan.com/threejsdepth/examples/helloworld.html)), download the depth map ([example](http://alvinwan.com/threejsdepth/examples/export.html)), and download a 360 depth map in equirectangular format ([example](http://alvinwan.com/threejsdepth/examples/export360.html))

