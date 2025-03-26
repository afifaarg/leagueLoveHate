document.addEventListener("DOMContentLoaded", function () {
  // Scene setup
  const container = document.getElementById("map3d");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x89b0d9);
  scene.fog = new THREE.FogExp2(0x89b0d9, 0.0015);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // PointerLockControls
  const controls = new PointerLockControls(camera, renderer.domElement);

  // Movement state
  const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };

  // Movement speed
  const movementSpeed = 5;
  let velocity = new THREE.Vector3();

  // Pointer lock setup
  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
  });

  // Key listeners
  document.addEventListener("keydown", function (event) {
    switch (event.code) {
      case "KeyW":
        moveState.forward = true;
        break;
      case "KeyA":
        moveState.left = true;
        break;
      case "KeyS":
        moveState.backward = true;
        break;
      case "KeyD":
        moveState.right = true;
        break;
      case "Space":
        moveState.up = true;
        break;
      case "ShiftLeft":
        moveState.down = true;
        break;
    }
  });

  document.addEventListener("keyup", function (event) {
    switch (event.code) {
      case "KeyW":
        moveState.forward = false;
        break;
      case "KeyA":
        moveState.left = false;
        break;
      case "KeyS":
        moveState.backward = false;
        break;
      case "KeyD":
        moveState.right = false;
        break;
      case "Space":
        moveState.up = false;
        break;
      case "ShiftLeft":
        moveState.down = false;
        break;
    }
  });

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(100, 200, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Ground texture - Fallback color if image fails to load
  const groundGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5f0b,
    roughness: 0.8,
    metalness: 0.2,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Try loading ground texture (but it's not critical)
  try {
    const groundTexture = new THREE.TextureLoader().load(
      "assets/textures/ground.jpg",
      function (texture) {
        groundMaterial.map = texture;
        groundMaterial.needsUpdate = true;
      },
      undefined,
      function (error) {
        console.log("Error loading ground texture:", error);
      }
    );
  } catch (e) {
    console.log("Could not load ground texture");
  }

  // River water
  const waterGeometry = new THREE.PlaneGeometry(300, 100);
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "assets/textures/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      },
      undefined,
      function (error) {
        console.log("Error loading water texture:", error);
      }
    ),
    sunDirection: directionalLight.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x1a75ff,
    distortionScale: 3.0,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.2;
  scene.add(water);

  // [Rest of your scene setup...]
  // Add trees, towers, etc. here

  // Animation loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Movement controls
    velocity.x -= velocity.x * 5.0 * delta;
    velocity.z -= velocity.z * 5.0 * delta;

    if (moveState.forward) velocity.z -= movementSpeed * delta;
    if (moveState.backward) velocity.z += movementSpeed * delta;
    if (moveState.left) velocity.x -= movementSpeed * delta;
    if (moveState.right) velocity.x += movementSpeed * delta;
    if (moveState.up) velocity.y += movementSpeed * delta;
    if (moveState.down) velocity.y -= movementSpeed * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += velocity.y * delta;

    // Constrain to map boundaries
    const pos = controls.getObject().position;
    const boundary = 150;
    pos.x = Math.max(-boundary, Math.min(boundary, pos.x));
    pos.z = Math.max(-boundary, Math.min(boundary, pos.z));
    pos.y = Math.max(1, Math.min(20, pos.y));

    // Update water animation
    if (water) {
      water.material.uniforms.time.value += delta;
    }

    renderer.render(scene, camera);
  }

  animate();
});
