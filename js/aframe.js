function getAframeObject3Ds() {
    // Get threejs objects from aframe scene
    const renderer = this.el.renderer;
    const scene = this.el.sceneEl.object3D;
    const camera = document.querySelector('[camera]').getObject3D('camera');

    return {renderer, scene, camera};
}

AFRAME.registerComponent('download-depth-map', {
    schema: {
      downloadKey: {type: 'string', default: ' '},
      depthPacking: {type: 'string', default: 'basic'},
    },
    init: function() {
      const {renderer, scene, camera} = getAframeObject3Ds();
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