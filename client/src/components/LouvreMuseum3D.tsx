import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import TouchControls from "./TouchControls";

/**
 * Layout 3D del Louvre Museum in stile low poly
 * Basato sulla struttura reale del Louvre con:
 * - Piramide di vetro (entrata)
 * - 3 Ali (Denon, Richelieu, Sully)
 * - Grande Galerie
 * - Salle des États (stanza Gioconda)
 * - Scale monumentali
 */

interface LouvreMuseum3DProps {
  onArtworkClick?: (artworkId: string) => void;
  artworks?: Array<{
    id: string;
    position: [number, number, number];
    name: string;
    artist: string;
    rarity: string;
  }>;
}

export default function LouvreMuseum3D({
  onArtworkClick,
  artworks = [],
}: LouvreMuseum3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
      setIsLocked(true); // Auto-start on mobile
    }

    // Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a1a4a); // Viola più chiaro
    scene.fog = new THREE.Fog(0x2a1a4a, 80, 200);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Pointer Lock Controls (only for desktop)
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

      // Click to start
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -50;
    mainLight.shadow.camera.right = 50;
    mainLight.shadow.camera.top = 50;
    mainLight.shadow.camera.bottom = -50;
    scene.add(mainLight);

    // Neon accent lights
    const neonColors = [0xff00ff, 0x00ffff, 0xff0080, 0x8000ff];
    neonColors.forEach((color, i) => {
      const light = new THREE.PointLight(color, 2, 30);
      const angle = (i / neonColors.length) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 20, 3, Math.sin(angle) * 20);
      scene.add(light);
    });

    // Floor (pavimento del museo)
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3a6a,
      roughness: 0.7,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid pattern sul pavimento
    const gridHelper = new THREE.GridHelper(100, 50, 0x8a5ada, 0x6a3aba);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Piramide di vetro (entrata centrale)
    const pyramidGeometry = new THREE.ConeGeometry(8, 12, 4);
    const pyramidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(0, 6, 0);
    pyramid.rotation.y = Math.PI / 4;
    scene.add(pyramid);

    // Glow effect per la piramide
    const pyramidGlow = new THREE.PointLight(0x00ffff, 3, 20);
    pyramidGlow.position.copy(pyramid.position);
    scene.add(pyramidGlow);

    // Funzione per creare muri
    function createWall(
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      color: number = 0x6a5a8a
    ): THREE.Mesh {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: 0.1,
      });
      const wall = new THREE.Mesh(geometry, material);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      return wall;
    }

    // Grande Galerie (corridoio principale)
    const gallerieLength = 60;
    const gallerieWidth = 12;
    const wallHeight = 8;

    // Muri laterali della Grande Galerie
    const leftWall = createWall(2, wallHeight, gallerieLength, -gallerieWidth / 2, wallHeight / 2, 0);
    const rightWall = createWall(2, wallHeight, gallerieLength, gallerieWidth / 2, wallHeight / 2, 0);
    scene.add(leftWall, rightWall);

    // Soffitto con lucernari
    const ceilingGeometry = new THREE.PlaneGeometry(gallerieWidth, gallerieLength);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a7a,
      side: THREE.DoubleSide,
      emissive: 0x3a2a5a,
      emissiveIntensity: 0.2,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    scene.add(ceiling);

    // Lucernari (skylight)
    for (let i = 0; i < 6; i++) {
      const skylightGeometry = new THREE.PlaneGeometry(3, 3);
      const skylightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.6,
      });
      const skylight = new THREE.Mesh(skylightGeometry, skylightMaterial);
      skylight.rotation.x = Math.PI / 2;
      skylight.position.set(0, wallHeight - 0.1, -25 + i * 10);
      scene.add(skylight);

      // Luce dal lucernario
      const skylightLight = new THREE.PointLight(0xffffaa, 1.5, 15);
      skylightLight.position.copy(skylight.position);
      skylightLight.position.y -= 1;
      scene.add(skylightLight);
    }

    // Salle des États (stanza della Gioconda) - stanza speciale
    const salleWidth = 15;
    const salleDepth = 12;
    const salleX = 20;
    const salleZ = -15;

    // Muri della Salle des États (più chiari)
    const salleWalls = [
      createWall(2, wallHeight, salleDepth, salleX - salleWidth / 2, wallHeight / 2, salleZ, 0x7a4a9a),
      createWall(2, wallHeight, salleDepth, salleX + salleWidth / 2, wallHeight / 2, salleZ, 0x7a4a9a),
      createWall(salleWidth, wallHeight, 2, salleX, wallHeight / 2, salleZ - salleDepth / 2, 0x7a4a9a),
      createWall(salleWidth, wallHeight, 2, salleX, wallHeight / 2, salleZ + salleDepth / 2, 0x7a4a9a),
    ];
    salleWalls.forEach((wall) => scene.add(wall));

    // Spotlight sulla "Gioconda" (posizione centrale nella Salle)
    const giocondaSpotlight = new THREE.SpotLight(0xffd700, 3, 20, Math.PI / 6, 0.5);
    giocondaSpotlight.position.set(salleX, wallHeight - 1, salleZ);
    giocondaSpotlight.target.position.set(salleX, 3, salleZ - 5);
    scene.add(giocondaSpotlight, giocondaSpotlight.target);

    // Ala Denon (destra)
    const denonWalls = [
      createWall(2, wallHeight, 30, 20, wallHeight / 2, 15, 0x6a4a8a),
      createWall(2, wallHeight, 30, 30, wallHeight / 2, 15, 0x6a4a8a),
    ];
    denonWalls.forEach((wall) => scene.add(wall));

    // Ala Richelieu (sinistra)
    const richelieuWalls = [
      createWall(2, wallHeight, 30, -20, wallHeight / 2, 15, 0x6a4a8a),
      createWall(2, wallHeight, 30, -30, wallHeight / 2, 15, 0x6a4a8a),
    ];
    richelieuWalls.forEach((wall) => scene.add(wall));

    // Scale monumentali
    function createStairs(x: number, z: number): void {
      const stepCount = 10;
      const stepWidth = 8;
      const stepDepth = 1;
      const stepHeight = 0.3;

      for (let i = 0; i < stepCount; i++) {
        const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
        const stepMaterial = new THREE.MeshStandardMaterial({
          color: 0x5a4a7a,
          roughness: 0.8,
          emissive: 0x3a2a5a,
          emissiveIntensity: 0.1,
        });
        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.set(x, i * stepHeight, z + i * stepDepth);
        step.castShadow = true;
        step.receiveShadow = true;
        scene.add(step);
      }
    }

    createStairs(-10, -30);
    createStairs(10, -30);

    // Opere NFT (cornici con glow)
    const artworkMeshes: THREE.Mesh[] = [];

    artworks.forEach((artwork, index) => {
      // Cornice dorata
      const frameGeometry = new THREE.BoxGeometry(2, 3, 0.2);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(...artwork.position);
      frame.castShadow = true;
      frame.userData = { artworkId: artwork.id, name: artwork.name };
      scene.add(frame);
      artworkMeshes.push(frame);

      // Canvas (opera d'arte)
      const canvasGeometry = new THREE.PlaneGeometry(1.8, 2.8);
      const canvasMaterial = new THREE.MeshStandardMaterial({
        color: getRarityColor(artwork.rarity),
        emissive: getRarityColor(artwork.rarity),
        emissiveIntensity: 0.3,
      });
      const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
      canvas.position.copy(frame.position);
      canvas.position.z += 0.15;
      scene.add(canvas);

      // Spotlight dedicato
      const artSpotlight = new THREE.SpotLight(getRarityColor(artwork.rarity), 2, 10, Math.PI / 8, 0.5);
      artSpotlight.position.set(artwork.position[0], artwork.position[1] + 2, artwork.position[2] + 1);
      artSpotlight.target.position.copy(frame.position);
      scene.add(artSpotlight, artSpotlight.target);

      // Glow effect
      const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: getRarityColor(artwork.rarity),
        transparent: true,
        opacity: 0.5,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(artwork.position[0], artwork.position[1] + 2, artwork.position[2]);
      scene.add(glow);
    });

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

    // Raycaster per interazione opere
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event: MouseEvent) {
      if (!isLocked) return;

      mouse.x = 0; // Centro schermo
      mouse.y = 0;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(artworkMeshes);

      if (intersects.length > 0) {
        const artwork = intersects[0].object;
        if (onArtworkClick && artwork.userData.artworkId) {
          onArtworkClick(artwork.userData.artworkId);
        }
      }
    }

    window.addEventListener("click", onMouseClick);

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Movement
      if (isLocked) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        // Desktop keyboard controls
        if (keys["w"]) {
          camera.position.add(direction.multiplyScalar(moveSpeed));
        }
        if (keys["s"]) {
          camera.position.add(direction.multiplyScalar(-moveSpeed));
        }
        if (keys["a"]) {
          camera.position.add(right.multiplyScalar(moveSpeed));
        }
        if (keys["d"]) {
          camera.position.add(right.multiplyScalar(-moveSpeed));
        }

        // Mobile touch controls
        if (checkMobile) {
          const touchMove = touchMoveRef.current;
          if (touchMove.x !== 0 || touchMove.y !== 0) {
            camera.position.add(direction.multiplyScalar(-touchMove.y * moveSpeed * 2));
            camera.position.add(right.multiplyScalar(touchMove.x * moveSpeed * 2));
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

        // Mantieni altezza camera
        camera.position.y = 2;

        // Limiti movimento
        camera.position.x = Math.max(-45, Math.min(45, camera.position.x));
        camera.position.z = Math.max(-45, Math.min(45, camera.position.z));
      }

      // Animazione piramide glow
      pyramidGlow.intensity = 3 + Math.sin(Date.now() * 0.001) * 0.5;

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("click", onMouseClick);
      if (controls) {
        controls.dispose();
      }
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isLocked, artworks, onArtworkClick]);

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
          <div className="text-center text-white p-8 bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-lg border-2 border-purple-500">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Stoned Museum
            </h2>
            <p className="text-lg mb-2">Click to enter the Louvre</p>
            <p className="text-sm text-gray-300 mb-4">
              Use WASD to move • Mouse to look around
            </p>
            <p className="text-xs text-purple-300">
              Click on artworks to view details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

