
// ================================================
// ONE MILLION COINS
// LICHT.JS
// ================================================

export function applyLighting(THREE, scene) {

    scene.background = new THREE.Color(0x777777);

    scene.fog = new THREE.Fog(
        0x777777,
        35,
        180
    );
}

export function createConcreteMaterial(THREE, texture) {

    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x999999
    });
}

export function createFloorMaterial(THREE, texture) {

    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x777777
    });
}

export function createDarkConcreteMaterial(THREE, texture) {

    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x555555
    });
}
