import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  Close,
  Download,
  Print,
  Refresh
} from '@mui/icons-material'
import { generateDailyShootingPlanWithRetry } from '../../services/schedulerService'
import toast from 'react-hot-toast'

/**
 * 일일촬영계획표 모달 컴포넌트
 * 특정 날짜의 촬영 일정을 바탕으로 일일촬영계획표를 생성하고 표시
 */
const DailyShootingPlanModal = ({ 
  open, 
  onClose, 
  projectTitle, 
  shootingDate, 
  scenes, 
  dailySchedule, // 새로운 dailySchedule 정보 추가
  weather = '맑음',
  sunrise = '05:30',
  sunset = '19:30'
}) => {
  const [dailyPlan, setDailyPlan] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  // 모달이 열릴 때마다 일일촬영계획표 생성
  useEffect(() => {
    if (open && scenes && scenes.length > 0) {
      generateDailyPlan()
    }
  }, [open, scenes])

  // 일일촬영계획표 생성
  const generateDailyPlan = async () => {
    if (!scenes || scenes.length === 0) {
      setError('촬영할 씬이 없습니다.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log('🎬 일일촬영계획표 생성 시작:', {
        projectTitle,
        shootingDate,
        scenesCount: scenes.length
      })

      const requestData = {
        projectTitle,
        shootingDate,
        scenes,
        weather,
        sunrise,
        sunset,
        staffInfo: '감독, 촬영감독, 조명감독, 미술감독, 소품담당, 의상담당, 분장담당',
        locationInfo: '주요 촬영 장소 정보'
      }

      const response = await generateDailyShootingPlanWithRetry(requestData)

      if (response.success) {
        setDailyPlan(response.data.dailyPlan)
        toast.success('일일촬영계획표가 생성되었습니다!')
      } else {
        throw new Error(response.message || '일일촬영계획표 생성에 실패했습니다.')
      }

    } catch (error) {
      console.error('❌ 일일촬영계획표 생성 실패:', error)
      setError(error.message)
      toast.error('일일촬영계획표 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 일일촬영계획표 재생성
  const handleRegenerate = () => {
    generateDailyPlan()
  }

  // 일일촬영계획표 다운로드
  const handleDownload = () => {
    if (!dailyPlan) return

    const content = `일일촬영계획표\n\n${dailyPlan}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${projectTitle}_일일촬영계획표_${shootingDate}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('일일촬영계획표가 다운로드되었습니다!')
  }

  // 일일촬영계획표 인쇄
  const handlePrint = () => {
    if (!dailyPlan) return

    // 새로운 dailySchedule 정보를 사용하여 정확한 시간표 생성
    let scheduleTableRows = ''
    
    if (dailySchedule && dailySchedule.length > 0) {
      // dailySchedule의 각 활동을 테이블 행으로 변환
      scheduleTableRows = dailySchedule.map(schedule => {
        return `
                    <tr>
                      <td>${schedule.time}</td>
                      <td>${schedule.activity}</td>
                      <td>${schedule.description}</td>
                    </tr>`
      }).join('')
    } else {
      // dailySchedule이 없는 경우 기존 로직 사용
      const scheduleTimes = scenes.map(scene => {
        const timeOfDay = scene.keywords?.timeOfDay || '낮'
        const estimatedDuration = scene.estimatedDuration || '5분'
        return {
          scene: scene.scene,
          timeOfDay,
          estimatedDuration,
          title: scene.title,
          location: scene.keywords?.location || '미정'
        }
      })

      // 시간대별로 씬 그룹화
      const morningScenes = scheduleTimes.filter(s => s.timeOfDay === '아침' || s.timeOfDay === '이른 아침')
      const dayScenes = scheduleTimes.filter(s => s.timeOfDay === '낮' || s.timeOfDay === '오후')
      const eveningScenes = scheduleTimes.filter(s => s.timeOfDay === '저녁' || s.timeOfDay === '밤')
      const nightScenes = scheduleTimes.filter(s => s.timeOfDay === '밤' || s.timeOfDay === '늦은 밤')

      if (morningScenes.length > 0) {
        scheduleTableRows += `
                      <tr>
                        <td>06:00-07:00</td>
                        <td>집합 및 이동</td>
                        <td>전체 스태프 집합</td>
                      </tr>
                      <tr>
                        <td>07:00-08:00</td>
                        <td>촬영 준비</td>
                        <td>카메라, 조명, 미술 셋팅</td>
                      </tr>
                      <tr>
                        <td>08:00-12:00</td>
                        <td>촬영</td>
                        <td>아침 씬: ${morningScenes.map(s => s.scene).join(', ')}</td>
                      </tr>`
      }
      
      if (dayScenes.length > 0) {
        if (scheduleTableRows) {
          scheduleTableRows += `
                        <tr>
                          <td>12:00-13:00</td>
                          <td>점심식사</td>
                          <td>1시간 휴식</td>
                        </tr>
                        <tr>
                          <td>13:00-18:00</td>
                          <td>촬영</td>
                          <td>낮 씬: ${dayScenes.map(s => s.scene).join(', ')}</td>
                        </tr>`
        } else {
          scheduleTableRows += `
                        <tr>
                          <td>06:00-07:00</td>
                          <td>집합 및 이동</td>
                          <td>전체 스태프 집합</td>
                        </tr>
                        <tr>
                          <td>07:00-08:00</td>
                          <td>촬영 준비</td>
                          <td>카메라, 조명, 미술 셋팅</td>
                        </tr>
                        <tr>
                          <td>08:00-12:00</td>
                          <td>촬영 준비</td>
                          <td>촬영지 셋팅 완료</td>
                        </tr>
                        <tr>
                          <td>12:00-13:00</td>
                          <td>점심식사</td>
                          <td>1시간 휴식</td>
                        </tr>
                        <tr>
                          <td>13:00-18:00</td>
                          <td>촬영</td>
                          <td>낮 씬: ${dayScenes.map(s => s.scene).join(', ')}</td>
                        </tr>`
        }
      }
      
      if (eveningScenes.length > 0) {
        scheduleTableRows += `
                        <tr>
                          <td>18:00-19:00</td>
                          <td>저녁식사</td>
                          <td>1시간 휴식</td>
                        </tr>
                        <tr>
                          <td>19:00-22:00</td>
                          <td>촬영</td>
                          <td>저녁 씬: ${eveningScenes.map(s => s.scene).join(', ')}</td>
                        </tr>`
      }
      
      if (nightScenes.length > 0) {
        scheduleTableRows += `
                        <tr>
                          <td>22:00-23:00</td>
                          <td>야간 촬영 준비</td>
                          <td>조명 셋팅</td>
                        </tr>
                        <tr>
                          <td>23:00-02:00</td>
                          <td>촬영</td>
                          <td>밤 씬: ${nightScenes.map(s => s.scene).join(', ')}</td>
                        </tr>
                        <tr>
                          <td>02:00-03:00</td>
                          <td>정리 및 마무리</td>
                          <td>촬영 종료</td>
                        </tr>`
      }
      
      // 기본 일정 (씬이 없는 경우)
      if (!scheduleTableRows) {
        scheduleTableRows = `
                        <tr>
                          <td>06:00-07:00</td>
                          <td>집합 및 이동</td>
                          <td>전체 스태프 집합</td>
                        </tr>
                        <tr>
                          <td>07:00-08:00</td>
                          <td>촬영 준비</td>
                          <td>카메라, 조명, 미술 셋팅</td>
                        </tr>
                        <tr>
                          <td>08:00-12:00</td>
                          <td>촬영</td>
                          <td>씬 ${scenes.map(s => s.scene).join(', ')}</td>
                        </tr>
                        <tr>
                          <td>12:00-13:00</td>
                          <td>점심식사</td>
                          <td>1시간 휴식</td>
                        </tr>
                        <tr>
                          <td>13:00-18:00</td>
                          <td>촬영</td>
                          <td>계속 촬영</td>
                        </tr>
                        <tr>
                          <td>18:00-19:00</td>
                          <td>저녁식사/정리</td>
                          <td>촬영 마무리</td>
                        </tr>`
      }
    }

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>일일촬영계획표 - ${projectTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body { 
              font-family: 'Malgun Gothic', Arial, sans-serif; 
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
            }
            
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
            }
            
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            
            .header h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 5px 0;
              color: #000;
            }
            
            .header .subtitle {
              font-size: 16px;
              font-weight: bold;
              margin: 0;
              color: #333;
            }
            
            .project-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              border: 1px solid #000;
              padding: 10px;
            }
            
            .project-info .left, .project-info .right {
              flex: 1;
            }
            
            .project-info .right {
              text-align: right;
            }
            
            .info-row {
              margin-bottom: 5px;
            }
            
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 80px;
            }
            
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 8px 12px;
              border-left: 4px solid #000;
              margin-bottom: 10px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 11px;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 6px 8px;
              text-align: center;
              vertical-align: middle;
            }
            
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              font-size: 11px;
            }
            
            .schedule-table th, .schedule-table td {
              text-align: left;
            }
            
            .scene-table th, .scene-table td {
              font-size: 10px;
              padding: 4px 6px;
            }
            
            .contact-table th, .contact-table td {
              text-align: left;
            }
            
            .notes {
              border: 1px solid #000;
              padding: 10px;
              margin-top: 20px;
            }
            
            .notes h4 {
              margin: 0 0 10px 0;
              font-size: 14px;
              font-weight: bold;
            }
            
            .notes ul {
              margin: 0;
              padding-left: 20px;
            }
            
            .notes li {
              margin-bottom: 5px;
            }
            
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            
            @media print {
              body { margin: 0; }
              .print-container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>일일촬영계획표</h1>
              <div class="subtitle">DAILY SHOOTING SCHEDULE</div>
            </div>
            
            <div class="project-info">
              <div class="left">
                <div class="info-row">
                  <span class="info-label">제목:</span>
                  <span>${projectTitle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">촬영일:</span>
                  <span>${shootingDate}</span>
                </div>
              </div>
              <div class="right">
                <div class="info-row">
                  <span class="info-label">날씨:</span>
                  <span>${weather}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">일출/일몰:</span>
                  <span>${sunrise} / ${sunset}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">1. 집합 시간 및 장소</div>
              <table>
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>시간</th>
                    <th>장소</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1차 집합</td>
                    <td>06:00</td>
                    <td>${scenes[0]?.keywords?.location || '주요 촬영지'}</td>
                    <td>전체 스태프</td>
                  </tr>
                  <tr>
                    <td>2차 집합</td>
                    <td>07:00</td>
                    <td>${scenes[0]?.keywords?.location || '주요 촬영지'}</td>
                    <td>배우 및 단역</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <div class="section-title">2. 촬영 일정표</div>
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>활동</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  ${scheduleTableRows}
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <div class="section-title">3. 촬영 씬 상세</div>
              <table class="scene-table">
                <thead>
                  <tr>
                    <th>씬번호</th>
                    <th>장소</th>
                    <th>시간대</th>
                    <th>컷수</th>
                    <th>내용</th>
                    <th>등장인물</th>
                    <th>단역</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  ${scenes.map((scene, index) => `
                    <tr>
                      <td>${scene.scene}</td>
                      <td>${scene.keywords?.location || '미정'}</td>
                      <td>${scene.keywords?.timeOfDay || '낮'}</td>
                      <td>3-5컷</td>
                      <td>${scene.title}</td>
                      <td>${scene.characterLayout || '미정'}</td>
                      <td>${scene.props ? '소품 필요' : '없음'}</td>
                      <td>${scene.lighting || '자연광'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <div class="section-title">4. 부서별 준비사항</div>
              <table>
                <thead>
                  <tr>
                    <th>부서</th>
                    <th>준비사항</th>
                    <th>담당자</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>연출부</td>
                    <td>시나리오, 콘티, 무전기, 감독 의자</td>
                    <td>감독</td>
                  </tr>
                  <tr>
                    <td>제작부</td>
                    <td>촬영 일정표, 연락처 목록, 차량 배치</td>
                    <td>제작부장</td>
                  </tr>
                  <tr>
                    <td>미술</td>
                    <td>촬영지 미술 작업, 소품 준비</td>
                    <td>미술감독</td>
                  </tr>
                  <tr>
                    <td>소품</td>
                    <td>씬별 소품 목록, 소품 차량</td>
                    <td>소품담당</td>
                  </tr>
                  <tr>
                    <td>의상/분장</td>
                    <td>배우 의상, 분장 도구, 헤어 도구</td>
                    <td>의상담당</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <div class="section-title">5. 연락처</div>
              <table class="contact-table">
                <thead>
                  <tr>
                    <th>부서</th>
                    <th>담당자</th>
                    <th>연락처</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>연출부</td>
                    <td>감독</td>
                    <td>010-0000-0000</td>
                  </tr>
                  <tr>
                    <td>제작부</td>
                    <td>제작부장</td>
                    <td>010-0000-0001</td>
                  </tr>
                  <tr>
                    <td>미술</td>
                    <td>미술감독</td>
                    <td>010-0000-0002</td>
                  </tr>
                  <tr>
                    <td>소품</td>
                    <td>소품담당</td>
                    <td>010-0000-0003</td>
                  </tr>
                  <tr>
                    <td>의상/분장</td>
                    <td>의상담당</td>
                    <td>010-0000-0004</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="notes">
              <h4>특이사항</h4>
              <ul>
                <li>촬영 시간 준수 필수</li>
                <li>날씨 상황에 따른 대비책 준비</li>
                <li>안전사고 예방에 유의</li>
                <li>촬영 자료 백업 필수</li>
                <li>무전기 사용 시 정확한 용어 사용</li>
                <li>촬영 중 소음 최소화</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>본 일일촬영계획표는 촬영 현장에서 참고용으로 사용됩니다.</p>
              <p>Generated by SceneForge AI - ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    
    // 인쇄 다이얼로그가 닫힌 후 창 닫기
    printWindow.onfocus = function() {
      setTimeout(function() {
        printWindow.close()
      }, 1000)
    }
    
    printWindow.print()
  }

  // 마크다운 테이블을 HTML 테이블로 변환하는 함수
  const parseMarkdownTables = (text) => {
    const sections = text.split(/(?=^## )/m)
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      const title = lines[0].replace('## ', '')
      const content = lines.slice(1).join('\n')
      
      // 테이블 파싱
      const tableMatch = content.match(/\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/)
      
      if (tableMatch) {
        const headers = tableMatch[1].split('|').map(h => h.trim()).filter(h => h)
        const rows = tableMatch[2].split('\n').filter(row => row.trim() && row.includes('|'))
        
        const tableData = rows.map(row => {
          const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
          return cells
        })
        
        return { title, headers, tableData, type: 'table' }
      } else {
        return { title, content, type: 'text' }
      }
    })
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        style: {
          maxHeight: '90vh',
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            일일촬영계획표
          </Typography>
          <Button onClick={onClose} color="inherit">
            <Close />
          </Button>
        </Box>
        <Box mt={1}>
          <Chip 
            label={`${projectTitle} - ${shootingDate}`} 
            color="primary" 
            size="small" 
          />
          <Chip 
            label={`${scenes?.length || 0}개 씬`} 
            variant="outlined" 
            size="small" 
            sx={{ ml: 1 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {isGenerating ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6" mt={2}>
              일일촬영계획표 생성 중...
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              AI가 촬영 일정을 분석하여 상세한 계획표를 작성하고 있습니다.
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : dailyPlan ? (
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {/* 새로운 스케줄 구조 표시 */}
            {dailySchedule && dailySchedule.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  📅 상세 촬영 일정표
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>시간</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>활동</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>상세 내용</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dailySchedule.map((schedule, index) => {
                        // 활동별 색상 매핑
                        const getActivityColor = (activity) => {
                          switch (activity) {
                            case '집합': return 'primary';
                            case '이동': return 'secondary';
                            case '리허설': return 'warning';
                            case '세팅': return 'info';
                            case '촬영': return 'success';
                            case '점심':
                            case '저녁': return 'error';
                            case '정리 및 해산': return 'default';
                            default: return 'default';
                          }
                        };

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* AI 생성된 일일촬영계획표 */}
            {parseMarkdownTables(dailyPlan).map((section, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  {section.title}
                </Typography>
                
                {section.type === 'table' ? (
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {section.headers.map((header, headerIndex) => (
                            <TableCell key={headerIndex} sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {section.tableData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {section.content}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="textSecondary" textAlign="center" py={4}>
            일일촬영계획표를 생성할 수 없습니다.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleRegenerate} 
          disabled={isGenerating}
          startIcon={<Refresh />}
        >
          재생성
        </Button>
        <Button 
          onClick={handleDownload} 
          disabled={!dailyPlan || isGenerating}
          startIcon={<Download />}
        >
          다운로드
        </Button>
        <Button 
          onClick={handlePrint} 
          disabled={!dailyPlan || isGenerating}
          startIcon={<Print />}
        >
          인쇄
        </Button>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DailyShootingPlanModal 