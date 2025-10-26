import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PlayerControls {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  mouseX: number;
  mouseY: number;
  isPointerLocked: boolean;
}

export function usePlayerControls() {
  const [controls, setControls] = useState<PlayerControls>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    mouseX: 0,
    mouseY: 0,
    isPointerLocked: false,
  });

  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  useEffect(() => {
    // Reset controls state on mount
    setControls({
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      mouseX: 0,
      mouseY: 0,
      isPointerLocked: false,
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls((prev) => ({ ...prev, moveForward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setControls((prev) => ({ ...prev, moveBackward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setControls((prev) => ({ ...prev, moveLeft: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setControls((prev) => ({ ...prev, moveRight: true }));
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls((prev) => ({ ...prev, moveForward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setControls((prev) => ({ ...prev, moveBackward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setControls((prev) => ({ ...prev, moveLeft: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setControls((prev) => ({ ...prev, moveRight: false }));
          break;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (controlsRef.current.isPointerLocked) {
        setControls((prev) => ({
          ...prev,
          mouseX: prev.mouseX + event.movementX,
          mouseY: prev.mouseY + event.movementY,
        }));
      }
    };

    const handlePointerLockChange = () => {
      setControls((prev) => ({
        ...prev,
        isPointerLocked: document.pointerLockElement !== null,
      }));
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('pointerlockchange', handlePointerLockChange, true);

    // Log for debugging
    console.log('[usePlayerControls] Event listeners registered');

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('pointerlockchange', handlePointerLockChange, true);
      console.log('[usePlayerControls] Event listeners removed');
    };
  }, []);

  return controls;
}

export function updatePlayerMovement(
  player: THREE.Object3D,
  camera: THREE.Camera,
  controls: PlayerControls,
  delta: number,
  walls: THREE.Box3[]
) {
  const moveSpeed = 5 * delta;
  const rotateSpeed = 0.002;

  // Rotate camera based on mouse movement
  camera.rotation.y -= controls.mouseX * rotateSpeed;
  camera.rotation.x -= controls.mouseY * rotateSpeed;
  
  // Clamp vertical rotation
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

  // Calculate movement direction
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, -1);
  const right = new THREE.Vector3(1, 0, 0);

  forward.applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  right.applyQuaternion(camera.quaternion);
  right.y = 0;
  right.normalize();

  if (controls.moveForward) direction.add(forward);
  if (controls.moveBackward) direction.sub(forward);
  if (controls.moveRight) direction.add(right);
  if (controls.moveLeft) direction.sub(right);

  direction.normalize();

  // Store old position for collision detection
  const oldPosition = player.position.clone();

  // Apply movement
  player.position.addScaledVector(direction, moveSpeed);

  // Simple collision detection
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    player.position,
    new THREE.Vector3(0.5, 1.6, 0.5)
  );

  for (const wall of walls) {
    if (playerBox.intersectsBox(wall)) {
      player.position.copy(oldPosition);
      break;
    }
  }
}

