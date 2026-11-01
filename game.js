
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { createCoin } from "./coin.js";
import { PhysicsWorld } from "./physik.js";
import { applyLighting } from "./licht.js";

// ================================================
// ONE MILLION COINS
// GAME.JS
// ================================================

let scene;
let camera;
let renderer;
let physics;

let coins = [];
let clock;

let gameStarted = false;
let animationFrame = null;

let keys = {};

let yaw = 0;
let pitch = 0;

const FLOOR_COUNT = 10;
const FLOOR_HEIGHT = 9;

const ROOM_WIDTH = 36;
const ROOM_DEPTH = 36;
const WALL_HEIGHT = 8;

const COINS_PER_FLOOR = 35;

const PLAYER_HEIGHT = 1.75;
const PLAYER_SPEED = 7;

let playerPosition = new THREE.Vector3(
    0,
    FLOOR_HEIGHT * (FLOOR_COUNT - 1) + PLAYER_HEIGHT,
    0
);

// ================================================
// INITIALISIERUNG
// ================================================

export async function initGame() {

    scene = new THREE.Scene();

    applyLighting(THREE, scene);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );

    camera.position.copy(playerPosition);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.zIndex = "0";

    clock = new THREE.Clock();

    createBunker();
    createCoins();
    createPhysics();

    window.addEventListener("resize", onResize);

    window.addEventListener("keydown", event => {
        keys[event.code] = true;

        if (event.code === "Escape" && gameStarted) {
            document.exitPointerLock();
        }
    });

    window.addEventListener("keyup", event => {
        keys[event.code] = false;
    });

    document.addEventListener(
        "pointerlockchange",
        onPointerLockChange
    );

    document.addEventListener(
        "mousemove",
        onMouseMove
    );

    animate();
}

// ================================================
// BUNKER
// ================================================

function createBunker() {

    const concrete = new THREE.MeshBasicMaterial({
        color: 0x777777
    });

    const darkConcrete = new THREE.MeshBasicMaterial({
        color: 0x484848
    });

    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x656565
    });

    const wallGeometry = new THREE.BoxGeometry(
        ROOM_WIDTH,
        WALL_HEIGHT,
        0.5
    );

    const sideGeometry = new THREE.BoxGeometry(
        0.5,
        WALL_HEIGHT,
        ROOM_DEPTH
    );

    for (let floor = 0; floor < FLOOR_COUNT; floor++) {

        const y = floor * FLOOR_HEIGHT;

        // Bodenplatte
        const floorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(
                ROOM_WIDTH,
                0.6,
                ROOM_DEPTH
            ),
            floorMaterial
        );

        floorMesh.position.set(
            0,
            y,
            0
        );

        floorMesh.receiveShadow = true;
        scene.add(floorMesh);

        // Decke außer auf der obersten Etage
        if (floor < FLOOR_COUNT - 1) {

            const ceiling = new THREE.Mesh(
                new THREE.BoxGeometry(
                    ROOM_WIDTH,
                    0.5,
                    ROOM_DEPTH
                ),
                darkConcrete
            );

            ceiling.position.set(
                0,
                y + WALL_HEIGHT,
                0
            );

            scene.add(ceiling);
        }

        // Wände
        const north = new THREE.Mesh(
            wallGeometry,
            concrete
        );

        north.position.set(
            0,
            y + WALL_HEIGHT / 2,
            -ROOM_DEPTH / 2
        );

        const south = new THREE.Mesh(
            wallGeometry,
            concrete
        );

        south.position.set(
            0,
            y + WALL_HEIGHT / 2,
            ROOM_DEPTH / 2
        );

        const east = new THREE.Mesh(
            sideGeometry,
            concrete
        );

        east.position.set(
            ROOM_WIDTH / 2,
            y + WALL_HEIGHT / 2,
            0
        );

        const west = new THREE.Mesh(
            sideGeometry,
            concrete
        );

        west.position.set(
            -ROOM_WIDTH / 2,
            y + WALL_HEIGHT / 2,
            0
        );

        scene.add(north, south, east, west);

        // Betonstützen
        const pillarGeometry = new THREE.BoxGeometry(
            0.8,
            WALL_HEIGHT,
            0.8
        );

        for (const x of [-15, 15]) {
            for (const z of [-15, 15]) {

                const pillar = new THREE.Mesh(
                    pillarGeometry,
                    darkConcrete
                );

                pillar.position.set(
                    x,
                    y + WALL_HEIGHT / 2,
                    z
                );

                scene.add(pillar);
            }
        }
    }
}

// ================================================
// MÜNZEN
// ================================================

function createCoins() {

    const coinPositions = [];

    for (let floor = 0; floor < FLOOR_COUNT; floor++) {

        const floorY = floor * FLOOR_HEIGHT + 0.7;

        for (let i = 0; i < COINS_PER_FLOOR; i++) {

            const x = (Math.random() - 0.5) * 28;
            const z = (Math.random() - 0.5) * 28;

            coinPositions.push({
                x,
                y: floorY + Math.random() * 3,
                z
            });
        }
    }

    for (const position of coinPositions) {

        const coin = createCoin(THREE);

        coin.position.set(
            position.x,
            position.y,
            position.z
        );

        coin.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        coin.scale.setScalar(0.65);

        scene.add(coin);

        coins.push(coin);
    }
}

