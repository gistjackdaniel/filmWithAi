import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material'
import {
  Schedule,
  LocationOn,
  CameraAlt,
  Group,
  Build,
  ExpandMore,
  Print,
  Download,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { generateOptimalSchedule, generateBreakdown, generateScheduleCSV, generateBreakdownCSV } from '../services/schedulerService'
import { SceneDetailModal } from '../components/scene'
import { CommonHeader } from '../components/common'
import { getScenes } from '../services/sceneApi'

import api from '../services/api'

/**
 * 일일 브레이크다운 페이지 컴포넌트
 * AllSchedulePage의 일일 스케줄 데이터를 활용하여 상세한 일일 브레이크다운을 생성하고 표시
 * PRD 브레이크다운 기능의 핵심 UI
 */
const DailyBreakdownPage = () => {
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  const location = useLocation()

  // URL 파라미터에서 프로젝트 ID 가져오기
  const { projectId } = useParams()

  // 로컬 상태 관리
  const [isGenerating, setIsGenerating] = useState(false)
  const [scheduleData, setScheduleData] = useState(null)
  const [breakdownData, setBreakdownData] = useState(null)
  const [activeTab, setActiveTab] = useState(0) // 0: 스케줄, 1: 브레이크다운
  const [projectInfo, setProjectInfo] = useState(null) // 프로젝트 정보

  // 콘티 상세 모달 상태 추가
  const [selectedConte, setSelectedConte] = useState(null) // 선택된 콘티 정보
  const [conteModalOpen, setConteModalOpen] = useState(false) // 모달 열림 여부

  // 날짜 설정 상태 추가
  const [startDate, setStartDate] = useState('') // 시작 날짜
  const [endDate, setEndDate] = useState('') // 종료 날짜
  const [dateRange, setDateRange] = useState([]) // 실제 날짜 배열

  // 프로젝트 정보 로드
  const loadProjectInfo = async () => {
    try {
      if (!projectId) return;
      
      const response = await api.get(`/project/${projectId}`);
      if (response.data.success) {
        setProjectInfo(response.data.data);
      }
    } catch (error) {
      console.error('프로젝트 정보 로드 실패:', error);
    }
  };

  /**
   * 스케줄 데이터 로드 함수 (NestJS 백엔드 연동)
   */
  const loadScheduleData = async () => {
    try {
      if (!projectId) {
        console.warn('프로젝트 ID가 없습니다.');
        return;
      }

      console.log('📋 스케줄 데이터 로드 중...');
      const response = await api.get(`/project/${projectId}/scheduler`);
      
      if (response.data.success && response.data.data) {
        console.log('✅ 스케줄 데이터 로드 완료:', response.data.data);
        setScheduleData(response.data.data);
        
        // 스케줄 데이터가 있으면 브레이크다운 생성
        if (response.data.data.days && response.data.data.days.length > 0) {
          generateBreakdownFromSchedule(response.data.data);
        }
      } else {
        console.log('📋 스케줄 데이터가 없습니다.');
        // 스케줄이 없으면 씬 데이터로부터 생성
        await generateScheduleFromScenes();
      }
    } catch (error) {
      console.error('❌ 스케줄 데이터 로드 실패:', error);
      // 로드 실패 시 씬 데이터로부터 생성
      await generateScheduleFromScenes();
    }
  };

  /**
   * 씬 데이터로부터 스케줄 생성 함수
   */
  const generateScheduleFromScenes = async () => {
    try {
      if (!projectId) {
        toast.error('프로젝트 ID가 없습니다.');
        return;
      }

      console.log('🎬 씬 데이터로부터 스케줄 생성 중...');
      
      // 1. 프로젝트의 씬 데이터 가져오기
      const scenesResponse = await getScenes(projectId);
      if (!scenesResponse.success || !scenesResponse.data) {
        toast.error('씬 데이터를 가져올 수 없습니다.');
        return;
      }

      const scenes = scenesResponse.data;
      if (scenes.length === 0) {
        toast.error('씬 데이터가 없습니다. 먼저 씬을 생성해주세요.');
        return;
      }

      // 2. 스케줄러 서비스를 사용하여 최적화된 스케줄 생성 (씬 기반 장소 관리)
      const scheduleResult = await generateOptimalSchedule(scenes, projectId);
      setScheduleData(scheduleResult);
      console.log('✅ 스케줄 생성 완료:', scheduleResult);

      // 5. 브레이크다운 생성
      generateBreakdownFromSchedule(scheduleResult);

      // 6. NestJS 백엔드에 스케줄 저장
      try {
        const saveResponse = await api.post(`/project/${projectId}/scheduler`, {
          days: scheduleResult.days,
          totalDays: scheduleResult.totalDays,
          totalScenes: scheduleResult.totalScenes,
          estimatedTotalDuration: scheduleResult.estimatedTotalDuration,
          createdAt: new Date()
        });
        
        if (saveResponse.data.success) {
          console.log('✅ 스케줄 DB 저장 완료');
        }
      } catch (err) {
        console.error('❌ 스케줄 DB 저장 실패:', err);
      }
    } catch (error) {
      console.error('❌ 스케줄 생성 실패:', error);
      toast.error('스케줄 생성에 실패했습니다.');
    }
  };

  /**
   * 스케줄 데이터로부터 브레이크다운 생성 함수
   */
  const generateBreakdownFromSchedule = (scheduleData) => {
    try {
      if (!scheduleData || !scheduleData.days || scheduleData.days.length === 0) {
        console.warn('스케줄 데이터가 없습니다.');
        return;
      }

      console.log('📊 브레이크다운 생성 중...');
      
      // 각 일차별로 브레이크다운 생성
      const breakdowns = scheduleData.days.map((day, dayIndex) => {
        const breakdown = generateBreakdown(day);
        return {
          day: day.day,
          date: day.date,
          breakdown: breakdown
        };
      });

      setBreakdownData(breakdowns);
      console.log('✅ 브레이크다운 생성 완료:', breakdowns);
    } catch (error) {
      console.error('❌ 브레이크다운 생성 실패:', error);
      toast.error('브레이크다운 생성에 실패했습니다.');
    }
  };

  /**
   * 날짜 범위 계산 함수
   * 시작 날짜부터 종료 날짜까지의 모든 날짜를 배열로 반환
   */
  const calculateDateRange = (start, end) => {
    if (!start || !end) return []
    
    const startDate = new Date(start)
    const endDate = new Date(end)
    const dates = []
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }
    
    return dates
  }

  /**
   * 날짜 포맷팅 함수
   * Date 객체를 'YYYY-MM-DD' 형태로 변환
   */
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  /**
   * 한국어 날짜 포맷팅 함수
   * Date 객체를 '2024년 1월 15일 (월)' 형태로 변환
   */
  const formatKoreanDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[d.getDay()]
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`
  }

  /**
   * 뒤로가기 버튼 핸들러
   */
  const handleBack = () => {
    navigate(-1)
  }

  /**
   * 씬(Chip) 클릭 핸들러 - 콘티 상세 모달 오픈
   */
  const handleSceneClick = (scene) => {
    setSelectedConte(scene)
    setConteModalOpen(true)
  }

  /**
   * 인쇄 핸들러
   */
  const handlePrint = () => {
    window.print()
  }

  /**
   * 날짜 설정 핸들러
   * 시작 날짜와 종료 날짜가 변경될 때 날짜 범위를 계산
   */
  const handleDateChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value)
    } else if (type === 'end') {
      setEndDate(value)
    }
    
    // 두 날짜가 모두 설정되면 날짜 범위 계산
    if (startDate && value && type === 'end') {
      const dates = calculateDateRange(startDate, value)
      setDateRange(dates)
      console.log('📅 날짜 범위 설정:', {
        start: startDate,
        end: value,
        totalDays: dates.length,
        dates: dates.map(d => formatKoreanDate(d))
      })
    } else if (value && endDate && type === 'start') {
      const dates = calculateDateRange(value, endDate)
      setDateRange(dates)
      console.log('📅 날짜 범위 설정:', {
        start: value,
        end: endDate,
        totalDays: dates.length,
        dates: dates.map(d => formatKoreanDate(d))
      })
    }
  }

  /**
   * CSV 다운로드 핸들러
   */
  const handleDownloadCSV = () => {
    if (scheduleData) {
      const csvContent = generateScheduleCSV(scheduleData)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${projectInfo?.title || 'project'}_schedule.csv`
      link.click()
      toast.success('CSV 파일이 다운로드되었습니다.')
    }
  }

  /**
   * 브레이크다운 CSV 다운로드 핸들러
   */
  const handleDownloadBreakdownCSV = () => {
    if (breakdownData) {
      const csvContent = generateBreakdownCSV(breakdownData)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${projectInfo?.title || 'project'}_breakdown.csv`
      link.click()
      toast.success('브레이크다운 CSV 파일이 다운로드되었습니다.')
    }
  }

  /**
   * PDF 다운로드 핸들러 (브라우저 인쇄 기능 활용)
   */
  const handleDownloadPDF = () => {
    // 인쇄 스타일을 적용하여 PDF로 저장
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>${projectInfo?.title || 'Project'} - 촬영 스케줄</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin: 20px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${projectInfo?.title || 'Project'} - 촬영 스케줄</h1>
            <p>생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
          </div>
          <div class="summary">
            <h3>스케줄 요약</h3>
            <p>총 촬영 일수: ${scheduleData?.totalDays || 0}일</p>
            <p>총 씬 수: ${scheduleData?.totalScenes || 0}개</p>
            <p>예상 총 촬영 시간: ${scheduleData?.estimatedTotalDuration || 0}분</p>
          </div>
          ${document.querySelector('.schedule-table')?.outerHTML || ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // 예상 시간(분, 소수 포함)을 'X시간 Y분 Z초'로 변환하는 함수
  function formatDuration(minutes) {
    // NaN, 0, undefined, 음수, 빈 문자열 등은 5분으로 보정
    const safeMin = Number(minutes);
    const minVal = (isNaN(safeMin) || safeMin <= 0) ? 5 : safeMin;
    const totalSeconds = Math.round(minVal * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    let result = '';
    if (hours > 0) result += `${hours}시간 `;
    if (mins > 0) result += `${mins}분 `;
    if (secs > 0) result += `${secs}초`;
    return result.trim() || '0초';
  }

  // 촬영 시간 표시 함수 (실제 촬영 시간과 분량 시간 구분)
  function formatShootingTime(scene) {
    // 분량(estimatedDuration)은 문자열 그대로 사용
    const contentDurationStr = scene.estimatedDuration || '5분';
    // 실제 촬영 시간 계산만 숫자 변환
    let raw = scene.estimatedDuration;
    if (typeof raw === 'string') {
      const match = raw.match(/\d+/);
      raw = match ? Number(match[0]) : NaN;
    }
    const contentDuration = Number(raw) || 5;
    const shootingDuration = Number(scene.actualShootingDuration) || 5;
    let ratio = '-';
    if (contentDuration > 0 && shootingDuration > 0) {
      ratio = (shootingDuration / contentDuration).toFixed(1);
    }
    return {
      content: contentDurationStr, // 문자열 그대로
      shooting: formatDuration(shootingDuration),
      ratio
    };
  }

  // 안전한 촬영 시간 계산 (백업용, 실제로는 사용 안 함)
  function getSafeDuration(scene) {
    return Number(scene.actualShootingDuration) || 5;
  }

  // 시간대별 시간 범위를 가져오는 함수 (스케줄러 서비스와 일치)
  const getTimeSlotRange = (timeSlot) => {
    switch (timeSlot) {
      case '오전':
      case '아침':
      case 'morning':
        return { 
          label: '오전 (09:00-12:00)', 
          availableMinutes: 180 // 3시간 = 180분
        }
      case '오후':
      case 'afternoon':
        return { 
          label: '오후 (13:00-17:00)', 
          availableMinutes: 240 // 4시간 = 240분
        }
      case '저녁':
      case 'evening':
        return { 
          label: '저녁 (18:00-21:00)', 
          availableMinutes: 180 // 3시간 = 180분
        }
      case '밤':
      case 'night':
        return { 
          label: '밤 (22:00-02:00)', 
          availableMinutes: 240 // 4시간 = 240분
        }
      case '새벽':
      case 'dawn':
        return { 
          label: '새벽 (05:00-08:00)', 
          availableMinutes: 180 // 3시간 = 180분
        }
      default:
        return { 
          label: '일반 (10:00-18:00)', 
          availableMinutes: 480 // 8시간 = 480분
        }
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (projectId) {
      loadProjectInfo();
      loadScheduleData();
    }
  }, [projectId]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* 공통 헤더 */}
      <CommonHeader 
        title="일일 브레이크다운"
        showBackButton={true}
        onBack={handleBack}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            인쇄
          </Button>
          <Button
            color="inherit"
            startIcon={<PictureAsPdf />}
            onClick={handleDownloadPDF}
          >
            PDF
          </Button>
          <Button
            color="inherit"
            startIcon={<TableChart />}
            onClick={handleDownloadCSV}
          >
            CSV
          </Button>
          <Button
            color="inherit"
            startIcon={<Download />}
            onClick={handleDownloadBreakdownCSV}
          >
            브레이크다운 CSV
          </Button>
        </Box>
      </CommonHeader>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 헤더 정보 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            일일 브레이크다운
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {projectInfo?.title ? `${projectInfo.title} - ` : ''}AllSchedulePage의 일일 스케줄 데이터를 활용한 상세한 촬영 브레이크다운입니다.
          </Typography>

          {/* 날짜 설정 섹션 */}
          {scheduleData && (
            <Card sx={{ mb: 3, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📅 촬영 기간 설정
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                촬영 시작일과 종료일을 설정하면 스케줄표에 실제 날짜가 표시됩니다.
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="촬영 시작일"
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: formatDate(new Date()) }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="촬영 종료일"
                    type="date"
                    value={endDate}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: startDate || formatDate(new Date()) }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    총 촬영 기간: {dateRange.length > 0 ? `${dateRange.length}일` : '설정 필요'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    스케줄 일수: {scheduleData.totalDays}일
                  </Typography>
                </Grid>
              </Grid>
              
              {dateRange.length > 0 && dateRange.length < scheduleData.totalDays && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ⚠️ 설정된 촬영 기간({dateRange.length}일)이 스케줄 일수({scheduleData.totalDays}일)보다 적습니다.
                  종료일을 늘려주세요.
                </Alert>
              )}
            </Card>
          )}

          {scheduleData && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Chip
                icon={<Schedule />}
                label={`총 ${scheduleData.totalDays}일`}
                color="primary"
              />
              <Chip
                icon={<CameraAlt />}
                label={`총 ${scheduleData.totalScenes}개 씬`}
                color="secondary"
              />
              <Chip
                icon={<LocationOn />}
                label={`총 ${scheduleData.estimatedTotalDuration}분 (실제 촬영)`}
                color="success"
              />
              {scheduleData.optimizationScore && (
                <Chip
                  icon={<Build />}
                  label={`최적화 점수: ${scheduleData.optimizationScore.efficiency}%`}
                  color="info"
                />
              )}
            </Box>
          )}
        </Box>

        {/* 로딩 상태 */}
        {isGenerating && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 스케줄 데이터 표시 */}
        {scheduleData && !isGenerating && (
          <Grid container spacing={3}>
            {/* 탭 버튼 */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant={activeTab === 0 ? 'contained' : 'outlined'}
                  onClick={() => setActiveTab(0)}
                  startIcon={<Schedule />}
                >
                  일일 촬영 스케줄
                </Button>
                <Button
                  variant={activeTab === 1 ? 'contained' : 'outlined'}
                  onClick={() => setActiveTab(1)}
                  startIcon={<Build />}
                >
                  브레이크다운
                </Button>
              </Box>
            </Grid>

            {/* 일일 촬영 스케줄 */}
            {activeTab === 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      일일 촬영 스케줄표
                    </Typography>

                    <TableContainer component={Paper} sx={{ mt: 2 }} className="schedule-table">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>일차</TableCell>
                            <TableCell>날짜</TableCell>
                            <TableCell>촬영 장소</TableCell>
                            <TableCell>촬영 씬</TableCell>
                            <TableCell>촬영 시간</TableCell>
                            <TableCell>필요 인력</TableCell>
                            <TableCell>필요 장비</TableCell>
                            <TableCell>시간대별</TableCell>
                          </TableRow>
                        </TableHead>
                          <TableBody>
                            {scheduleData.days.map((day, index) => (
                              <TableRow key={index}>
                                <TableCell>{day.day}</TableCell>
                                <TableCell>
                                  {dateRange.length > 0 && dateRange[day.day - 1] ? (
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {formatKoreanDate(dateRange[day.day - 1])}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDate(dateRange[day.day - 1])}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    day.date
                                  )}
                                </TableCell>
                                <TableCell>{day.location}</TableCell>
                                <TableCell>
                                  <Box>
                                    {day.scenes.map((scene, sceneIndex) => (
                                      // 씬 Chip 클릭 시 상세 모달 오픈
                                      <Chip
                                        key={sceneIndex}
                                        label={`씬 ${scene.scene}`}
                                        size="small"
                                        sx={{ mr: 0.5, mb: 0.5, cursor: 'pointer' }}
                                        onClick={() => handleSceneClick(scene)}
                                      />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" color="primary">
                                      <strong>촬영: {formatDuration(day.estimatedDuration)}</strong>
                                    </Typography>
                                    {day.scenes.map((scene, sceneIndex) => {
                                      const timeInfo = formatShootingTime(scene);
                                      return (
                                        <Typography key={sceneIndex} variant="caption" display="block" sx={{ mt: 0.5 }}>
                                          씬 {scene.scene}: 분량 {timeInfo.content} → 촬영 {timeInfo.shooting} ({timeInfo.ratio}배)
                                        </Typography>
                                      );
                                    })}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    {day.crew.map((member, memberIndex) => (
                                      <Chip
                                        key={memberIndex}
                                        label={member}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    {day.equipment.map((item, itemIndex) => (
                                      <Chip
                                        key={itemIndex}
                                        label={item}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    {day.scenes.map((scene, sceneIndex) => {
                                      // 정확한 시간대 표시 정보 우선 사용
                                      const timeSlotDisplay = scene.timeSlotDisplay
                                      const timeSlot = scene.keywords?.timeOfDay || '미정'
                                      const timeRange = scene.timeRange
                                      const actualDuration = scene.actualShootingDuration || getSafeDuration(scene)
                                      
                                      // 시간대별 정확한 시간 표시 형식 (우선순위 명확화)
                                      let timeDisplay = `씬 ${scene.scene}: ${timeSlot}`
                                      
                                      // 1. timeSlotDisplay가 있는 경우 최우선 사용 (가장 정확한 시간)
                                      if (timeSlotDisplay && timeSlotDisplay.includes('~')) {
                                        timeDisplay = `씬 ${scene.scene}: ${timeSlotDisplay}`
                                      } 
                                      // 2. sceneStartTime과 sceneEndTime이 있는 경우 사용
                                      else if (scene.sceneStartTime && scene.sceneEndTime) {
                                        timeDisplay = `씬 ${scene.scene}: ${timeSlot} (${scene.sceneStartTime} ~ ${scene.sceneEndTime})`
                                      } 
                                      // 3. timeRange가 있는 경우 사용
                                      else if (timeRange && timeRange.start && timeRange.end) {
                                        timeDisplay = `씬 ${scene.scene}: ${timeSlot} (${timeRange.start} ~ ${timeRange.end})`
                                      } 
                                      
                                      return (
                                        <Typography key={sceneIndex} variant="caption" display="block" sx={{ mb: 0.5 }}>
                                          {timeDisplay}
                                        </Typography>
                                      )
                                    })}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* 브레이크다운 */}
            {activeTab === 1 && breakdownData && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      촬영 브레이크다운
                    </Typography>

                    <Grid container spacing={3} sx={{ mt: 2 }}>
                      {/* 장소별 분류 (최우선) */}
                      <Grid item xs={12} md={6}>
                        <Accordion defaultExpanded>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">
                              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                              촬영 장소별 분류 (최우선)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {Object.entries(breakdownData.locations).map(([location, scenes]) => (
                              <Box key={location} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="primary">
                                  {location} ({scenes.length}개 씬)
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                  {scenes.map((scene, index) => (
                                    <Typography key={index} variant="body2">
                                      • 씬 {scene.scene}: {scene.title}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>

                      {/* 배우별 분류 (두 번째 우선순위) */}
                      <Grid item xs={12} md={6}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">
                              <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
                              배우별 분류 (두 번째 우선순위)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {Object.entries(breakdownData.actors).map(([actor, scenes]) => (
                              <Box key={actor} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="primary">
                                  {actor} ({scenes.length}개 씬)
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                  {scenes.map((scene, index) => (
                                    <Typography key={index} variant="body2">
                                      • 씬 {scene.scene}: {scene.title}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>

                      {/* 시간대별 분류 (세 번째 우선순위) */}
                      <Grid item xs={12} md={6}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">
                              <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                              시간대별 분류 (세 번째 우선순위)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {Object.entries(breakdownData.timeSlots).map(([timeSlot, scenes]) => {
                              // 시간대별 총 촬영시간 계산
                              const totalShootingTime = scenes.reduce((total, scene) => {
                                const actualDuration = scene.actualShootingDuration || getSafeDuration(scene)
                                return total + actualDuration
                              }, 0)
                              
                              // 시간대별 시간 범위 가져오기
                              const timeRange = getTimeSlotRange(timeSlot)
                              
                              return (
                                <Box key={timeSlot} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                  <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
                                    {timeSlot} ({scenes.length}개 씬)
                                  </Typography>
                                  
                                  {/* 시간대별 시간 범위 표시 */}
                                  {timeRange && (
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                      📅 {timeRange.label} (총 {timeRange.availableMinutes}분)
                                    </Typography>
                                  )}
                                  
                                  {/* 총 촬영시간 표시 */}
                                  <Typography variant="caption" display="block" color="primary" sx={{ mb: 1 }}>
                                    ⏰ 총 촬영시간: {formatDuration(totalShootingTime)}
                                  </Typography>
                                  
                                  {/* 시간 효율성 표시 */}
                                  {timeRange && (
                                    <Typography variant="caption" display="block" color="info.main" sx={{ mb: 1 }}>
                                      📊 시간 효율성: {Math.round((totalShootingTime / timeRange.availableMinutes) * 100)}%
                                    </Typography>
                                  )}
                                  
                                  <Box sx={{ ml: 2 }}>
                                    {scenes.map((scene, index) => {
                                      const actualDuration = scene.actualShootingDuration || getSafeDuration(scene)
                                      const timeInfo = formatShootingTime(scene)
                                      const timeSlotDisplay = scene.timeSlotDisplay
                                      const timeSlot = scene.keywords?.timeOfDay || '미정'
                                      const timeRange = scene.timeRange
                                      
                                      // 정확한 시간 표시 형식
                                      let timeDisplay = `씬 ${scene.scene}: ${timeSlot}`
                                      
                                      // 정확한 시간대 표시 정보가 있는 경우 우선 사용
                                      if (timeSlotDisplay) {
                                        timeDisplay = `씬 ${scene.scene}: ${timeSlotDisplay}`
                                      } else if (scene.sceneStartTime && scene.sceneEndTime) {
                                        // 씬 시작/종료 시간이 있는 경우 정확한 시간 표시
                                        timeDisplay = `씬 ${scene.scene}: ${timeSlot} (${scene.sceneStartTime} ~ ${scene.sceneEndTime})`
                                      } else if (timeRange) {
                                        // 시간대별 시간 범위가 있는 경우
                                        timeDisplay = `씬 ${scene.scene}: ${timeSlot} (${timeRange.start} ~ ${timeRange.end})`
                                      }
                                      
                                      return (
                                        <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {timeDisplay}
                                          </Typography>
                                          
                                          {/* 촬영시간 정보 */}
                                          <Typography variant="caption" display="block" color="primary">
                                            촬영시간: {formatDuration(actualDuration)}
                                          </Typography>
                                          
                                          {/* 분량 대비 촬영시간 비율 */}
                                          <Typography variant="caption" display="block" color="text.secondary">
                                            분량 {timeInfo.content} → 촬영 {timeInfo.shooting} ({timeInfo.ratio}배)
                                          </Typography>
                                        </Box>
                                      )
                                    })}
                                  </Box>
                                </Box>
                              )
                            })}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>

                      {/* 장비별 분류 (네 번째 우선순위) */}
                      <Grid item xs={12} md={6}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">
                              <CameraAlt sx={{ mr: 1, verticalAlign: 'middle' }} />
                              장비별 분류 (네 번째 우선순위)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {Object.entries(breakdownData.equipment).map(([equipment, scenes]) => (
                              <Box key={equipment} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="secondary">
                                  {equipment} ({scenes.length}개 씬)
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                  {scenes.map((scene, index) => (
                                    <Typography key={index} variant="body2">
                                      • 씬 {scene.scene}: {scene.title}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>

                      {/* 인력별 분류 */}
                      <Grid item xs={12} md={6}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">
                              <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
                              인력별 분류
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {Object.entries(breakdownData.crew).map(([crew, scenes]) => (
                              <Box key={crew} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="primary">
                                  {crew} ({scenes.length}개 씬)
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                  {scenes.map((scene, index) => (
                                    <Typography key={index} variant="body2">
                                      • 씬 {scene.scene}: {scene.title}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>

                      {/* 소품별 분류 */}
                      <Grid item xs={12} md={6}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">
                              <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                              소품별 분류
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {Object.entries(breakdownData.props).map(([prop, scenes]) => (
                              <Box key={prop} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="secondary">
                                  {prop} ({scenes.length}개 씬)
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                  {scenes.map((scene, index) => (
                                    <Typography key={index} variant="body2">
                                      • 씬 {scene.scene}: {scene.title}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* 데이터 없음 상태 */}
        {!scheduleData && !isGenerating && (
          <Alert severity="info" sx={{ mt: 3 }}>
            스케줄 데이터가 없습니다. 먼저 씬을 생성하고 스케줄을 생성해주세요.
          </Alert>
        )}
      </Container>

      {/* 씬 상세 모달 (공통 컴포넌트 사용) */}
      <SceneDetailModal
        open={conteModalOpen}
        onClose={() => setConteModalOpen(false)}
        scene={selectedConte}
        onEdit={null} // 스케줄표에서는 편집 기능 비활성화
        onImageRetry={null} // 스케줄표에서는 이미지 재시도 기능 비활성화
        imageLoadErrors={{}}
        onImageLoadError={null}
      />
    </Box>
  )
}

export default DailyBreakdownPage 