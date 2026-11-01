
// ================================================
// ONE MILLION COINS
// PHYSIK ENGINE 2.0
// ================================================

export class PhysicsWorld {
    constructor(THREE, options = {}) {
        this.THREE = THREE;

        this.gravity = options.gravity ?? -9.81;
        this.iterations = options.iterations ?? 8;
        this.substeps = options.substeps ?? 3;

        this.objects = [];
        this.staticObjects = [];

        this.groundY = options.groundY ?? 0;
        this.airDrag = options.airDrag ?? 0.015;
        this.sleepThreshold = 0.04;
    }

    add(mesh, options = {}) {
        const body = {
            mesh,

            mass: options.mass ?? 1,
            invMass: 1 / (options.mass ?? 1),

            radius: options.radius ?? 0.5,

            velocity: new this.THREE.Vector3(),
            angularVelocity: new this.THREE.Vector3(),

            force: new this.THREE.Vector3(),
            torque: new this.THREE.Vector3(),

            restitution: options.restitution ?? 0.35,
            friction: options.friction ?? 0.5,

            useGravity: options.useGravity ?? true,
            isStatic: options.isStatic ?? false,

            sleeping: false,
            sleepTimer: 0,

            linearDamping: options.linearDamping ?? 0.02,
            angularDamping: options.angularDamping ?? 0.08
        };

        if (body.isStatic) {
            body.invMass = 0;
        }

        this.objects.push(body);
        return body;
    }

    addStatic(mesh) {
        this.staticObjects.push(mesh);
    }

    applyForce(body, force) {
        if (!body || body.isStatic) return;

        body.force.add(force);
        body.sleeping = false;
    }

    applyImpulse(body, impulse, point = null) {
        if (!body || body.isStatic) return;

        body.velocity.addScaledVector(
            impulse,
            body.invMass
        );

        if (point) {
            const offset = point.clone().sub(body.mesh.position);
            body.angularVelocity.add(
                new this.THREE.Vector3().crossVectors(offset, impulse)
                    .multiplyScalar(body.invMass)
            );
        }

        body.sleeping = false;
    }

    setVelocity(body, velocity) {
        body.velocity.copy(velocity);
        body.sleeping = false;
    }

    update(deltaTime) {
        const frameTime = Math.min(deltaTime, 0.05);
        const dt = frameTime / this.substeps;

        for (let step = 0; step < this.substeps; step++) {
            this.integrate(dt);

            for (let i = 0; i < this.iterations; i++) {
                this.solveGround();
                this.solveStatic();
                this.solveDynamic();
            }

            this.updateSleeping(dt);
        }
    }

    integrate(dt) {
        for (const body of this.objects) {
            if (body.isStatic || body.sleeping) continue;

            if (body.useGravity) {
                body.velocity.y += this.gravity * dt;
            }

            body.velocity.addScaledVector(
                body.force,
                body.invMass * dt
            );

            body.force.set(0, 0, 0);

            body.velocity.multiplyScalar(
                Math.max(0, 1 - body.linearDamping * dt)
            );

            body.angularVelocity.multiplyScalar(
                Math.max(0, 1 - body.angularDamping * dt)
            );

            body.mesh.position.addScaledVector(
                body.velocity,
                dt
            );

            const angularSpeed = body.angularVelocity.length();

            if (angularSpeed > 0.00001) {
                const axis = body.angularVelocity.clone().normalize();

                const rotation = new this.THREE.Quaternion()
                    .setFromAxisAngle(axis, angularSpeed * dt);

                body.mesh.quaternion.multiply(rotation);
            }
        }
    }

    solveGround() {
        for (const body of this.objects) {
            if (body.isStatic) continue;

            const bottom = body.mesh.position.y - body.radius;

            if (bottom >= this.groundY) continue;

            body.mesh.position.y = this.groundY + body.radius;

            if (body.velocity.y < 0) {
                body.velocity.y *= -body.restitution;
            }

            const normalSpeed = body.velocity.y;

            const horizontal = new this.THREE.Vector3(
                body.velocity.x,
                0,
                body.velocity.z
            );

            const speed = horizontal.length();

            if (speed > 0.0001) {
                const normalForce = Math.abs(this.gravity) * body.mass;
                const frictionImpulse = Math.min(
                    speed * body.mass,
                    body.friction * normalForce * 0.016
                );

                horizontal.multiplyScalar(
                    Math.max(0, 1 - frictionImpulse / (speed * body.mass))
                );

                body.velocity.x = horizontal.x;
                body.velocity.z = horizontal.z;

                body.angularVelocity.x += horizontal.z * 0.03;
                body.angularVelocity.z -= horizontal.x * 0.03;
            }

            if (Math.abs(normalSpeed) < 0.12) {
                body.velocity.y = 0;
            }
        }
    }

