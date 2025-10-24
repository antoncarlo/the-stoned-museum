import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { usePlayerControls, updatePlayerMovement } from '@/hooks/usePlayerControls';
import { celVertexShader, celFragmentShader, glowVertexShader, glowFragmentShader } from '@/lib/shaders';
import { getNFTByPosition, type NFTArtwork } from '@/lib/nftData';
import NFTInfo from './NFTInfo';

export default function LouvreGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Object3D | null>(null);
  const wallsRef = useRef<THREE.Box3[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const controls = usePlayerControls();
  const [currentNFT, setCurrentNFT] = useState<NFTArtwork | null>(null);
  const [showNFTInfo, setShowNFTInfo] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a2e); // Dark purple background
    scene.fog = new THREE.Fog(0x1a0a2e, 10, 50);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 5); // Eye level height
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Player object (invisible, just for movement)
    const player = new THREE.Object3D();
    player.position.set(0, 0, 5);
    player.add(camera);
    scene.add(player);
    playerRef.current = player;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main directional light (purple tint)
    const mainLight = new THREE.DirectionalLight(0xd946ef, 1.5);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    scene.add(mainLight);

    // Accent lights (pink/magenta)
    const accentLight1 = new THREE.PointLight(0xff00ff, 2, 15);
    accentLight1.position.set(-10, 3, -10);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xff1493, 2, 15);
    accentLight2.position.set(10, 3, -10);
    scene.add(accentLight2);

    // Create museum floor
    createFloor(scene);

    // Create museum walls and rooms
    wallsRef.current = createMuseumLayout(scene);

    // Create NFT frames
    createNFTFrames(scene);

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      if (player && camera && controls.isPointerLocked) {
        updatePlayerMovement(player, camera, controls, delta, wallsRef.current);
        
        // Check for nearby NFT artworks
        const playerPos = player.position;
        const nearbyNFT = getNFTByPosition([playerPos.x, playerPos.y, playerPos.z], 3);
        
        if (nearbyNFT && nearbyNFT.id !== currentNFT?.id) {
          setCurrentNFT(nearbyNFT);
          setShowNFTInfo(true);
        } else if (!nearbyNFT && showNFTInfo) {
          setShowNFTInfo(false);
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const handleClick = () => {
    if (containerRef.current && !controls.isPointerLocked) {
      containerRef.current.requestPointerLock();
    }
  };

  return (
    <>
      <div 
        ref={containerRef} 
        className="w-full h-screen fixed top-0 left-0"
        style={{ cursor: controls.isPointerLocked ? 'none' : 'pointer' }}
        onClick={handleClick}
      />
      
      {!controls.isPointerLocked && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-md text-white p-8 rounded-xl text-center z-10 border-2 border-purple-500/50 shadow-2xl max-w-lg">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300">
              Louvre NFT Museum
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4 text-purple-200">Benvenuto nel Museo Virtuale</h2>
          
          <div className="space-y-3 mb-6">
            <p className="text-purple-100">Esplora gallerie d'arte digitale in un ambiente 3D immersivo</p>
            <div className="bg-purple-500/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-purple-200">🎮 Usa <span className="font-bold text-white">WASD</span> o <span className="font-bold text-white">frecce</span> per muoverti</p>
              <p className="text-sm text-purple-200">🖱️ Muovi il <span className="font-bold text-white">mouse</span> per guardarti intorno</p>
              <p className="text-sm text-purple-200">🖼️ Avvicinati alle opere per scoprire i dettagli</p>
            </div>
          </div>
          
          <button 
            onClick={handleClick}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Inizia l'Esplorazione
          </button>
          
          <p className="text-xs text-purple-300 mt-4">Premi ESC in qualsiasi momento per uscire</p>
        </div>
      )}
      
      <NFTInfo visible={showNFTInfo} nftData={currentNFT} />
      
      {controls.isPointerLocked && (
        <div className="fixed top-4 left-4 bg-purple-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm z-10">
          <p className="font-semibold">🎨 Louvre NFT Museum</p>
          <p className="text-xs text-purple-200">Esplora le gallerie</p>
        </div>
      )}
    </>
  );
}

// Helper function to create floor
function createFloor(scene: THREE.Scene) {
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d1b4e,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Add grid pattern
  const gridHelper = new THREE.GridHelper(100, 50, 0x8b5cf6, 0x4c1d95);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);
}

