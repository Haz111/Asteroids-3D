var container;
var renderer, composer;
var scene, camera, controls;
var render_stats, htmlScore;

// game specyfic
var ship;
var bullets = [];
var asteroidsAmount = 10;
var asteroids = [];
var asteroidMaterial, asteroidEdgesMaterial;

var loaded = false;

var score = 0;

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
	var bulletSpeed = 400;

	var asteroidStartSpeedMax = 25;
	var asteroidStartSpeedMin = 40;
	var asteroidMaxSpeed = 100;
	var asteroidAcceleration = 2;
	var asteroidShipBuffor = 20; // buffor to ship when new asteroid appears
	var asteroidWallBuffor = 4;
	var asteroidChildAmount = 3;

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

	htmlScore = document.createElement('points');
	htmlScore.style.position = 'absolute';
	htmlScore.style.color = "#624CAB";
	htmlScore.style.fontSize = "30px";
	htmlScore.style.fontFamily = '"Lucida Console", Monaco, monospace';
	htmlScore.innerHTML = "SCORE: 0";
	htmlScore.style.top = 20 + 'px';
	htmlScore.style.left = 20 + 'px';
	container.appendChild(htmlScore);

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
	for (var i = 0; i < wallProperties.length; i++){
			var wallMaterial = new THREE.MeshLambertMaterial({color: wallProperties[i].color, transparent: true, opacity: 0.05, side: THREE.DoubleSide});
			var wall = new THREE.Mesh(wallGeometry, wallMaterial);
			wall.position.set(wallProperties[i].x, wallProperties[i].y, wallProperties[i].z);
			wall.rotation.set(wallProperties[i].rX, wallProperties[i].rY, wallProperties[i].rZ);
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
		ship.radius = 2;
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
		// controls.rollSpeed = 100;
		controls.domElement = container;
		controls.rollSpeed = Math.PI / 24;
		controls.autoForward = false;
		controls.dragToLook = false;

		asteroidMaterial = new THREE.MeshBasicMaterial( {color: 0xffffaa, transparent: true, opacity: 0.3} );
		asteroidEdgesMaterial = new THREE.LineBasicMaterial( { color: 0xFFFFFF, linewidth: 3 } );

		spawnNewAsteroids();

		loaded = true;

		initPostprocessing();
	});

	// Skybox
	var imagePrefix = "textures/skybox/cosmos_";
	var directions  = ["right1", "left2", "top3", "bottom4", "front5", "back6"];
	var imageSuffix = ".png";
	var skyGeometry = new THREE.CubeGeometry( 1000, 1000, 1000 );

	var materialArray = [];
	for (var i = 0; i < 6; i++)
		materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
			side: THREE.BackSide
		}));
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
	scene.add( skyBox );

	requestAnimationFrame( render );
};

update = function(delta) {
	if(loaded) {
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

		var amountOfAsteroids = asteroids.length;
		if (amountOfAsteroids > 0) {
			for(var i = amountOfAsteroids - 1; i >= 0; i--) {
				// update
				var dist = asteroids[i].speed * delta;
				asteroids[i].translateZ(dist);
				if (asteroids[i].position.x > halfWall) asteroids[i].position.x = - halfWall + 1;
				if (asteroids[i].position.x < -halfWall) asteroids[i].position.x = halfWall - 1;
				if (asteroids[i].position.y > halfWall) asteroids[i].position.y = - halfWall + 1;
				if (asteroids[i].position.y < -halfWall) asteroids[i].position.y = halfWall - 1;
				if (asteroids[i].position.z > halfWall) asteroids[i].position.z = - halfWall + 1;
				if (asteroids[i].position.z < -halfWall) asteroids[i].position.z = halfWall - 1;
				if (asteroids[i].spped < asteroidMaxSpeed) asteroids[i].speed += asteroidAcceleration * delta;

				// collisions
				var amountOfBullets = bullets.length;
				var killed = false;
				if (amountOfBullets > 0) {
					for(var j = amountOfBullets - 1; j >= 0; j--) {
						if (radiusCollision(asteroids[i], bullets[j])) {
								addScore(asteroids[i].size);
								killed = true;
								scene.remove(bullets[j]);
								bullets.splice(j, 1);
								spawnSmashedAsteroids(asteroids[i]);
						}
					}
				}
				if (!killed) {
					if (radiusCollision(asteroids[i], ship)) {
						killed = true;
					}
				}
				if (killed) {
					scene.remove(asteroids[i]);
					asteroids.splice(i, 1);
				}
			}
		}

		if(asteroids.length <= 0) spawnNewAsteroids();

		if(controls) controls.update( delta );

		composer.render( delta );
	}
};