// ================================================
// PHYSIK
// ================================================

function createPhysics() {

    physics = new PhysicsWorld(THREE, {
        gravity: -9.81,
        iterations: 8,
        substeps: 3,
        groundY: -1000
    });

    // Etagen als statische Kollisionsflächen
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {

        const y = floor * FLOOR_HEIGHT;

        const collider = new THREE.Mesh(
            new THREE.BoxGeometry(
                ROOM_WIDTH,
                0.6,
                ROOM_DEPTH
            ),
            new THREE.MeshBasicMaterial({
                visible: false
            })
        );

        collider.position.set(0, y, 0);
        collider.updateMatrixWorld(true);

        physics.addStatic(collider);

        // Collider-Referenz behalten
        scene.add(collider);
    }

    // Wand-Collider
    const wallColliders = [
        {
            x: 0,
            y: FLOOR_HEIGHT * (FLOOR_COUNT - 1) + WALL_HEIGHT / 2,
            z: -ROOM_DEPTH / 2,
            sx: ROOM_WIDTH,
            sy: WALL_HEIGHT,
            sz: 0.5
        },
        {
            x: 0,
            y: FLOOR_HEIGHT * (FLOOR_COUNT - 1) + WALL_HEIGHT / 2,
            z: ROOM_DEPTH / 2,
            sx: ROOM_WIDTH,
            sy: WALL_HEIGHT,
            sz: 0.5
        },
        {
            x: -ROOM_WIDTH / 2,
            y: FLOOR_HEIGHT * (FLOOR_COUNT - 1) + WALL_HEIGHT / 2,
            z: 0,
            sx: 0.5,
            sy: WALL_HEIGHT,
            sz: ROOM_DEPTH
        },
        {
            x: ROOM_WIDTH / 2,
            y: FLOOR_HEIGHT * (FLOOR_COUNT - 1) + WALL_HEIGHT / 2,
            z: 0,
            sx: 0.5,
            sy: WALL_HEIGHT,
            sz: ROOM_DEPTH
        }
    ];

    for (const wall of wallColliders) {

        const collider = new THREE.Mesh(
            new THREE.BoxGeometry(
                wall.sx,
                wall.sy,
                wall.sz
            ),
            new THREE.MeshBasicMaterial({
                visible: false
            })
        );

        collider.position.set(
            wall.x,
            wall.y,
            wall.z
        );

        collider.updateMatrixWorld(true);

        scene.add(collider);
        physics.addStatic(collider);
    }

    // Münzen als Physikobjekte
    for (const coin of coins) {

        const body = physics.add(coin, {
            mass: 1,
            radius: 0.65,
            restitution: 0.25,
            friction: 0.7,
            linearDamping: 0.04,
            angularDamping: 0.1
        });

        body.velocity.set(
            (Math.random() - 0.5) * 0.5,
            0,
            (Math.random() - 0.5) * 0.5
        );
    }
}

// ================================================
// SPIEL STARTEN
// ================================================

export function startGame() {

    if (gameStarted) return;

    const canvas = renderer.domElement;

    canvas.requestPointerLock();

    gameStarted = true;

    const menu = document.getElementById("menu");

    if (menu) {
        menu.style.display = "none";
    }
}

// ================================================
// MAUS
// ================================================

function onMouseMove(event) {

    if (!gameStarted) return;

    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    const sensitivity = 0.002;

    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

    pitch = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, pitch)
    );

    camera.rotation.order = "YXZ";
    camera.rotation.set(
        pitch,
        yaw,
        0
    );
}

// ================================================
// MENÜ BEI ESC
// ================================================

function onPointerLockChange() {

    if (document.pointerLockElement !== renderer.domElement) {

        gameStarted = false;

        const menu = document.getElementById("menu");

        if (menu) {
            menu.style.display = "flex";
        }
    }
}

// ================================================
// SPIELER
// ================================================

function updatePlayer(deltaTime) {

    if (!gameStarted) return;

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
        movement.normalize();

        playerPosition.addScaledVector(
            movement,
            PLAYER_SPEED * deltaTime
        );
    }

    const limitX = ROOM_WIDTH / 2 - 1;
    const limitZ = ROOM_DEPTH / 2 - 1;

    playerPosition.x = THREE.MathUtils.clamp(
        playerPosition.x,
        -limitX,
        limitX
    );

    playerPosition.z = THREE.MathUtils.clamp(
        playerPosition.z,
        -limitZ,
        limitZ
    );

    camera.position.copy(playerPosition);
}

// ================================================
// FENSTERGRÖSSE
// ================================================

function onResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

// ================================================
// HAUPTSCHLEIFE
// ================================================

function animate() {

    animationFrame = requestAnimationFrame(animate);

    const deltaTime = Math.min(
        clock.getDelta(),
        0.05
    );

    updatePlayer(deltaTime);

    if (physics) {
        physics.update(deltaTime);
    }

    renderer.render(scene, camera);
}
