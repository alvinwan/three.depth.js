/**
 * Args:
 *   renderer: the renderer to export the depth from
 *   near: the near plane of the camera (only if maxPrecision = false)
 *   far: the far plane of the camera (only if maxPrecision = false)
 *   maxPrecision: whether to pack the depth to RGB (true) or [0, 1] (false)
 */
class WebGLDepthExporter {
    FRAGMENT_SHADER = `#include <packing>

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;


float readDepth( sampler2D depthSampler, vec2 coord ) {
    float fragCoordZ = texture2D( depthSampler, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

void main() {
    //vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
    float depth = readDepth( tDepth, vUv );

    gl_FragColor.rgb = 1.0 - vec3( depth );
    gl_FragColor.a = 1.0;
}`;

    VERTEX_SHADER = `varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

    constructor(renderer, {
        maxPrecision = false,
        near = null,
        far = null,
    } = {}) {
        this.renderer = renderer;
        this.maxPrecision = maxPrecision;

        // Initialize a standard render target that can store depth textures for
        // usage later on.
        this.invisibleRenderTarget = new THREE.WebGLRenderTarget(1, 1);
        this.invisibleRenderTarget.depthTexture = new THREE.DepthTexture();

        // Initialize the flat "TV screen" planes, which will hold the depth values 
        // as a color texture.
        const planeGeo = new THREE.PlaneBufferGeometry(2, 2);

        let depthMaterial;
        if (maxPrecision) {
            depthMaterial = this._getPreciseDepthMaterial();
        } else {
            depthMaterial = this._getDepthMaterial(near, far);
        }
        this.depthMaterial = depthMaterial;

        // Create a flat "TV screen" scene, to render the depth texture to.
        this.depthScene = new THREE.Scene();
        const depthPlane = new THREE.Mesh(planeGeo, depthMaterial);
        depthPlane.position.set(0, 0, -1); // TODO: wut
        this.depthScene.add(depthPlane);

        // Create an orthographic camera for the flat "TV screen" scene.
        this.depthCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    }

    setRenderTarget(renderTarget, activeCubeFace) {
        this.renderer.setRenderTarget(renderTarget, activeCubeFace);
    }

    render(scene, camera) {
        // Get original render target
        var renderTarget = this.renderer.getRenderTarget();
        var activeCubeFace = this.renderer.getActiveCubeFace();

        // Draw scene into invisible render target.
        this.renderer.setRenderTarget(this.invisibleRenderTarget);
        this.renderer.render(scene, camera);
        this.renderer.setRenderTarget(null);
        
        // Restore original render target
        this.renderer.setRenderTarget(renderTarget, activeCubeFace);

        if (!this.maxPrecision) {
            // If we're not packing depth to RGB, we need to update the 
            // depth texture with the appropriate values, for the shader.
            this.depthMaterial.uniforms.cameraNear.value = camera.near;
            this.depthMaterial.uniforms.cameraFar.value = camera.far;
            this.depthMaterial.uniforms.tDiffuse.value = this.invisibleRenderTarget.texture;
            this.depthMaterial.uniforms.tDepth.value = this.invisibleRenderTarget.depthTexture;
        }

        // Render depth texture to the provided target.
        this.renderer.render(this.depthScene, this.depthCamera);
    }

    setSize(width, height) {
        this.invisibleRenderTarget.setSize(width, height);
    }

    /**
     * Create a material that renders the depth texture as a color texture.
     * The color texture specifically packs the depth values to RGB. To decode this,
     * compute a base 256 number:
     *  
     *      const depth = r * ((255 / 256) / (256 * 256 * 256)) +
     *                    g * ((255 / 256) / (256 * 256)) +
     *                    b * ((255 / 256) / 256);
     */
    _getPreciseDepthMaterial() {
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
                'gl_FragColor = packDepthToRGBA( gl_FragColor.r );'
            );
        };
        return depthMaterial;
    }

    _getDepthMaterial(near, far) {
        return new THREE.ShaderMaterial( {
            vertexShader: this.VERTEX_SHADER,
            fragmentShader: this.FRAGMENT_SHADER,
            uniforms: {
                cameraNear: { value: near },
                cameraFar: { value: far },
                tDiffuse: { value: null },
                tDepth: { value: null }
            }
        } );
    }
}

THREE.WebGLDepthExporter = WebGLDepthExporter;