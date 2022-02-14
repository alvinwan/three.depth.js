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