var container;
var renderer, composer;
var scene, camera, controls;

// game specyfic
var ship;
var bullets = [];

// other
var clock = new THREE.Clock();

// constants

var wallLength = 400;
var halfWall = wallLength / 2;

var wallProperties = [
		{x: 0, y: 0, z: - halfWall, rX: 0, rY: 0, rZ: 0, color: 0x0000ff },
		{x: 0, y: 0, z: halfWall, rX: 0, rY: -Math.PI, rZ: 0, color: 0x0000ff },
		{x: halfWall, y: 0, z: 0, rX: 0, rY: -Math.PI / 2, rZ: 0, color: 0x00ff00 },
		{x: - halfWall, y: 0, z: 0, rX: 0, rY: Math.PI / 2, rZ: 0, color: 0x00ff00 },
		{x: 0, y: halfWall, z: 0, rX: Math.PI / 2, rY: 0, rZ: 0, color: 0xff0000},
		{x: 0, y: - halfWall, z: 0, rX: -Math.PI / 2, rY: 0, rZ: 0, color: 0xff0000},
	]

	var bulletDiscanceMax = halfWall;
	var bulletSpeed = 80;

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
	// scene.add( camera );

	// ambient light
	var light = new THREE.AmbientLight( 0x404040, 20 ); // soft white light
	scene.add( light );


	// bounds

	var wallGeometry = new THREE.PlaneGeometry(wallLength, wallLength);
	// var wallMaterial = new THREE.MeshLambertMaterial({color: 0x0000ff, transparent: true, opacity: 0.1});
	for (var i = 0; i < wallProperties.length; i++){
			var wallMaterial = new THREE.MeshLambertMaterial({color: wallProperties[i].color, transparent: true, opacity: 0.1});
			// console.log(wallMaterial.color);
			// wallMaterial.color = wallProperties[i].color;
			// console.log(wallMaterial.color);
			var wall = new THREE.Mesh(wallGeometry, wallMaterial);
			wall.position.set(wallProperties[i].x, wallProperties[i].y, wallProperties[i].z);
			wall.rotation.set(wallProperties[i].rX, wallProperties[i].rY, wallProperties[i].rZ);
			// wall.rotation.y = wallProperties[i].rotationY;
			scene.add(wall);
	}

	// ship
	var jsonLoader = new THREE.JSONLoader();

	jsonLoader.load( "models/ship.json", function( shipGeometry, shipMaterials ) {
		for(var i = 0; i < shipMaterials.length; i++) {
			shipMaterials[i].transparent = true;
			shipMaterials[i].opacity = 0.3;
		}
		var shipMaterial = new THREE.MultiMaterial( shipMaterials );
		ship = new THREE.Mesh( shipGeometry, shipMaterial );
		// edges
		var edgesGeometry = new THREE.EdgesGeometry( shipGeometry );
		var edgesMaterial = new THREE.LineBasicMaterial( { color: 0xFFFFFF, linewidth: 3 } );
		var edges = new THREE.LineSegments( edgesGeometry, edgesMaterial );
		ship.add( edges );

		ship.position.set(0,0,0);
		scene.add( ship );

		ship.add( camera );
		camera.position.set(0,0,5);
		camera.lookAt(new THREE.Vector3(0,0,-3));

		// controls
		controls = new THREE.FlyControls( ship );
		controls.movementSpeed = 60;
		controls.domElement = container;
		controls.rollSpeed = Math.PI / 24;
		controls.autoForward = false;
		controls.dragToLook = false;
	});


		// initPostprocessing();
	// camera.position.set(15,15,15);

	requestAnimationFrame( render );
};

update = function(delta) {
	if(ship) {
			if (ship.position.x > halfWall) ship.position.x = - halfWall + 1;
			if (ship.position.x < -halfWall) ship.position.x = halfWall - 1;
			if (ship.position.y > halfWall) ship.position.y = - halfWall + 1;
			if (ship.position.y < -halfWall) ship.position.y = halfWall - 1;
			if (ship.position.z > halfWall) ship.position.z = - halfWall + 1;
			if (ship.position.z < -halfWall) ship.position.z = halfWall - 1;
	}

	var amountOfBullets = bullets.length;
	if (amountOfBullets > 0) {
		for(var i = amountOfBullets - 1; i >= 0; i--) {
			if (bullets[i].distance > bulletDiscanceMax) {
				scene.remove(bullets[i]);
				bullets.splice(i, 1);
			} else {
				var dist = bulletSpeed * delta;
				bullets[i].translateZ(-dist);
				bullets[i].distance += dist;
			}
		}
	}

	if(controls) controls.update( delta );

};

render = function() {
	var delta = clock.getDelta();

	requestAnimationFrame( render );
	update(delta);
	// composer.render( delta );
	renderer.render( scene, camera );
	render_stats.update();
};

shot = function() {
	var geometry = new THREE.SphereGeometry( 0.5, 4, 4 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffffaa} );
	var bullet = new THREE.Mesh( geometry, material );
	bullet.rotation.copy(ship.rotation);
	bullet.position.copy(ship.position);
	bullet.translateZ(-10);
	bullet.distance = 0;
	bullets.push(bullet)
	scene.add(bullet);

}



initPostprocessing = function() {
	composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );

	var effect = new THREE.ShaderPass( THREE.DotScreenShader );
	effect.uniforms[ 'scale' ].value = 4;
	composer.addPass( effect );

	var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
	effect.uniforms[ 'amount' ].value = 0.0015;
	effect.renderToScreen = true;
	composer.addPass( effect );

}

additionalControls = function(event) {

	switch (event.which) {
		case 32: // space
			console.log("space pressed");
			shot();
			break;

	}
}

document.onkeydown = additionalControls;
window.onload = initScene;
