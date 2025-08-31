import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TimeRulerProps {
  totalSeconds: number;
  pixelsPerSecond: number;
  currentTime: number;
  onClick?: (seconds: number) => void;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ totalSeconds, pixelsPerSecond, currentTime, onClick }) => {
  const count = Math.ceil(Math.max(totalSeconds, 1) / 10);
  return (
    <Box
      sx={{ position: 'relative', height: 30, borderBottom: '1px solid #eee', cursor: 'pointer', px: 0 }}
      onClick={(e) => {
        if (!onClick) return;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const px = e.clientX - rect.left;
        const seconds = px / pixelsPerSecond;
        onClick(Math.max(0, Math.min(totalSeconds, seconds)));
      }}
    >
      {/* 0초 기준 라인 */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, backgroundColor: 'divider' }} />
      {/* 현재 플레이헤드 */}
      <Box sx={{ position: 'absolute', left: `${currentTime * pixelsPerSecond}px`, top: 0, bottom: 0, width: 2, backgroundColor: 'primary.main' }} />
      {/* 10초 간격 라벨 */}
      {[...Array(count).keys()].map((k) => (
        <Box key={k} sx={{ position: 'absolute', left: `${k * 10 * pixelsPerSecond}px`, top: 0 }}>
          <Typography sx={{ position: 'relative', top: -12 }} variant="caption" color="text.secondary">{k * 10}s</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default TimeRuler;


