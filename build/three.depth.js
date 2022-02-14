class CubeOrthographicCamera extends THREE.CubeCamera {

	constructor( left, right, top, bottom, near, far, renderTarget ) {

		super( near, far, renderTarget );

		this.type = 'CubeOrthographicCamera';

		if ( renderTarget.isWebGLCubeRenderTarget !== true ) {

			console.error( 'THREE.CubeOrthographicCamera: The constructor now expects an instance of WebGLCubeRenderTarget as third parameter.' );
			return;

		}

		this.renderTarget = renderTarget;

		const cameraPX = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		cameraPX.layers = this.layers;
		cameraPX.up.set( 0, - 1, 0 );
		cameraPX.lookAt( new THREE.Vector3( 1, 0, 0 ) );
		this.add( cameraPX );

		const cameraNX = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		cameraNX.layers = this.layers;
		cameraNX.up.set( 0, - 1, 0 );
		cameraNX.lookAt( new THREE.Vector3( - 1, 0, 0 ) );
		this.add( cameraNX );

		const cameraPY = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		cameraPY.layers = this.layers;
		cameraPY.up.set( 0, 0, 1 );
		cameraPY.lookAt( new THREE.Vector3( 0, 1, 0 ) );
		this.add( cameraPY );

		const cameraNY = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		cameraNY.layers = this.layers;
		cameraNY.up.set( 0, 0, - 1 );
		cameraNY.lookAt( new THREE.Vector3( 0, - 1, 0 ) );
		this.add( cameraNY );

		const cameraPZ = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		cameraPZ.layers = this.layers;
		cameraPZ.up.set( 0, - 1, 0 );
		cameraPZ.lookAt( new THREE.Vector3( 0, 0, 1 ) );
		this.add( cameraPZ );

		const cameraNZ = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		cameraNZ.layers = this.layers;
		cameraNZ.up.set( 0, - 1, 0 );
		cameraNZ.lookAt( new THREE.Vector3( 0, 0, - 1 ) );
		this.add( cameraNZ );

	}
}

THREE.CubeOrthographicCamera = CubeOrthographicCamera;
class CubePerspectiveCamera extends THREE.CubeCamera {
    constructor( near, far, aspect, fov, renderTarget ) {
        super(near, far, renderTarget);

        this.type = 'CubePerspectiveCamera';

        this.aspect = aspect;
        this.fov = fov;
    }

    /**
     * Apply this flip after each transformation to the cube camera. Since
     * the cube camera is a rotated version of the perspective camera, this
     * is necessary to ensure that the camera has one face (the front) facing
     * the same direction the a perspective camera with the same
     * extrinsics would.
     */
    flip() {
        // Flip by 180˚ about the x-axis, since the cube camera is flipped
        let flip = new THREE.Quaternion()
        flip.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI)
        flip.multiply(this.quaternion);
        this.quaternion.copy(flip);
    }

    get aspect() {
        return this.children[0].aspect;
    }

    set aspect(value) {
        this.children.forEach(child => {
            child.aspect = value;
        });
    }

    get fov() {
        return this.children[0].fov;
    }

    set fov(value) {
        this.children.forEach(child => {
            child.fov = value;
        });
    }

    updateExtrinsicsWith(camera) {
        // Update camera extrinsics with perspective camera's
        camera.updateMatrixWorld();
        this.updateMatrixWorld();
        camera.getWorldPosition(this.position);
        camera.getWorldQuaternion(this.quaternion);
        this.flip(); // Flip cube camera so the front matches the perspective camera
    }

    updateIntrinsicsForDisplay(camera) {
        this.aspect = camera.aspect;
        this.fov = camera.fov;
        this.updateProjectionMatrix();
    }

    updateIntrinsicsForExport() {
        this.aspect = 1;
        this.fov = 90;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.children.forEach(child => {
            child.updateProjectionMatrix();
        });
    }

    static fromPerspectiveCamera(perspectiveCamera) {
        // Initialize camera intrinsics with perspective camera
        const near = perspectiveCamera.near;
        const far = perspectiveCamera.far;
        const aspect = perspectiveCamera.aspect;
        const fov = perspectiveCamera.fov;
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
        const cubeCamera = new THREE.CubePerspectiveCamera(near, far, aspect, fov, cubeRenderTarget);

        // Initialize camera extrinsics with perspective camera
        cubeCamera.updateExtrinsicsWith(perspectiveCamera);

        // Returned camera is ready for display
        return cubeCamera;
    }
}

