import React, { useEffect, useRef } from 'react';

type Props = {
  peaks: number[]; // normalized -1..1
  width: number; // px
  height: number; // px
  color?: string;
};

const Waveform: React.FC<Props> = ({ peaks, width, height, color = '#7dd3fc' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    const mid = height / 2;
    const len = peaks.length;
    if (len === 0) return;
    for (let x = 0; x < width; x++) {
      const idx = Math.floor((x / width) * len);
      const amp = Math.max(-1, Math.min(1, peaks[idx]));
      const h = Math.max(1, Math.abs(amp) * (height - 2));
      ctx.fillRect(x, mid - h / 2, 1, h);
    }
  }, [peaks, width, height, color]);

  return <canvas ref={canvasRef} />;
};

export default Waveform;


