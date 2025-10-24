import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import TouchControls from "./TouchControls";
import { createLupinCharacter, animateLupin } from "@/lib/lupinCharacter";

interface Artwork {
  id: string;
  name: string;
  artist: string;
  rarity: string;
  farmRate: number;
}

interface LouvreGameSimpleProps {
  onArtworkClick?: (artworkId: string) => void;
  userArtworks?: Artwork[];
}

/**
 * The Stoned Museum - Versione Semplificata
 * 
 * Fase 1: Intro - Cortile Louvre low poly, cammini fino alla porta
 * Fase 2: Galleria Personale - Stanza arredata con cavalletti e opere NFT
 */
export default function LouvreGameSimple({
  onArtworkClick,
  userArtworks = [],
}: LouvreGameSimpleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"intro" | "gallery">("intro");
  const [isLocked, setIsLocked] = useState(false);
  const [instructions, setInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const touchLookRef = useRef({ deltaX: 0, deltaY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Detect mobile
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(checkMobile);
    if (checkMobile) {
      setInstructions(false);
      setIsLocked(true);
    }

    // Setup Scene
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Pointer Lock Controls (desktop only)
    let controls: PointerLockControls | null = null;
    
    if (!checkMobile) {
      controls = new PointerLockControls(camera, renderer.domElement);

      controls.addEventListener("lock", () => {
        setIsLocked(true);
        setInstructions(false);
      });

      controls.addEventListener("unlock", () => {
        setIsLocked(false);
        setInstructions(true);
      });

      const handleClick = () => {
        if (!isLocked && controls) {
          controls.lock();
        }
      };
      renderer.domElement.addEventListener("click", handleClick);
    }

    // Movement
    const moveSpeed = 0.15;
    const keys: { [key: string]: boolean } = {};

    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    // Lupin character
    const lupin = createLupinCharacter();
    scene.add(lupin);

    // ===== FASE 1: INTRO - CORTILE LOUVRE =====
    function createIntroScene() {
      scene.background = new THREE.Color(0x87CEEB); // Cielo azzurro
      scene.fog = new THREE.Fog(0x87CEEB, 50, 150);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xffffff, 1);
      sunLight.position.set(50, 80, 50);
      sunLight.castShadow = true;
      scene.add(sunLight);

      // Pavimento cortile (low poly)
      const courtyard = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.8,
        })
      );
      courtyard.rotation.x = -Math.PI / 2;
      courtyard.receiveShadow = true;
      scene.add(courtyard);

      // Pattern pavimento
      for (let i = -5; i <= 5; i++) {
        for (let j = -5; j <= 5; j++) {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 9),
            new THREE.MeshStandardMaterial({
              color: (i + j) % 2 === 0 ? 0xaaaaaa : 0xbbbbbb,
              roughness: 0.9,
            })
          );
          tile.rotation.x = -Math.PI / 2;
          tile.position.set(i * 10, 0.01, j * 10);
          scene.add(tile);
        }
      }

      // PIRAMIDE LOW POLY (centro)
      const pyramidGeometry = new THREE.ConeGeometry(12, 18, 4);
      const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdd88,
        transparent: true,
        opacity: 0.6,
        emissive: 0xffdd88,
        emissiveIntensity: 0.2,
      });
      const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      pyramid.position.set(0, 9, -30);
      pyramid.rotation.y = Math.PI / 4;
      pyramid.castShadow = true;
      scene.add(pyramid);

      // Bordi piramide
      const edges = new THREE.EdgesGeometry(pyramidGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xaa8844, linewidth: 2 });
      const pyramidEdges = new THREE.LineSegments(edges, edgesMaterial);
      pyramidEdges.position.copy(pyramid.position);
      pyramidEdges.rotation.copy(pyramid.rotation);
      scene.add(pyramidEdges);

      // PORTA ENTRATA (sotto la piramide)
      const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(3, 5, 0.5),
        new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.7,
        })
      );
      doorFrame.position.set(0, 2.5, -25);
      doorFrame.castShadow = true;
      scene.add(doorFrame);

      // Porta (scura)
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 4.5, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0x3a2a1a,
          roughness: 0.8,
        })
      );
      door.position.set(0, 2.5, -24.8);
      scene.add(door);

      // Maniglia porta (dorata)
      const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.9,
          roughness: 0.2,
        })
      );
      handle.position.set(0.8, 2.5, -24.5);
      scene.add(handle);

      // Luce sulla porta
      const doorLight = new THREE.SpotLight(0xffeeaa, 2, 20, Math.PI / 6);
      doorLight.position.set(0, 8, -22);
      doorLight.target.position.set(0, 2, -25);
      scene.add(doorLight, doorLight.target);

      // PALAZZO LOUVRE (semplificato low poly)
      const palaceLeft = new THREE.Mesh(
        new THREE.BoxGeometry(30, 20, 10),
        new THREE.MeshStandardMaterial({
          color: 0xd4a574,
          roughness: 0.7,
        })
      );
      palaceLeft.position.set(-25, 10, -40);
      palaceLeft.castShadow = true;
      scene.add(palaceLeft);

      const palaceRight = new THREE.Mesh(
        new THREE.BoxGeometry(30, 20, 10),
        new THREE.MeshStandardMaterial({
          color: 0xd4a574,
          roughness: 0.7,
        })
      );
      palaceRight.position.set(25, 10, -40);
      palaceRight.castShadow = true;
      scene.add(palaceRight);

      // Finestre palazzo
      for (let i = 0; i < 6; i++) {
        const windowLeft = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 3),
          new THREE.MeshBasicMaterial({ color: 0x88ccff })
        );
        windowLeft.position.set(-30 + i * 5, 12, -35.1);
        scene.add(windowLeft);

        const windowRight = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 3),
          new THREE.MeshBasicMaterial({ color: 0x88ccff })
        );
        windowRight.position.set(20 + i * 5, 12, -35.1);
        scene.add(windowRight);
      }

      // Posizione iniziale Lupin (lontano dalla porta)
      camera.position.set(0, 2, 40);
      lupin.position.set(0, 0, 40);
    }

    // ===== FASE 2: GALLERIA PERSONALE =====
    function createGalleryScene() {
      // Clear intro scene
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      scene.add(lupin);

      scene.background = new THREE.Color(0xf5f5f0);
      scene.fog = null;

      // Lighting galleria
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
      mainLight.position.set(10, 15, 10);
      mainLight.castShadow = true;
      scene.add(mainLight);

      // STANZA (15x15 metri)
      const roomSize = 15;
      const wallHeight = 4;

      // Pavimento parquet
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({
          color: 0xd4a574,
          roughness: 0.6,
          metalness: 0.1,
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      // Pattern parquet
      for (let i = 0; i < 15; i++) {
        const plank = new THREE.Mesh(
          new THREE.PlaneGeometry(15, 0.8),
          new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xc49563 : 0xd4a574,
            roughness: 0.7,
          })
        );
        plank.rotation.x = -Math.PI / 2;
        plank.position.set(0, 0.01, -7 + i);
        scene.add(plank);
      }

      // Soffitto
      const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.9,
          side: THREE.DoubleSide,
        })
      );
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = wallHeight;
      scene.add(ceiling);

      // Muri
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f0,
        roughness: 0.8,
      });

      // Muro Nord
      const wallNorth = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, wallHeight, 0.2),
        wallMaterial
      );
      wallNorth.position.set(0, wallHeight / 2, -roomSize / 2);
      wallNorth.castShadow = true;
      wallNorth.receiveShadow = true;
      scene.add(wallNorth);

      // Muro Sud
      const wallSouth = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, wallHeight, 0.2),
        wallMaterial
      );
      wallSouth.position.set(0, wallHeight / 2, roomSize / 2);
      wallSouth.castShadow = true;
      wallSouth.receiveShadow = true;
      scene.add(wallSouth);

      // Muro Est
      const wallEast = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, wallHeight, roomSize),
        wallMaterial
      );
      wallEast.position.set(roomSize / 2, wallHeight / 2, 0);
      wallEast.castShadow = true;
      wallEast.receiveShadow = true;
      scene.add(wallEast);

      // Muro Ovest
      const wallWest = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, wallHeight, roomSize),
        wallMaterial
      );
      wallWest.position.set(-roomSize / 2, wallHeight / 2, 0);
      wallWest.castShadow = true;
      wallWest.receiveShadow = true;
      scene.add(wallWest);

      // ARREDAMENTO

      // Lampadario centrale
      const chandelier = new THREE.Group();
      const chandelierBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 0.5, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xffeeaa,
          emissiveIntensity: 0.3,
        })
      );
      chandelier.add(chandelierBase);
      
      for (let i = 0; i < 6; i++) {
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffee })
        );
        const angle = (i / 6) * Math.PI * 2;
        bulb.position.set(Math.cos(angle) * 0.4, -0.3, Math.sin(angle) * 0.4);
        chandelier.add(bulb);

        const light = new THREE.PointLight(0xffffee, 0.5, 10);
        light.position.copy(bulb.position);
        chandelier.add(light);
      }
      
      chandelier.position.set(0, wallHeight - 0.5, 0);
      scene.add(chandelier);

      // Divano
      const sofa = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.7,
        })
      );
      sofa.position.set(-5, 0.4, 5);
      sofa.castShadow = true;
      scene.add(sofa);

      // Schienale divano
      const sofaBack = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 })
      );
      sofaBack.position.set(-5, 1, 5.5);
      scene.add(sofaBack);

      // Tavolino
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.1, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.3,
          metalness: 0.2,
        })
      );
      table.position.set(-5, 0.5, 3);
      table.castShadow = true;
      scene.add(table);

      // Gambe tavolino
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x654321 })
        );
        leg.position.set(
          -5 + (i % 2 === 0 ? -0.6 : 0.6),
          0.25,
          3 + (i < 2 ? -0.3 : 0.3)
        );
        scene.add(leg);
      }

      // Pianta in vaso
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.25, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
      );
      pot.position.set(6, 0.25, -6);
      scene.add(pot);

      const plant = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.9 })
      );
      plant.position.set(6, 0.8, -6);
      scene.add(plant);

      // CAVALLETTI CON OPERE NFT
      function createEasel(x: number, z: number, rotation: number, artwork?: Artwork) {
        const easelGroup = new THREE.Group();

        // Gambe cavalletto
        const legMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.7,
        });

        const legFront = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1.8, 0.05),
          legMaterial
        );
        legFront.position.set(0, 0.9, 0.3);
        legFront.rotation.x = -0.2;
        easelGroup.add(legFront);

        const legLeft = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1.5, 0.05),
          legMaterial
        );
        legLeft.position.set(-0.3, 0.75, -0.2);
        legLeft.rotation.z = 0.3;
        easelGroup.add(legLeft);

        const legRight = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1.5, 0.05),
          legMaterial
        );
        legRight.position.set(0.3, 0.75, -0.2);
        legRight.rotation.z = -0.3;
        easelGroup.add(legRight);

        // Supporto tela
        const support = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.05, 0.05),
          legMaterial
        );
        support.position.set(0, 1, 0.25);
        easelGroup.add(support);

        if (artwork) {
          // Cornice
          const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 1.1, 0.05),
            new THREE.MeshStandardMaterial({
              color: 0xffd700,
              metalness: 0.8,
              roughness: 0.2,
            })
          );
          frame.position.set(0, 1.2, 0.3);
          frame.castShadow = true;
          easelGroup.add(frame);

          // Tela (colore basato su rarità)
          const canvas = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 1),
            new THREE.MeshStandardMaterial({
              color: getRarityColor(artwork.rarity),
              emissive: getRarityColor(artwork.rarity),
              emissiveIntensity: 0.2,
            })
          );
          canvas.position.set(0, 1.2, 0.35);
          easelGroup.add(canvas);

          // Spotlight sull'opera
          const spotlight = new THREE.SpotLight(0xffffff, 1.5, 10, Math.PI / 8);
          spotlight.position.set(0, 3, 0.5);
          spotlight.target.position.set(0, 1.2, 0.3);
          easelGroup.add(spotlight, spotlight.target);

          // Targhetta
          const plaque = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.15, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xcccccc })
          );
          plaque.position.set(0, 0.5, 0.35);
          easelGroup.add(plaque);

          // Store artwork data
          frame.userData = { artworkId: artwork.id, artwork };
        }

        easelGroup.position.set(x, 0, z);
        easelGroup.rotation.y = rotation;
        scene.add(easelGroup);
      }

      function getRarityColor(rarity: string): number {
        const colors: { [key: string]: number } = {
          Common: 0x808080,
          Rare: 0x0080ff,
          Epic: 0x8000ff,
          Legendary: 0xff8000,
          Mythic: 0xff00ff,
        };
        return colors[rarity] || 0xffffff;
      }

      // 3 opere starter + 7 cavalletti vuoti
      const easelPositions = [
        { x: -3, z: -5, r: 0 },
        { x: 0, z: -5, r: 0 },
        { x: 3, z: -5, r: 0 },
        { x: -5, z: -2, r: Math.PI / 2 },
        { x: -5, z: 1, r: Math.PI / 2 },
        { x: 5, z: -2, r: -Math.PI / 2 },
        { x: 5, z: 1, r: -Math.PI / 2 },
        { x: -3, z: 4, r: Math.PI },
        { x: 0, z: 4, r: Math.PI },
        { x: 3, z: 4, r: Math.PI },
      ];

      easelPositions.forEach((pos, index) => {
        const artwork = userArtworks[index];
        createEasel(pos.x, pos.z, pos.r, artwork);
      });

      // Posizione iniziale nella galleria
      camera.position.set(0, 2, 8);
      lupin.position.set(0, 0, 8);
    }

    // Initialize intro scene
    createIntroScene();

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Movement
      if (isLocked) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        let isMoving = false;

        // Desktop keyboard
        if (keys["w"]) {
          camera.position.add(direction.multiplyScalar(moveSpeed));
          lupin.position.add(direction.multiplyScalar(moveSpeed));
          isMoving = true;
        }
        if (keys["s"]) {
          camera.position.add(direction.multiplyScalar(-moveSpeed));
          lupin.position.add(direction.multiplyScalar(-moveSpeed));
          isMoving = true;
        }
        if (keys["a"]) {
          camera.position.add(right.multiplyScalar(moveSpeed));
          lupin.position.add(right.multiplyScalar(moveSpeed));
          isMoving = true;
        }
        if (keys["d"]) {
          camera.position.add(right.multiplyScalar(-moveSpeed));
          lupin.position.add(right.multiplyScalar(-moveSpeed));
          isMoving = true;
        }

        // Mobile touch
        if (checkMobile) {
          const touchMove = touchMoveRef.current;
          if (touchMove.x !== 0 || touchMove.y !== 0) {
            camera.position.add(direction.multiplyScalar(-touchMove.y * moveSpeed * 2));
            lupin.position.add(direction.multiplyScalar(-touchMove.y * moveSpeed * 2));
            camera.position.add(right.multiplyScalar(touchMove.x * moveSpeed * 2));
            lupin.position.add(right.multiplyScalar(touchMove.x * moveSpeed * 2));
            isMoving = true;
          }

          const touchLook = touchLookRef.current;
          if (touchLook.deltaX !== 0 || touchLook.deltaY !== 0) {
            const euler = new THREE.Euler(0, 0, 0, "YXZ");
            euler.setFromQuaternion(camera.quaternion);
            euler.y -= touchLook.deltaX * 0.002;
            euler.x -= touchLook.deltaY * 0.002;
            euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
            camera.quaternion.setFromEuler(euler);
            touchLookRef.current = { deltaX: 0, deltaY: 0 };
          }
        }

        camera.position.y = 2;

        // Lupin segue camera (terza persona)
        lupin.position.x = camera.position.x;
        lupin.position.z = camera.position.z;
        lupin.rotation.y = Math.atan2(direction.x, direction.z);

        // Anima Lupin
        animateLupin(lupin, isMoving, time);

        // Check transition intro -> gallery
        if (phase === "intro" && camera.position.z < -23) {
          setPhase("gallery");
          createGalleryScene();
        }

        // Limiti movimento galleria
        if (phase === "gallery") {
          const limit = 7;
          camera.position.x = Math.max(-limit, Math.min(limit, camera.position.x));
          camera.position.z = Math.max(-limit, Math.min(limit, camera.position.z));
          lupin.position.x = camera.position.x;
          lupin.position.z = camera.position.z;
        }
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
      if (controls) {
        controls.dispose();
      }
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isLocked, phase, userArtworks, onArtworkClick]);

  function handleTouchMove(x: number, y: number) {
    touchMoveRef.current = { x, y };
  }

  function handleTouchLook(deltaX: number, deltaY: number) {
    touchLookRef.current = { deltaX, deltaY };
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen">
      {isMobile && isLocked && (
        <TouchControls onMove={handleTouchMove} onLook={handleTouchLook} />
      )}
      
      {instructions && !isMobile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center text-white p-8 bg-gradient-to-br from-amber-900/90 to-yellow-900/90 rounded-lg border-2 border-amber-500">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
              The Stoned Museum
            </h2>
            <p className="text-lg mb-2">Click to start</p>
            <p className="text-sm text-gray-300 mb-4">
              {phase === "intro" 
                ? "Walk to the pyramid entrance" 
                : "Explore your personal gallery"}
            </p>
            <p className="text-xs text-amber-300">
              WASD to move • Mouse to look around
            </p>
          </div>
        </div>
      )}

      {/* Phase indicator */}
      {isLocked && (
        <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur px-4 py-2 rounded-lg border border-amber-500/50">
          <p className="text-amber-200 text-sm font-semibold">
            {phase === "intro" ? "🏛️ Louvre Courtyard" : "🎨 Your Gallery"}
          </p>
        </div>
      )}
    </div>
  );
}

