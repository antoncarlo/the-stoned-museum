import { useEffect, useRef, useState } from "react";

interface TouchControlsProps {
  onMove: (x: number, y: number) => void;
  onLook: (deltaX: number, deltaY: number) => void;
}

export default function TouchControls({ onMove, onLook }: TouchControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const lookAreaRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let joystickTouchId: number | null = null;
    let lookTouchId: number | null = null;
    let lastLookX = 0;
    let lastLookY = 0;

    function handleJoystickStart(e: TouchEvent) {
      if (!joystickRef.current) return;
      
      const touch = e.touches[0];
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        joystickTouchId = touch.identifier;
        setJoystickActive(true);
        updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
      }
    }

    function handleJoystickMove(e: TouchEvent) {
      if (joystickTouchId === null || !joystickRef.current) return;

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === joystickTouchId) {
          const rect = joystickRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
          break;
        }
      }
    }

    function handleJoystickEnd(e: TouchEvent) {
      if (joystickTouchId === null) return;

      let touchStillActive = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId) {
          touchStillActive = true;
          break;
        }
      }

      if (!touchStillActive) {
        joystickTouchId = null;
        setJoystickActive(false);
        setJoystickPosition({ x: 0, y: 0 });
        onMove(0, 0);
      }
    }

    function updateJoystick(deltaX: number, deltaY: number) {
      const maxDistance = 50;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }

      setJoystickPosition({ x: deltaX, y: deltaY });
      onMove(deltaX / maxDistance, deltaY / maxDistance);
    }

    function handleLookStart(e: TouchEvent) {
      if (!lookAreaRef.current) return;

      const touch = e.touches[0];
      const rect = lookAreaRef.current.getBoundingClientRect();

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        lookTouchId = touch.identifier;
        lastLookX = touch.clientX;
        lastLookY = touch.clientY;
      }
    }

    function handleLookMove(e: TouchEvent) {
      if (lookTouchId === null) return;

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === lookTouchId) {
          const deltaX = touch.clientX - lastLookX;
          const deltaY = touch.clientY - lastLookY;
          onLook(deltaX, deltaY);
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
          break;
        }
      }
    }

    function handleLookEnd(e: TouchEvent) {
      if (lookTouchId === null) return;

      let touchStillActive = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === lookTouchId) {
          touchStillActive = true;
          break;
        }
      }

      if (!touchStillActive) {
        lookTouchId = null;
      }
    }

    document.addEventListener("touchstart", handleJoystickStart);
    document.addEventListener("touchmove", handleJoystickMove);
    document.addEventListener("touchend", handleJoystickEnd);
    document.addEventListener("touchstart", handleLookStart);
    document.addEventListener("touchmove", handleLookMove);
    document.addEventListener("touchend", handleLookEnd);

    return () => {
      document.removeEventListener("touchstart", handleJoystickStart);
      document.removeEventListener("touchmove", handleJoystickMove);
      document.removeEventListener("touchend", handleJoystickEnd);
      document.removeEventListener("touchstart", handleLookStart);
      document.removeEventListener("touchmove", handleLookMove);
      document.removeEventListener("touchend", handleLookEnd);
    };
  }, [onMove, onLook]);

  return (
    <>
      {/* Joystick per movimento */}
      <div
        ref={joystickRef}
        className="fixed bottom-8 left-8 w-32 h-32 bg-purple-900/30 border-2 border-purple-500/50 rounded-full backdrop-blur z-50"
        style={{ touchAction: "none" }}
      >
        <div
          className={`absolute w-12 h-12 bg-purple-500 rounded-full transition-all ${
            joystickActive ? "scale-110" : "scale-100"
          }`}
          style={{
            left: `calc(50% - 1.5rem + ${joystickPosition.x}px)`,
            top: `calc(50% - 1.5rem + ${joystickPosition.y}px)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold pointer-events-none">
          MOVE
        </div>
      </div>

      {/* Area per guardare intorno */}
      <div
        ref={lookAreaRef}
        className="fixed top-0 right-0 bottom-0 left-40 z-40"
        style={{ touchAction: "none" }}
      >
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-900/50 px-4 py-2 rounded-full border border-purple-500/50 backdrop-blur pointer-events-none">
          <p className="text-white text-xs font-semibold">
            👆 Drag to look around
          </p>
        </div>
      </div>
    </>
  );
}

