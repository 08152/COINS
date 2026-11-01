import * as THREE from "three";

// ============================================
// RAW BUNKER
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x77736c);
scene.fog = new THREE.Fog(0x77736c, 65, 150);

const camera = new THREE.PerspectiveCamera(
    75, innerWidth / innerHeight, 0.1, 250
);

camera.position.set(0, 1.7, 28);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

document.body.appendChild(renderer.domElement);

// ============================================
// NATÜRLICHES UMGEBUNGSLICHT
// KEINE LAMPEN
// ============================================

scene.add(new THREE.AmbientLight(0xffffff, 1.25));

const naturalLight = new THREE.HemisphereLight(
    0xd4d0c6,
    0x49453f,
    1.1
);

scene.add(naturalLight);

// ============================================
// BETON TEXTUREN
// ============================================

function createConcreteTexture() {

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#85837d";
    ctx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 50000; i++) {

        const shade = Math.random() * 100;

        ctx.fillStyle =
            `rgba(${shade},${shade},${shade},${Math.random() * 0.2})`;

        ctx.fillRect(
            Math.random() * 1024,
            Math.random() * 1024,
            Math.random() * 5 + 1,
            Math.random() * 5 + 1
        );
    }

    // Betonflecken
    for (let i = 0; i < 120; i++) {

        const x = Math.random() * 1024;
        const y = Math.random() * 1024;

        ctx.fillStyle = "rgba(40,40,35,0.035)";

        ctx.beginPath();
        ctx.ellipse(
            x, y,
            Math.random() * 70 + 10,
            Math.random() * 40 + 10,
            Math.random(),
            0, Math.PI * 2
        );
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);

    return texture;
}

const concreteTexture = createConcreteTexture();

const concrete = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    roughness: 1,
    metalness: 0
});

const darkConcrete = new THREE.MeshStandardMaterial({
    color: 0x686660,
    roughness: 1
});

const floorMaterial = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    roughness: 1
});

const metal = new THREE.MeshStandardMaterial({
    color: 0x494741,
    roughness: 0.9,
    metalness: 0.25
});

// ============================================
// BAUFUNKTION
// ============================================

const colliders = [];

function box(x, y, z, sx, sy, sz, material, collision = true) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (collision) {
        colliders.push({
            x, z,
            hx: sx / 2,
            hz: sz / 2
        });
    }

    return mesh;
}

// ============================================
// RIESIGER BETONBUNKER
// ============================================

const W = 70;
const L = 120;
const H = 14;

// Boden
box(0, -0.5, 0, W, 1, L, floorMaterial);

// Decke
box(0, H, 0, W, 1.5, L, concrete);

// Seitenwände
box(-35, 7, 0, 1.5, 14, L, concrete);
box(35, 7, 0, 1.5, 14, L, concrete);

// Hintere Wand
box(0, 7, -60, W, 14, 1.5, concrete);

// Vorderer Wandbereich
box(-22, 7, 60, 26, 14, 1.5, concrete);
box(22, 7, 60, 26, 14, 1.5, concrete);
box(0, 12, 60, 18, 4, 1.5, concrete);

// ============================================
// BETONSTÜTZEN
// ============================================

for (let z = -50; z <= 50; z += 15) {

    for (const x of [-29, 29]) {

        box(x, 7, z, 2, 14, 2, darkConcrete);

        box(x, 13.5, z, 3, 0.5, 3, concrete);
    }
}

// Massive Querträger
for (let z = -45; z <= 45; z += 15) {

    box(0, 13, z, 68, 0.9, 1.5, darkConcrete);
}

// ============================================
// ROHRLEITUNGEN
// ============================================

function pipe(x, y, z, length, radius, horizontal = true) {

    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, length, 12),
        metal
    );

    mesh.position.set(x, y, z);

    if (horizontal) {
        mesh.rotation.z = Math.PI / 2;
    }

    scene.add(mesh);
}

pipe(-32, 10, 0, 115, 0.24);
pipe(32, 10, 0, 115, 0.18);
pipe(-32, 8.8, 0, 115, 0.12);
pipe(32, 8.8, 0, 115, 0.12);

