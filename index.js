var container, renderer;
var scene, camera;

// var initScene, render;

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

	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.set(5,5,5);
	camera.lookAt(cube.position);

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
