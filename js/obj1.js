import * as THREE from "../three.js-master/build/three.module.js";
import { GLTFLoader } from "../three.js-master/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "../three.js-master/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector(".webgl");
const scene = new THREE.Scene();
let rootLoadedModel;
let mixer;

const loader = new GLTFLoader();
loader.load("assets/jiraia.glb", (glb) => {
  const loadModel = glb.scene;

  loadModel.scale.set(0.4, 0.4, 0.4);
  scene.add(loadModel);

  rootLoadedModel = loadModel;
  addLights();

  mixer = new THREE.AnimationMixer(rootLoadedModel);
  const animations = glb.animations;
  if (animations && animations.length > 0) {
    const action = mixer.clipAction(animations[0]);
    const action2 = mixer.clipAction(animations[1]);
    action.play();
    action2.play();
  }

  rootLoadedModel.traverse((child) => {
    if (child.isMesh) {
      child.userData.clickable = true;
    }
  });
});

const ambientLight = new THREE.AmbientLight(0x404040, 5);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(2, 2, 5);
scene.add(light);

// Boilerplate
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(2.8, 2.8, 1.8);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.gammaOutput = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

canvas.addEventListener("click", onCanvasClick);

function onCanvasClick(event) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const clickableObjects = [];
  rootLoadedModel.traverse((child) => {
    if (child.isMesh && child.userData.clickable) {
      clickableObjects.push(child);
    }
  });

  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    if (mixer) {
      mixer.timeScale = 1;
      action.paused = false;
    }
  }
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(2, 2, 5);
  light.name = "directionalLight";
  rootLoadedModel.add(light);
}

function animate() {
  let rotationSpeed = 0.005;

  requestAnimationFrame(animate);

  if (rootLoadedModel) {
    rootLoadedModel.traverse((child) => {
      if (child.isMesh) {
        const boundingBox = new THREE.Box3().setFromObject(child);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);

        const light = scene.getObjectByName("directionalLight");
        if (light) {
          light.position.copy(worldPosition);
        }
      }
    });

    rootLoadedModel.rotation.y += rotationSpeed;

    if (mixer) {
      mixer.update(0.0167);
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
