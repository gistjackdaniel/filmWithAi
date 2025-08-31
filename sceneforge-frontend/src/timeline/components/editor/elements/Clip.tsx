import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Waveform from './Waveform';

type Props = {
  id: string;
  title: string;
  kind: 'image' | 'video' | 'audio';
  start: number; // sec
  duration: number; // sec
  top: number; // px from track top
  height: number; // px
  pps: number; // pixels per second
  track: string;
  selected?: boolean;
  onSelect?: (id: string, multi: boolean) => void;
  onChange?: (id: string, next: { start?: number; duration?: number }) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
};

const Clip: React.FC<Props> = ({ id, title, kind, start, duration, top, height, pps, selected, onSelect, onChange, draggable = false, onDragStart }) => {
  const left = useMemo(() => start * pps, [start, pps]);
  const width = useMemo(() => Math.max(24, duration * pps), [duration, pps]);
  const bg = kind === 'audio' ? '#243447' : kind === 'video' ? '#1e293b' : '#334155';
  const borderColor = selected ? '#60a5fa' : '#3a4253';

  const draggingRef = useRef<{ mode: 'move' | 'resize-l' | 'resize-r'; startX: number; baseStart: number; baseDuration: number } | null>(null);

  const snap = useCallback((sec: number) => {
    const step = 1; // 1s snap
    return Math.max(0, Math.round(sec / step) * step);
  }, []);

  const onMouseDown = (mode: 'move' | 'resize-l' | 'resize-r') => (e: React.MouseEvent) => {
    e.stopPropagation();
    draggingRef.current = { mode, startX: e.clientX, baseStart: start, baseDuration: duration };
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - draggingRef.current.startX;
      const dSec = dx / pps;
      if (draggingRef.current.mode === 'move') {
        const ns = snap(draggingRef.current.baseStart + dSec);
        onChange?.(id, { start: ns });
      } else if (draggingRef.current.mode === 'resize-l') {
        const ns = Math.max(0, snap(draggingRef.current.baseStart + dSec));
        const nd = Math.max(0.5, draggingRef.current.baseDuration + (draggingRef.current.baseStart - ns));
        onChange?.(id, { start: ns, duration: nd });
      } else if (draggingRef.current.mode === 'resize-r') {
        const nd = Math.max(0.5, snap(draggingRef.current.baseDuration + dSec));
        onChange?.(id, { duration: nd });
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <Box 
      onClick={(e) => onSelect?.(id, e.metaKey || e.ctrlKey)} 
      draggable={draggable}
      onDragStart={onDragStart}
      sx={{ position: 'absolute', left, top, width, height, bgcolor: bg, border: `2px solid ${borderColor}`, borderRadius: 0.5, overflow: 'hidden', userSelect: 'none' }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, cursor: 'ew-resize' }} onMouseDown={onMouseDown('resize-l')} />
      <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'ew-resize' }} onMouseDown={onMouseDown('resize-r')} />
      <Box onMouseDown={onMouseDown('move')} sx={{ px: 1, py: 0.5, bgcolor: '#0f172a', borderBottom: `1px solid ${borderColor}`, cursor: 'grab' }}>
        <Typography variant="caption" sx={{ color: '#d1d5db', fontWeight: 600 }} noWrap>{title}</Typography>
      </Box>
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
        {kind === 'audio' ? (
          <Waveform peaks={new Array(Math.max(1, Math.floor(width))).fill(0).map((_, i) => Math.sin(i / 5) * 0.6)} width={width} height={height - 18} />
        ) : (
          'thumbnail'
        )}
      </Box>
    </Box>
  );
};

export default Clip;


