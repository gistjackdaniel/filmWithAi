import React from 'react';
import { Box } from '@mui/material';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const circleStyle = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid #2b2f38',
  background: '#0c0e12',
  color: '#cdd3e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none' as const,
};

const ZoomControls: React.FC<Props> = ({ onZoomIn, onZoomOut }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.5 }}>
      <Box onClick={onZoomOut} sx={circleStyle as any}>−</Box>
      <Box onClick={onZoomIn} sx={circleStyle as any}>＋</Box>
    </Box>
  );
};

export default ZoomControls;


