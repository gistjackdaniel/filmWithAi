import React, { useState, useEffect } from 'react';
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
  Button,
  Chip,
  Grid,
  Container,
  Divider,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  Schedule,
  LocationOn,
  Group,
  Videocam,
  AccessTime,
  CameraAlt, // 아이콘 추가
  Build, // 아이콘 추가
  Star, // 즐겨찾기 아이콘 추가
  Delete, // 삭제 아이콘 추가
  Refresh // 재생성 아이콘 추가
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { generateOptimalSchedule } from '../services/schedulerService';
import toast from 'react-hot-toast';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { SceneDetailModal } from '../components/scene';
import { getProject } from '../services/projectApi';
import { CommonHeader } from '../components/common';
import api from '../services/api';
import { scheduleShooting } from '../services/schedulerService';
import { getScenes } from '../services/sceneApi';



/**
 * 간단한 스케줄표 페이지
 * 복잡한 기능 없이 깔끔한 스케줄표만 표시
 */
const SimpleSchedulePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams(); // URL 파라미터에서 프로젝트 ID 가져오기
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0); // 현재 선택된 Day 인덱스 상태 추가
  // 날짜 범위 상태: 시작일, 종료일 (기본값: 오늘~오늘+N-1)
  const [dateRange, setDateRange] = useState([dayjs(), dayjs().add(3, 'day')]);
  
  // 콘티 상세 모달 상태 추가
  const [selectedConte, setSelectedConte] = useState(null); // 선택된 콘티 정보
  const [conteModalOpen, setConteModalOpen] = useState(false); // 모달 열림 여부


  // URL 파라미터 확인하여 즐겨찾기 모드인지 확인
  const isFavoriteView = new URLSearchParams(location.search).get('view') === 'favorite';
  const urlProjectId = new URLSearchParams(location.search).get('projectId');
  
  // 프로젝트 ID 결정: URL 파라미터 > useParams > null
  const finalProjectId = urlProjectId || projectId;

  // 스토리 생성 스토어에서 스토리 데이터 가져오기
  const { generatedStory } = useStoryStore();

  // location.state에서 전달받은 콘티 데이터 확인
  const passedConteData = location.state?.conteData;

  // 프로젝트 정보 가져오기 함수
  const getProjectInfo = async (projectId) => {
    try {
      console.log(`📋 프로젝트 ${projectId} 정보 가져오는 중...`);
      
      const response = await getProject(projectId, { includeContes: false });
      
      if (response.success && response.data?.project) {
        console.log(`✅ 프로젝트 ${projectId} 정보 가져옴:`, response.data.project.projectTitle);
        return response.data.project;
      } else {
        console.warn(`⚠️ 프로젝트 ${projectId} 정보 가져오기 실패`);
      }
      return null;
    } catch (error) {
      console.error(`❌ 프로젝트 ${projectId} 정보 가져오기 오류:`, error);
      return null;
    }
  };

  // 프로젝트별 콘티 데이터 가져오기 함수
  const getProjectConteData = async (projectId) => {
    try {
      console.log(`📋 프로젝트 ${projectId}의 콘티 데이터 가져오는 중...`);
      
      const response = await getProject(projectId, { includeContes: true });
      
      if (response.success && response.data?.conteList) {
        const contes = response.data.conteList.map(conte => ({
          ...conte,
          projectTitle: response.data.project.projectTitle,
          projectId: projectId
        }));
        console.log(`✅ 프로젝트 ${projectId}에서 ${contes.length}개 콘티 가져옴`);
        return contes;
      } else {
        console.warn(`⚠️ 프로젝트 ${projectId} 콘티 데이터 가져오기 실패`);
      }
      return [];
    } catch (error) {
      console.error(`❌ 프로젝트 ${projectId} 콘티 데이터 가져오기 오류:`, error);
      return [];
    }
  };

  // 즐겨찾기된 프로젝트 데이터 가져오기
  const getFavoriteProjectsData = async () => {
    try {
      if (finalProjectId) {
        // 특정 프로젝트의 콘티 데이터만 가져오기
        return await getProjectConteData(finalProjectId);
      } else {
        // 기존 로직: 모든 즐겨찾기 프로젝트의 콘티 데이터 가져오기
        const storedData = localStorage.getItem('favoriteProjects');
        if (storedData) {
          const favoriteProjects = JSON.parse(storedData);
          console.log('⭐ 즐겨찾기 프로젝트 목록:', favoriteProjects);
          
          // 각 프로젝트의 콘티 데이터를 API로 가져오기
          const allContes = [];
          
          for (const project of favoriteProjects) {
            try {
              const projectId = project.id || project._id;
              const projectContes = await getProjectConteData(projectId);
              allContes.push(...projectContes);
            } catch (error) {
              console.error(`❌ 프로젝트 ${project.id || project._id} 콘티 데이터 가져오기 오류:`, error);
            }
          }
          
          console.log('⭐ 총 즐겨찾기 콘티 데이터:', allContes.length, '개');
          return allContes;
        }
        return [];
      }
    } catch (error) {
      console.error('즐겨찾기 프로젝트 데이터 파싱 실패:', error);
      return [];
    }
  };

  // 사용할 콘티 데이터 결정 (비동기 처리)
  const [conteData, setConteData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null); // 프로젝트 정보 추가
  const [isLoadingConteData, setIsLoadingConteData] = useState(true); // 콘티 데이터 로딩 상태 추가
  
  useEffect(() => {
    const loadConteData = async () => {
      setIsLoadingConteData(true); // 로딩 시작
      console.log('🔍 SimpleSchedulePage 콘티 데이터 로드 시작');
      console.log('  - isFavoriteView:', isFavoriteView);
      console.log('  - finalProjectId:', finalProjectId);
      console.log('  - passedConteData:', passedConteData?.length || 0, '개');
      console.log('  - actualConteData:', actualConteData?.length || 0, '개');
      console.log('  - location.state:', location.state);
      console.log('  - location.search:', location.search);
      
      let dataToUse = [];
      
      if (passedConteData && passedConteData.length > 0) {
        // Dashboard나 ProjectPage에서 전달받은 콘티 데이터 사용 (최우선)
        console.log('📋 전달받은 콘티 데이터 사용:', passedConteData.length, '개');
        console.log('📋 첫 번째 콘티 샘플:', passedConteData[0]);
        dataToUse = passedConteData;
      } else if (isFavoriteView) {
        // 즐겨찾기 모드: 프로젝트 ID로 데이터 가져오기
        const favoriteData = await getFavoriteProjectsData();
        console.log('📋 즐겨찾기 콘티 데이터 로드:', favoriteData.length, '개');
        dataToUse = favoriteData;
        
        // 선택된 프로젝트 정보 설정
        if (finalProjectId) {
          const storedProject = localStorage.getItem('selectedFavoriteProject');
          if (storedProject) {
            setSelectedProject(JSON.parse(storedProject));
          }
        }
      } else if (finalProjectId) {
        // URL 파라미터로 프로젝트 ID가 있는 경우 해당 프로젝트 데이터 가져오기
        console.log('📋 URL 파라미터 프로젝트 ID로 데이터 가져오기:', finalProjectId);
        const projectData = await getProjectConteData(finalProjectId);
        console.log('📋 프로젝트 데이터 로드:', projectData.length, '개');
        dataToUse = projectData;
        
        // 프로젝트 정보도 함께 가져오기
        const projectInfoData = await getProjectInfo(finalProjectId);
        if (projectInfoData) {
          setProjectInfo(projectInfoData);
        }
      } else {
        // 기본값: 스토리 생성 스토어의 데이터 사용
        console.log('📋 기본 콘티 데이터 로드:', actualConteData?.length || 0, '개');
        dataToUse = actualConteData || testConteData;
      }
      
      // keywords 필드가 없는 경우 기본값 추가
      const processedData = dataToUse.map(conte => ({
        ...conte,
        keywords: conte.keywords || {
          location: '미정',
          equipment: '기본 장비',
          cast: [],
          props: [],
          specialRequirements: [],
          timeOfDay: '오후',
          weather: conte.weather || '맑음'
        }
      }));
      
      console.log('✅ 최종 처리된 콘티 데이터:', processedData.length, '개');
      setConteData(processedData);
      setIsLoadingConteData(false); // 로딩 완료
    };
    
    loadConteData();
  }, [isFavoriteView, actualConteData, finalProjectId, passedConteData]);

  const getConteData = () => {
    return conteData;
  };

  // 쉬는시간(분) 상수 선언
  const BREAK_TIME_MINUTES = 60; // 1시간

  // days에 날짜를 순차적으로 할당하는 함수
  function assignDatesToDays(days, range) {
    if (!range[0] || !range[1]) return days;
    const start = dayjs(range[0]);
    return days.map((day, idx) => ({
      ...day,
      day: day.day ?? idx + 1,
      date: start.add(idx, 'day').format('YYYY-MM-DD')
    }));
  }

  // 스케줄 생성 함수 (NestJS 백엔드 연동)
  const generateSchedule = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🎬 스케줄 생성 시작 (NestJS 백엔드)');
      
      if (!finalProjectId) {
        setError('프로젝트 ID가 없습니다.');
        return;
      }
      
      // 1. 프로젝트의 씬 데이터 가져오기
      console.log('📋 씬 데이터 가져오는 중...');
      const scenesResponse = await getScenes(finalProjectId);
      if (!scenesResponse.success || !scenesResponse.data) {
        setError('씬 데이터를 가져올 수 없습니다.');
        return;
      }
      
      const scenes = scenesResponse.data;
      console.log('📋 사용할 씬 데이터:', {
        totalCount: scenes.length,
        isArray: Array.isArray(scenes),
        firstItem: scenes[0] ? {
          id: scenes[0]._id,
          title: scenes[0].title,
          location: scenes[0].location?.name,
          timeOfDay: scenes[0].timeOfDay
        } : '없음'
      });
      
      if (!scenes || scenes.length === 0) {
        setError('씬 데이터가 없습니다. 먼저 씬을 생성해주세요.');
        return;
      }
      
      // 2. 스케줄러 서비스를 사용하여 최적화된 스케줄 생성 (그룹 정보는 씬에서 관리)
      console.log('🎬 최적화된 스케줄 생성 중...');
      const scheduleResult = await generateOptimalSchedule(scenes, finalProjectId);
      setScheduleData(scheduleResult);
      console.log('✅ 스케줄 생성 완료:', scheduleResult);

      // 5. NestJS 백엔드에 스케줄 저장
      try {
        const saveResponse = await api.post(`/project/${finalProjectId}/scheduler`, {
          days: scheduleResult.days,
          totalDays: scheduleResult.totalDays,
          totalScenes: scheduleResult.totalScenes,
          estimatedTotalDuration: scheduleResult.estimatedTotalDuration,
          createdAt: new Date()
        });
        
        if (saveResponse.data.success) {
          console.log('✅ 스케줄 DB 저장 완료');
        } else {
          console.warn('⚠️ 스케줄 DB 저장 실패:', saveResponse.data.message);
        }
      } catch (err) {
        console.error('❌ 스케줄 DB 저장 실패:', err);
      }
    } catch (error) {
      console.error('❌ 스케줄 생성 실패:', error)
      setError(error.message || '스케줄 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 스케줄 조회 함수 (NestJS 백엔드 연동)
  const loadSchedule = async () => {
    try {
      if (!finalProjectId) return;
      
      console.log('📋 기존 스케줄 조회 중...');
      const response = await api.get(`/project/${finalProjectId}/scheduler`);
      
      if (response.data.success && response.data.data) {
        console.log('✅ 기존 스케줄 로드 완료:', response.data.data);
        setScheduleData(response.data.data);
      } else {
        console.log('📋 기존 스케줄이 없습니다. 새로 생성합니다.');
        generateSchedule();
      }
    } catch (error) {
      console.error('❌ 스케줄 조회 실패:', error);
      // 조회 실패 시 새로 생성
      generateSchedule();
    }
  };

  // 페이지 로드 시 스케줄 조회 또는 생성
  useEffect(() => {
    console.log('📦 [AllSchedulePage] 프로젝트 ID:', finalProjectId);
    if (finalProjectId) {
      loadSchedule();
    }
  }, [finalProjectId]); // 프로젝트 ID가 변경될 때마다 스케줄 조회

  // 촬영 시간 포맷팅 함수
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0분';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${mins}분`;
  };

  // 씬별 촬영 시간 계산 함수
  const getSafeDuration = (scene) => {
    let raw = scene.estimatedDuration;
    if (typeof raw === 'string') {
      const match = raw.match(/\d+/);
      raw = match ? Number(match[0]) : NaN;
    }
    const num = Number(raw);
    if (isNaN(num) || num <= 0) return 5;
    
    const contentDuration = num;
    const shootingRatio = 50; // 50배 고정
    const actualDuration = Math.round(contentDuration * shootingRatio);
    
    return actualDuration;
  };

  // 뒤로가기 함수 - 단순화된 버전
  const handleBack = () => {
    console.log('🔙 뒤로가기 버튼 클릭됨');
    console.log('  - finalProjectId:', finalProjectId);
    console.log('  - location.state:', location.state);
    
    // 일반적인 뒤로가기 - 브라우저 히스토리에서 이전 페이지로 이동
    console.log('🔙 이전 페이지로 돌아가기');
    navigate(-1);
  };

  // 스케줄 삭제 함수 (NestJS 백엔드 연동)
  const handleDeleteSchedule = async () => {
    try {
      if (!finalProjectId) {
        toast.error('프로젝트 ID가 없습니다.');
        return;
      }
      
      console.log('🗑️ 스케줄 삭제 시작...');
      const response = await api.delete(`/project/${finalProjectId}/scheduler`);
      
      if (response.data.success) {
        console.log('✅ 스케줄 삭제 완료');
        setScheduleData(null);
        toast.success('스케줄이 삭제되었습니다.');
      } else {
        console.error('❌ 스케줄 삭제 실패:', response.data.message);
        toast.error(response.data.message || '스케줄 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 스케줄 삭제 실패:', error);
      toast.error('스케줄 삭제에 실패했습니다.');
    }
  };

  // 스케줄 재생성 함수
  const handleRegenerateSchedule = async () => {
    console.log('🔄 스케줄 재생성 시작...');
    await generateSchedule();
  };

  /**
   * 씬(Chip) 클릭 핸들러 - 콘티 상세 모달 오픈
   */
  const handleSceneClick = (scene) => {
    setSelectedConte(scene);
    setConteModalOpen(true);
  };

  /**
   * 시간대별로 씬을 그룹핑하는 함수
   * 스케줄러 서비스에서 계산된 정확한 시간 정보를 사용
   * @param {Array} days - 일차별 스케줄 데이터
   * @returns {Array} 시간대별로 그룹핑된 씬 데이터
   */
  function groupScenesByTimeBlock(days) {
    // days가 undefined/null이면 빈 배열로 대체
    if (!Array.isArray(days)) return [];
    // 각 day의 scenes가 undefined/null이면 빈 배열로 대체
    const allScenes = days.flatMap(day => Array.isArray(day.scenes) ? day.scenes.map(scene => ({ ...scene, day })) : []);
    // 결과: [{ time: '09:00~10:00', scenes: [scene, ...], location, cast, note }]
    const result = [];

    // 씬별로 정확한 시간 정보 사용
    for (let i = 0; i < allScenes.length; i++) {
      const scene = allScenes[i];
      
      // 스케줄러 서비스에서 계산된 정확한 시간 정보 우선 사용
      let timeLabel = '';
      
      // 1. timeSlotDisplay가 있는 경우 (가장 정확한 시간 정보)
      if (scene.timeSlotDisplay && scene.timeSlotDisplay.includes('~')) {
        timeLabel = scene.timeSlotDisplay;
        console.log(`✅ timeSlotDisplay 사용: ${timeLabel}`);
      } 
      // 2. sceneStartTime과 sceneEndTime이 있는 경우
      else if (scene.sceneStartTime && scene.sceneEndTime) {
        timeLabel = `${scene.sceneStartTime} ~ ${scene.sceneEndTime}`;
        console.log(`✅ sceneStartTime/EndTime 사용: ${timeLabel}`);
      } 
      // 3. timeRange가 있는 경우
      else if (scene.timeRange && scene.timeRange.start && scene.timeRange.end) {
        timeLabel = `${scene.timeRange.start} ~ ${scene.timeRange.end}`;
        console.log(`✅ timeRange 사용: ${timeLabel}`);
      } 
      // 4. 기본 시간대만 표시 (fallback)
      else {
        const timeSlot = scene.keywords?.timeOfDay || scene.timeSlot || '미정';
        timeLabel = `${timeSlot} (시간 미정)`;
        console.log(`⚠️ 기본 시간대 사용: ${timeLabel}`);
      }
      
      // 상세 정보 추출 (schedulerService에서 추가된 정보 우선 사용)
      const cameraInfo = scene.cameraDetails || {};
      const crewInfo = scene.crewDetails || [];
      const equipmentInfo = scene.equipmentDetails || [];
      
      // 그룹에 추가
      result.push({
        time: timeLabel,
        scenes: [scene],
        location: scene.keywords?.location || scene.location || '',
        cast: scene.keywords?.cast || [],
        note: scene.title || '',
        // 디버깅을 위한 추가 정보
        actualShootingDuration: scene.actualShootingDuration,
        estimatedDuration: scene.estimatedDuration,
        timeSlot: scene.keywords?.timeOfDay || scene.timeSlot,
        // 상세 정보 추가
        cameraDetails: cameraInfo,
        crewDetails: crewInfo,
        equipmentDetails: equipmentInfo
      });
    }
    
    console.log('🕐 시간대별 그룹핑 결과:', result.map(item => ({
      time: item.time,
      scene: item.scenes[0]?.scene,
      title: item.scenes[0]?.title,
      duration: item.actualShootingDuration,
      camera: item.cameraDetails?.model,
      crew: item.crewDetails?.length,
      equipment: item.equipmentDetails?.length
    })));
    
    return result;
  }

  // 시간 문자열(HH:MM)에 분을 더하는 함수 (쉬는시간 계산용)
  function addMinutesToTime(time, minutes) {
    // time이 '미정'이거나 잘못된 형식이면 그대로 반환
    if (!time || typeof time !== 'string' || !time.includes(':')) return '미정';
    const [h, m] = time.split(':').map(Number);
    let total = h * 60 + m + minutes;
    // 24시간 이상이면 24로 제한
    if (total >= 24 * 60) total -= 24 * 60;
    const newH = String(Math.floor(total / 60)).padStart(2, '0');
    const newM = String(total % 60).padStart(2, '0');
    return `${newH}:${newM}`;
  }

  // 날짜 범위 계산 함수 추가
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

  // 날짜 포맷팅 함수 추가
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  // 한국어 날짜 포맷팅 함수 추가
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

  // 날짜 범위 상태 업데이트 함수 추가
  const [actualDateRange, setActualDateRange] = useState([])

  // 날짜가 변경될 때마다 실제 날짜 범위 계산
  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      const dates = calculateDateRange(dateRange[0], dateRange[1])
      setActualDateRange(dates)
      console.log('📅 날짜 범위 설정:', {
        start: dateRange[0].format('YYYY-MM-DD'),
        end: dateRange[1].format('YYYY-MM-DD'),
        totalDays: dates.length,
        dates: dates.map(d => formatKoreanDate(d))
      })
    }
  }, [dateRange])

  // 브라우저 뒤로가기/앞으로가기 버튼 처리 - 제거 (단순화)

  // 날짜가 변경될 때마다 days에 날짜를 할당
  const daysWithDates = scheduleData && scheduleData.days
    ? assignDatesToDays(scheduleData.days, dateRange)
    : [];

  const [realLocations, setRealLocations] = useState([]);
  const [realLocationMap, setRealLocationMap] = useState({});

  // 모든 realLocation 불러오기 및 id→이름 매핑
  useEffect(() => {
    if (finalProjectId) {
              api.get(`/project/${finalProjectId}/real-locations`).then(res => {
        const list = res.data.data || [];
        setRealLocations(list);
        const map = {};
        list.forEach(loc => { map[loc._id] = loc.name; });
        setRealLocationMap(map);
      });
    }
  }, [finalProjectId]);

  // 콘티 데이터 새로고침 함수 (기존 loadConteData를 재사용)
  const reloadConteData = async () => {
    if (finalProjectId) {
      setIsLoadingConteData(true);
      const projectData = await getProjectConteData(finalProjectId);
      setConteData(projectData);
      setIsLoadingConteData(false);
    }
  };



  // 씬 개수와 촬영 시간 계산
  const totalScenes = (scheduleData?.days ?? []).reduce(
    (total, day) => total + (day.timeline?.filter(block => block.type === '촬영').length || 0),
    0
  );
  const totalShootingMinutes = (scheduleData?.days ?? []).reduce(
    (total, day) =>
      total +
      (day.timeline
        ? day.timeline
            .filter(block => block.type === '촬영')
            .reduce((sum, block) => sum + (block.duration || block.estimatedDuration || 0), 0)
        : 0),
    0
  );

  return (
    <Box sx={{ background: '#181820', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
      {/* 공통 헤더 */}
      <CommonHeader 
        title="촬영 스케줄"
        showBackButton={true}
        onBack={handleBack}
      />
      
        <Box sx={{ mb: 4 }}>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {finalProjectId 
            ? (projectInfo 
                ? `📅 ${projectInfo.projectTitle} 스케줄` 
                : `📅 프로젝트 스케줄 (ID: ${finalProjectId})`)
            : (isFavoriteView 
                ? (selectedProject 
                    ? `⭐ ${selectedProject.projectTitle} 스케줄` 
                    : '⭐ 즐겨찾기 프로젝트 스케줄')
                : '📅 촬영 스케줄'
              )
          }
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          {finalProjectId 
            ? (projectInfo 
                ? `${projectInfo.projectTitle} 프로젝트의 콘티를 기반으로 최적의 촬영 스케줄을 제공합니다.`
                : `프로젝트 ID: ${finalProjectId} - 선택된 프로젝트의 콘티를 기반으로 최적의 촬영 스케줄을 제공합니다.`)
            : (isFavoriteView 
                ? (selectedProject 
                    ? `${selectedProject.projectTitle} 프로젝트의 콘티를 기반으로 최적의 촬영 스케줄을 제공합니다.`
                    : '즐겨찾기된 프로젝트들의 콘티를 기반으로 최적의 촬영 스케줄을 제공합니다.')
                : 'AI가 생성한 콘티를 기반으로 최적의 촬영 스케줄을 제공합니다.'
              )
          }
        </Typography>
      </Box>

      {/* 콘티 데이터 로딩 상태 */}
      {isLoadingConteData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Schedule sx={{ animation: 'spin 1s linear infinite' }} />
              <Typography>콘티 데이터를 불러오는 중...</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 스케줄 생성 로딩 상태 */}
      {isLoading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Schedule sx={{ animation: 'spin 1s linear infinite' }} />
              <Typography>스케줄을 생성하고 있습니다...</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 에러 상태 */}
      {error && (
        <Card sx={{ mb: 3, backgroundColor: '#ffebee' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              onClick={generateSchedule}
              sx={{ mt: 2 }}
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 실제 콘티 데이터가 없을 때 안내 메시지 */}
      {!isLoadingConteData && (!getConteData() || getConteData().length === 0) ? (
        <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
          <CardContent>
            <Typography variant="h6" color="warning.main" gutterBottom>
              {finalProjectId 
                ? `📝 프로젝트에 콘티가 없습니다` 
                : (isFavoriteView 
                    ? (selectedProject 
                        ? `⭐ ${selectedProject.projectTitle}에 콘티가 없습니다` 
                        : '⭐ 즐겨찾기된 프로젝트가 없습니다')
                    : '📝 콘티 데이터가 없습니다'
                  )
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {finalProjectId 
                ? `선택된 프로젝트에 콘티 데이터가 없습니다. 먼저 콘티를 생성해주세요.`
                : (isFavoriteView 
                    ? (selectedProject 
                        ? `${selectedProject.projectTitle} 프로젝트에 콘티 데이터가 없습니다. 먼저 콘티를 생성해주세요.`
                        : '즐겨찾기된 프로젝트에 콘티 데이터가 없습니다. 대시보드에서 프로젝트를 즐겨찾기에 추가해주세요.')
                    : '현재 더미 데이터로 스케줄을 생성하고 있습니다. 실제 콘티 데이터를 사용하려면 먼저 스토리 생성 페이지에서 콘티를 생성해주세요.'
                  )
              }
            </Typography>
            <Button 
              variant="outlined" 
              color="warning"
              onClick={() => navigate(isFavoriteView ? '/' : '/story-generation')}
              sx={{ mt: 1 }}
            >
              {isFavoriteView ? '대시보드로 이동' : '스토리 생성 페이지로 이동'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 스케줄 데이터 표시 */}
      {scheduleData && !isLoading && (
        <Grid container spacing={3} justifyContent="center" alignItems="flex-start"> {/* 중앙 정렬 */}
          {/* 날짜 범위 선택 UI (DatePicker 2개) */}
          <Grid item xs={12} md={12} lg={12}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="촬영 시작일"
                    value={dateRange[0]}
                    onChange={date => setDateRange([date, dateRange[1]])}
                    sx={{ width: '100%' }}
                    // 시작일은 오늘부터 선택 가능
                    minDate={dayjs()}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="촬영 종료일"
                    value={dateRange[1]}
                    onChange={date => setDateRange([dateRange[0], date])}
                    sx={{ width: '100%' }}
                    // 종료일은 시작일 이후부터 선택 가능
                    minDate={dateRange[0] ? dateRange[0].add(1, 'day') : dayjs().add(1, 'day')}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>

          {/* 촬영 기간 경고 */}
          {actualDateRange.length > 0 && actualDateRange.length < scheduleData.totalDays && (
            <Grid item xs={12} md={12} lg={12}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ 설정된 촬영 기간({actualDateRange.length}일)이 스케줄 일수({scheduleData.totalDays}일)보다 적습니다.
                종료일을 늘려주세요.
              </Alert>
            </Grid>
          )}

          {/* 상단 Chip 요약 정보 (SchedulerPage와 동일하게 MUI color prop 사용) */}
          <Grid item xs={12} md={12} lg={12} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {/* 기존 Chip들 */}
              <Chip
                  icon={<Star />}
                  label={`$${isFavoriteView
                      ? (selectedProject 
                          ? `즐겨찾기 - ${selectedProject.projectTitle}` 
                          : '즐겨찾기 프로젝트')
                      : (getConteData().length > 0 ? '실제 콘티' : '더미 데이터')
                }`}
                color={finalProjectId || isFavoriteView ? "warning" : (getConteData().length > 0 ? "success" : "warning")}
                variant="outlined"
              />
              <Chip
                icon={<Schedule />}
                label={`총 ${scheduleData.days?.length || 0}일`}
                color="primary"
              />
              <Chip
                icon={<CameraAlt />}
                  label={`총 ${totalScenes}개 씬`}
                color="secondary"
              />
              <Chip
                icon={<LocationOn />}
                  label={`총 ${formatDuration(totalShootingMinutes)} (실제 촬영)`}
                color="success"
              />
              </Box>
              {/* 스케줄 관리 버튼들 */}
              <Box sx={{ display: 'flex', gap: 1 }}>

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<Refresh />}
                  onClick={handleRegenerateSchedule}
                  sx={{ height: 40 }}
                >
                  재생성
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteSchedule}
                  sx={{ height: 40 }}
                >
                  삭제
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* 상단 Day별 탭 UI */}
          <Grid item xs={12} md={12} lg={12}> {/* 중아너비 제한 */}
            <Tabs
              value={selectedDay}
              onChange={(e, newValue) => setSelectedDay(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {daysWithDates.map((day, idx) => (
                <Tab key={idx} label={`${day.day}일차${day.date ? ` (${day.date})` : ''}`} />
              ))}
            </Tabs>
          </Grid>

          {/* 선택된 Day만 렌더링 */}
          {daysWithDates[selectedDay] && (
            <Grid item xs={12} md={12} lg={12}> {/* 중아너비 제한 */}
              <Card key={selectedDay} sx={{ mb: 4, mx: 'auto' }}> {/* 카드 중앙 정렬 */}
                <CardContent>
                  {/* 일차 및 날짜/장소 정보 */}
                  <Typography variant="h6" gutterBottom>
                    {daysWithDates[selectedDay].day}일차 {daysWithDates[selectedDay].date ? `(${daysWithDates[selectedDay].date})` : ''} - {daysWithDates[selectedDay].location}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#2F2F37' }}>
                          <TableCell align="center"><strong>시간</strong></TableCell>
                          <TableCell align="center"><strong>씬</strong></TableCell>
                          <TableCell align="center"><strong>촬영 위치</strong></TableCell>
                          <TableCell align="center"><strong>카메라</strong></TableCell>
                          <TableCell align="center"><strong>주요 인물</strong></TableCell>
                          <TableCell align="center"><strong>필요 인력</strong></TableCell>
                          <TableCell align="center"><strong>필요 장비</strong></TableCell>
                          <TableCell align="center"><strong>비고</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {daysWithDates[selectedDay]?.timeline?.map((block, idx) => (
                          block.type !== '촬영' ? (
                            <TableRow key={idx}>
                              <TableCell>{block.time || block.type}</TableCell>
                              <TableCell colSpan={8} align="center">{block.type}</TableCell>
                              </TableRow>
                          ) : (
                            <TableRow key={idx}>
                              {/* 시간 */}
                              <TableCell>{block.time || '-'}</TableCell>
                              {/* 씬 */}
                              <TableCell>{block.scene ? (block.scene.title || '-') : (block.type || '-')}</TableCell>
                              {/* 촬영 위치 */}
                              <TableCell>{block.scene ? (realLocationMap[block.scene.keywords?.realLocationId] || '-') : '-'}</TableCell>
                              {/* 카메라 */}
                              <TableCell>{block.scene ? (block.scene.requiredEquipment || '-') : '-'}</TableCell>
                              {/* 주요 인물 */}
                              <TableCell>{block.scene ? (Array.isArray(block.scene.keywords?.cast) ? block.scene.keywords.cast.join(', ') : (block.scene.keywords?.cast || '-')) : '-'}</TableCell>
                              {/* 필요 인력 */}
                              <TableCell>{block.scene ? (block.scene.requiredPersonnel || '-') : '-'}</TableCell>
                              {/* 필요 장비 */}
                              <TableCell>{block.scene ? (block.scene.keywords?.equipment || '-') : '-'}</TableCell>
                              {/* 비고 */}
                              <TableCell>{block.scene ? (block.scene.note || '-') : '-'}</TableCell>
                                </TableRow>
                          )
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* 씬 상세 모달 (공통 컴포넌트 사용) */}
      <SceneDetailModal
        open={conteModalOpen}
        onClose={() => setConteModalOpen(false)}
        scene={selectedConte}
        onEdit={null} // SimpleSchedulePage에서는 편집 기능 비활성화
        onImageRetry={null} // SimpleSchedulePage에서는 이미지 재시도 기능 비활성화
        imageLoadErrors={{}}
        onImageLoadError={null}
      />

    </Container>
    </Box>
  );
};

export default SimpleSchedulePage; 