function registerThreeDepthJsAframeComponents() {
  DEPTH_PACKING = {
    rgba: THREE.RGBADepthPacking,
    basic: THREE.BasicDepthPacking,
  }

  // Grab default three.js objects from Aframe
  function getAframeObject3Ds(el) {
      const renderer = el.renderer;
      const scene = el.sceneEl.object3D;
      const camera = document.querySelector('[camera]').getObject3D('camera');

      return {renderer, scene, camera};
  } 

  AFRAME.registerComponent('download-depth-map-on-load', {
      schema: {
        packing: {type: 'string', default: 'basic'},
      },
      init: function() {
        // Grab default three.js objects from Aframe
        let {renderer, scene, camera} = getAframeObject3Ds(this.el);
        let {packing} = this.data;

        // 1. Initialize depth exporter
        packing = DEPTH_PACKING[packing];
        this.depthExporter = new THREE.WebGLDepthExporter(renderer, {packing});

        // 2. Update the depth exporter size
        let canvas = renderer.domElement;
        this.depthExporter.setSize(canvas.width, canvas.height);

        // 3. Download depth map on key press
        this.depthExporter.download(scene, camera);
      },
  });

  AFRAME.registerComponent('preview-depth-map', {
    schema: {
      packing: {type: 'string', default: 'basic'},
      toggleKey: {type: 'string', default: 'c'},
      id: {type: 'string', default: '#debug'},
    },
    init: function() {
      // Grab default three.js objects from Aframe
      let {renderer, scene, camera} = getAframeObject3Ds(this.el);
      let {packing, toggleKey, id} = this.data;

      const aframeCanvas = renderer.domElement;

      // Create a canvas
      const canvas = document.createElement( 'canvas' );
      canvas.setAttribute('id', id);
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '10';
      document.body.appendChild(canvas); // Append to body

      // Initialize renderer with the current canvas
      renderer = new THREE.WebGLRenderer({canvas}); // replace renderer with our own
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);

      // 1. Initialize depth exporters
      packing = DEPTH_PACKING[packing];
      this.depthExporter = new THREE.WebGLDepthExporter(renderer, {packing});

      // 2. Update the depth exporter size
      this.depthExporter.setSize(canvas.width, canvas.height);

      // 3. Create a cube camera tracking the aframe camera
      this.cubeCamera = THREE.CubePerspectiveCamera.fromPerspectiveCamera(camera);
      scene.add(this.cubeCamera);

      // 4. Pick camera to render, based on key press
      const self = this;
      this.canvasCameraIndex = -1;
      this.isPreviewVisible = true;
      document.addEventListener('keypress', function(e) {
        if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
          self.canvasCameraIndex = parseInt(e.key) - 1;
        } else if (e.key == '0') {
          self.canvasCameraIndex = -1;
        } else if (e.key == toggleKey) {
          self.isPreviewVisible = !self.isPreviewVisible;
          canvas.style.display = self.isPreviewVisible ? 'block' : 'none';
          aframeCanvas.style.display = self.isPreviewVisible ? 'none' : 'block';
        }
      });
    },
    tick: function() {
      if (this.canvasCameraIndex && this.isPreviewVisible) {
        let {scene, camera} = getAframeObject3Ds(this.el);

        // 5. Prepare cube camera for display
        const canvas = this.depthExporter.renderer.domElement;
        this.cubeCamera.updateIntrinsicsForDisplay(camera, canvas);
        this.cubeCamera.updateExtrinsicsWith(camera);

        // 6. Render depth to canvas
        const previewCamera = this.canvasCameraIndex > -1 ?
          this.cubeCamera.children[this.canvasCameraIndex] : camera;
        this.depthExporter.setRenderTarget(null);
        this.depthExporter.render(scene, previewCamera);
        this.depthExporter.setRenderTarget(null);
      }
    }
  });

  AFRAME.registerComponent('download-depth-map', {
    schema: {
        downloadKey: {type: 'string', default: 'p'},
        download360Key: {type: 'string', default: ' '},
        packing: {type: 'string', default: 'basic'},
    },
    init: function() {
      // Grab default three.js objects from Aframe
      let {renderer, scene, camera} = getAframeObject3Ds(this.el);
      let {packing, downloadKey, download360Key} = this.data;
      let canvas = renderer.domElement;

      // 1. Initialize depth exporters and helpers
      packing = DEPTH_PACKING[packing];
      this.depthExporter = new THREE.WebGLDepthExporter(renderer, {packing}); // for 2d depth map
      this.depthExporter.setSize(canvas.clientWidth, canvas.clientHeight);
      this.cubeDepthExporter = new THREE.WebGLCubeDepthExporter(renderer, {packing}); // for 3d depth map
      const equi = new CubemapToEquirectangular( renderer, false ); // for equirectangular projection

      // 2. Create a cube camera tracking the aframe camera
      this.cubeCamera = THREE.CubePerspectiveCamera.fromPerspectiveCamera(camera);
      scene.add(this.cubeCamera);

      const self = this;
      document.addEventListener('keypress', function(e) {
        if (e.key == downloadKey) {
          // 3. Update the depth exporters size
          self.depthExporter.setSize(canvas.clientWidth, canvas.clientHeight);

          // 4. Download 2d depth map on key press
          self.depthExporter.download(scene, camera);
        } else if (e.key == download360Key) {
          // 3. Update the depth exporters size
          self.cubeDepthExporter.setSize(canvas.clientWidth, canvas.clientHeight);

          // 4. Update camera intrinsics and extrinsics for export
          self.cubeCamera.updateIntrinsicsForExport();
          self.cubeCamera.updateExtrinsicsWith(camera);

          // 5. Render depth in all directions to a cubemap
          self.cubeDepthExporter.setRenderTarget(self.cubeCamera.renderTarget);
          self.cubeDepthExporter.render(scene, self.cubeCamera);
          self.cubeDepthExporter.setRenderTarget(null);

          // 6. Download equirectangular depth map
          equi.convert(self.cubeCamera);
        }
      });
    },
  });
}

if (AFRAME) {
  registerThreeDepthJsAframeComponents();
}