render = function() {
	var delta = clock.getDelta();

	requestAnimationFrame( render );
	update(delta);

	// renderer.render( scene, camera );
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
	bullet.radius = 0.5;
	bullets.push(bullet)
	scene.add(bullet);
}

spawnNewAsteroids = function() {
	for (var i = 0; i < asteroidsAmount; i++) {
		var asteroid = createAsteroid(1);
		asteroids.push(asteroid)
		scene.add(asteroid);
	}
	asteroidsAmount++;
}

spawnSmashedAsteroids = function(oldAsteroid) {
	if(oldAsteroid.size === 1 || oldAsteroid.size === 2) {
		for (var i = 0; i < asteroidChildAmount; i++) {
			var asteroid = createAsteroid(oldAsteroid.size + 1, oldAsteroid.position);
			asteroids.push(asteroid)
			scene.add(asteroid);
		}
	}
}

createAsteroid = function(size, position) {
	var radius;
	switch (size) {
		case 1:	radius = 20; break;
		case 2:	radius = 10; break;
		default: radius = 4; break;
	}
	var asteroidGeometry = new THREE.IcosahedronGeometry(radius, 0);
	var asteroidEdgesGeometry = new THREE.EdgesGeometry( asteroidGeometry );

	var asteroid = new THREE.Mesh( asteroidGeometry, asteroidMaterial );
	var asteroidEdges = new THREE.LineSegments( asteroidEdgesGeometry, asteroidEdgesMaterial );
	asteroid.add(asteroidEdges);

	if (position) {
		asteroid.position.copy(position);
	} else {
		asteroid.position.copy(asteroidPosition());
	}
	asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI, "XYZ");
	asteroid.speed = (Math.random() * (asteroidStartSpeedMax - asteroidStartSpeedMin)) + asteroidStartSpeedMin;
	asteroid.size = size;
	asteroid.radius = radius;

	return asteroid;
}

asteroidPosition = function() {
	var x, y, z;
	if (ship) {
		var length = wallLength - 2*asteroidShipBuffor - 2*asteroidWallBuffor;
		x = Math.random() * length + asteroidShipBuffor + asteroidWallBuffor - halfWall;
		x = x < ship.position.x ? x - asteroidShipBuffor : x + asteroidShipBuffor;
		y = Math.random() * length + asteroidShipBuffor + asteroidWallBuffor - halfWall;
		y = y < ship.position.y ? y - asteroidShipBuffor : y + asteroidShipBuffor;
		z = Math.random() * length + asteroidShipBuffor + asteroidWallBuffor - halfWall;
		z = z < ship.position.z ? z - asteroidShipBuffor : z + asteroidShipBuffor;
	} else {
		var length = wallLength - 2*asteroidWallBuffor;
		x = Math.random() * length + asteroidWallBuffor - halfWall;
		y = Math.random() * length + asteroidWallBuffor - halfWall;
		z = Math.random() * length + asteroidWallBuffor - halfWall;
	}
	return new THREE.Vector3(x,y,z);
}

radiusCollision = function(object1, object2) {
	return (Math.sqrt(Math.pow(object1.position.x - object2.position.x, 2) + Math.pow(object1.position.y - object2.position.y, 2) + Math.pow(object1.position.z - object2.position.z, 2)) < (object1.radius + object2.radius));
}

addScore = function(size) {
	switch (size) {
		case 1: score += 20; break;
		case 2: score += 50; break;
		case 3: score += 100; break;
	}
	htmlScore.innerHTML = "SCORE: " + score;
}

initPostprocessing = function() {

	var renderPass = new THREE.RenderPass( scene, camera );

	var shaderPass = new THREE.ShaderPass( THREE.RGBShiftShader );
	shaderPass.uniforms[ 'amount' ].value = 0.0015;
	shaderPass.renderToScreen = true;

	var effectFilm = new THREE.FilmPass(0.35, 0.25, 648, true);

	composer = new THREE.EffectComposer( renderer );
	composer.addPass( renderPass );
	composer.addPass( shaderPass );
	composer.addPass( effectFilm );

}

additionalControls = function(event) {

	switch (event.which) {
		case 32: // space
			shot();
			break;

	}
}

document.onkeydown = additionalControls;
window.onload = initScene;
