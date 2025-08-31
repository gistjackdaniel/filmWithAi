import React from 'react';
import { Box, Typography } from '@mui/material';
import { Movie } from '@mui/icons-material';
import { formatTimeFromSeconds, getDurationSeconds } from '../../utils/timeline';

export interface V1CutCardProps {
  cut: any;
  width: number;
  draggable?: boolean;
}

const V1CutCard: React.FC<V1CutCardProps> = ({ cut, width, draggable = true }) => {
  const duration = getDurationSeconds({ duration: cut.duration, estimatedDuration: cut.estimatedDuration });
  return (
    <Box
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'cut-from-v1',
          source: 'timeline-v1',
          cut
        }));
      }}
      sx={{
        width,
        height: 80,
        border: '1px solid #ddd',
        borderRadius: 1,
        backgroundColor: 'background.paper',
        mr: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.5, borderBottom: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Movie fontSize="small" />
          <Typography variant="caption">컷 {cut.shotNumber}</Typography>
        </Box>
        <Typography variant="caption">{formatTimeFromSeconds(duration)}</Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
        <Typography variant="caption" sx={{ textAlign: 'center' }}>
          {cut.title || `컷 ${cut.shotNumber}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default V1CutCard;