    solveStatic() {
        for (const body of this.objects) {
            if (body.isStatic) continue;

            for (const obstacle of this.staticObjects) {
                const box = new this.THREE.Box3()
                    .setFromObject(obstacle);

                const p = body.mesh.position;

                const closest = new this.THREE.Vector3(
                    Math.max(box.min.x, Math.min(p.x, box.max.x)),
                    Math.max(box.min.y, Math.min(p.y, box.max.y)),
                    Math.max(box.min.z, Math.min(p.z, box.max.z))
                );

                const difference = p.clone().sub(closest);
                const distance = difference.length();

                if (distance >= body.radius) continue;

                let normal;

                if (distance < 0.00001) {
                    const distances = [
                        Math.abs(p.x - box.min.x),
                        Math.abs(box.max.x - p.x),
                        Math.abs(p.y - box.min.y),
                        Math.abs(box.max.y - p.y),
                        Math.abs(p.z - box.min.z),
                        Math.abs(box.max.z - p.z)
                    ];

                    const min = Math.min(...distances);
                    const index = distances.indexOf(min);

                    const normals = [
                        new this.THREE.Vector3(-1, 0, 0),
                        new this.THREE.Vector3(1, 0, 0),
                        new this.THREE.Vector3(0, -1, 0),
                        new this.THREE.Vector3(0, 1, 0),
                        new this.THREE.Vector3(0, 0, -1),
                        new this.THREE.Vector3(0, 0, 1)
                    ];

                    normal = normals[index];
                } else {
                    normal = difference.normalize();
                }

                const penetration = body.radius - distance;

                p.addScaledVector(normal, penetration);

                const velocityNormal = body.velocity.dot(normal);

                if (velocityNormal < 0) {
                    body.velocity.addScaledVector(
                        normal,
                        -(1 + body.restitution) * velocityNormal
                    );
                }
            }
        }
    }

    solveDynamic() {
        for (let i = 0; i < this.objects.length; i++) {
            const a = this.objects[i];

            for (let j = i + 1; j < this.objects.length; j++) {
                const b = this.objects[j];

                if (a.isStatic && b.isStatic) continue;

                const delta = b.mesh.position.clone()
                    .sub(a.mesh.position);

                const distance = delta.length();
                const minimum = a.radius + b.radius;

                if (distance >= minimum || distance < 0.000001) {
                    continue;
                }

                const normal = delta.multiplyScalar(1 / distance);
                const penetration = minimum - distance;

                const totalInvMass = a.invMass + b.invMass;
                if (totalInvMass === 0) continue;

                // Positionskorrektur
                const correction = Math.max(0, penetration - 0.001) *
                    0.8 / totalInvMass;

                a.mesh.position.addScaledVector(
                    normal,
                    -correction * a.invMass
                );

                b.mesh.position.addScaledVector(
                    normal,
                    correction * b.invMass
                );

                // Relativgeschwindigkeit
                const relative = b.velocity.clone()
                    .sub(a.velocity);

                const velocityNormal = relative.dot(normal);

                if (velocityNormal > 0) continue;

                // Stoßimpuls
                const restitution = Math.min(
                    a.restitution,
                    b.restitution
                );

                const impulseMagnitude =
                    -(1 + restitution) * velocityNormal /
                    totalInvMass;

                const impulse = normal.clone()
                    .multiplyScalar(impulseMagnitude);

                a.velocity.addScaledVector(
                    impulse,
                    -a.invMass
                );

                b.velocity.addScaledVector(
                    impulse,
                    b.invMass
                );

                // Reibungsimpuls
                const tangent = relative.clone()
                    .sub(normal.clone().multiplyScalar(velocityNormal));

                if (tangent.lengthSq() > 0.000001) {
                    tangent.normalize();

                    let jt = -relative.dot(tangent) / totalInvMass;

                    const friction = Math.sqrt(
                        a.friction * b.friction
                    );

                    jt = Math.max(
                        -impulseMagnitude * friction,
                        Math.min(impulseMagnitude * friction, jt)
                    );

                    const frictionImpulse = tangent.multiplyScalar(jt);

                    a.velocity.addScaledVector(
                        frictionImpulse,
                        -a.invMass
                    );

                    b.velocity.addScaledVector(
                        frictionImpulse,
                        b.invMass
                    );
                }

                a.sleeping = false;
                b.sleeping = false;
            }
        }
    }

    updateSleeping(dt) {
        for (const body of this.objects) {
            if (body.isStatic) continue;

            const speed = body.velocity.length();
            const rotation = body.angularVelocity.length();

            if (
                speed < this.sleepThreshold &&
                rotation < this.sleepThreshold &&
                body.mesh.position.y <= this.groundY + body.radius + 0.02
            ) {
                body.sleepTimer += dt;

                if (body.sleepTimer > 0.6) {
                    body.velocity.set(0, 0, 0);
                    body.angularVelocity.set(0, 0, 0);
                    body.sleeping = true;
                }
            } else {
                body.sleepTimer = 0;
                body.sleeping = false;
            }
        }
    }

    remove(body) {
        const index = this.objects.indexOf(body);

        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }

    clear() {
        this.objects.length = 0;
        this.staticObjects.length = 0;
    }
}
