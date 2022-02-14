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