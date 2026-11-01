
// ================================================
// ONE MILLION COINS
// LICHT.JS
// Keine künstlichen Lichtquellen
// ================================================

export function applyLighting(THREE, scene) {

    scene.background = new THREE.Color(0x777777);

    scene.fog = new THREE.Fog(
        0x777777,
        35,
        180
    );
}

// Beton
export function createConcreteMaterial(THREE, texture) {

    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x999999
    });
}

// Boden
export function createFloorMaterial(THREE, texture) {

    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x777777
    });
}

// Dunkler Beton
export function createDarkConcreteMaterial(THREE, texture) {

    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x555555
    });
}
