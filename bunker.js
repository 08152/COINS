
import * as THREE from "three";

// ==========================================
// GRUNDEINSTELLUNGEN
// ==========================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x77746e);
scene.fog = new THREE.Fog(0x77746e, 100, 350);

const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    600
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.NoToneMapping;

document.body.appendChild(renderer.domElement);

// ==========================================
// MATERIALIEN
// ==========================================

function createConcreteTexture() {

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#85837d";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 30000; i++) {

        const v = Math.random() * 100;

        ctx.fillStyle = `rgba(${v},${v},${v},0.15)`;

        ctx.fillRect(
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 4,
            Math.random() * 4
        );
    }

    for (let i = 0; i < 40; i++) {

        ctx.strokeStyle = "rgba(40,40,35,0.15)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    return texture;
}

const concreteTexture = createConcreteTexture();

const concrete = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    roughness: 1
});

const floorMaterial = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    roughness: 1
});

const darkConcrete = new THREE.MeshStandardMaterial({
    color: 0x66635e,
    roughness: 1
});

const ceilingBasic = new THREE.MeshBasicMaterial({
    color: 0x56544f
});

// ==========================================
// BUNKER DIMENSIONEN
// ==========================================

const WIDTH = 90;
const DEPTH = 90;
const FLOOR_HEIGHT = 9;
const FLOOR_COUNT = 10;

const WALL = 2;

// ==========================================
// BAUFUNKTION
// ==========================================

const colliders = [];

function createBox(
    x, y, z,
    sx, sy, sz,
    material,
    collision = true
) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        material
    );

    mesh.position.set(x, y, z);
    scene.add(mesh);

    if (collision) {
        colliders.push({
            x, y, z,
            hx: sx / 2,
            hy: sy / 2,
            hz: sz / 2
        });
    }

    return mesh;
}

// ==========================================
// 10 ETAGEN
// ==========================================

for (let floor = 0; floor < FLOOR_COUNT; floor++) {

    const baseY = floor * FLOOR_HEIGHT;

    // Boden
    createBox(
        0, baseY - 0.3, 0,
        WIDTH, 0.6, DEPTH,
        floorMaterial
    );

    // Decke
    if (floor < FLOOR_COUNT - 1) {

        createBox(
            0, baseY + FLOOR_HEIGHT, 0,
            WIDTH, 0.5, DEPTH,
            ceilingBasic
        );
    }

    // Außenwände
    createBox(
        -WIDTH / 2, baseY + FLOOR_HEIGHT / 2, 0,
        WALL, FLOOR_HEIGHT, DEPTH,
        concrete
    );

    createBox(
        WIDTH / 2, baseY + FLOOR_HEIGHT / 2, 0,
        WALL, FLOOR_HEIGHT, DEPTH,
        concrete
    );

    createBox(
        0, baseY + FLOOR_HEIGHT / 2, -DEPTH / 2,
        WIDTH, FLOOR_HEIGHT, WALL,
        concrete
    );

    createBox(
        0, baseY + FLOOR_HEIGHT / 2, DEPTH / 2,
        WIDTH, FLOOR_HEIGHT, WALL,
        concrete
    );

    // Betonstützen
    for (const x of [-38, 38]) {
        for (const z of [-38, 38]) {

            createBox(
                x, baseY + FLOOR_HEIGHT / 2, z,
                2.5, FLOOR_HEIGHT, 2.5,
                darkConcrete
            );
        }
    }

    // Querträger
    for (let z = -30; z <= 30; z += 30) {

        createBox(
            0, baseY + FLOOR_HEIGHT - 0.6, z,
            WIDTH - 4, 0.7, 0.8,
            darkConcrete,
            false
        );
    }
}

// ==========================================
// BETONVERSTÄRKUNGEN
// ==========================================

for (let floor = 0; floor < FLOOR_COUNT; floor++) {

    const y = floor * FLOOR_HEIGHT + 0.3;

    for (const x of [-43, 43]) {

        createBox(
            x, y, 0,
            1, 0.6, 86,
            darkConcrete,
            false
        );
    }
}

// ==========================================
// SPAWN ETAGE 10
// ==========================================

const SPAWN_Y = (FLOOR_COUNT - 1) * FLOOR_HEIGHT + 1.7;

camera.position.set(0, SPAWN_Y, 25);

// ==========================================
// SPIELER
// ==========================================

let yaw = 0;
let pitch = 0;

const keys = {};

document.addEventListener("keydown", e => {
    keys[e.code] = true;
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

// ==========================================
// START UND PAUSE
// ==========================================

const menu = document.getElementById("menu");
const startButton = document.getElementById("start");

startButton.addEventListener("click", () => {

    renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {

    const playing =
        document.pointerLockElement === renderer.domElement;

    menu.style.display = playing ? "none" : "flex";
});

// ==========================================
// MAUSSTEUERUNG
// ==========================================

document.addEventListener("mousemove", e => {

    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    pitch = THREE.MathUtils.clamp(
        pitch,
        -1.45,
        1.45
    );

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

// ==========================================
// KOLLISION
// ==========================================

const playerRadius = 0.45;

function collides(x, z) {

    if (x < -33 || x > 33 || z < -43 || z > 43) {
        return true;
    }

    for (const c of colliders) {

        const dx = Math.max(
            c.x - c.hx,
            Math.min(x, c.x + c.hx)
        );

        const dz = Math.max(
            c.z - c.hz,
            Math.min(z, c.z + c.hz)
        );

        if (Math.hypot(x - dx, z - dz) < playerRadius) {
            return true;
        }
    }

    return false;
}

// ==========================================
// BEWEGUNG
// ==========================================

const clock = new THREE.Clock();

function updatePlayer(delta) {

    let forward = 0;
    let side = 0;

    if (keys.KeyW) forward += 1;
    if (keys.KeyS) forward -= 1;
    if (keys.KeyD) side += 1;
    if (keys.KeyA) side -= 1;

    const direction = new THREE.Vector3(
        side,
        0,
        -forward
    );

    if (direction.lengthSq() > 0) {
        direction.normalize();
    }

    direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    const distance = 7 * delta;

    const nx = camera.position.x + direction.x * distance;
    const nz = camera.position.z + direction.z * distance;

    if (!collides(nx, camera.position.z)) {
        camera.position.x = nx;
    }

    if (!collides(camera.position.x, nz)) {
        camera.position.z = nz;
    }

    camera.position.y = SPAWN_Y;
}

// ==========================================
// GAME LOOP
// ==========================================

function animate() {

    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (document.pointerLockElement === renderer.domElement) {
        updatePlayer(delta);
    }

    renderer.render(scene, camera);
}

animate();

// ==========================================
// RESIZE
// ==========================================

window.addEventListener("resize", () => {

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
});
