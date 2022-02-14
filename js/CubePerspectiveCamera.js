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

    updateProjectionMatrix() {
        this.children.forEach(child => {
            child.updateProjectionMatrix();
        });
    }
}

THREE.CubePerspectiveCamera = CubePerspectiveCamera;