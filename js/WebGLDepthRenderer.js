// Since THREE.WebGLRenderer is an old-style function constructor, we must
// continue using that to override the render method (I think)
function WebGLDepthRenderer(parameters) {
    THREE.WebGLRenderer.call(this, parameters);

    this.parentRender = this.render;
    
    // Initialize a standard render target that can store depth textures for
    // usage later on.
    this.invisibleRenderTarget = new THREE.WebGLRenderTarget(1, 1);
    this.invisibleRenderTarget.depthTexture = new THREE.DepthTexture();

    // Initialize the flat "TV screen" planes, which will hold the depth values 
    // as a color texture.
    const planeGeo = new THREE.PlaneBufferGeometry(2, 2);      
    const depthMaterial = new THREE.MeshBasicMaterial({
        map: this.invisibleRenderTarget.depthTexture,
    });
    depthMaterial.onBeforeCompile = function(shader) {
        // the <packing> GLSL chunk from three.js has the packDeathToRGBA function.
        // then at the end of the shader the default MaterialBasicShader has
        // already read from the material's `map` texture (the depthTexture)
        // which has depth in 'r' and assigned it to gl_FragColor
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            '#include <common>\n#include <packing>',
        ).replace(
            '#include <fog_fragment>',
            'gl_FragColor = packDepthToRGBA( gl_FragColor.r );',
        );
    };  
    
    // Create a flat "TV screen" scene, to render the depth texture to.
    this.depthScene = new THREE.Scene();
    const depthPlane = new THREE.Mesh(planeGeo, depthMaterial);
    this.depthScene.position.set(0, 0, -1); // TODO: wut
    this.depthScene.add(depthPlane);

    // Create an orthographic camera for the flat "TV screen" scene.
    this.depthCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

    // Again, using this.<method> = ... was the only way I could get this to
    // override the base WebGLRenderer render method.
    this.render = function(scene, camera) {
        // Get original render target
        var renderTarget = this.getRenderTarget();
    
        // Draw scene into invisible render target.
        this.setRenderTarget(this.invisibleRenderTarget);
        this.parentRender(scene, camera);
        this.setRenderTarget(null);
    
        // Render depth texture to the provided target.
        this.setRenderTarget(renderTarget);
        this.parentRender(this.depthScene, this.depthCamera);
    }
}


THREE.WebGLDepthRenderer = WebGLDepthRenderer;