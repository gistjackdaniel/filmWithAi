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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Link, // 연결 아이콘 추가
  Description, // 일일촬영계획표 아이콘 추가
  Refresh // 재생성 아이콘 추가
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { generateOptimalSchedule } from '../services/schedulerService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ConteDetailModal from '../components/StoryGeneration/ConteDetailModal';
import useStoryGenerationStore from '../stores/storyGenerationStore'; // 스토리 생성 스토어 추가
import { getProject } from '../services/projectApi';
import CommonHeader from '../components/CommonHeader';
import { locationAPI } from '../services/api';
import DailyShootingPlanModal from '../components/Scheduler/DailyShootingPlanModal';
import scheduleApi from '../services/scheduleApi';

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

  // 일일촬영계획표 모달 상태 추가
  const [dailyPlanModalOpen, setDailyPlanModalOpen] = useState(false);
  const [selectedDayForPlan, setSelectedDayForPlan] = useState(null);

  // URL 파라미터 확인하여 즐겨찾기 모드인지 확인
  const isFavoriteView = new URLSearchParams(location.search).get('view') === 'favorite';
  const urlProjectId = new URLSearchParams(location.search).get('projectId');
  
  // 프로젝트 ID 결정: URL 파라미터 > useParams > null
  const finalProjectId = urlProjectId || projectId;

  // 스토리 생성 스토어에서 실제 콘티 데이터 가져오기 (기본값으로만 사용)
  const { conteGeneration } = useStoryGenerationStore();
  const actualConteData = conteGeneration.generatedConte;

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
      const response = await getProject(projectId, { includeContes: true });
      
      if (response.success && response.data?.conteList) {
        const contes = response.data.conteList.map(conte => ({
          ...conte,
          projectTitle: response.data.project.projectTitle,
          projectId: projectId
        }));
        
        // 새로고침 후 실제장소 연결 상태 확인
        const contesWithRealLocation = contes.filter(c => c.realLocationId);
        console.log('🔄 새로고침 후 데이터 로드:', {
          totalContes: contes.length,
          contesWithRealLocation: contesWithRealLocation.length,
          realLocationDetails: contesWithRealLocation.map(c => ({
            id: c._id,
            title: c.title,
            realLocationId: c.realLocationId
          }))
        });
        
        return contes;
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
  
  // 콘티 데이터 로드 함수를 컴포넌트 레벨로 이동
    const loadConteData = async () => {
    setIsLoadingConteData(true);
    
    console.log('🔄 콘티 데이터 로드 시작:', {
      passedConteData: !!passedConteData,
      isFavoriteView,
      finalProjectId,
      actualConteData: !!actualConteData
    });
      
      let dataToUse = [];
      
    // 새로고침 시에는 passedConteData를 무시하고 DB에서 데이터 가져오기
    if (passedConteData && passedConteData.length > 0 && !window.performance.navigation.type) {
      console.log('📥 passedConteData 사용 (페이지 이동)');
        dataToUse = passedConteData;
      } else if (isFavoriteView) {
      console.log('⭐ 즐겨찾기 뷰 - getFavoriteProjectsData 호출');
        const favoriteData = await getFavoriteProjectsData();
        dataToUse = favoriteData;
        
        if (finalProjectId) {
          const storedProject = localStorage.getItem('selectedFavoriteProject');
          if (storedProject) {
            setSelectedProject(JSON.parse(storedProject));
          }
        }
      } else if (finalProjectId) {
      console.log('📋 프로젝트 뷰 - getProjectConteData 호출 (DB에서 최신 데이터)');
        const projectData = await getProjectConteData(finalProjectId);
        dataToUse = projectData;
        
        const projectInfoData = await getProjectInfo(finalProjectId);
        if (projectInfoData) {
          setProjectInfo(projectInfoData);
        }
      } else {
      console.log('🎭 기본 데이터 사용');
        dataToUse = actualConteData || testConteData;
      }
      
    console.log('📊 최종 로드된 데이터:', {
      dataCount: dataToUse.length,
      hasRealLocation: dataToUse.some(c => c.realLocationId)
    });
    
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
      
      setConteData(processedData);
    setIsLoadingConteData(false);
    };
    
  useEffect(() => {
    loadConteData();
    
    // 실제장소 데이터도 함께 로드
    if (finalProjectId) {
      loadRealLocations();
    }
  }, [isFavoriteView, actualConteData, finalProjectId, passedConteData]);

  const getConteData = () => {
    return conteData;
  };

  // 테스트용 더미 콘티 데이터 (실제 콘티 데이터 구조와 동일)
  const testConteData = [
    {
      "id": "scene_1",
      "scene": 1,
      "title": "지친 하루의 끝",
      "description": "지연은 늦은 밤 도서관에서 나와 무거운 책가방을 메고 집으로 향한다. 얼굴에는 지친 기색이 역력하다.",
      "dialogue": "지연: \"언제쯤 이 고된 하루들이 끝날까...\"",
      "cameraAngle": "지연의 측면 얼굴을 따라가는 트래킹 샷.",
      "cameraWork": "도서관에서 나오는 지연을 따라가는 핸드헬드 촬영.",
      "characterLayout": "지연은 책가방을 메고 도서관 문을 나선다. 주변은 어둡고 적막하다.",
      "props": "책가방, 이어폰",
      "weather": "흐림",
      "lighting": "가로등 불빛",
      "visualDescription": "조용한 밤길과 지연의 고단함이 대비를 이룬다.",
      "transition": "지연이 버스를 타고 창밖을 바라보는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 어두운 배경 속 인물 강조.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "1분 30초",
      "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "대학교 도서관 앞",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["책가방", "이어폰"],
        "lighting": "가로등 불빛",
        "weather": "흐림",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911696Z",
      "modifiedBy": "AI",
      "cameras": ["C1", "C2"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "Sony FX6",
          "lens": "24-70mm f/2.8 GM",
          "settings": "4K 60fps, S-Log3",
          "movement": "핸드헬드"
        },
        "crew": {
          "director": "김감독",
          "cinematographer": "박촬영감독",
          "cameraOperator": "이카메라맨",
          "lightingDirector": "최조명감독",
          "makeupArtist": "정메이크업",
          "costumeDesigner": "한의상",
          "soundEngineer": "윤음향감독",
          "artDirector": "임미술감독",
          "additionalCrew": ["보조감독", "스크립터"]
        },
        "equipment": {
          "cameras": ["Sony FX6", "B-Cam"],
          "lenses": ["24-70mm f/2.8 GM", "85mm f/1.4 GM"],
          "lighting": ["LED 패널", "스탠드", "디퓨저"],
          "audio": ["무선마이크", "보조마이크", "녹음기"],
          "grip": ["트라이포드", "스테디캠", "크레인"],
          "special": ["스모크머신", "팬"]
        }
      }
    },
    {
      "id": "scene_2",
      "scene": 2,
      "title": "카페에서의 만남",
      "description": "지연과 민수는 카페에서 만나 서로의 고민을 나눈다. 창밖으로는 비가 내리고 있다.",
      "dialogue": "지연: \"요즘 너무 힘들어...\" 민수: \"나도 그래, 같이 힘내자.\"",
      "cameraAngle": "카페 테이블을 마주보고 앉은 두 사람의 중간 샷.",
      "cameraWork": "대화하는 두 사람의 얼굴을 번갈아가며 클로즈업.",
      "characterLayout": "지연과 민수가 카페 테이블을 마주보고 앉아 있다. 창밖으로는 비가 내린다.",
      "props": "카페 테이블, 커피잔, 창문",
      "weather": "비",
      "lighting": "카페 내부 조명",
      "visualDescription": "따뜻한 카페 분위기와 창밖의 차가운 비가 대비를 이룬다.",
      "transition": "두 사람이 카페를 나서는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 자연스러운 대화 장면 연출.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "도시 카페",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "민수"],
        "props": ["카페 테이블", "커피잔", "창문"],
        "lighting": "카페 내부 조명",
        "weather": "비",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "RED Komodo",
          "lens": "50mm f/1.4",
          "settings": "6K RAW, 24fps",
          "movement": "고정"
        },
        "crew": {
          "director": "김감독",
          "cinematographer": "박촬영감독",
          "cameraOperator": "이카메라맨",
          "lightingDirector": "최조명감독",
          "makeupArtist": "정메이크업",
          "costumeDesigner": "한의상",
          "soundEngineer": "윤음향감독",
          "artDirector": "임미술감독",
          "additionalCrew": ["보조감독", "스크립터", "소품담당"]
        },
        "equipment": {
          "cameras": ["RED Komodo", "A-Cam"],
          "lenses": ["50mm f/1.4", "35mm f/1.4"],
          "lighting": ["LED 패널", "스탠드", "디퓨저", "반사판"],
          "audio": ["무선마이크", "보조마이크", "녹음기"],
          "grip": ["트라이포드", "돌리", "크레인"],
          "special": ["스모크머신", "팬", "비효과"]
        }
      }
    },
    {
      "id": "scene_3",
      "scene": 3,
      "title": "카페에서의 독서",
      "description": "지연은 카페에서 책을 읽으며 조용히 시간을 보낸다. 창밖으로는 사람들이 지나간다.",
      "dialogue": "지연: \"이 책이 참 재미있네...\"",
      "cameraAngle": "책을 읽는 지연의 클로즈업.",
      "cameraWork": "지연의 얼굴과 책을 번갈아가며 촬영.",
      "characterLayout": "지연이 카페 창가에 앉아 책을 읽고 있다. 주변에는 다른 손님들이 있다.",
      "props": "카페 테이블, 책, 커피잔, 창문",
      "weather": "맑음",
      "lighting": "카페 내부 조명",
      "visualDescription": "조용한 카페 분위기와 지연의 집중하는 모습.",
      "transition": "지연이 책을 덮고 일어나는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 집중하는 모습을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "도시 카페",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["카페 테이블", "책", "커피잔", "창문"],
        "lighting": "카페 내부 조명",
        "weather": "맑음",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "Canon C300 Mark III",
          "lens": "85mm f/1.4",
          "settings": "4K 30fps, Canon Log",
          "movement": "고정"
        },
        "crew": {
          "director": "김감독",
          "cinematographer": "박촬영감독",
          "cameraOperator": "이카메라맨",
          "lightingDirector": "최조명감독",
          "makeupArtist": "정메이크업",
          "costumeDesigner": "한의상",
          "soundEngineer": "윤음향감독",
          "artDirector": "임미술감독",
          "additionalCrew": ["보조감독", "스크립터"]
        },
        "equipment": {
          "cameras": ["Canon C300 Mark III"],
          "lenses": ["85mm f/1.4", "50mm f/1.4"],
          "lighting": ["LED 패널", "스탠드", "디퓨저"],
          "audio": ["무선마이크", "녹음기"],
          "grip": ["트라이포드"],
          "special": []
        }
      }
    },
    {
      "id": "scene_4",
      "scene": 4,
      "title": "카페에서의 인터뷰",
      "description": "지연은 카페에서 기자와 인터뷰를 한다. 테이블에는 녹음기가 놓여있다.",
      "dialogue": "기자: \"지연님의 새로운 프로젝트에 대해 이야기해주세요.\" 지연: \"네, 말씀드리겠습니다.\"",
      "cameraAngle": "인터뷰하는 두 사람의 중간 샷.",
      "cameraWork": "대화하는 두 사람의 얼굴을 번갈아가며 클로즈업.",
      "characterLayout": "지연과 기자가 카페 테이블을 마주보고 앉아 있다. 테이블에는 녹음기가 있다.",
      "props": "카페 테이블, 녹음기, 노트, 커피잔",
      "weather": "맑음",
      "lighting": "카페 내부 조명",
      "visualDescription": "진지한 인터뷰 분위기와 카페의 따뜻한 조명.",
      "transition": "인터뷰가 끝나고 두 사람이 일어나는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 자연스러운 대화 장면 연출.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "도시 카페",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "기자"],
        "props": ["카페 테이블", "녹음기", "노트", "커피잔"],
        "lighting": "카페 내부 조명",
        "weather": "맑음",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "기본 카메라",
          "lens": "기본 렌즈",
          "settings": "기본 설정",
          "movement": "고정"
        },
        "crew": {
          "director": "감독",
          "cinematographer": "촬영감독",
          "cameraOperator": "카메라맨",
          "lightingDirector": "조명감독",
          "makeupArtist": "메이크업",
          "costumeDesigner": "의상",
          "soundEngineer": "음향감독",
          "artDirector": "미술감독",
          "additionalCrew": []
        },
        "equipment": {
          "cameras": ["카메라"],
          "lenses": ["기본 렌즈"],
          "lighting": ["조명"],
          "audio": ["마이크"],
          "grip": ["트라이포드"],
          "special": []
        }
      }
    },
    {
      "id": "scene_5",
      "scene": 5,
      "title": "카페에서의 고민",
      "description": "지연은 카페에서 노트북을 보며 깊은 고민에 잠긴다. 창밖으로는 비가 내린다.",
      "dialogue": "지연: \"이 문제를 어떻게 해결해야 할까...\"",
      "cameraAngle": "노트북을 보는 지연의 클로즈업.",
      "cameraWork": "지연의 얼굴과 노트북 화면을 번갈아가며 촬영.",
      "characterLayout": "지연이 카페 창가에 앉아 노트북을 보고 있다. 창밖으로는 비가 내린다.",
      "props": "카페 테이블, 노트북, 커피잔, 창문",
      "weather": "비",
      "lighting": "카페 내부 조명",
      "visualDescription": "어두운 창밖과 카페의 따뜻한 조명이 대비를 이룬다.",
      "transition": "지연이 노트북을 덮고 일어나는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 고민하는 모습을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "도시 카페",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["카페 테이블", "노트북", "커피잔", "창문"],
        "lighting": "카페 내부 조명",
        "weather": "비",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "기본 카메라",
          "lens": "기본 렌즈",
          "settings": "기본 설정",
          "movement": "고정"
        },
        "crew": {
          "director": "감독",
          "cinematographer": "촬영감독",
          "cameraOperator": "카메라맨",
          "lightingDirector": "조명감독",
          "makeupArtist": "메이크업",
          "costumeDesigner": "의상",
          "soundEngineer": "음향감독",
          "artDirector": "미술감독",
          "additionalCrew": []
        },
        "equipment": {
          "cameras": ["카메라"],
          "lenses": ["기본 렌즈"],
          "lighting": ["조명"],
          "audio": ["마이크"],
          "grip": ["트라이포드"],
          "special": []
        }
      }
    },
    {
      "id": "scene_6",
      "scene": 6,
      "title": "집에서의 휴식",
      "description": "지연은 집에서 소파에 앉아 TV를 보며 휴식을 취한다. 창밖으로는 밤이 되었다.",
      "dialogue": "지연: \"오늘 하루도 끝났네...\"",
      "cameraAngle": "소파에 앉아 TV를 보는 지연의 클로즈업.",
      "cameraWork": "지연의 얼굴과 TV 화면을 번갈아가며 촬영.",
      "characterLayout": "지연이 집의 소파에 앉아 TV를 보고 있다. 창밖으로는 밤이 되었다.",
      "props": "소파, TV, 리모컨, 창문",
      "weather": "맑음",
      "lighting": "집 내부 조명",
      "visualDescription": "따뜻한 집 분위기와 지연의 편안한 모습.",
      "transition": "지연이 TV를 끄고 일어나는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 편안한 분위기를 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "지연의 집",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["소파", "TV", "리모컨", "창문"],
        "lighting": "집 내부 조명",
        "weather": "맑음",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "기본 카메라",
          "lens": "기본 렌즈",
          "settings": "기본 설정",
          "movement": "고정"
        },
        "crew": {
          "director": "감독",
          "cinematographer": "촬영감독",
          "cameraOperator": "카메라맨",
          "lightingDirector": "조명감독",
          "makeupArtist": "메이크업",
          "costumeDesigner": "의상",
          "soundEngineer": "음향감독",
          "artDirector": "미술감독",
          "additionalCrew": []
        },
        "equipment": {
          "cameras": ["카메라"],
          "lenses": ["기본 렌즈"],
          "lighting": ["조명"],
          "audio": ["마이크"],
          "grip": ["트라이포드"],
          "special": []
        }
      }
    },
    {
      "id": "scene_7",
      "scene": 7,
      "title": "집에서의 요리",
      "description": "지연은 집에서 요리를 하며 즐거워한다. 주방에는 다양한 재료들이 있다.",
      "dialogue": "지연: \"오늘은 이 요리를 만들어보자.\"",
      "cameraAngle": "요리하는 지연의 클로즈업.",
      "cameraWork": "지연의 얼굴과 요리 과정을 번갈아가며 촬영.",
      "characterLayout": "지연이 주방에서 요리를 하고 있다. 주변에는 다양한 재료들이 있다.",
      "props": "주방 시설, 요리 재료, 조리도구, 접시",
      "weather": "맑음",
      "lighting": "주방 내부 조명",
      "visualDescription": "따뜻한 주방 분위기와 지연의 즐거운 요리 모습.",
      "transition": "지연이 요리를 완성하는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 주방 공간을 자연스럽게 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "지연의 집",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["주방 시설", "요리 재료", "조리도구", "접시"],
        "lighting": "주방 내부 조명",
        "weather": "맑음",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"],
      // 스케줄링 상세 정보 추가
      "scheduling": {
        "camera": {
          "model": "기본 카메라",
          "lens": "기본 렌즈",
          "settings": "기본 설정",
          "movement": "고정"
        },
        "crew": {
          "director": "감독",
          "cinematographer": "촬영감독",
          "cameraOperator": "카메라맨",
          "lightingDirector": "조명감독",
          "makeupArtist": "메이크업",
          "costumeDesigner": "의상",
          "soundEngineer": "음향감독",
          "artDirector": "미술감독",
          "additionalCrew": []
        },
        "equipment": {
          "cameras": ["카메라"],
          "lenses": ["기본 렌즈"],
          "lighting": ["조명"],
          "audio": ["마이크"],
          "grip": ["트라이포드"],
          "special": []
        }
      }
    },
    {
      "id": "scene_8",
      "scene": 8,
      "title": "집에서의 공부",
      "description": "지연은 집에서 책상에 앉아 공부한다. 주변에는 책과 노트가 있다.",
      "dialogue": "지연: \"이 문제를 어떻게 풀어야 할까...\"",
      "cameraAngle": "공부하는 지연의 클로즈업.",
      "cameraWork": "지연의 얼굴과 책을 번갈아가며 촬영.",
      "characterLayout": "지연이 집의 책상에 앉아 공부하고 있다. 주변에는 책과 노트가 있다.",
      "props": "책상, 책, 노트, 연필",
      "weather": "맑음",
      "lighting": "집 내부 조명",
      "visualDescription": "조용한 집 분위기와 지연의 집중하는 모습.",
      "transition": "지연이 책을 덮고 일어나는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 집중하는 모습을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "지연의 집",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["책상", "책", "노트", "연필"],
        "lighting": "집 내부 조명",
        "weather": "맑음",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_9",
      "scene": 9,
      "title": "학교에서의 수업",
      "description": "지연은 학교 교실에서 수업을 듣는다. 선생님과 다른 학생들이 있다.",
      "dialogue": "선생님: \"오늘은 이 주제에 대해 토론해보겠습니다.\"",
      "cameraAngle": "교실에서 수업을 듣는 학생들의 중간 샷.",
      "cameraWork": "선생님과 학생들의 얼굴을 번갈아가며 클로즈업.",
      "characterLayout": "지연과 다른 학생들이 교실에 앉아 있고, 선생님이 앞에 서 있다.",
      "props": "교실 책상, 칠판, 분필, 교과서",
      "weather": "맑음",
      "lighting": "교실 내부 조명",
      "visualDescription": "활기찬 교실 분위기와 열심히 공부하는 학생들.",
      "transition": "수업이 끝나고 학생들이 일어나는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 교실 공간을 자연스럽게 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "imageUrl": "https://images.unsplash.com/photo-1523240794102-9eb5cbda3ae8?w=800&h=600&fit=crop",
      "keywords": {
        "userInfo": "지연",
        "location": "학교 교실",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "선생님", "학생들"],
        "props": ["교실 책상", "칠판", "분필", "교과서"],
        "lighting": "교실 내부 조명",
        "weather": "맑음",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_10",
      "scene": 10,
      "title": "학교에서의 토론",
      "description": "지연은 학교에서 동료들과 토론을 한다. 교실에는 활발한 분위기가 감지된다.",
      "dialogue": "지연: \"이 주제에 대해 어떻게 생각해?\" 동료: \"흥미로운 관점이네.\"",
      "cameraAngle": "토론하는 학생들의 중간 샷.",
      "cameraWork": "토론하는 학생들의 얼굴을 번갈아가며 클로즈업.",
      "characterLayout": "지연과 동료들이 교실에서 토론하고 있다. 주변에는 다른 학생들이 있다.",
      "props": "교실 책상, 칠판, 노트, 펜",
      "weather": "맑음",
      "lighting": "교실 내부 조명",
      "visualDescription": "활발한 토론 분위기와 열정적인 학생들.",
      "transition": "토론이 끝나고 학생들이 일어나는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 교실 공간을 자연스럽게 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "keywords": {
        "userInfo": "지연",
        "location": "학교 교실",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "동료들"],
        "props": ["교실 책상", "칠판", "노트", "펜"],
        "lighting": "교실 내부 조명",
        "weather": "맑음",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_11",
      "scene": 11,
      "title": "영화관에서의 데이트",
      "description": "지연과 민수는 영화관에서 영화를 보며 데이트한다. 주변에는 다른 관객들도 있다.",
      "dialogue": "지연: \"이 영화 정말 재미있네.\" 민수: \"그래, 다음에도 같이 와야겠다.\"",
      "cameraAngle": "영화관에서 영화를 보는 두 사람의 클로즈업.",
      "cameraWork": "영화를 보는 두 사람의 얼굴을 번갈아가며 촬영.",
      "characterLayout": "지연과 민수가 영화관에서 영화를 보고 있다. 주변에는 다른 관객들이 있다.",
      "props": "영화관 좌석, 팝콘, 음료, 스크린",
      "weather": "맑음",
      "lighting": "영화관 내부 조명",
      "visualDescription": "어두운 영화관 분위기와 두 사람의 로맨틱한 데이트.",
      "transition": "영화가 끝나고 두 사람이 영화관을 나서는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 어두운 영화관에서의 모습을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "keywords": {
        "userInfo": "지연",
        "location": "영화관",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "민수"],
        "props": ["영화관 좌석", "팝콘", "음료", "스크린"],
        "lighting": "영화관 내부 조명",
        "weather": "맑음",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_12",
      "scene": 12,
      "title": "도서관에서의 독서",
      "description": "지연은 도서관에서 책을 읽으며 조용히 시간을 보낸다. 주변에는 다른 독서자들도 있다.",
      "dialogue": "지연: \"이 책 정말 재미있네...\"",
      "cameraAngle": "책을 읽는 지연의 클로즈업.",
      "cameraWork": "지연의 얼굴과 책을 번갈아가며 촬영.",
      "characterLayout": "지연이 도서관 책상에 앉아 책을 읽고 있고, 주변에는 다른 독서자들이 있다.",
      "props": "책, 책상, 의자, 도서관 책장",
      "weather": "맑음",
      "lighting": "도서관 내부 조명",
      "visualDescription": "조용한 도서관 분위기와 지연의 집중하는 모습.",
      "transition": "지연이 책을 덮고 일어나는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 집중하는 모습을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "keywords": {
        "userInfo": "지연",
        "location": "도서관",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연"],
        "props": ["책", "책상", "의자", "도서관 책장"],
        "lighting": "도서관 내부 조명",
        "weather": "맑음",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_13",
      "scene": 13,
      "title": "놀이공원에서의 즐거움",
      "description": "지연과 민수는 놀이공원에서 롤러코스터를 타며 즐거워한다. 주변에는 다른 관광객들도 있다.",
      "dialogue": "지연: \"와! 너무 재미있어!\" 민수: \"다시 타자!\"",
      "cameraAngle": "롤러코스터를 타는 두 사람의 클로즈업.",
      "cameraWork": "즐거워하는 두 사람의 얼굴을 번갈아가며 촬영.",
      "characterLayout": "지연과 민수가 롤러코스터를 타고 있다. 주변에는 다른 관광객들이 있다.",
      "props": "롤러코스터, 놀이공원 시설, 음식, 음료",
      "weather": "맑음",
      "lighting": "자연광",
      "visualDescription": "활기찬 놀이공원 분위기와 두 사람의 즐거운 모습.",
      "transition": "롤러코스터가 끝나고 두 사람이 내리는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 넓은 놀이공원 풍경을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "keywords": {
        "userInfo": "지연",
        "location": "놀이공원",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "민수"],
        "props": ["롤러코스터", "놀이공원 시설", "음식", "음료"],
        "lighting": "자연광",
        "weather": "맑음",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_14",
      "scene": 14,
      "title": "바에서의 대화",
      "description": "지연과 민수는 바에서 술을 마시며 깊은 대화를 나눈다. 분위기는 진지하다.",
      "dialogue": "지연: \"우리 미래에 대해 이야기해보자.\" 민수: \"그래, 뭔가 생각이 있어?\"",
      "cameraAngle": "바 카운터에서 대화하는 두 사람의 클로즈업.",
      "cameraWork": "진지한 표정의 두 사람의 얼굴을 번갈아가며 촬영.",
      "characterLayout": "지연과 민수가 바 카운터에 앉아 있다. 주변에는 다른 손님들이 있다.",
      "props": "바 카운터, 술잔, 조명, 의자",
      "weather": "맑음",
      "lighting": "바 내부 조명",
      "visualDescription": "어두운 바 분위기와 두 사람의 진지한 대화.",
      "transition": "두 사람이 바를 나서는 장면으로 전환.",
      "lensSpecs": "50mm 렌즈로 어두운 바에서의 모습을 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "keywords": {
        "userInfo": "지연",
        "location": "도시 바",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "민수"],
        "props": ["바 카운터", "술잔", "조명", "의자"],
        "lighting": "바 내부 조명",
        "weather": "맑음",
        "timeOfDay": "밤",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    },
    {
      "id": "scene_15",
      "scene": 15,
      "title": "공항에서의 이별",
      "description": "지연과 민수는 공항에서 이별한다. 민수는 해외로 떠나고 지연은 남는다.",
      "dialogue": "지연: \"안전하게 다녀와.\" 민수: \"꼭 돌아올게.\"",
      "cameraAngle": "공항에서 이별하는 두 사람의 클로즈업.",
      "cameraWork": "슬픈 표정의 두 사람의 얼굴을 번갈아가며 촬영.",
      "characterLayout": "지연과 민수가 공항에서 마주보고 있다. 주변에는 다른 승객들이 있다.",
      "props": "공항 시설, 여행가방, 창문, 의자",
      "weather": "맑음",
      "lighting": "공항 내부 조명",
      "visualDescription": "밝은 공항 분위기와 두 사람의 슬픈 이별.",
      "transition": "민수가 입국장으로 들어가는 장면으로 전환.",
      "lensSpecs": "35mm 렌즈로 공항 공간을 자연스럽게 담는다.",
      "visualEffects": "필요 없음",
      "type": "live_action",
      "estimatedDuration": "2분",
      "keywords": {
        "userInfo": "지연",
        "location": "공항",
        "date": "2024-01-01",
        "equipment": "카메라",
        "cast": ["지연", "민수"],
        "props": ["공항 시설", "여행가방", "창문", "의자"],
        "lighting": "공항 내부 조명",
        "weather": "맑음",
        "timeOfDay": "낮",
        "specialRequirements": []
      },
      "weights": {"locationPriority": 1, "equipmentPriority": 1, "castPriority": 1, "timePriority": 1, "complexity": 1},
      "canEdit": true,
      "lastModified": "2025-07-14T07:58:53.911728Z",
      "modifiedBy": "AI",
      "cameras": ["C3", "C5", "C7"]
    }
  ];

  // 쉬는시간(분) 상수 선언
  const BREAK_TIME_MINUTES = 60; // 1시간

  // days에 날짜를 순차적으로 할당하는 함수
  function assignDatesToDays(days, range) {
    if (!range[0] || !range[1]) return days;
    const start = dayjs(range[0]);
    return days.map((day, idx) => ({
      ...day,
      date: start.add(idx, 'day').format('YYYY-MM-DD')
    }));
  }

  // 스케줄 로드 함수
  const loadSchedule = async () => {
    if (!finalProjectId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📋 스케줄 로드 시작:', finalProjectId);
      
      // 1. 기존 스케줄 확인
      const existingSchedule = await scheduleApi.getSchedule(finalProjectId);
      
      if (existingSchedule.success) {
        console.log('✅ 기존 스케줄 로드 완료');
        setScheduleData(existingSchedule.data);
        return existingSchedule.data;
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('📝 기존 스케줄이 없습니다. 새로 생성합니다.');
      } else {
        console.error('❌ 스케줄 로드 오류:', error);
      }
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  // 스케줄 저장 함수
  const saveSchedule = async (scheduleData) => {
    if (!finalProjectId || !scheduleData || !conteData) return;
    
    try {
      console.log('💾 스케줄 저장 시작:', finalProjectId);
      
      const response = await scheduleApi.saveSchedule(finalProjectId, scheduleData, conteData);
      
      if (response.success) {
        console.log('✅ 스케줄 저장 완료:', response.message);
        return response.data;
      }
    } catch (error) {
      console.error('❌ 스케줄 저장 오류:', error);
      throw error;
    }
  };

  // 스케줄 생성 함수
  const generateSchedule = async (forceRegenerate = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!conteData || conteData.length === 0) {
        if (isFavoriteView) {
          setError('즐겨찾기된 프로젝트에 콘티 데이터가 없습니다.');
        } else {
          setError('콘티 데이터가 없습니다. 먼저 콘티를 생성해주세요.');
        }
        return;
      }
      
      // 1. 콘티 데이터 변경 감지 (강제 재생성이 아닌 경우에만)
      if (!forceRegenerate) {
        try {
          const updateCheck = await scheduleApi.checkScheduleUpdate(finalProjectId, conteData);
          console.log('🔄 콘티 데이터 변경 확인:', updateCheck);
          
          if (updateCheck.success && !updateCheck.needsUpdate) {
            console.log('✅ 기존 스케줄 사용 가능');
            const existingSchedule = await loadSchedule();
            if (existingSchedule) {
              setScheduleData(existingSchedule);
              return;
            }
          }
        } catch (error) {
          console.log('📝 스케줄 변경 감지 실패, 새로 생성합니다.');
        }
      } else {
        console.log('🔄 강제 재생성 모드: 기존 스케줄 무시하고 새로 생성');
      }
      
      // 2. 새 스케줄 생성
      console.log('🔄 새 스케줄 생성 시작');
      const schedule = await generateOptimalSchedule(conteData)
      
      // 3. 스케줄 저장
      await saveSchedule(schedule);
      
      setScheduleData(schedule)
      console.log('✅ 스케줄 생성 및 저장 완료:', schedule)
    } catch (error) {
      console.error('❌ 스케줄 생성 실패:', error)
      setError(error.message || '스케줄 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 페이지 로드 시 자동으로 스케줄 로드/생성
  useEffect(() => {
    console.log('📦 [SimpleSchedulePage] 즐겨찾기 모드:', isFavoriteView);
    console.log('📦 [SimpleSchedulePage] 사용할 콘티 데이터:', getConteData());
    
    // conteData가 로드된 후에만 스케줄 처리
    if (conteData && conteData.length > 0) {
      // 즐겨찾기 모드가 아닌 경우에만 백엔드 스케줄 로드 시도
      if (!isFavoriteView && finalProjectId) {
        generateSchedule(false); // 페이지 로드 시에는 기존 로직 사용 (forceRegenerate = false)
      } else {
        // 즐겨찾기 모드 또는 프로젝트 ID가 없는 경우 기존 로직 사용
        generateSchedule(false);
      }
    }
  }, [isFavoriteView, conteData, finalProjectId]); // finalProjectId 의존성 추가

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

  /**
   * 씬(Chip) 클릭 핸들러 - 콘티 상세 모달 오픈
   */
  const handleSceneClick = (scene) => {
    setSelectedConte(scene);
    setConteModalOpen(true);
  };

  // 일일촬영계획표 모달 열기
  const handleOpenDailyPlanModal = (day) => {
    setSelectedDayForPlan(day);
    setDailyPlanModalOpen(true);
  };

  /**
   * 시간대별로 씬을 그룹핑하는 함수
   * 스케줄러 서비스에서 계산된 정확한 시간 정보를 사용
   * @param {Array} days - 일차별 스케줄 데이터
   * @returns {Array} 시간대별로 그룹핑된 씬 데이터
   */
  function groupScenesByTimeBlock(days) {
    // 결과: [{ time: '09:00~10:00', scenes: [scene, ...], location, cast, note }]
    const result = [];

    // 모든 씬을 시간 순서대로 평탄화
    const allScenes = days.flatMap(day => day.scenes.map(scene => ({ ...scene, day })));

    // 씬별로 정확한 시간 정보 사용
    for (let i = 0; i < allScenes.length; i++) {
      const scene = allScenes[i];
      
      // 스케줄러 서비스에서 계산된 정확한 시간 정보 우선 사용
      let timeLabel = '';
      
      // 1. timeSlotDisplay가 있는 경우 (가장 정확한 시간 정보)
      if (scene.timeSlotDisplay && scene.timeSlotDisplay.includes('~')) {
        timeLabel = scene.timeSlotDisplay;
      } 
      // 2. sceneStartTime과 sceneEndTime이 있는 경우
      else if (scene.sceneStartTime && scene.sceneEndTime) {
        timeLabel = `${scene.sceneStartTime} ~ ${scene.sceneEndTime}`;
      } 
      // 3. timeRange가 있는 경우
      else if (scene.timeRange && scene.timeRange.start && scene.timeRange.end) {
        timeLabel = `${scene.timeRange.start} ~ ${scene.timeRange.end}`;
      } 
      // 4. 기본 시간대만 표시 (fallback)
      else {
        const timeSlot = scene.keywords?.timeOfDay || scene.timeSlot || '미정';
        timeLabel = `${timeSlot} (시간 미정)`;
      }
      
      // 상세 정보 추출 (schedulerService에서 추가된 정보 우선 사용)
      const cameraInfo = scene.cameraDetails || {};
      const crewInfo = scene.crewDetails || [];
      const equipmentInfo = scene.equipmentDetails || [];
      
      // 원본 콘티 데이터의 모든 필드를 보존
      const preservedScene = {
        ...scene,
        _id: scene._id || scene.id, // _id가 없으면 id를 사용
        id: scene.id,   // id 필드도 보존
        realLocationId: scene.realLocationId // 실제장소 ID 보존
      };
      
      // 그룹에 추가
      result.push({
        time: timeLabel,
        scenes: [preservedScene], // 보존된 씬 데이터 사용
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
    }
  }, [dateRange])

  // 브라우저 뒤로가기/앞으로가기 버튼 처리 - 제거 (단순화)

  // 날짜가 변경될 때마다 days에 날짜를 할당
  const daysWithDates = scheduleData && scheduleData.days
    ? assignDatesToDays(scheduleData.days, dateRange)
    : [];

  // 가상장소 연결 관련 상태
  const [realLocations, setRealLocations] = useState([]);
  const [locationConnectionModal, setLocationConnectionModal] = useState(false);
  const [selectedConteForLocation, setSelectedConteForLocation] = useState(null);
  const [selectedRealLocation, setSelectedRealLocation] = useState('');

  // 가상장소 데이터 로드
  const loadRealLocations = async () => {
    if (!finalProjectId) return;
    
    try {
      const response = await locationAPI.getRealLocations(finalProjectId);
      if (response.data.success) {
        setRealLocations(response.data.data || []);
      }
    } catch (error) {
      console.error('실제장소 로드 오류:', error);
    }
  };

  // 실제장소 연결 모달 열기
  const handleOpenLocationConnection = (conte) => {
    if (!conte._id) {
      console.error('콘티 ID가 없습니다!');
      return;
    }
    
    setSelectedConteForLocation(conte);
    // 현재 연결된 실제장소가 있으면 선택 상태로 설정
    setSelectedRealLocation(conte.realLocationId || '');
    setLocationConnectionModal(true);
  };

  // 실제장소 연결 모달 닫기
  const handleCloseLocationConnection = () => {
    setLocationConnectionModal(false);
    setSelectedConteForLocation(null);
    setSelectedRealLocation('');
  };

  // 실제장소 연결 저장
  const handleSaveLocationConnection = async () => {
    if (!selectedConteForLocation) return;

    try {
      const requestBody = {
        realLocationId: selectedRealLocation || null 
      };

      console.log('🔗 실제장소 연결 시작:', {
        projectId: finalProjectId,
        conteId: selectedConteForLocation._id,
        realLocationId: selectedRealLocation,
        requestBody
      });

      const response = await fetch(`/api/projects/${finalProjectId}/contes/${selectedConteForLocation._id}/assign-location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth-token') || localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ DB 저장 성공:', {
          success: result.success,
          message: result.message,
          data: result.data
        });
        
        setConteData(prevData => {
          const updatedData = prevData.map(conte => 
            (conte._id === selectedConteForLocation._id || 
             conte.id === selectedConteForLocation._id ||
             conte._id === selectedConteForLocation.id ||
             conte.id === selectedConteForLocation.id)
              ? { ...conte, realLocationId: selectedRealLocation || null }
              : conte
          );
          
          const updatedConteData = updatedData;
          
          setTimeout(async () => {
            try {
              await generateSchedule();
            } catch (error) {
              console.error('❌ 스케줄 재생성 실패:', error);
            }
          }, 0);
          
          return updatedData;
        });
        
        setLocationConnectionModal(false);
        setSelectedConteForLocation(null);
        setSelectedRealLocation('');
        
        await generateSchedule();
        
        console.log('🎉 실제장소 연결 완료! 새로고침 후에도 유지되는지 확인해보세요.');
      } else {
        const errorData = await response.json();
        console.error('❌ DB 저장 실패:', {
          status: response.status,
          error: errorData
        });
        alert(`실제장소 연결 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('❌ 실제장소 연결 오류:', error);
      alert(`실제장소 연결 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 실제장소 이름 가져오기
  const getRealLocationName = (realLocationId) => {
    if (!realLocationId) return '미연결';
    const location = realLocations.find(loc => loc._id === realLocationId);
    return location ? location.name : '미연결';
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* 공통 헤더 */}
      <CommonHeader 
        title="촬영 스케줄"
        showBackButton={true}
        onBack={handleBack}
      />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 헤더 */}
        <Box sx={{ mb: 4 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
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
          
          {/* 위치 관리 버튼 - 프로젝트가 있을 때만 표시 */}
          {finalProjectId && (
            <Button
              variant="outlined"
              startIcon={<LocationOn />}
              onClick={() => navigate(`/project/${finalProjectId}/locations`)}
              sx={{ 
                minWidth: '120px',
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  backgroundColor: 'success.light',
                  color: 'success.dark'
                }
              }}
            >
              위치 관리
            </Button>
          )}
          
          {/* 스케줄 재생성 버튼 */}
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => generateSchedule(true)} // 강제 재생성 모드
            disabled={isLoading}
            sx={{ 
              minWidth: '140px',
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            {isLoading ? '재생성 중...' : (finalProjectId ? '스케줄 재생성 & 저장' : '스케줄 재생성')}
          </Button>
        </Box>
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
          <Grid item xs={12} md={10} lg={8}>
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
            <Grid item xs={12} md={10} lg={8}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ 설정된 촬영 기간({actualDateRange.length}일)이 스케줄 일수({scheduleData.totalDays}일)보다 적습니다.
                종료일을 늘려주세요.
              </Alert>
            </Grid>
          )}

          {/* 상단 Chip 요약 정보 (SchedulerPage와 동일하게 MUI color prop 사용) */}
          <Grid item xs={12} md={10} lg={8}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {/* 데이터 소스 표시 */}
              <Chip
                icon={finalProjectId || isFavoriteView ? <Star /> : <Videocam />}
                label={`데이터: ${finalProjectId 
                  ? `프로젝트 ${finalProjectId.substring(0, 8)}...` 
                  : (isFavoriteView 
                      ? (selectedProject 
                          ? `즐겨찾기 - ${selectedProject.projectTitle}` 
                          : '즐겨찾기 프로젝트')
                      : (getConteData().length > 0 ? '실제 콘티' : '더미 데이터')
                    )
                }`}
                color={finalProjectId || isFavoriteView ? "warning" : (getConteData().length > 0 ? "success" : "warning")}
                variant="outlined"
              />
              {/* 총 일수: color="primary" */}
              <Chip
                icon={<Schedule />}
                label={`총 ${scheduleData.days?.length || 0}일`}
                color="primary"
              />
              {/* 총 씬: color="secondary" */}
              <Chip
                icon={<CameraAlt />}
                label={`총 ${scheduleData.days?.reduce((total, day) => total + (day.scenes?.length || 0), 0)}개 씬`}
                color="secondary"
              />
              {/* 총 촬영시간: color="success" */}
              <Chip
                icon={<LocationOn />}
                label={`총 ${formatDuration(scheduleData.days?.reduce((total, day) => total + (day.estimatedDuration || 0), 0))} (실제 촬영)`}
                color="success"
              />
              {/* 최적화 점수: color="info" */}
              <Chip
                icon={<Build />}
                label={`최적화 점수: ${scheduleData.optimizationScore?.efficiency ?? 'NaN'}%`}
                color="info"
              />
            </Box>
          </Grid>

          {/* 상단 Day별 탭 UI */}
          <Grid item xs={12} md={10} lg={8}> {/* 중아너비 제한 */}
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
            <Grid item xs={12} md={10} lg={8}> {/* 중아너비 제한 */}
              <Card key={selectedDay} sx={{ mb: 4, mx: 'auto' }}> {/* 카드 중앙 정렬 */}
                <CardContent>
                  {/* 일차 및 날짜/장소 정보 */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                    {daysWithDates[selectedDay].day}일차 {daysWithDates[selectedDay].date ? `(${daysWithDates[selectedDay].date})` : ''} - {daysWithDates[selectedDay].location}
                  </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Description />}
                      onClick={() => handleOpenDailyPlanModal(daysWithDates[selectedDay])}
                      sx={{ 
                        minWidth: '140px',
                        borderColor: 'info.main',
                        color: 'info.main',
                        '&:hover': {
                          borderColor: 'info.dark',
                          backgroundColor: 'info.light',
                          color: 'info.dark'
                        }
                      }}
                    >
                      일일촬영계획표
                    </Button>
                  </Box>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#2F2F37' }}>
                          <TableCell><strong>시간</strong></TableCell>
                          <TableCell><strong>활동</strong></TableCell>
                          <TableCell><strong>씬</strong></TableCell>
                          <TableCell><strong>장소</strong></TableCell>
                          <TableCell><strong>카메라</strong></TableCell>
                          <TableCell><strong>주요 인물</strong></TableCell>
                          <TableCell><strong>필요 인력</strong></TableCell>
                          <TableCell><strong>필요 장비</strong></TableCell>
                          <TableCell><strong>비고</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* dailySchedule 정보를 기반으로 통합된 스케줄 표시 */}
                        {daysWithDates[selectedDay].dailySchedule ? (
                          daysWithDates[selectedDay].dailySchedule.map((schedule, idx) => {
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

                            // 촬영 활동인 경우 해당 씬 정보 찾기
                            let sceneInfo = null;
                            if (schedule.activity === '촬영') {
                              const sceneMatch = schedule.description.match(/씬 (\d+): (.+?) \((\d+)분\)/);
                              if (sceneMatch) {
                                const sceneNumber = parseInt(sceneMatch[1]);
                                const sceneTitle = sceneMatch[2];
                                const sceneDuration = parseInt(sceneMatch[3]);
                                sceneInfo = {
                                  scene: sceneNumber,
                                  title: sceneTitle,
                                  duration: sceneDuration
                                };
                              }
                            }

                            // 씬 정보에서 상세 데이터 가져오기
                            const sceneData = sceneInfo ? 
                              daysWithDates[selectedDay].scenes.find(s => s.scene === sceneInfo.scene) : null;

                            return (
                              <TableRow key={idx}>
                                {/* 시간 */}
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold">
                                    {schedule.time}
                                  </Typography>
                                </TableCell>
                                
                                {/* 활동 */}
                                <TableCell>
                                  <Chip
                                    label={schedule.activity}
                                    size="small"
                                    color={getActivityColor(schedule.activity)}
                                    variant="filled"
                                  />
                                </TableCell>
                                
                                {/* 씬 */}
                                <TableCell>
                                  {sceneInfo ? (
                                    <Chip
                                      label={`씬 ${sceneInfo.scene}`}
                                      color="primary"
                                      variant="outlined"
                                      size="small"
                                      sx={{ cursor: 'pointer' }}
                                      onClick={() => sceneData && handleSceneClick(sceneData)}
                                    />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                
                                {/* 장소 */}
                                <TableCell>
                                  {sceneData ? (
                                    sceneData.realLocationId ? (
                                      <Typography 
                                        variant="body2" 
                                        color="primary" 
                                        sx={{ 
                                          cursor: 'pointer',
                                          textDecoration: 'underline',
                                          '&:hover': { opacity: 0.8 }
                                        }}
                                        onClick={() => handleOpenLocationConnection(sceneData)}
                                      >
                                        📍 {sceneData.realLocationName || getRealLocationName(sceneData.realLocationId)}
                                      </Typography>
                                    ) : (
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2">
                                          {sceneData.location || '미정'}
                                        </Typography>
                                        <Button
                                          size="small"
                                          startIcon={<Link />}
                                          onClick={() => handleOpenLocationConnection(sceneData)}
                                          sx={{ minWidth: 'auto', p: 0.5 }}
                                        >
                                          연결
                                        </Button>
                                      </Box>
                                    )
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                
                                {/* 카메라 */}
                                <TableCell>
                                  {sceneData ? (
                                    <Typography variant="body2">
                                      {sceneData.camera || '기본 카메라'}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                
                                {/* 주요 인물 */}
                                <TableCell>
                                  {sceneData && sceneData.actors && Array.isArray(sceneData.actors) && sceneData.actors.length > 0 ? (
                                    sceneData.actors.map((actor, i) => (
                                      <Chip
                                        key={i}
                                        label={actor}
                                        color="secondary"
                                        size="small"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                
                                {/* 필요 인력 */}
                                <TableCell>
                                  {sceneData && sceneData.crew && Array.isArray(sceneData.crew) && sceneData.crew.length > 0 ? (
                                    <Typography variant="body2">
                                      {sceneData.crew.join(', ')}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                
                                {/* 필요 장비 */}
                                <TableCell>
                                  {sceneData && sceneData.equipment && Array.isArray(sceneData.equipment) && sceneData.equipment.length > 0 ? (
                                    <Typography variant="body2">
                                      {sceneData.equipment.join(', ')}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                
                                {/* 비고 */}
                                <TableCell>
                                  {sceneInfo ? (
                                    <Typography variant="body2">
                                      {sceneInfo.title}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      {schedule.description}
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          // dailySchedule이 없는 경우 기존 로직 사용
                          groupScenesByTimeBlock([daysWithDates[selectedDay]]).map((block, idx, arr) => {
                          const sceneEndTime = block.scenes[0]?.sceneEndTime || '미정';
                          const breakStart = sceneEndTime;
                          const breakEnd = sceneEndTime !== '미정' ? addMinutesToTime(sceneEndTime, BREAK_TIME_MINUTES) : '미정';
                          
                          const rawCameraInfo = block.scenes[0]?.camera || '기본 카메라';
                          const requiredPersonnel = block.scenes[0]?.requiredPersonnel || '정보 없음';
                          const requiredEquipment = block.scenes[0]?.requiredEquipment || '정보 없음';
                          
                          const parseCameraInfo = (cameraStr) => {
                              if (!cameraStr || typeof cameraStr !== 'string') return '기본 카메라';
                            const cameraMatch = cameraStr.match(/(C\d+)/g);
                            if (cameraMatch && cameraMatch.length > 1) {
                              return cameraMatch.join(', ');
                            }
                            return cameraStr;
                          };
                          
                          const cameraInfo = parseCameraInfo(rawCameraInfo);
                          const cast = block.scenes[0]?.keywords?.cast || [];
                          
                          return (
                            <React.Fragment key={idx}>
                              <TableRow>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{block.time}</Typography>
                                    {block.actualShootingDuration && (
                                      <Typography variant="caption" color="text.secondary">
                                        촬영: {formatDuration(block.actualShootingDuration)}
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                  <TableCell>
                                    <Chip label="촬영" size="small" color="success" variant="filled" />
                                  </TableCell>
                                <TableCell>
                                  {block.scenes.map((scene, i) => (
                                    <Chip
                                      key={i}
                                      label={`씬 ${scene.scene}`}
                                      color="primary"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5, cursor: 'pointer' }}
                                      onClick={() => handleSceneClick(scene)}
                                    />
                                  ))}
                                </TableCell>
                                <TableCell>
                                                                      {block.scenes[0]?.realLocationId ? (
                                      <Typography 
                                        variant="body2" 
                                        color="primary" 
                                        sx={{ 
                                          cursor: 'pointer',
                                          textDecoration: 'underline',
                                          '&:hover': { opacity: 0.8 }
                                        }}
                                        onClick={() => handleOpenLocationConnection(block.scenes[0])}
                                      >
                                        📍 {block.scenes[0].realLocationName || getRealLocationName(block.scenes[0].realLocationId)}
                                      </Typography>
                                    ) : (
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Typography variant="body2">
                                        {block.location}
                                      </Typography>
                                      <Button
                                        size="small"
                                        startIcon={<Link />}
                                        onClick={() => handleOpenLocationConnection(block.scenes[0])}
                                        sx={{ minWidth: 'auto', p: 0.5 }}
                                      >
                                        연결
                                      </Button>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {cameraInfo}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {Array.isArray(cast) && cast.length > 0
                                    ? cast.map((actor, i) => (
                                        <Chip
                                          key={i}
                                          label={actor}
                                          color="secondary"
                                          size="small"
                                          sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                      ))
                                    : (typeof cast === 'string' ? cast : '-')}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {requiredPersonnel}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {requiredEquipment}
                                  </Typography>
                                </TableCell>
                                <TableCell>{block.note}</TableCell>
                              </TableRow>
                              {idx < arr.length - 1 && (
                                <TableRow>
                                  <TableCell>
                                    <Typography color="warning.main">
                                      {breakStart}~{breakEnd}
                                    </Typography>
                                  </TableCell>
                                    <TableCell>
                                      <Chip label="쉬는시간" size="small" color="warning" variant="filled" />
                                  </TableCell>
                                  <TableCell colSpan={7} align="center">
                                    <Typography color="warning.main">쉬는시간</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* 콘티 상세 모달 (공통 컴포넌트 사용) */}
      <ConteDetailModal
        open={conteModalOpen}
        onClose={() => setConteModalOpen(false)}
        conte={selectedConte}
      />

      {/* 실제장소 연결 모달 */}
      <Dialog open={locationConnectionModal} onClose={handleCloseLocationConnection} maxWidth="sm" fullWidth>
        <DialogTitle>
          실제장소 연결
        </DialogTitle>
        <DialogContent>
          {selectedConteForLocation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                씬 {selectedConteForLocation.scene}: {selectedConteForLocation.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                현재 장소: {selectedConteForLocation.keywords?.location || '미정'}
              </Typography>
              
              {selectedConteForLocation.realLocationId && (
                <Box sx={{ mt: 1, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary.contrastText" gutterBottom>
                    현재 연결된 실제장소:
                  </Typography>
                  <Typography variant="body2" color="primary.contrastText">
                    📍 {getRealLocationName(selectedConteForLocation.realLocationId)}
                  </Typography>
                </Box>
              )}
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>실제장소 선택</InputLabel>
                <Select
                  value={selectedRealLocation}
                  onChange={(e) => setSelectedRealLocation(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>실제장소 연결 해제</em>
                  </MenuItem>
                  {realLocations.map((location) => (
                    <MenuItem key={location._id} value={location._id}>
                      {location.name} - {location.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedRealLocation && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    선택된 실제장소 정보:
                  </Typography>
                  {(() => {
                    const location = realLocations.find(loc => loc._id === selectedRealLocation);
                    return location ? (
                      <Box>
                        <Typography variant="body2">
                          <strong>이름:</strong> {location.name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>설명:</strong> {location.description}
                        </Typography>
                        <Typography variant="body2">
                          <strong>환경:</strong> {location.characteristics?.environment}
                        </Typography>
                        <Typography variant="body2">
                          <strong>시간대:</strong> {location.shootingInfo?.timeOfDay}
                        </Typography>
                      </Box>
                    ) : null;
                  })()}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLocationConnection}>취소</Button>
          <Button onClick={handleSaveLocationConnection} variant="contained">
            {selectedRealLocation ? '연결' : '연결 해제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 일일촬영계획표 모달 */}
      <DailyShootingPlanModal
        open={dailyPlanModalOpen}
        onClose={() => setDailyPlanModalOpen(false)}
        projectTitle={projectInfo?.projectTitle || '프로젝트'}
        shootingDate={selectedDayForPlan ? formatKoreanDate(selectedDayForPlan.date) : ''}
        scenes={selectedDayForPlan?.scenes || []}
        dailySchedule={selectedDayForPlan?.dailySchedule || []}
        weather="맑음"
        sunrise="05:30"
        sunset="19:30"
      />
    </Container>
    </Box>
  );
};

export default SimpleSchedulePage; 