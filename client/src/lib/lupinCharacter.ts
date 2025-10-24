import * as THREE from "three";

/**
 * Crea il personaggio di Lupin in stile low poly
 * Arsène Lupin - Il ladro gentiluomo
 */
export function createLupinCharacter(): THREE.Group {
  const lupin = new THREE.Group();

  // Materiali
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, // Nero per il vestito
    roughness: 0.7,
  });

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdbac, // Pelle chiara
    roughness: 0.6,
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Bianco per guanti e camicia
    roughness: 0.5,
  });

  const cloakMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, // Nero per mantello
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // CORPO
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.4),
    bodyMaterial
  );
  torso.position.y = 0.9;
  torso.castShadow = true;
  lupin.add(torso);

  // TESTA
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    skinMaterial
  );
  head.position.y = 1.5;
  head.castShadow = true;
  lupin.add(head);

  // CAPPELLO A CILINDRO (iconico!)
  const hatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16),
    bodyMaterial
  );
  hatBrim.position.y = 1.7;
  lupin.add(hatBrim);

  const hatTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16),
    bodyMaterial
  );
  hatTop.position.y = 1.95;
  lupin.add(hatTop);

  // MONOCOLO
  const monocle = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.02, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  monocle.position.set(0.15, 1.55, 0.21);
  monocle.rotation.y = Math.PI / 2;
  lupin.add(monocle);

  // Lente monocolo
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.1,
    })
  );
  lens.position.set(0.15, 1.55, 0.21);
  lens.rotation.y = Math.PI / 2;
  lupin.add(lens);

  // BRACCIA
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.7, 0.2),
    bodyMaterial
  );
  leftArm.position.set(-0.4, 0.9, 0);
  leftArm.castShadow = true;
  lupin.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.7, 0.2),
    bodyMaterial
  );
  rightArm.position.set(0.4, 0.9, 0);
  rightArm.castShadow = true;
  lupin.add(rightArm);

  // GUANTI BIANCHI (iconici!)
  const leftGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.25, 0.22),
    whiteMaterial
  );
  leftGlove.position.set(-0.4, 0.5, 0);
  lupin.add(leftGlove);

  const rightGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.25, 0.22),
    whiteMaterial
  );
  rightGlove.position.set(0.4, 0.5, 0);
  lupin.add(rightGlove);

  // GAMBE
  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.7, 0.25),
    bodyMaterial
  );
  leftLeg.position.set(-0.15, 0.15, 0);
  leftLeg.castShadow = true;
  lupin.add(leftLeg);

  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.7, 0.25),
    bodyMaterial
  );
  rightLeg.position.set(0.15, 0.15, 0);
  rightLeg.castShadow = true;
  lupin.add(rightLeg);

  // SCARPE
  const leftShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.1, 0.35),
    bodyMaterial
  );
  leftShoe.position.set(-0.15, -0.15, 0.05);
  lupin.add(leftShoe);

  const rightShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.1, 0.35),
    bodyMaterial
  );
  rightShoe.position.set(0.15, -0.15, 0.05);
  lupin.add(rightShoe);

  // MANTELLO (drammatico!)
  const cloakGeometry = new THREE.PlaneGeometry(1, 1.2);
  const cloak = new THREE.Mesh(cloakGeometry, cloakMaterial);
  cloak.position.set(0, 0.9, -0.25);
  cloak.castShadow = true;
  lupin.add(cloak);

  // Animazione mantello (leggero movimento)
  lupin.userData.animateCloak = (time: number) => {
    cloak.rotation.x = Math.sin(time * 2) * 0.1;
  };

  // CAMICIA BIANCA (colletto visibile)
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.35),
    whiteMaterial
  );
  collar.position.set(0, 1.25, 0);
  lupin.add(collar);

  // Posizione iniziale
  lupin.position.y = 0.2;

  return lupin;
}

/**
 * Anima il personaggio di Lupin
 */
export function animateLupin(
  lupin: THREE.Group,
  isMoving: boolean,
  time: number
) {
  if (!lupin) return;

  // Animazione mantello
  if (lupin.userData.animateCloak) {
    lupin.userData.animateCloak(time);
  }

  // Bob movimento (su e giù leggero mentre cammina)
  if (isMoving) {
    lupin.position.y = 0.2 + Math.abs(Math.sin(time * 8)) * 0.05;
    
    // Rotazione leggera braccia
    const leftArm = lupin.children.find(
      (child) => child.position.x < 0 && child.position.y > 0.8
    );
    const rightArm = lupin.children.find(
      (child) => child.position.x > 0 && child.position.y > 0.8
    );

    if (leftArm) {
      leftArm.rotation.x = Math.sin(time * 8) * 0.3;
    }
    if (rightArm) {
      rightArm.rotation.x = -Math.sin(time * 8) * 0.3;
    }
  } else {
    lupin.position.y = 0.2;
  }
}