// Helper function to create museum layout
function createMuseumLayout(scene: THREE.Scene): THREE.Box3[] {
  const walls: THREE.Box3[] = [];
  
  // Cel shading material for walls
  const wallMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0x1e1b4b) },
      lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      celLevels: { value: 4.0 },
    },
    vertexShader: celVertexShader,
    fragmentShader: celFragmentShader,
  });

  // Central atrium walls
  walls.push(createWall(scene, 0, 2.5, -10, 30, 5, 0.5, wallMaterial)); // Back wall
  walls.push(createWall(scene, -15, 2.5, 5, 0.5, 5, 30, wallMaterial)); // Left wall
  walls.push(createWall(scene, 15, 2.5, 5, 0.5, 5, 30, wallMaterial)); // Right wall

  // North gallery
  walls.push(createWall(scene, 0, 2.5, -20, 20, 5, 0.5, wallMaterial)); // Back
  walls.push(createWall(scene, -10, 2.5, -15, 0.5, 5, 10, wallMaterial)); // Left
  walls.push(createWall(scene, 10, 2.5, -15, 0.5, 5, 10, wallMaterial)); // Right

  // South gallery (right side)
  walls.push(createWall(scene, 20, 2.5, 15, 10, 5, 0.5, wallMaterial)); // Back
  walls.push(createWall(scene, 15, 2.5, 10, 0.5, 5, 10, wallMaterial)); // Left
  walls.push(createWall(scene, 25, 2.5, 10, 0.5, 5, 10, wallMaterial)); // Right

  // East gallery (left side)
  walls.push(createWall(scene, -20, 2.5, 15, 10, 5, 0.5, wallMaterial)); // Back
  walls.push(createWall(scene, -25, 2.5, 10, 0.5, 5, 10, wallMaterial)); // Left
  walls.push(createWall(scene, -15, 2.5, 10, 0.5, 5, 10, wallMaterial)); // Right

  // Ceiling elements (low poly beams)
  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c1d95,
    flatShading: true,
  });

  for (let i = -10; i <= 10; i += 5) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 30),
      beamMaterial
    );
    beam.position.set(i, 4.8, 0);
    scene.add(beam);
  }

  return walls;
}

// Helper function to create a wall
function createWall(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material
): THREE.Box3 {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(geometry, material);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);

  // Create collision box
  const box = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x, y, z),
    new THREE.Vector3(width, height, depth)
  );
  return box;
}

// Helper function to create NFT frames
function createNFTFrames(scene: THREE.Scene) {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700, // Gold
    roughness: 0.3,
    metalness: 0.8,
    flatShading: true,
  });

  // Glowing shader material for artworks
  const createArtworkMaterial = (color: number) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        time: { value: 0 },
        texture1: { value: new THREE.Texture() },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
    });
  };

  // North gallery frames (purple/magenta theme)
  createFrame(scene, -5, 2.5, -19.5, frameMaterial, createArtworkMaterial(0xff00ff));
  createFrame(scene, 0, 2.5, -19.5, frameMaterial, createArtworkMaterial(0xd946ef));
  createFrame(scene, 5, 2.5, -19.5, frameMaterial, createArtworkMaterial(0xff1493));

  // East gallery frames (pink theme)
  createFrame(scene, -24.5, 2.5, 10, frameMaterial, createArtworkMaterial(0xff69b4), true);
  createFrame(scene, -24.5, 2.5, 13, frameMaterial, createArtworkMaterial(0xff1493), true);

  // South gallery frames (cyan/blue theme)
  createFrame(scene, 24.5, 2.5, 10, frameMaterial, createArtworkMaterial(0x00ffff), true);
  createFrame(scene, 24.5, 2.5, 13, frameMaterial, createArtworkMaterial(0x0080ff), true);

  // Central atrium frames (mixed)
  createFrame(scene, -14.5, 2.5, -5, frameMaterial, createArtworkMaterial(0x8b5cf6), true);
  createFrame(scene, 14.5, 2.5, -5, frameMaterial, createArtworkMaterial(0xa855f7), true);
}

// Helper function to create a single frame with artwork
function createFrame(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  frameMaterial: THREE.Material,
  artworkMaterial: THREE.Material,
  rotateY = false
) {
  // Frame
  const frameGeometry = new THREE.BoxGeometry(2.2, 2.2, 0.1);
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.set(x, y, z);
  if (rotateY) frame.rotation.y = Math.PI / 2;
  scene.add(frame);

  // Artwork (inner part)
  const artworkGeometry = new THREE.PlaneGeometry(2, 2);
  const artwork = new THREE.Mesh(artworkGeometry, artworkMaterial);
  artwork.position.set(
    x + (rotateY ? 0.06 : 0),
    y,
    z + (rotateY ? 0 : 0.06)
  );
  if (rotateY) {
    artwork.rotation.y = Math.PI / 2;
  }
  scene.add(artwork);

  // Spotlight for artwork
  const spotlight = new THREE.SpotLight(0xffffff, 3, 10, Math.PI / 6, 0.5);
  spotlight.position.set(x, y + 2, z + (rotateY ? 0 : 2));
  spotlight.target = artwork;
  scene.add(spotlight);
}

