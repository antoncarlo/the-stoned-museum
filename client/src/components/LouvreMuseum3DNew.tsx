import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import TouchControls from "./TouchControls";

/**
 * Louvre Museum 3D - Architettura Riconoscibile
 * 
 * Layout basato sul vero Louvre:
 * - Forma a U con 3 ali (Denon, Richelieu, Sully)
 * - Cortile centrale (Cour Napoléon) con piramide di vetro
 * - Grande Galerie (corridoio lungo con archi)
 * - Salle des États (stanza Gioconda)
 * - Sale espositive con opere NFT
 */

interface Artwork {
  id: string;
  position: [number, number, number];
  name: string;
  artist: string;
  rarity: string;
}

interface LouvreMuseum3DNewProps {
  onArtworkClick?: (artworkId: string) => void;
  artworks?: Artwork[];
}

export default function LouvreMuseum3DNew({
  onArtworkClick,
  artworks = [],
}: LouvreMuseum3DNewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(false); // Ref per evitare closure stale
  const [instructions, setInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-hide istruzioni dopo 5 secondi
  useEffect(() => {
    if (instructions && !isMobile) {
      const timer = setTimeout(() => {
        setInstructions(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [instructions, isMobile]);
  const [currentRoom, setCurrentRoom] = useState("Cour Napoléon");
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const touchLookRef = useRef({ deltaX: 0, deltaY: 0 });
  const cameraRef = useRef<THREE.Camera | null>(null);

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
    scene.background = new THREE.Color(0xf5f5dc); // Beige chiaro (colore tipico Louvre)
    scene.fog = new THREE.Fog(0xf5f5dc, 100, 250);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 50); // Inizio nel cortile
    cameraRef.current = camera;

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
        isLockedRef.current = true;
        setInstructions(false);
      });

      controls.addEventListener("unlock", () => {
        setIsLocked(false);
        isLockedRef.current = false;
        // NON riattivare le istruzioni quando si fa ESC
      });

      const handleClick = () => {
        // Usa ref invece di state per evitare closure stale
        if (!isLockedRef.current && controls) {
          controls.lock();
        }
      };
      renderer.domElement.addEventListener("click", handleClick);
    }

    // Movement
    const moveSpeed = 0.5; // Aumentato da 0.2 a 0.5 per movimento più veloce
    const keys: { [key: string]: boolean } = {};

    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    // Lighting - Luce naturale del Louvre
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
    sunLight.position.set(50, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Luci aggiuntive per illuminare le sale
    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight1.position.set(-50, 40, -50);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight2.position.set(50, 40, -50);
    scene.add(fillLight2);

    // Materiali
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8d5b7, // Marmo beige
      roughness: 0.4,
      metalness: 0.1,
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5ead6, // Crema chiaro
      roughness: 0.7,
      metalness: 0.05,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    // PAVIMENTO CORTILE (Cour Napoléon)
    const courtyardFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      floorMaterial
    );
    courtyardFloor.rotation.x = -Math.PI / 2;
    courtyardFloor.receiveShadow = true;
    scene.add(courtyardFloor);

    // Pattern pavimento (griglia marmo)
    const gridHelper = new THREE.GridHelper(120, 60, 0xd4c4a8, 0xe8d5b7);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // PIRAMIDE DI VETRO (iconica!)
    const pyramidHeight = 20;
    const pyramidBase = 30;
    const pyramidGeometry = new THREE.ConeGeometry(pyramidBase / 2, pyramidHeight, 4);
    const pyramidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.25,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.95,
      thickness: 0.5,
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(0, pyramidHeight / 2, 0);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.castShadow = true;
    scene.add(pyramid);

    // Struttura metallica piramide
    const edgesGeometry = new THREE.EdgesGeometry(pyramidGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    const pyramidEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    pyramidEdges.position.copy(pyramid.position);
    pyramidEdges.rotation.copy(pyramid.rotation);
    scene.add(pyramidEdges);

    // Funzione per creare muri con texture
    function createWall(width: number, height: number, depth: number, x: number, y: number, z: number): THREE.Mesh {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const wall = new THREE.Mesh(geometry, wallMaterial.clone());
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      return wall;
    }

    // Funzione per creare colonne
    function createColumn(x: number, z: number): THREE.Group {
      const columnGroup = new THREE.Group();
      
      // Base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.6 })
      );
      base.position.y = 0.25;
      columnGroup.add(base);

      // Corpo colonna
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 7, 16),
        new THREE.MeshStandardMaterial({ color: 0xf5ead6, roughness: 0.5 })
      );
      shaft.position.y = 4;
      shaft.castShadow = true;
      columnGroup.add(shaft);

      // Capitello
      const capital = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.6, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.6 })
      );
      capital.position.y = 7.9;
      columnGroup.add(capital);

      columnGroup.position.set(x, 0, z);
      return columnGroup;
    }

    const wallHeight = 10;

    // ===== ALA DENON (Destra) =====
    const denonLength = 80;
    const denonWidth = 20;
    const denonX = 40;
    const denonZ = -40;

    // Muri esterni Denon
    scene.add(createWall(2, wallHeight, denonLength, denonX + denonWidth / 2, wallHeight / 2, denonZ));
    scene.add(createWall(2, wallHeight, denonLength, denonX - denonWidth / 2, wallHeight / 2, denonZ));
    scene.add(createWall(denonWidth, wallHeight, 2, denonX, wallHeight / 2, denonZ - denonLength / 2));
    scene.add(createWall(denonWidth, wallHeight, 2, denonX, wallHeight / 2, denonZ + denonLength / 2));

    // Pavimento Denon
    const denonFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(denonWidth, denonLength),
      floorMaterial.clone()
    );
    denonFloor.rotation.x = -Math.PI / 2;
    denonFloor.position.set(denonX, 0.01, denonZ);
    denonFloor.receiveShadow = true;
    scene.add(denonFloor);

    // Soffitto Denon
    const denonCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(denonWidth, denonLength),
      ceilingMaterial.clone()
    );
    denonCeiling.rotation.x = Math.PI / 2;
    denonCeiling.position.set(denonX, wallHeight, denonZ);
    scene.add(denonCeiling);

    // Colonne Denon
    for (let i = 0; i < 8; i++) {
      const z = denonZ + denonLength / 2 - 10 - i * 10;
      scene.add(createColumn(denonX - 7, z));
      scene.add(createColumn(denonX + 7, z));
    }

    // ===== ALA RICHELIEU (Sinistra) =====
    const richelieuX = -40;
    const richelieuZ = -40;

    // Muri esterni Richelieu
    scene.add(createWall(2, wallHeight, denonLength, richelieuX + denonWidth / 2, wallHeight / 2, richelieuZ));
    scene.add(createWall(2, wallHeight, denonLength, richelieuX - denonWidth / 2, wallHeight / 2, richelieuZ));
    scene.add(createWall(denonWidth, wallHeight, 2, richelieuX, wallHeight / 2, richelieuZ - denonLength / 2));
    scene.add(createWall(denonWidth, wallHeight, 2, richelieuX, wallHeight / 2, richelieuZ + denonLength / 2));

    // Pavimento Richelieu
    const richelieuFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(denonWidth, denonLength),
      floorMaterial.clone()
    );
    richelieuFloor.rotation.x = -Math.PI / 2;
    richelieuFloor.position.set(richelieuX, 0.01, richelieuZ);
    richelieuFloor.receiveShadow = true;
    scene.add(richelieuFloor);

    // Soffitto Richelieu
    const richelieuCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(denonWidth, denonLength),
      ceilingMaterial.clone()
    );
    richelieuCeiling.rotation.x = Math.PI / 2;
    richelieuCeiling.position.set(richelieuX, wallHeight, richelieuZ);
    scene.add(richelieuCeiling);

    // Colonne Richelieu
    for (let i = 0; i < 8; i++) {
      const z = richelieuZ + denonLength / 2 - 10 - i * 10;
      scene.add(createColumn(richelieuX - 7, z));
      scene.add(createColumn(richelieuX + 7, z));
    }

    // ===== ALA SULLY (Fondo) =====
    const sullyLength = 100;
    const sullyWidth = 20;
    const sullyZ = -90;

    // Muri esterni Sully
    scene.add(createWall(sullyLength, wallHeight, 2, 0, wallHeight / 2, sullyZ - sullyWidth / 2));
    scene.add(createWall(sullyLength, wallHeight, 2, 0, wallHeight / 2, sullyZ + sullyWidth / 2));
    scene.add(createWall(2, wallHeight, sullyWidth, -sullyLength / 2, wallHeight / 2, sullyZ));
    scene.add(createWall(2, wallHeight, sullyWidth, sullyLength / 2, wallHeight / 2, sullyZ));

    // Pavimento Sully
    const sullyFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(sullyLength, sullyWidth),
      floorMaterial.clone()
    );
    sullyFloor.rotation.x = -Math.PI / 2;
    sullyFloor.position.set(0, 0.01, sullyZ);
    sullyFloor.receiveShadow = true;
    scene.add(sullyFloor);

    // Soffitto Sully
    const sullyCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(sullyLength, sullyWidth),
      ceilingMaterial.clone()
    );
    sullyCeiling.rotation.x = Math.PI / 2;
    sullyCeiling.position.set(0, wallHeight, sullyZ);
    scene.add(sullyCeiling);

    // ===== GRANDE GALERIE (Corridoio lungo) =====
    // Collegamento tra le ali
    const grandeGalerieLength = 60;
    const grandeGalerieWidth = 15;
    const grandeGalerieZ = -30;

    // Pavimento Grande Galerie
    const grandeGalerieFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(grandeGalerieWidth, grandeGalerieLength),
      floorMaterial.clone()
    );
    grandeGalerieFloor.rotation.x = -Math.PI / 2;
    grandeGalerieFloor.position.set(0, 0.01, grandeGalerieZ);
    grandeGalerieFloor.receiveShadow = true;
    scene.add(grandeGalerieFloor);

    // Soffitto ad arco Grande Galerie
    const grandeGalerieCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(grandeGalerieWidth, grandeGalerieLength),
      ceilingMaterial.clone()
    );
    grandeGalerieCeiling.rotation.x = Math.PI / 2;
    grandeGalerieCeiling.position.set(0, wallHeight, grandeGalerieZ);
    scene.add(grandeGalerieCeiling);

    // Lucernari Grande Galerie
    for (let i = 0; i < 6; i++) {
      const skylightZ = grandeGalerieZ + grandeGalerieLength / 2 - 5 - i * 10;
      const skylight = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.6 })
      );
      skylight.rotation.x = Math.PI / 2;
      skylight.position.set(0, wallHeight - 0.1, skylightZ);
      scene.add(skylight);

      // Luce dal lucernario
      const skylightLight = new THREE.PointLight(0xffffcc, 2, 20);
      skylightLight.position.set(0, wallHeight - 2, skylightZ);
      scene.add(skylightLight);
    }

    // ===== SALLE DES ÉTATS (Stanza Gioconda) =====
    const salleWidth = 25;
    const salleDepth = 20;
    const salleX = 0;
    const salleZ = -60;

    // Muri Salle des États
    scene.add(createWall(2, wallHeight, salleDepth, salleX - salleWidth / 2, wallHeight / 2, salleZ));
    scene.add(createWall(2, wallHeight, salleDepth, salleX + salleWidth / 2, wallHeight / 2, salleZ));
    scene.add(createWall(salleWidth, wallHeight, 2, salleX, wallHeight / 2, salleZ - salleDepth / 2));
    scene.add(createWall(salleWidth, wallHeight, 2, salleX, wallHeight / 2, salleZ + salleDepth / 2));

    // Pavimento Salle
    const salleFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(salleWidth, salleDepth),
      new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.3 }) // Parquet
    );
    salleFloor.rotation.x = -Math.PI / 2;
    salleFloor.position.set(salleX, 0.01, salleZ);
    salleFloor.receiveShadow = true;
    scene.add(salleFloor);

    // Soffitto decorato Salle
    const salleCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(salleWidth, salleDepth),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.1 })
    );
    salleCeiling.rotation.x = Math.PI / 2;
    salleCeiling.position.set(salleX, wallHeight, salleZ);
    scene.add(salleCeiling);

    // Spotlight "Gioconda"
    const giocondaLight = new THREE.SpotLight(0xffffff, 3, 30, Math.PI / 8, 0.3);
    giocondaLight.position.set(salleX, wallHeight - 1, salleZ);
    giocondaLight.target.position.set(salleX, 3, salleZ - 8);
    scene.add(giocondaLight, giocondaLight.target);

    // ===== OPERE NFT =====
    const artworkMeshes: THREE.Mesh[] = [];

    artworks.forEach((artwork) => {
      // Cornice dorata
      const frameGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.3);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.2,
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(...artwork.position);
      frame.castShadow = true;
      frame.userData = { artworkId: artwork.id, name: artwork.name };
      scene.add(frame);
      artworkMeshes.push(frame);

      // Canvas
      const canvasGeometry = new THREE.PlaneGeometry(2.2, 3.2);
      const canvasMaterial = new THREE.MeshStandardMaterial({
        color: getRarityColor(artwork.rarity),
        emissive: getRarityColor(artwork.rarity),
        emissiveIntensity: 0.2,
      });
      const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
      canvas.position.copy(frame.position);
      canvas.position.z += 0.2;
      scene.add(canvas);

      // Spotlight opera
      const artLight = new THREE.SpotLight(0xffffff, 1.5, 15, Math.PI / 10, 0.5);
      artLight.position.set(artwork.position[0], artwork.position[1] + 3, artwork.position[2] + 2);
      artLight.target.position.copy(frame.position);
      scene.add(artLight, artLight.target);
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

    // Raycaster per interazione
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event: MouseEvent) {
      if (!isLocked) return;

      mouse.x = 0;
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

    // Rilevamento stanza corrente
    function updateCurrentRoom() {
      const pos = camera.position;
      
      if (Math.abs(pos.x) < 50 && Math.abs(pos.z) < 50) {
        setCurrentRoom("Cour Napoléon");
      } else if (pos.x > 20 && pos.z < -20 && pos.z > -100) {
        setCurrentRoom("Ala Denon");
      } else if (pos.x < -20 && pos.z < -20 && pos.z > -100) {
        setCurrentRoom("Ala Richelieu");
      } else if (Math.abs(pos.x) < 50 && pos.z < -70) {
        setCurrentRoom("Ala Sully");
      } else if (Math.abs(pos.x) < 15 && pos.z > -70 && pos.z < -40) {
        setCurrentRoom("Grande Galerie");
      } else if (Math.abs(pos.x) < 15 && Math.abs(pos.z - (-60)) < 12) {
        setCurrentRoom("Salle des États");
      }
    }

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

        // Desktop keyboard
        if (keys["w"]) camera.position.add(direction.multiplyScalar(moveSpeed));
        if (keys["s"]) camera.position.add(direction.multiplyScalar(-moveSpeed));
        if (keys["a"]) camera.position.add(right.multiplyScalar(moveSpeed));
        if (keys["d"]) camera.position.add(right.multiplyScalar(-moveSpeed));

        // Mobile touch
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

        camera.position.y = 2;
        camera.position.x = Math.max(-55, Math.min(55, camera.position.x));
        camera.position.z = Math.max(-110, Math.min(60, camera.position.z));

        updateCurrentRoom();
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
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 cursor-pointer"
          onClick={() => setInstructions(false)}
        >
          <div className="text-center text-white p-8 bg-gradient-to-br from-amber-900/90 to-yellow-900/90 rounded-lg border-2 border-amber-500">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
              Musée du Louvre
            </h2>
            <p className="text-lg mb-2">Click anywhere to enter the museum</p>
            <p className="text-sm text-gray-300 mb-4">
              Use WASD to move • Mouse to look around
            </p>
            <p className="text-xs text-amber-300">
              Explore the 3 wings and discover NFT artworks
            </p>
            <p className="text-xs text-gray-500 mt-4">
              (Auto-closes in 5 seconds)
            </p>
          </div>
        </div>
      )}

      {/* Minimap e info stanza */}
      {isLocked && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/70 backdrop-blur p-4 rounded-lg border border-amber-500/50">
            <p className="text-amber-200 text-sm font-semibold mb-2">Current Location:</p>
            <p className="text-white text-lg">{currentRoom}</p>
          </div>
        </div>
      )}
    </div>
  );
}

