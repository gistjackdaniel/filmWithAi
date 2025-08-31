import React from 'react';
import { Box } from '@mui/material';

type Props = {
  currentTime: number;
  pixelsPerSecond: number;
  height: number;
};

const Playhead: React.FC<Props> = ({ currentTime, pixelsPerSecond, height }) => {
  const x = currentTime * pixelsPerSecond;
  return (
    <Box sx={{ position: 'absolute', left: `${x}px`, top: 0, bottom: 0, width: 2, bgcolor: '#3ea6ff', pointerEvents: 'none' }}>
      <Box sx={{ position: 'absolute', top: -8, left: -6, width: 12, height: 8, bgcolor: '#3ea6ff', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
    </Box>
  );
};

export default Playhead;


