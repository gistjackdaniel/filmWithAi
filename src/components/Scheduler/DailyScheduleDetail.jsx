import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Grid
} from '@mui/material'
import {
  Schedule,
  LocationOn,
  AccessTime,
  Description
} from '@mui/icons-material'

/**
 * 일일 스케줄 상세 정보 컴포넌트
 * dailySchedule 배열의 시간별 활동 정보를 표시
 */
const DailyScheduleDetail = ({ dailySchedule, dayNumber, location, totalScenes }) => {
  if (!dailySchedule || dailySchedule.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            상세 스케줄 정보가 없습니다.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // 활동별 색상 매핑
  const getActivityColor = (activity) => {
    switch (activity) {
      case '집합':
        return 'primary'
      case '이동':
        return 'secondary'
      case '리허설':
        return 'warning'
      case '세팅':
        return 'info'
      case '촬영':
        return 'success'
      case '점심':
      case '저녁':
        return 'error'
      case '정리 및 해산':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Schedule color="primary" />
          <Typography variant="h6" component="h3">
            Day {dayNumber} 상세 스케줄
          </Typography>
          <Chip 
            icon={<LocationOn />} 
            label={location} 
            size="small" 
            color="secondary" 
          />
          <Chip 
            icon={<Description />} 
            label={`${totalScenes}개 씬`} 
            size="small" 
            color="info" 
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 상세 스케줄 테이블 */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime fontSize="small" />
                    시간
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>
                  활동
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '65%' }}>
                  상세 내용
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailySchedule.map((schedule, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: 'grey.25' },
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {schedule.time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.activity}
                      size="small"
                      color={getActivityColor(schedule.activity)}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {schedule.description}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 요약 정보 */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>총 활동:</strong> {dailySchedule.length}개
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>촬영 활동:</strong> {dailySchedule.filter(s => s.activity === '촬영').length}개
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}

export default DailyScheduleDetail 