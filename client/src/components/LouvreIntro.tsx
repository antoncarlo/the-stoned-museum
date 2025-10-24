import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface LouvreIntroProps {
  onComplete: () => void;
}

/**
 * Sequenza intro cinematica del Louvre
 * - Vista esterna notturna del cortile con piramide
 * - Camera si avvicina alla piramide
 * - Entra attraverso il vetro
 * - Fade to museo interno
 */
export default function LouvreIntro({ onComplete }: LouvreIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [skipVisible, setSkipVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628); // Cielo notturno
    scene.fog = new THREE.Fog(0x0a1628, 50, 200);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 80); // Inizio lontano
    camera.lookAt(0, 10, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting - Notturno
    const ambientLight = new THREE.AmbientLight(0x2a3f5f, 0.3);
    scene.add(ambientLight);

    // Luna
    const moonLight = new THREE.DirectionalLight(0x6688aa, 0.5);
    moonLight.position.set(-50, 100, -50);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // Stelle
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
    });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 400;
      const y = Math.random() * 200 + 50;
      const z = (Math.random() - 0.5) * 400;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Pavimento cortile
    const courtyardFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.8,
        metalness: 0.2,
      })
    );
    courtyardFloor.rotation.x = -Math.PI / 2;
    courtyardFloor.receiveShadow = true;
    scene.add(courtyardFloor);

    // Pattern pavimento
    const gridHelper = new THREE.GridHelper(150, 75, 0x555555, 0x444444);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // PIRAMIDE DI VETRO (illuminata)
    const pyramidHeight = 20;
    const pyramidBase = 30;
    const pyramidGeometry = new THREE.ConeGeometry(
      pyramidBase / 2,
      pyramidHeight,
      4
    );
    const pyramidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.15,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      emissive: 0xffdd88,
      emissiveIntensity: 0.3,
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(0, pyramidHeight / 2, 0);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.castShadow = true;
    scene.add(pyramid);

    // Struttura metallica piramide (illuminata)
    const edgesGeometry = new THREE.EdgesGeometry(pyramidGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0xffdd88,
      linewidth: 2,
    });
    const pyramidEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    pyramidEdges.position.copy(pyramid.position);
    pyramidEdges.rotation.copy(pyramid.rotation);
    scene.add(pyramidEdges);

    // Luci interne piramide
    const pyramidLight1 = new THREE.PointLight(0xffdd88, 2, 40);
    pyramidLight1.position.set(0, 5, 0);
    scene.add(pyramidLight1);

    const pyramidLight2 = new THREE.PointLight(0xffdd88, 1.5, 30);
    pyramidLight2.position.set(0, 15, 0);
    scene.add(pyramidLight2);

    // PALAZZO LOUVRE (semplificato)
    function createPalaceWing(x: number, z: number, width: number, depth: number) {
      const wingGroup = new THREE.Group();

      // Edificio principale
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, 25, depth),
        new THREE.MeshStandardMaterial({
          color: 0xd4a574,
          roughness: 0.7,
          emissive: 0xffaa44,
          emissiveIntensity: 0.1,
        })
      );
      building.position.y = 12.5;
      building.castShadow = true;
      wingGroup.add(building);

      // Finestre illuminate
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 3; j++) {
          const windowLight = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 2),
            new THREE.MeshBasicMaterial({
              color: 0xffeeaa,
              transparent: true,
              opacity: 0.8,
            })
          );
          windowLight.position.set(
            -width / 2 + 5 + i * 5,
            5 + j * 6,
            depth / 2 + 0.1
          );
          wingGroup.add(windowLight);

          // Luce dalle finestre
          const windowPointLight = new THREE.PointLight(0xffeeaa, 0.5, 10);
          windowPointLight.position.copy(windowLight.position);
          windowPointLight.position.z += 2;
          wingGroup.add(windowPointLight);
        }
      }

      // Tetto
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 2, 3, depth + 2),
        new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          roughness: 0.9,
        })
      );
      roof.position.y = 26.5;
      wingGroup.add(roof);

      wingGroup.position.set(x, 0, z);
      return wingGroup;
    }

    // 3 ali del palazzo
    scene.add(createPalaceWing(-50, -40, 40, 15)); // Sinistra
    scene.add(createPalaceWing(50, -40, 40, 15)); // Destra
    scene.add(createPalaceWing(0, -70, 120, 15)); // Fondo

    // Fontane con riflessi
    function createFountain(x: number, z: number) {
      const fountainGroup = new THREE.Group();

      // Base fontana
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3.5, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      base.position.y = 0.25;
      fountainGroup.add(base);

      // Acqua (riflettente)
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(2.8, 32),
        new THREE.MeshStandardMaterial({
          color: 0x1a3a5a,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0x1a3a5a,
          emissiveIntensity: 0.2,
        })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.51;
      fountainGroup.add(water);

      // Luce sottacqua
      const underwaterLight = new THREE.PointLight(0x4488ff, 1, 15);
      underwaterLight.position.y = 1;
      fountainGroup.add(underwaterLight);

      fountainGroup.position.set(x, 0, z);
      return fountainGroup;
    }

    scene.add(createFountain(-25, 15));
    scene.add(createFountain(25, 15));

    // Lampioni
    function createLampPost(x: number, z: number) {
      const lampGroup = new THREE.Group();

      // Palo
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      pole.position.y = 3;
      lampGroup.add(pole);

      // Lampada
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffeeaa,
          transparent: true,
          opacity: 0.9,
        })
      );
      lamp.position.y = 6.5;
      lampGroup.add(lamp);

      // Luce
      const lampLight = new THREE.PointLight(0xffeeaa, 2, 25);
      lampLight.position.y = 6.5;
      lampLight.castShadow = true;
      lampGroup.add(lampLight);

      lampGroup.position.set(x, 0, z);
      return lampGroup;
    }

    // Lampioni lungo il percorso
    for (let i = 0; i < 6; i++) {
      const z = 60 - i * 15;
      scene.add(createLampPost(-15, z));
      scene.add(createLampPost(15, z));
    }

    // ANIMAZIONE CAMERA
    const clock = new THREE.Clock();
    const introDuration = 8; // 8 secondi
    let introProgress = 0;

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      introProgress += delta / introDuration;

      if (introProgress <= 1) {
        // Movimento camera: da lontano verso la piramide
        const t = introProgress;
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Ease in-out

        // Posizione
        camera.position.z = 80 - easeT * 75; // Da 80 a 5
        camera.position.y = 2 + Math.sin(easeT * Math.PI) * 1; // Leggero movimento verticale
        camera.position.x = Math.sin(easeT * Math.PI * 0.5) * 2; // Leggero movimento laterale

        // Guarda sempre la piramide
        camera.lookAt(0, 10, 0);

        // Rotazione stelle
        stars.rotation.y += delta * 0.05;

        // Pulsazione luci piramide
        pyramidLight1.intensity = 2 + Math.sin(clock.getElapsedTime() * 2) * 0.5;
        pyramidLight2.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 2 + 1) * 0.3;

        // Fade out verso la fine
        if (introProgress > 0.85) {
          const fadeProgress = (introProgress - 0.85) / 0.15;
          renderer.domElement.style.opacity = (1 - fadeProgress).toString();
        }
      } else {
        // Fine intro
        onComplete();
      }

      renderer.render(scene, camera);
    }

    animate();

    // Resize
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [onComplete]);

  return (
    <div ref={containerRef} className="relative w-full h-screen">
      {skipVisible && (
        <button
          onClick={onComplete}
          className="absolute bottom-8 right-8 z-50 px-6 py-3 bg-amber-600/80 hover:bg-amber-500 text-white font-semibold rounded-lg backdrop-blur transition-all"
        >
          Skip Intro →
        </button>
      )}

      <div className="absolute bottom-8 left-8 z-50 text-white">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
          Musée du Louvre
        </h1>
        <p className="text-lg text-gray-300">Paris, France</p>
      </div>
    </div>
  );
}

