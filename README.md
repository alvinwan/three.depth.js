# threejs.depth

Makes depth map export from threeJS simple, using just a few lines of code:

```javascript
// Initialize the usual stuff, along with a scene
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({canvas});
...

// 1. Initialize a depth exporter
const depthExporter = new THREE.WebGLDepthExporter(renderer);

function render() {
    // 2. Render depth to your desired render target.
    // In this example, we render to canvas.
    depthExporter.setRenderTarget(null);
    depthExporter.render(scene, camera);
}
...

// 3. Update the depth exporter size on init and window resize
depthExporter.setSize(canvas.width, canvas.height);
```

See these examples for working demos and annotated source code:

- [Hello World](http://alvinwan.com/threejs.depth/examples/helloworld.html)
- [Higher-Precision Depth](http://alvinwan.com/threejs.depth/examples/precision.html)
- [Export Depth](http://alvinwan.com/threejs.depth/examples/export.html)
- [Download 360 Depth](http://alvinwan.com/threejs.depth/examples/export360.html)

## How it Works

The technique to grab depth is used in the [official three.js examples](https://threejs.org/examples/?q=depth#webgl_depth_texture) and by [three.js pros](https://stackoverflow.com/a/58946651/4855984). This repository simply packages up that solution in an interface for you to use, but the idea is the same. 

The nice part is that three.js already computes the depth of each pixel, from a given camera, when rendering. However, the problem is that this depth is not directly accessible. Instead, (1) the depth texture can be rendered as a color texture in a second scene, and (2) that color texture can then be read.

    1. The depth texture loses precision during the translation into discretized color values, so for higher precision ([example](http://alvinwan.com/threejs.depth/examples/precision.html)), you can use a base 256 representation for depth.

    2. The color texture in your second scene is applied to a flat plane. The camera in this scene is an orthographic camera pointed at the flat plane. Once this second scene is rendered to a render target your choice, you then have a depth map to do whatever you want with!


