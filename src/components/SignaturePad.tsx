"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  onChange: (dataUrl: string | null) => void;
}

export default function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);
  const [signed,  setSigned] = useState(false);

  function getPos(e: MouseEvent | Touch, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: ((e.clientX ?? (e as Touch).clientX) - rect.left) * scaleX,
      y: ((e.clientY ?? (e as Touch).clientY) - rect.top)  * scaleY,
    };
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function start(pos: { x: number; y: number }) {
      drawing.current = true;
      lastPos.current = pos;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    function move(pos: { x: number; y: number }) {
      if (!drawing.current || !lastPos.current) return;
      ctx.lineWidth   = 2;
      ctx.lineCap     = "round";
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      lastPos.current = pos;
    }
    function stop() {
      if (!drawing.current || !canvas) return;
      drawing.current = false;
      lastPos.current = null;
      setSigned(true);
      onChange(canvas.toDataURL("image/png"));
    }

    const onMouseDown = (e: MouseEvent) => start(getPos(e, canvas));
    const onMouseMove = (e: MouseEvent) => move(getPos(e, canvas));
    const onMouseUp   = () => stop();
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); start(getPos(e.touches[0], canvas)); };
    const onTouchMove  = (e: TouchEvent) => { e.preventDefault(); move(getPos(e.touches[0], canvas)); };
    const onTouchEnd   = () => stop();

    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown",  onMouseDown);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative border-2 border-dashed border-[#C9A96E] rounded-xl overflow-hidden bg-[#FAFAF7]">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair"
          style={{ height: 120 }}
        />
        {!signed && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none select-none">
            Sign here
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="flex items-center gap-1.5 text-xs text-[#6b7280] self-end"
      >
        <RotateCcw size={12} /> Clear
      </button>
    </div>
  );
}
