
import * as THREE from "three";
import { createCoin } from "./coin.js";
import { PhysicsWorld } from "./physik.js";
import { applyLighting } from "./licht.js";

// =============================================
// ONE MILLION COINS
// =============================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x777777);
scene.fog = new THREE.Fog(0x777777, 45, 190);

// Beleuchtung: keine sichtbaren Lampen im Bunker.
// Die Lichtquellen dienen nur dazu, die Oberflächen
// und die glänzenden Münzen sichtbar zu machen.
scene.add(new THREE.AmbientLight(0xffffff, 1.1));

const sunlight = new THREE.DirectionalLight(0xffffff, 2.0);
sunlight.position.set(-30, 100, 40);
scene.add(sunlight);

applyLighting(scene);

// =============================================
// RENDERER
// =============================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.body.appendChild(renderer.domElement);

// =============================================
// KAMERA
// =============================================

const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    300
);

const FLOOR_HEIGHT = 9;
const FLOOR_COUNT = 10;
const WIDTH = 90;
const DEPTH = 90;
const WALL = 2;

const SPAWN_Y = (FLOOR_COUNT - 1) * FLOOR_HEIGHT + 1.7;

camera.position.set(0, SPAWN_Y, 25);
scene.add(camera);

// =============================================
// BETONMATERIALIEN
// =============================================

function createConcreteTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#777777";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 14000; i++) {
        const shade = 75 + Math.random() * 75;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.16)`;

        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 3 + 0.5;

        ctx.fillRect(x, y, size, size);
    }

    for (let i = 0; i < 35; i++) {
        ctx.strokeStyle = "rgba(30,30,30,0.12)";
        ctx.lineWidth = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);

    return texture;
}

const concreteTexture = createConcreteTexture();

const concreteMaterial = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: 0x999999,
    roughness: 0.95,
    metalness: 0
});

const floorMaterial = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: 0x777777,
    roughness: 0.98
});

// =============================================
// BUNKER
// =============================================

const bunker = new THREE.Group();
scene.add(bunker);

const physics = new PhysicsWorld(THREE, {
    gravity: -9.81,
    iterations: 8,
    substeps: 3,
    groundY: -1000
});

const staticMeshes = [];

function addConcrete(x, y, z, sx, sy, sz, material = concreteMaterial) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    bunker.add(mesh);
    staticMeshes.push(mesh);

    return mesh;
}

for (let floor = 0; floor < FLOOR_COUNT; floor++) {
    const y = floor * FLOOR_HEIGHT;

    // Boden
    addConcrete(
        0, y - 0.5, 0,
        WIDTH, 1, DEPTH,
        floorMaterial
    );

    // Decke der unteren Etagen
    if (floor < FLOOR_COUNT - 1) {
        addConcrete(
            0, y + FLOOR_HEIGHT - 0.5, 0,
            WIDTH, 1, DEPTH,
            concreteMaterial
        );
    }

    // Außenwände
    addConcrete(0, y + FLOOR_HEIGHT / 2, -DEPTH / 2, WIDTH, FLOOR_HEIGHT, WALL);
    addConcrete(0, y + FLOOR_HEIGHT / 2, DEPTH / 2, WIDTH, FLOOR_HEIGHT, WALL);
    addConcrete(-WIDTH / 2, y + FLOOR_HEIGHT / 2, 0, WALL, FLOOR_HEIGHT, DEPTH);
    addConcrete(WIDTH / 2, y + FLOOR_HEIGHT / 2, 0, WALL, FLOOR_HEIGHT, DEPTH);

    // Massive Betonstützen
    const pillarPositions = [
        [-40, -40],
        [40, -40],
        [-40, 40],
        [40, 40]
    ];

    for (const [x, z] of pillarPositions) {
        addConcrete(x, y + FLOOR_HEIGHT / 2, z, 2, FLOOR_HEIGHT, 2);
    }
}

// =============================================
// MÜNZEN
// =============================================

// Hinweis: Die Physik-Engine verwendet Kugelradien.
// Daher werden die Münzen für diese vereinfachte
// Physik als runde Körper behandelt.

const COIN_RADIUS = 0.5;
const coins = [];

const COINS_PER_FLOOR = 35;
const random = (min, max) => min + Math.random() * (max - min);

for (let floor = 0; floor < FLOOR_COUNT; floor++) {
    const floorY = floor * FLOOR_HEIGHT;

    for (let i = 0; i < COINS_PER_FLOOR; i++) {
        const coin = createCoin(THREE);

        coin.position.set(
            random(-35, 35),
            floorY + 1.2 + Math.random() * 4,
            random(-35, 35)
        );

        // Münzen leicht unterschiedlich drehen
        coin.rotation.set(
            Math.random() * 0.2,
            Math.random() * Math.PI * 2,
            Math.random() * 0.2
        );

        coin.scale.setScalar(random(0.65, 1.0));

        scene.add(coin);

        const body = physics.add(coin, {
            mass: 0.2,
            radius: COIN_RADIUS * coin.scale.x,
            restitution: 0.3,
            friction: 0.6,
            linearDamping: 0.08,
            angularDamping: 0.12
        });

        // Leichte zufällige Anfangsbewegung
        physics.applyImpulse(
            body,
            new THREE.Vector3(
                random(-0.4, 0.4),
                random(-0.2, 0.5),
                random(-0.4, 0.4)
            )
        );

        coins.push({ coin, body });
    }
}

// =============================================
// SPIELERSTEUERUNG
// =============================================

const keys = {};

let playing = false;
let yaw = 0;
let pitch = 0;

const playerSpeed = 9;
const playerHeight = 1.7;

window.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (event.code === "Escape" && playing) {
        document.exitPointerLock();
    }
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

document.getElementById("start").addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    playing = document.pointerLockElement === renderer.domElement;
    document.getElementById("menu").style.display =
        playing ? "none" : "flex";
});

document.addEventListener("mousemove", event => {
    if (!playing) return;

    yaw -= event.movementX * 0.002;
    pitch -= event.movementY * 0.002;

    pitch = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, pitch)
    );

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

// =============================================
// SPIELERBEWEGUNG
// =============================================

function updatePlayer(deltaTime) {
    if (!playing) return;

    const forward = new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    );

    const movement = new THREE.Vector3();

    if (keys["KeyW"]) movement.add(forward);
    if (keys["KeyS"]) movement.sub(forward);
    if (keys["KeyD"]) movement.add(right);
    if (keys["KeyA"]) movement.sub(right);

    if (movement.lengthSq() > 0) {
        movement.normalize().multiplyScalar(playerSpeed * deltaTime);
    }

    const nextX = camera.position.x + movement.x;
    const nextZ = camera.position.z + movement.z;

    // Außenwände nicht durchqueren
    if (Math.abs(nextX) < WIDTH / 2 - 3) {
        camera.position.x = nextX;
    }

    if (Math.abs(nextZ) < DEPTH / 2 - 3) {
        camera.position.z = nextZ;
    }

    camera.position.y = SPAWN_Y;
}

// =============================================
// ANIMATION
// =============================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.033);

    updatePlayer(deltaTime);

    physics.update(deltaTime);

    renderer.render(scene, camera);
}

animate();

// =============================================
// FENSTERGRÖSSE
// =============================================

window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
});
