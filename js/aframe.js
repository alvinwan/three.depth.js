function getAframeObject3Ds(el) {
    // Get threejs objects from aframe scene
    const renderer = el.renderer;
    const scene = el.sceneEl.object3D;
    const camera = document.querySelector('[camera]').getObject3D('camera');

    return {renderer, scene, camera};
}

AFRAME.registerComponent('download-depth-map', {
    schema: {
      downloadKey: {type: 'string', default: ' '},
      depthPacking: {type: 'string', default: 'basic'},
    },
    init: function() {
      const {renderer, scene, camera} = getAframeObject3Ds(this.el);
      const packing = this.data.depthPacking == 'basic' ? THREE.BasicDepthPacking : THREE.RGBADepthPacking;
      
      // 1. Initialize depth exporter
      const depthExporter = new THREE.WebGLDepthExporter(renderer, {packing});

      // 2. Update the depth exporter size
      const canvas = renderer.domElement;
      depthExporter.setSize(canvas.width, canvas.height);

      // 3. Download depth map on key press
      const downloadKey = this.data.downloadKey;
      document.addEventListener('keypress', function(e) {
        if (e.key == downloadKey) {
          depthExporter.download(scene, camera);
        }
      });
    },
});

AFRAME.registerComponent('download-360-depth-map', {
    schema: {
        downloadKey: {type: 'string', default: ' '},
        depthPacking: {type: 'string', default: 'basic'},
    },
    init: function() {
        let {renderer, scene, camera} = getAframeObject3Ds(this.el);
        const packing = this.data.depthPacking == 'basic' ? THREE.BasicDepthPacking : THREE.RGBADepthPacking;

        // 1. Initialize depth exporter
        const cubeDepthExporter = new THREE.WebGLCubeDepthExporter(renderer, {packing});

        // 2. Update the depth exporter size
        const canvas = renderer.domElement;
        cubeDepthExporter.setSize(canvas.width, canvas.height);

        // 3. Create a cube camera tracking the aframe camera
        const cubeCamera = THREE.WebGLCubeDepthExporter.cubeCameraFromPerspectiveCamera(camera);

        // Download depth map on key press
        const downloadKey = this.data.downloadKey;
        document.addEventListener('keypress', function(e) {
            if (e.key == downloadKey) {
                // 4. Update cube camera to match aframe camera
                THREE.WebGLCubeDepthExporter.cubeCameraTrackPerspectiveCamera(cubeCamera, camera);

                // 5. Render depth in all directions to a cubemap
                cubeDepthExporter.setRenderTarget(cubeCamera.renderTarget);
                cubeDepthExporter.render(scene, cubeCamera);
                cubeDepthExporter.setRenderTarget(null);

                // 6. Run cubemap to equirectangular conversion
                const equi = new CubemapToEquirectangular( renderer, false );
                equi.convert(cubeCamera);
            }
        });
    }
});

function cubeCameraTrackPerspective(cubeCamera, perspectiveCamera) {
    const position = perspectiveCamera.position;
    const up = perspectiveCamera.up;
    const quaternion = perspectiveCamera.quaternion;
    cubeCamera.position.copy(position);
    cubeCamera.up.copy(up);
    cubeCamera.quaternion.copy(quaternion);
}