// ============================================
// BETONBODEN-PLATTEN
// ============================================

for (let x = -30; x <= 30; x += 10) {

    for (let z = -55; z <= 55; z += 10) {

        const line = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.015, 9.8),
            darkConcrete
        );

        line.position.set(x, 0.01, z);
        scene.add(line);
    }
}

// ============================================
// GOLDMÜNZEN
// ============================================

const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9a527,
    metalness: 0.85,
    roughness: 0.24
});

const goldEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd45b,
    metalness: 0.9,
    roughness: 0.2
});

const coinGeometry = new THREE.CylinderGeometry(
    0.48, 0.48, 0.12, 32
);

const coinGroups = [];

function createCoin(x, y, z, rotation = 0) {

    const coin = new THREE.Group();

    const body = new THREE.Mesh(
        coinGeometry,
        goldMaterial
    );

    body.castShadow = true;
    body.receiveShadow = true;

    coin.add(body);

    const edge = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.49, 0.49, 0.035, 32
        ),
        goldEdgeMaterial
    );

    edge.position.y = 0.035;
    coin.add(edge);

    // Einfaches Sternsymbol
    const starShape = new THREE.Shape();

    for (let i = 0; i < 10; i++) {

        const angle = i * Math.PI / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? 0.23 : 0.10;

        const x2 = Math.cos(angle) * r;
        const y2 = Math.sin(angle) * r;

        if (i === 0) starShape.moveTo(x2, y2);
        else starShape.lineTo(x2, y2);
    }

    starShape.closePath();

    const star = new THREE.Mesh(
        new THREE.ShapeGeometry(starShape),
        goldEdgeMaterial
    );

    star.rotation.x = -Math.PI / 2;
    star.position.y = 0.065;

    coin.add(star);

    coin.position.set(x, y, z);
    coin.rotation.set(
        (Math.random() - 0.5) * 0.18,
        rotation,
        (Math.random() - 0.5) * 0.18
    );

    scene.add(coin);

    return coin;
}

// Große zufällige Münzhaufen
function createCoinPile(cx, cz, amount, radius) {

    for (let i = 0; i < amount; i++) {

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * radius;

        const x = cx + Math.cos(angle) * distance;
        const z = cz + Math.sin(angle) * distance;

        const stackHeight = Math.random() * 1.2;

        const coin = createCoin(
            x,
            0.12 + stackHeight,
            z,
            Math.random() * Math.PI
        );

        coinGroups.push(coin);
    }
}

// Münzen im gesamten Bunker
createCoinPile(-20, -40, 180, 9);
createCoinPile(15, -42, 160, 8);
createCoinPile(-8, -15, 180, 9);
createCoinPile(20, 0, 130, 8);
createCoinPile(-23, 18, 160, 9);
createCoinPile(12, 35, 180, 9);
createCoinPile(-8, 45, 100, 7);

// Einzelne Münzen
for (let i = 0; i < 280; i++) {

    const x = THREE.MathUtils.randFloat(-31, 31);
    const z = THREE.MathUtils.randFloat(-55, 55);

    createCoin(
        x,
        0.12,
        z,
        Math.random() * Math.PI
    );
}

// ============================================
// MÜNZSTAPEL
// ============================================

function createCoinStack(x, z, height) {

    for (let i = 0; i < height; i++) {

        const coin = createCoin(
            x + (Math.random() - 0.5) * 0.08,
            0.12 + i * 0.125,
            z + (Math.random() - 0.5) * 0.08,
            Math.random() * 0.1
        );

        coin.rotation.z = (Math.random() - 0.5) * 0.05;
    }
}

for (let i = 0; i < 30; i++) {

    createCoinStack(
        THREE.MathUtils.randFloat(-29, 29),
        THREE.MathUtils.randFloat(-53, 53),
        Math.floor(Math.random() * 10 + 3)
    );
}

// ============================================
// MÜNZZÄHLGERÄT
// ============================================

const machineBody = new THREE.MeshStandardMaterial({
    color: 0x393b38,
    roughness: 0.75,
    metalness: 0.35
});

const machineDark = new THREE.MeshStandardMaterial({
    color: 0x171817,
    roughness: 0.65
});

