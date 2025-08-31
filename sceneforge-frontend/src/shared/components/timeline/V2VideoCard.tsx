import React from 'react';
import { Box, Chip, Button, Typography } from '@mui/material';

export interface V2VideoCardProps {
  video: {
    id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    duration: number;
    type: 'uploaded' | 'ai_generated';
    createdAt: string;
    fileSize?: number;
  };
  width: number;
  onDelete: (id: string) => void;
}

const V2VideoCard: React.FC<V2VideoCardProps> = ({ video, width, onDelete }) => {
  return (
    <Box sx={{ width, height: 80, border: '1px solid #ddd', borderRadius: 1, backgroundColor: 'background.paper', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 4, left: 4 }}>
        <Chip size="small" label={video.type === 'ai_generated' ? 'AI' : '업로드'} color={video.type === 'ai_generated' ? 'secondary' : 'default'} />
      </Box>
      <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
        <Button size="small" onClick={() => onDelete(video.id)}>삭제</Button>
      </Box>
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
        <Typography variant="caption" sx={{ textAlign: 'center' }}>
          {video.title} • {video.duration}s
        </Typography>
      </Box>
    </Box>
  );
};

export default V2VideoCard;


