import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Chip, Stack } from '@mui/material';
import type { ScheduleResult, ScheduleDay, TimeSlotItem } from '../services/schedulerService';

interface Props {
  schedule: ScheduleResult | null;
}

const TimeSlotRow: React.FC<{ item: TimeSlotItem }> = ({ item }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
        {item.startTime} ~ {item.endTime}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, ml: 2 }}>
        {item.activity}
        {item.sceneNumber ? ` · 씬 ${item.sceneNumber}` : ''}
        {item.sceneTitle ? `: ${item.sceneTitle}` : ''}
        {item.details ? ` (${item.details})` : ''}
      </Typography>
    </Box>
  );
};

const DayCard: React.FC<{ day: ScheduleDay }> = ({ day }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{day.date}</Typography>
          {day.timeRange && (
            <Chip size="small" label={`${day.timeRange.start} ~ ${day.timeRange.end}`} />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          총 {day.totalScenes}개 씬 · 약 {Math.round(day.estimatedDuration)}분
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={0.5}>
          {day.timeSlots.map((slot, idx) => (
            <TimeSlotRow key={idx} item={slot} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

const ScheduleViewer: React.FC<Props> = ({ schedule }) => {
  if (!schedule) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">스케줄이 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">
          총 {schedule.totalDays}일 · 씬 {schedule.totalScenes}개 · 약 {Math.round(schedule.estimatedTotalDuration)}분
        </Typography>
      </Box>
      {schedule.days.map(day => (
        <DayCard key={day.day} day={day} />
      ))}
    </Box>
  );
};

export default ScheduleViewer;


