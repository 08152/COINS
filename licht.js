// licht.js
// ONE MILLION COINS – dezente natürliche Sichtbarkeit
// Keine Lampen, keine Lichtquellen und keine künstliche Beleuchtung.
// Die Materialien bleiben auch ohne Three.js-Lichter sichtbar.

export function applyLighting(scene) {
    scene.background = new THREE.Color(0x777777);
    scene.fog = new THREE.Fog(0x777777, 35, 180);

    // Keine Lichtquellen hinzufügen.
    // MeshBasicMaterial muss für die Betonflächen verwendet werden,
    // damit sie auch ohne Beleuchtung sichtbar bleiben.
}

export function createConcreteMaterial(texture) {
    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x999999,
        roughness: 1
    });
}

export function createFloorMaterial(texture) {
    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x777777
    });
}

export function createDarkConcreteMaterial(texture) {
    return new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x555555
    });
}
