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