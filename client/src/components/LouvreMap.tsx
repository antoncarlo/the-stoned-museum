import { useEffect, useRef } from "react";

interface LouvreMapProps {
  playerPosition: { x: number; z: number };
  guards: Array<{ x: number; z: number; rotation: number }>;
  artworks: Array<{ x: number; z: number; stolen: boolean }>;
  visible: boolean;
}

/**
 * Minimap interattiva del Louvre
 * Mostra layout, posizione Lupin, guardie, opere NFT
 */
export default function LouvreMap({
  playerPosition,
  guards,
  artworks,
  visible,
}: LouvreMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale: 1 unità 3D = 2 pixel mappa
    const scale = 2;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    function worldToMap(x: number, z: number): { x: number; y: number } {
      return {
        x: offsetX + x * scale,
        y: offsetY + z * scale,
      };
    }

    // Background
    ctx.fillStyle = "rgba(20, 20, 30, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // LAYOUT LOUVRE

    // Cortile centrale (Cour Napoléon)
    ctx.fillStyle = "rgba(100, 100, 120, 0.3)";
    const courtyard = worldToMap(0, 0);
    ctx.fillRect(courtyard.x - 50, courtyard.y - 50, 100, 100);

    // Piramide
    ctx.fillStyle = "rgba(255, 221, 136, 0.5)";
    ctx.beginPath();
    ctx.moveTo(courtyard.x, courtyard.y - 15);
    ctx.lineTo(courtyard.x + 15, courtyard.y + 15);
    ctx.lineTo(courtyard.x - 15, courtyard.y + 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffdd88";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ala Denon (destra)
    ctx.fillStyle = "rgba(212, 164, 116, 0.3)";
    const denon = worldToMap(40, -40);
    ctx.fillRect(denon.x - 20, denon.y - 80, 40, 160);
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(denon.x - 20, denon.y - 80, 40, 160);

    // Label Denon
    ctx.fillStyle = "#d4a574";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DENON", denon.x, denon.y);

    // Ala Richelieu (sinistra)
    ctx.fillStyle = "rgba(212, 164, 116, 0.3)";
    const richelieu = worldToMap(-40, -40);
    ctx.fillRect(richelieu.x - 20, richelieu.y - 80, 40, 160);
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(richelieu.x - 20, richelieu.y - 80, 40, 160);

    // Label Richelieu
    ctx.fillStyle = "#d4a574";
    ctx.fillText("RICHELIEU", richelieu.x, richelieu.y);

    // Ala Sully (fondo)
    ctx.fillStyle = "rgba(212, 164, 116, 0.3)";
    const sully = worldToMap(0, -90);
    ctx.fillRect(sully.x - 100, sully.y - 20, 200, 40);
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(sully.x - 100, sully.y - 20, 200, 40);

    // Label Sully
    ctx.fillStyle = "#d4a574";
    ctx.fillText("SULLY", sully.x, sully.y);

    // Grande Galerie
    ctx.fillStyle = "rgba(245, 234, 214, 0.2)";
    const galerie = worldToMap(0, -30);
    ctx.fillRect(galerie.x - 15, galerie.y - 60, 30, 120);

    // OPERE NFT
    artworks.forEach((artwork) => {
      const pos = worldToMap(artwork.x, artwork.z);
      
      if (artwork.stolen) {
        // Opera rubata (grigio)
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        ctx.strokeStyle = "#666";
      } else {
        // Opera da rubare (oro)
        ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
        ctx.strokeStyle = "#ffd700";
      }
      
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glow per opere non rubate
      if (!artwork.stolen) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffd700";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // GUARDIE
    guards.forEach((guard) => {
      const pos = worldToMap(guard.x, guard.z);

      // Cono di visione (rosso)
      ctx.fillStyle = "rgba(255, 50, 50, 0.2)";
      ctx.strokeStyle = "rgba(255, 50, 50, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      const visionLength = 15;
      const visionAngle = Math.PI / 4; // 45 gradi
      const startAngle = guard.rotation - visionAngle / 2;
      const endAngle = guard.rotation + visionAngle / 2;
      ctx.arc(pos.x, pos.y, visionLength, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Guardia (rosso)
      ctx.fillStyle = "#ff3333";
      ctx.strokeStyle = "#cc0000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Direzione guardia
      ctx.strokeStyle = "#ff3333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(
        pos.x + Math.cos(guard.rotation) * 8,
        pos.y + Math.sin(guard.rotation) * 8
      );
      ctx.stroke();
    });

    // LUPIN (giocatore)
    const playerPos = worldToMap(playerPosition.x, playerPosition.z);

    // Ombra Lupin
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(playerPos.x + 1, playerPos.y + 1, 7, 0, Math.PI * 2);
    ctx.fill();

    // Lupin (blu)
    ctx.fillStyle = "#4488ff";
    ctx.strokeStyle = "#2266dd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glow Lupin
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#4488ff";
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cappello Lupin (icona)
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(playerPos.x - 4, playerPos.y - 8, 8, 3);

    // Legenda
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    
    ctx.fillStyle = "#4488ff";
    ctx.fillText("● Lupin", 10, canvas.height - 50);
    
    ctx.fillStyle = "#ff3333";
    ctx.fillText("● Guards", 10, canvas.height - 35);
    
    ctx.fillStyle = "#ffd700";
    ctx.fillText("● Artworks", 10, canvas.height - 20);

  }, [playerPosition, guards, artworks, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-30">
      <div className="bg-black/80 backdrop-blur p-3 rounded-lg border-2 border-amber-600/50 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-amber-200 text-sm font-bold">LOUVRE MAP</h3>
          <div className="text-xs text-gray-400">Press M to toggle</div>
        </div>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded border border-amber-600/30"
        />
      </div>
    </div>
  );
}

