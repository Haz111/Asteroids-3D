var container, renderer;
var scene, camera;

// game specyfic
var ship;

initScene = function() {
	container = document.getElementById('threejs-renderer');
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMapSoft = true;
	container.appendChild( renderer.domElement );

	render_stats = new Stats();
	render_stats.domElement.style.position = 'absolute';
	render_stats.domElement.style.top = '1px';
	render_stats.domElement.style.zIndex = 100;
	container.appendChild( renderer.domElement );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(
		35,
		window.innerWidth / window.innerHeight,
		1,
		3000
	);
	scene.add( camera );

	// ambient light
	var light = new THREE.AmbientLight( 0x404040, 20 ); // soft white light
	scene.add( light );
	console.log(light)

	// ship
	var jsonLoader = new THREE.JSONLoader();

	jsonLoader.load( "models/ship.json", function( shipGeometry, shipMaterials ) {
		var shipMaterial = new THREE.MultiMaterial( shipMaterials );
		ship = new THREE.Mesh( shipGeometry, shipMaterial );
		// edges
		var edgesGeometry = new THREE.EdgesGeometry( shipGeometry );
		var edgesMaterial = new THREE.LineBasicMaterial( { color: 0xFFFFFF, linewidth: 3 } );
		var edges = new THREE.LineSegments( edgesGeometry, edgesMaterial );
		ship.add( edges );

		ship.position.set(0,0,0);
		scene.add( ship );

		camera.lookAt(ship.position);
	});

	camera.position.set(15,15,15);

	requestAnimationFrame( render );
};

update = function() {

}

render = function() {
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
	render_stats.update();
};

window.onload = initScene;