THREE.CubePerspectiveCamera = CubePerspectiveCamera;
;(function() {

	"use strict";

	var root = this

	var has_require = typeof require !== 'undefined'

	var THREE = root.THREE || has_require && require('three')
	if( !THREE )
		throw new Error( 'CubemapToEquirectangular requires three.js' )

var vertexShader = `
attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main()  {

	vUv = vec2( 1.- uv.x, uv.y );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;

var fragmentShader = `
precision mediump float;

uniform samplerCube map;

varying vec2 vUv;

#define M_PI 3.1415926535897932384626433832795

void main()  {

	vec2 uv = vUv;

	float longitude = uv.x * 2. * M_PI - M_PI + M_PI / 2.;
	float latitude = uv.y * M_PI;

	vec3 dir = vec3(
		- sin( longitude ) * sin( latitude ),
		cos( latitude ),
		- cos( longitude ) * sin( latitude )
	);
	normalize( dir );

	gl_FragColor = textureCube( map, dir );

}
`;

function CubemapToEquirectangular( renderer, provideCubeCamera ) {

	this.width = 1;
	this.height = 1;

	this.renderer = renderer;

	this.material = new THREE.RawShaderMaterial( {
		uniforms: {
			map: { type: 't', value: null }
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
		transparent: true
	} );

	this.scene = new THREE.Scene();
	this.quad = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 1, 1 ),
		this.material
	);
	this.scene.add( this.quad );
	this.camera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -10000, 10000 );

	this.canvas = document.createElement( 'canvas' );
	this.ctx = this.canvas.getContext( '2d' );

	this.cubeCamera = null;
	this.attachedCamera = null;

	this.downloader = new Downloader(renderer);

	this.setSize( 4096, 2048 );

	var gl = this.renderer.getContext();
	this.cubeMapSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE )

	if( provideCubeCamera ) {
		this.getCubeCamera( 2048 )
	}

}

CubemapToEquirectangular.prototype.setSize = function( width, height ) {

	this.width = width;
	this.height = height;

	this.quad.scale.set( this.width, this.height, 1 );

	this.camera.left = this.width / - 2;
	this.camera.right = this.width / 2;
	this.camera.top = this.height / 2;
	this.camera.bottom = this.height / - 2;

	this.camera.updateProjectionMatrix();

	this.output = new THREE.WebGLRenderTarget( this.width, this.height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType
	});

	this.downloader.setSize(this.width, this.height);

	this.canvas.width = this.width;
	this.canvas.height = this.height;

}

CubemapToEquirectangular.prototype.getCubeCamera = function( size ) {

	var options = { format: THREE.RGBAFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter };
	const renderTarget = new THREE.WebGLCubeRenderTarget(size, options);
	this.cubeCamera = new THREE.CubeCamera(.1, 1000, renderTarget );

	return this.cubeCamera;

}

CubemapToEquirectangular.prototype.attachCubeCamera = function( camera ) {

	this.getCubeCamera();
	this.attachedCamera = camera;

}

CubemapToEquirectangular.prototype.convert = function( cubeCamera, download ) {

	this.quad.material.uniforms.map.value = cubeCamera.renderTarget.texture;
    this.renderer.setRenderTarget(this.output);
	this.renderer.render( this.scene, this.camera);

	const imageData = this.downloader.renderTargetToImage(this.output, true, true);
	if( download !== false ) {
		this.download( imageData );
	}
    this.renderer.setRenderTarget(null);

	return imageData

};

CubemapToEquirectangular.prototype.download = function( imageData ) {
	this.downloader.download( imageData );
};

CubemapToEquirectangular.prototype.update = function( camera, scene ) {

	var autoClear = this.renderer.autoClear;
	this.renderer.autoClear = true;
	this.cubeCamera.position.copy( camera.position );
	this.cubeCamera.update( this.renderer, scene );
	this.renderer.autoClear = autoClear;

	this.convert( this.cubeCamera );

}

if( typeof exports !== 'undefined' ) {
	if( typeof module !== 'undefined' && module.exports ) {
		exports = module.exports = CubemapToEquirectangular
	}
	exports.CubemapToEquirectangular = CubemapToEquirectangular
}
else {
	root.CubemapToEquirectangular = CubemapToEquirectangular
}

}).call(this);
class Downloader {
    constructor(renderer) {
        this.renderer = renderer;

        // Initialize canvas for blob conversion
        this.canvas = document.createElement( 'canvas' );
	    this.ctx = this.canvas.getContext( '2d' );

        let size = new THREE.Vector2();
        this.renderer.getSize(size);
        this.setSize(size.x, size.y);
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    download(image) {
        this.ctx.putImageData( image, 0, 0 );

        this.canvas.toBlob( function( blob ) {

            var url = URL.createObjectURL(blob);
            var fileName = 'image-' + document.title + '-' + Date.now() + '.png';
            var anchor = document.createElement( 'a' );
            anchor.href = url;
            anchor.setAttribute("download", fileName);
            anchor.className = "download-js-link";
            anchor.innerHTML = "downloading...";
            anchor.style.display = "none";
            document.body.appendChild(anchor);
            setTimeout(function() {
                anchor.click();
                document.body.removeChild(anchor);
            }, 1 );

        }, 'image/png' );
    }

    renderTargetToImage(renderTarget, flipH=false, flipV=false) {
        // Write render target depth to pixel array
        const raw = new Uint8Array( 4 * this.width * this.height );
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, this.width, this.height, raw);

        // Flip pixels vertically. For some reason, all pixel arrays are flipped vertically.
        const pixels = Downloader.flipPixels(raw, this.width, this.height, flipH, flipV);

        // Create image from pixel array
        const image = new ImageData( new Uint8ClampedArray( pixels ), this.width, this.height );

        return image;
    }

    static flipPixels(pixels, width, height, flipH=false, flipV=false) {
        const flipped = new Uint8Array(4 * width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const fy = flipV ? height - y - 1 : y;
                const fx = flipH ? width - x - 1 : x;
                const flippedIndex = (fy * width + fx) * 4;
                for (let i = 0; i < 4; i++) {
                    flipped[flippedIndex + i] = pixels[index + i];
                }
            }
        }
        return flipped;
    }
}
class WebGLCubeDepthExporter extends THREE.WebGLDepthExporter {
    render(scene, cubeCamera) {
        // Get original render target
        var renderTarget = this.renderer.getRenderTarget();
        var activeCubeFace = this.renderer.getActiveCubeFace();

        // Render the depth texture to all faces of the cube, one at a time
        for (let curCubeFace = 0; curCubeFace < 6; curCubeFace++) {
            let invisibleCamera = cubeCamera.children[curCubeFace]; // camera in invisible space

            // draw render target scene to render target
            this.renderer.setRenderTarget(this.invisibleRenderTarget);
            this.renderer.render(scene, invisibleCamera);
            this.renderer.setRenderTarget(null);
            
            // render the depth texture to the provided target
            this.renderer.setRenderTarget(renderTarget, curCubeFace);
            this.renderer.render(this.depthScene, this.depthCamera);
            this.renderer.setRenderTarget(null);
        }

        // Restore original render target
        this.renderer.setRenderTarget(renderTarget, activeCubeFace);
    }

    toImage() {
        console.warn(
            'WebGLCubeDepthExporter.toImage() by default only exports ' +
            'the last face of the cube. Instead, use Downloader.renderTargetDepthToImage()' +
            'on the cube render target.'
        );
        return super.toImage();
    }

    static cubeCameraFromPerspectiveCamera(perspectiveCamera) {
        // Initialize camera intrinsics with perspective camera
        const near = perspectiveCamera.near;
        const far = perspectiveCamera.far;
        const aspect = perspectiveCamera.aspect;
        const fov = perspectiveCamera.fov;
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
        const cubeCamera = new THREE.CubePerspectiveCamera(near, far, aspect, fov, cubeRenderTarget);

        // Initialize camera extrinsics with perspective camera
        WebGLCubeDepthExporter.cubeCameraTrackPerspectiveCamera(cubeCamera, perspectiveCamera);
        return cubeCamera;
    }

    static cubeCameraTrackPerspectiveCamera(cCamera, pCamera) {
        // Update camera extrinsics with perspective camera's
        pCamera.updateMatrixWorld();
        cCamera.updateMatrixWorld();
        pCamera.getWorldPosition(cCamera.position);
        pCamera.getWorldQuaternion(cCamera.quaternion);
        cCamera.flip(); // Flip cube camera so the front matches the perspective camera
    }
}

THREE.WebGLCubeDepthExporter = WebGLCubeDepthExporter;
/**
 * Args:
 *   renderer: the renderer to export the depth from
 *   near: the near plane of the camera (only if packing = THREE.BasicDepthPacking)
 *   far: the far plane of the camera (only if packing = THREE.BasicDepthPacking)
 *   packing: whether to pack the depth to RGB (THREE.RGBADepthPacking) or [0, 1] (THREE.BasicDepthPacking)
 */
class WebGLDepthExporter {
    constructor(renderer, {
        packing = THREE.BasicDepthPacking,
    } = {}) {
        this.downloader = new Downloader(renderer);
        this.renderer = renderer;
        this.packing = packing;

        // Initialize a render target for image export. Doesnt need a depth or 
        // stencil buffer, since we just need its color texture.
        this.imageRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
            depthBuffer: false,
            stencilBuffer: false,
        })

        // Initialize a standard render target that can store depth textures for
        // usage later on.
        this.invisibleRenderTarget = new THREE.WebGLRenderTarget(1, 1);
        this.invisibleRenderTarget.depthTexture = new THREE.DepthTexture();

        // Initialize the flat "TV screen" planes, which will hold the depth values 
        // as a color texture.
        const planeGeo = new THREE.PlaneBufferGeometry(2, 2);

        // Initialize depth material to use the depth texture as a color texture.
        const depthMaterial = this._getDepthMaterial(this.packing);

        // Create a flat "TV screen" scene, to render the depth texture to.
        this.depthScene = new THREE.Scene();
        const depthPlane = new THREE.Mesh(planeGeo, depthMaterial);
        depthPlane.position.set(0, 0, -1);
        this.depthScene.add(depthPlane);

        // Create an orthographic camera for the flat "TV screen" scene.
        this.depthCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    }

    setRenderTarget(renderTarget, activeCubeFace) {
        this.renderer.setRenderTarget(renderTarget, activeCubeFace);
    }

    render(scene, camera) {
        this._isolatedRenderTargetContext(function() {
            // Draw scene into invisible render target.
            this.renderer.setRenderTarget(this.invisibleRenderTarget);
            this.renderer.render(scene, camera);
            this.renderer.setRenderTarget(null);
        });

        // Render depth texture to the provided target.
        this.renderer.render(this.depthScene, this.depthCamera);
    }

    setSize(width, height) {
        this.invisibleRenderTarget.setSize(width, height);
        this.imageRenderTarget.setSize(width, height);
        this.downloader.setSize(width, height);
    }

    /**
     * Export the last-rendered depth texture to an image.
     */
    toImage() {
        this._isolatedRenderTargetContext(function() {
            this.setRenderTarget(this.imageRenderTarget);
            this.render(this.depthScene, this.depthCamera);
            this.setRenderTarget(null);
        });
        return this.downloader.renderTargetToImage(this.imageRenderTarget, false, true);
    }

    /**
     * Download a depth map for the provided scene and camera.
     */
    download(scene, camera) {
        this.render(scene, camera);
        this._downloadLastRender();
    }

    /**
     * Download the last-rendered depth texture as an image. This is not the 
     * default, because it's too easy to forget to render the depth before
     * using this method directly.
     */
    _downloadLastRender() {
        const image = this.toImage();
        this.downloader.download(image);
    }

    /**
     * Run a function in a new isolated render target context. This ensures that 
     * the original render target is restored after the function is run. 
     */
    _isolatedRenderTargetContext(handler) {
        // Get original render target
        var renderTarget = this.renderer.getRenderTarget();
        var activeCubeFace = this.renderer.getActiveCubeFace();

        handler.bind(this)();

        // Restore original render target
        this.renderer.setRenderTarget(renderTarget, activeCubeFace);
    }

    /**
     * Create a material that renders the depth texture as a color texture.
     * If packing = THREE.BasicDepthPacking, the depth is packed to [0, 1]. Else,
     * the depth is packed to RGB. To decode depth packed in RGB color channels, 
     * compute a base 256 number:
     *  
     *      const depth = r * ((255 / 256) / (256 * 256 * 256)) +
     *                    g * ((255 / 256) / (256 * 256)) +
     *                    b * ((255 / 256) / 256);
     */
    _getDepthMaterial(packing) {
        let fragmentShaderLine;
        if (packing === THREE.RGBADepthPacking) {
            fragmentShaderLine = WebGLDepthExporterShaders.fragmentShaderLineRGB;
        } else {
            fragmentShaderLine = WebGLDepthExporterShaders.fragmentShaderLineBasic;
        }

        const depthMaterial = new THREE.MeshBasicMaterial({
            map: this.invisibleRenderTarget.depthTexture,
        });
        depthMaterial.onBeforeCompile = function (shader) {
            // the <packing> GLSL chunk from three.js has the packDeathToRGBA function.
            // then at the end of the shader the default MaterialBasicShader has
            // already read from the material's `map` texture (the depthTexture)
            // which has depth in 'r' and assigned it to gl_FragColor
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                '#include <common>\n#include <packing>'
            ).replace(
                '#include <fog_fragment>',
                fragmentShaderLine,
            );
        };
        return depthMaterial;
    }
}

class WebGLDepthExporterShaders {
    static fragmentShaderLineRGB = 'gl_FragColor = packDepthToRGBA( gl_FragColor.r );';
    static fragmentShaderLineBasic = 'gl_FragColor.rgb = (1.0 - vec3( gl_FragColor.r )) * 255.0;\ngl_FragColor.a = 1.0;';
}

THREE.WebGLDepthExporter = WebGLDepthExporter;
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
      id: {type: 'string', default: '#debug'},
    },
    init: function() {
      // Create a canvas
      const canvas = document.createElement( 'canvas' );
      canvas.setAttribute('id', this.data.id);
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '10';
      document.body.appendChild(canvas); // Append to body

      // Grab default three.js objects from Aframe
      let {scene, camera} = getAframeObject3Ds(this.el);
      let {packing} = this.data;

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
      document.addEventListener('keypress', function(e) {
        if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
          self.canvasCameraIndex = parseInt(e.key) - 1;
        } else if (e.key == '0') {
          self.canvasCameraIndex = -1;
        }
      });
    },
    tick: function() {
      if (this.canvasCameraIndex) {
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
