
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { createCoin } from "./coin.js";
import { PhysicsWorld } from "./physik.js";
import { applyLighting } from "./licht.js";

let scene;
let camera;
let renderer;
let physics;
let playing = false;
let yaw = 0;
let pitch = 0;

const keys = {};

const WIDTH = 90;
const DEPTH = 90;
const FLOOR_HEIGHT = 9;
const FLOOR_COUNT = 10;
const SPAWN_Y = (FLOOR_COUNT - 1) * FLOOR_HEIGHT + 1.7;

const PLAYER_SPEED = 9;

export async function initGame() {

    // SZENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x777777);
    scene.fog = new THREE.Fog(0x777777, 40, 190);

    // KAMERA
    camera = new THREE.PerspectiveCamera(
        75,
        innerWidth / innerHeight,
        0.1,
        300
    );

    camera.position.set(0, SPAWN_Y, 25);
    camera.rotation.order = "YXZ";

    // LICHT
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(-30, 100, 40);
    scene.add(sun);

    applyLighting(scene);

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;

    document.body.appendChild(renderer.domElement);

    // PHYSIK
    physics = new PhysicsWorld(THREE, {
        gravity: -9.81,
        iterations: 8,
        substeps: 3,
        groundY: -1000
    });

    // BETON
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 512;
    textureCanvas.height = 512;

    const ctx = textureCanvas.getContext("2d");
    ctx.fillStyle = "#777777";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 14000; i++) {
        const shade = 70 + Math.random() * 80;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.18)`;
        ctx.fillRect(
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 3 + 1,
            Math.random() * 3 + 1
        );
    }

    const concreteTexture = new THREE.CanvasTexture(textureCanvas);
    concreteTexture.wrapS = THREE.RepeatWrapping;
    concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(8, 8);

    const concrete = new THREE.MeshStandardMaterial({
        map: concreteTexture,
        color: 0x999999,
        roughness: 0.95
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: concreteTexture,
        color: 0x777777,
        roughness: 0.98
    });

    // BUNKER
    const bunker = new THREE.Group();
    scene.add(bunker);

    function addWall(x, y, z, sx, sy, sz, material = concrete) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(sx, sy, sz),
            material
        );

        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        bunker.add(mesh);
    }

    for (let floor = 0; floor < FLOOR_COUNT; floor++) {

        const y = floor * FLOOR_HEIGHT;

        // Boden
        addWall(0, y - 0.5, 0, WIDTH, 1, DEPTH, floorMaterial);

        // Decke
        if (floor < FLOOR_COUNT - 1) {
            addWall(
                0,
                y + FLOOR_HEIGHT - 0.5,
                0,
                WIDTH,
                1,
                DEPTH
            );
        }

        // Außenwände
        addWall(0, y + FLOOR_HEIGHT / 2, -DEPTH / 2, WIDTH, FLOOR_HEIGHT, 2);
        addWall(0, y + FLOOR_HEIGHT / 2, DEPTH / 2, WIDTH, FLOOR_HEIGHT, 2);
        addWall(-WIDTH / 2, y + FLOOR_HEIGHT / 2, 0, 2, FLOOR_HEIGHT, DEPTH);
        addWall(WIDTH / 2, y + FLOOR_HEIGHT / 2, 0, 2, FLOOR_HEIGHT, DEPTH);

        // Betonstützen
        for (const x of [-40, 40]) {
            for (const z of [-40, 40]) {
                addWall(x, y + FLOOR_HEIGHT / 2, z, 2, FLOOR_HEIGHT, 2);
            }
        }
    }

    // MÜNZEN
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {

        const floorY = floor * FLOOR_HEIGHT;

        for (let i = 0; i < 35; i++) {

            const coin = createCoin(THREE);

            coin.position.set(
                THREE.MathUtils.randFloat(-35, 35),
                floorY + 1.2 + Math.random() * 4,
                THREE.MathUtils.randFloat(-35, 35)
            );

            coin.rotation.set(
                Math.random() * 0.2,
                Math.random() * Math.PI * 2,
                Math.random() * 0.2
            );

            coin.scale.setScalar(
                THREE.MathUtils.randFloat(0.65, 1)
            );

            scene.add(coin);

            const body = physics.add(coin, {
                mass: 0.2,
                radius: 0.5 * coin.scale.x,
                restitution: 0.3,
                friction: 0.6
            });

            physics.applyImpulse(
                body,
                new THREE.Vector3(
                    THREE.MathUtils.randFloat(-0.4, 0.4),
                    THREE.MathUtils.randFloat(-0.2, 0.5),
                    THREE.MathUtils.randFloat(-0.4, 0.4)
                )
            );
        }
    }

    // STEUERUNG
    window.addEventListener("keydown", event => {
        keys[event.code] = true;

        if (event.code === "Escape" && playing) {
            document.exitPointerLock();
        }
    });

    window.addEventListener("keyup", event => {
        keys[event.code] = false;
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

        pitch = THREE.MathUtils.clamp(
            pitch,
            -Math.PI / 2 + 0.01,
            Math.PI / 2 - 0.01
        );

        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
    });

    // ANIMATION
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.033);

        updatePlayer(dt);
        physics.update(dt);

        renderer.render(scene, camera);
    }

    animate();

    // FENSTERGRÖSSE
    window.addEventListener("resize", () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });
}

// STARTBUTTON
export function startGame() {
    if (!renderer) return;

    renderer.domElement.requestPointerLock();
}

// SPIELERBEWEGUNG
function updatePlayer(dt) {
    if (!playing) return;

    const forward = new THREE.Vector3(
        -Math.sin(yaw), 0, -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw), 0, -Math.sin(yaw)
    );

    const movement = new THREE.Vector3();

    if (keys.KeyW) movement.add(forward);
    if (keys.KeyS) movement.sub(forward);
    if (keys.KeyA) movement.sub(right);
    if (keys.KeyD) movement.add(right);

    if (movement.lengthSq() > 0) {
        movement.normalize().multiplyScalar(PLAYER_SPEED * dt);
    }

    const nextX = camera.position.x + movement.x;
    const nextZ = camera.position.z + movement.z;

    if (Math.abs(nextX) < WIDTH / 2 - 3) {
        camera.position.x = nextX;
    }

    if (Math.abs(nextZ) < DEPTH / 2 - 3) {
        camera.position.z = nextZ;
    }

    camera.position.y = SPAWN_Y;
}
