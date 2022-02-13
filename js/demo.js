function setupTorusKnotScene(count=50, scale=5) {
    let scene = new THREE.Scene();

    const geometry = new THREE.TorusKnotGeometry( 1, 0.3, 128, 64 );
    const material = new THREE.MeshPhongMaterial( { color: 'blue' } );

    for ( let i = 0; i < count; i ++ ) {

        const r = Math.random() * 2.0 * Math.PI;
        const z = ( Math.random() * 2.0 ) - 1.0;
        const zScale = Math.sqrt( 1.0 - z * z ) * scale;

        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(
            Math.cos( r ) * zScale,
            Math.sin( r ) * zScale,
            z * scale
        );
        mesh.rotation.set( Math.random(), Math.random(), Math.random() );
        scene.add( mesh );
    }

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    return scene;
}