function createMachine(x, z) {

    // Gehäuse
    box(x, 2.1, z, 5, 4.2, 3, machineBody);

    // Oberer Einfülltrichter
    box(x, 4.5, z, 3.5, 0.4, 2, metal);

    // Dunkler Münzeinwurf
    box(x, 4.75, z, 2.5, 0.12, 1, machineDark, false);

    // Vorderseite
    box(x, 2.6, z + 1.56, 3.7, 1.8, 0.12, machineDark, false);

    // Mechanisches Zählfenster
    box(x, 3.1, z + 1.64, 2.5, 0.55, 0.08, metal, false);

    // Tasten
    for (let i = 0; i < 3; i++) {

        const button = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.22, 0.12),
            goldMaterial
        );

        button.position.set(
            x - 0.7 + i * 0.7,
            1.8,
            z + 1.7
        );

        scene.add(button);
    }

    // Standfüße
    for (const dx of [-1.8, 1.8]) {

        box(x + dx, 0.4, z, 0.3, 0.8, 0.3, metal);
    }

    // Auffangschale
    box(x, 0.5, z + 2.5, 3, 0.2, 1.5, metal, false);
}

createMachine(27, -5);

// ============================================
// LAGERREGAL
// ============================================

function createShelf(x, z) {

    for (let y = 1; y <= 5; y += 2) {

        box(x, y, z, 7, 0.18, 1.5, metal, false);
    }

    for (const dx of [-3.3, 3.3]) {

        box(x + dx, 2.5, z, 0.2, 5, 1.5, metal);
    }

    for (let y = 1.3; y <= 5; y += 2) {

        for (let i = 0; i < 3; i++) {

            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1.1, 1.2),
                darkConcrete
            );

            crate.position.set(
                x - 2 + i * 2,
                y + 0.6,
                z
            );

            scene.add(crate);
        }
    }
}

createShelf(29, -30);

// ============================================
// SPIELER
// ============================================

let yaw = 0;
let pitch = 0;

const keys = {};

document.addEventListener("keydown", e => {
    keys[e.code] = true;
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

document.getElementById("start").onclick = () => {
    renderer.domElement.requestPointerLock();
};

document.addEventListener("pointerlockchange", () => {

    document.getElementById("menu").style.display =
        document.pointerLockElement === renderer.domElement
            ? "none"
            : "flex";
});

document.addEventListener("mousemove", e => {

    if (document.pointerLockElement !== renderer.domElement) return;

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

// ============================================
// BEWEGUNG UND WANDKOLLISION
// ============================================

const playerRadius = 0.45;

function collides(x, z) {

    if (x < -33 || x > 33 || z < -58 || z > 58) {
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

        const distance = Math.hypot(x - dx, z - dz);

        if (distance < playerRadius) return true;
    }

    return false;
}

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

    camera.position.y = 1.7;
}

// ============================================
// SICHTBARE HÄNDE
// ============================================

const skin = new THREE.MeshStandardMaterial({
    color: 0xb18b70,
    roughness: 0.85
});

const hands = new THREE.Group();
camera.add(hands);
hands.position.set(0, -0.48, -0.75);

function createHand(x) {

    const hand = new THREE.Group();

    const palm = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.20, 0.10),
        skin
    );

    hand.add(palm);

    for (let i = 0; i < 4; i++) {

        const finger = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.12, 0.04),
            skin
        );

        finger.position.set(
            -0.055 + i * 0.037,
            -0.12,
            0
        );

        hand.add(finger);
    }

    const thumb = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.10, 0.05),
        skin
    );

    thumb.position.set(x > 0 ? -0.11 : 0.11, -0.04, 0);
    hand.add(thumb);

    hand.position.x = x;
    hand.position.y = -0.02;

    hands.add(hand);
}

createHand(-0.28);
createHand(0.28);

// ============================================
// LOOP
// ============================================

function animate() {

    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (document.pointerLockElement === renderer.domElement) {
        updatePlayer(delta);
    }

    renderer.render(scene, camera);
}

animate();

// ============================================
// RESIZE
// ============================================

window.addEventListener("resize", () => {

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
});
