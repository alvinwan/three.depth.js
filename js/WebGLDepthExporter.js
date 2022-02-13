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