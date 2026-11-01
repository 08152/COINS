// coin.js
// ONE MILLION COINS – glänzende Goldmünze mit Stern

export function createCoin(THREE) {
    const coin = new THREE.Group();

    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffc400,
        metalness: 1.0,
        roughness: 0.18
    });

    const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xb8860b,
        metalness: 1.0,
        roughness: 0.25
    });

    const starMaterial = new THREE.MeshStandardMaterial({
        color: 0xffe36b,
        metalness: 1.0,
        roughness: 0.12
    });

    // Münzkörper
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.16, 96),
        goldMaterial
    );

    body.rotation.x = Math.PI / 2;
    coin.add(body);

    // Äußerer Rand
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.91, 0.055, 12, 96),
        edgeMaterial
    );

    coin.add(rim);

    // Innerer Ring
    const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.73, 0.018, 8, 96),
        starMaterial
    );

    innerRing.position.z = 0.085;
    coin.add(innerRing);

    // Sternform
    const starShape = new THREE.Shape();

    const outerRadius = 0.58;
    const innerRadius = 0.25;

    for (let i = 0; i < 10; i++) {
        const angle = Math.PI / 2 + i * Math.PI / 5;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            starShape.moveTo(x, y);
        } else {
            starShape.lineTo(x, y);
        }
    }

    starShape.closePath();

    const starGeometry = new THREE.ExtrudeGeometry(starShape, {
        depth: 0.055,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.025,
        bevelThickness: 0.025
    });

    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.z = 0.09;
    coin.add(star);

    // Kleine Details am Münzrand
    for (let i = 0; i < 48; i++) {
        const angle = (i / 48) * Math.PI * 2;

        const detail = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.035, 0.12),
            edgeMaterial
        );

        detail.position.set(
            Math.cos(angle) * 0.97,
            Math.sin(angle) * 0.97,
            0
        );

        detail.rotation.z = angle;
        coin.add(detail);
    }

    coin.traverse(object => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });

    return coin;
}
