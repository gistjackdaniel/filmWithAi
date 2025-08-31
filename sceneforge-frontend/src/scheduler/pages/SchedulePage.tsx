import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import type { Scene } from '../../scene/services/sceneService';
import { ScheduleViewer } from '..';
import { generateOptimalSchedule, type ScheduleResult } from '../services/schedulerService';

interface Props {
  scenes: Scene[];
}

const SchedulePage: React.FC<Props> = ({ scenes }) => {
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        스케줄링
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          disabled={scenes.length === 0}
          onClick={() => {
            const result = generateOptimalSchedule(scenes);
            setSchedule(result);
          }}
        >
          스케줄 생성
        </Button>
        <Button
          variant="outlined"
          onClick={() => setSchedule(null)}
        >
          초기화
        </Button>
      </Box>
      {schedule ? (
        <ScheduleViewer schedule={schedule} />
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            씬 데이터를 기반으로 스케줄을 생성하세요.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SchedulePage;


