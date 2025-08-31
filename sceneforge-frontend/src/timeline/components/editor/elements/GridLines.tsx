import React, { useMemo } from 'react';
import { Box } from '@mui/material';

type Props = {
  totalSeconds: number;
  pixelsPerSecond: number;
  height: number;
};

const GridLines: React.FC<Props> = ({ totalSeconds, pixelsPerSecond, height }) => {
  const width = totalSeconds * pixelsPerSecond;
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let s = 0; s <= totalSeconds; s += 1) arr.push(s);
    return arr;
  }, [totalSeconds]);

  return (
    <Box sx={{ position: 'absolute', left: 0, top: 0, width: `${width}px`, height, pointerEvents: 'none' }}>
      {ticks.map((s) => (
        <Box key={s} sx={{ position: 'absolute', left: `${s * pixelsPerSecond}px`, top: 0, bottom: 0, width: 1, bgcolor: s % 10 === 0 ? '#2f3b55' : '#1f2736' }} />
      ))}
    </Box>
  );
};

export default GridLines;


