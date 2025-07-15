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
  ArrowBack,
  CameraAlt, // 아이콘 추가
  Build // 아이콘 추가
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { generateOptimalSchedule } from '../services/schedulerService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ConteDetailModal from '../components/StoryGeneration/ConteDetailModal';
import useStoryGenerationStore from '../stores/storyGenerationStore'; // 스토리 생성 스토어 추가

/**
 * 간단한 스케줄표 페이지
 * 복잡한 기능 없이 깔끔한 스케줄표만 표시
 */
const SimpleSchedulePage = () => {
  const navigate = useNavigate();
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0); // 현재 선택된 Day 인덱스 상태 추가
  // 날짜 범위 상태: 시작일, 종료일 (기본값: 오늘~오늘+N-1)
  const [dateRange, setDateRange] = useState([dayjs(), dayjs().add(3, 'day')]);
  
  // 콘티 상세 모달 상태 추가
  const [selectedConte, setSelectedConte] = useState(null); // 선택된 콘티 정보
  const [conteModalOpen, setConteModalOpen] = useState(false); // 모달 열림 여부

  // 스토리 생성 스토어에서 실제 콘티 데이터 가져오기
  const { conteGeneration } = useStoryGenerationStore();
  const actualConteData = conteGeneration.generatedConte;

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
      "cameras": ["C1", "C2"]
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
      "cameras": ["C3", "C5", "C7"]
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
      "cameras": ["C3", "C5", "C7"]
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
      "cameras": ["C3", "C5", "C7"]
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
      "cameras": ["C3", "C5", "C7"]
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
      "cameras": ["C3", "C5", "C7"]
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
      "cameras": ["C3", "C5", "C7"]
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

  // 스케줄 생성 함수
  const generateSchedule = async () => {
    setIsLoading(true);
    setError(null);
    
    // 실제 콘티 데이터 우선 사용, 없으면 더미 데이터 사용
    let conteDataToUse = actualConteData && actualConteData.length > 0 
      ? actualConteData 
      : testConteData;
    
    // 실제 콘티 데이터에 이미지 URL이 없는 경우 기본 이미지 추가
    if (actualConteData && actualConteData.length > 0) {
      conteDataToUse = actualConteData.map((conte, index) => ({
        ...conte,
        imageUrl: conte.imageUrl || `https://images.unsplash.com/photo-${1500000000 + index}?w=800&h=600&fit=crop`
      }));
    }
    
    // 콘티 데이터 전체 로그
    console.log('📦 [generateSchedule] 실제 콘티 데이터:', actualConteData);
    console.log('📦 [generateSchedule] 사용할 콘티 데이터:', conteDataToUse);
    console.log('📦 [generateSchedule] 데이터 소스:', actualConteData && actualConteData.length > 0 ? '실제 데이터' : '더미 데이터');

    try {
      console.log('🎬 간단한 스케줄 생성 시작...');
      console.log('📊 콘티 데이터:', conteDataToUse);
      console.log('📊 데이터 개수:', conteDataToUse.length);
      
      const result = await generateOptimalSchedule(conteDataToUse);
      // 스케줄 생성 결과 로그
      console.log('✅ [generateSchedule] 스케줄 생성 완료:', result);
      setScheduleData(result);
    } catch (err) {
      console.error('❌ 스케줄 생성 실패:', err);
      setError('스케줄 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 로드 시 자동으로 스케줄 생성
  // 1. 컴포넌트 마운트 시 콘티 데이터 전체 로그
  useEffect(() => {
    console.log('📦 [SimpleSchedulePage] 실제 콘티 데이터:', actualConteData);
    console.log('📦 [SimpleSchedulePage] 더미 콘티 데이터:', testConteData);
    console.log('📦 [SimpleSchedulePage] 데이터 소스:', actualConteData && actualConteData.length > 0 ? '실제 데이터' : '더미 데이터');
    generateSchedule();
  }, [actualConteData]); // 실제 콘티 데이터가 변경될 때마다 스케줄 재생성

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

  // 뒤로가기 함수
  const handleBack = () => {
    navigate(-1);
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
        timeSlot: scene.keywords?.timeOfDay || scene.timeSlot
      });
    }
    
    console.log('🕐 시간대별 그룹핑 결과:', result.map(item => ({
      time: item.time,
      scene: item.scenes[0]?.scene,
      title: item.scenes[0]?.title,
      duration: item.actualShootingDuration
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

  // 날짜가 변경될 때마다 days에 날짜를 할당
  const daysWithDates = scheduleData && scheduleData.days
    ? assignDatesToDays(scheduleData.days, dateRange)
    : [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          뒤로가기
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          📅 촬영 스케줄
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          AI가 생성한 콘티를 기반으로 최적의 촬영 스케줄을 제공합니다.
        </Typography>
      </Box>

      {/* 로딩 상태 */}
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
      {!actualConteData || actualConteData.length === 0 ? (
        <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
          <CardContent>
            <Typography variant="h6" color="warning.main" gutterBottom>
              📝 콘티 데이터가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              현재 더미 데이터로 스케줄을 생성하고 있습니다. 
              실제 콘티 데이터를 사용하려면 먼저 스토리 생성 페이지에서 콘티를 생성해주세요.
            </Typography>
            <Button 
              variant="outlined" 
              color="warning"
              onClick={() => navigate('/story-generation')}
              sx={{ mt: 1 }}
            >
              스토리 생성 페이지로 이동
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
                icon={<Videocam />}
                label={`데이터: ${actualConteData && actualConteData.length > 0 ? '실제 콘티' : '더미 데이터'}`}
                color={actualConteData && actualConteData.length > 0 ? "success" : "warning"}
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
                  <Typography variant="h6" gutterBottom>
                    {daysWithDates[selectedDay].day}일차 {daysWithDates[selectedDay].date ? `(${daysWithDates[selectedDay].date})` : ''} - {daysWithDates[selectedDay].location}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#2F2F37' }}>
                          <TableCell><strong>시간</strong></TableCell>
                          <TableCell><strong>씬</strong></TableCell>
                          <TableCell><strong>장소</strong></TableCell>
                          <TableCell><strong>카메라</strong></TableCell>
                          <TableCell><strong>주요 인물</strong></TableCell>
                          <TableCell><strong>필요 인력</strong></TableCell> {/* crew만 */}
                          <TableCell><strong>필요 장비</strong></TableCell> {/* equipment만 */}
                          <TableCell><strong>비고</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* 씬별로 시간대 그룹핑 후, 각 씬 뒤에 쉬는시간 행을 추가 */}
                        {groupScenesByTimeBlock([daysWithDates[selectedDay]]).map((block, idx, arr) => {
                          // block/scenes 정보 로그
                          console.log(`🟨 [렌더링] Day${selectedDay+1} block${idx+1}:`, block);
                          // 현재 씬의 종료시간을 쉬는시간 시작으로 사용
                          const sceneEndTime = block.scenes[0]?.sceneEndTime || '미정';
                          const breakStart = sceneEndTime;
                          const breakEnd = sceneEndTime !== '미정' ? addMinutesToTime(sceneEndTime, BREAK_TIME_MINUTES) : '미정';
                          // crew: keywords.crew만, 없으면 '-'
                          const crew = block.scenes[0]?.keywords?.crew || '-';
                          // equipment: keywords.equipment만, 없으면 '-'
                          const equipment = block.scenes[0]?.keywords?.equipment || '-';
                          // 주요 인물: cast만
                          const cast = block.scenes[0]?.keywords?.cast || [];
                          return (
                            <React.Fragment key={idx}>
                              {/* 씬 정보 행 */}
                              <TableRow>
                                {/* 시간 정보 및 촬영시간 */}
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
                                {/* 씬 번호(Chip) */}
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
                                {/* 장소 정보 */}
                                <TableCell>{block.location}</TableCell>
                                {/* 카메라 정보: cameras 배열을 표시 */}
                                <TableCell>
                                  {block.scenes[0]?.cameras && block.scenes[0].cameras.length > 0
                                    ? block.scenes[0].cameras.join(', ')
                                    : '-'}
                                </TableCell>
                                {/* 주요 인물(Chip, cast만) */}
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
                                {/* 필요 인력(crew만, Chip 또는 문자열) */}
                                <TableCell>
                                  {Array.isArray(crew) && crew.length > 0
                                    ? crew.map((person, i) => (
                                        <Chip key={i} label={person} color="info" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                      ))
                                    : (typeof crew === 'string' ? crew : '-')}
                                </TableCell>
                                {/* 필요 장비(equipment만, Chip 또는 문자열) */}
                                <TableCell>
                                  {Array.isArray(equipment) && equipment.length > 0
                                    ? equipment.map((item, i) => (
                                        <Chip key={i} label={item} color="success" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                      ))
                                    : (typeof equipment === 'string' ? equipment : '-')}
                                </TableCell>
                                {/* 비고(노트) */}
                                <TableCell>{block.note}</TableCell>
                              </TableRow>
                              {/* 쉬는시간 행: 마지막 씬이 아니면 추가 */}
                              {idx < arr.length - 1 && (
                                <TableRow>
                                  {/* 쉬는시간도 00:00~00:00 형식으로 표기 */}
                                  <TableCell>
                                    <Typography color="warning.main">
                                      {breakStart}~{breakEnd}
                                    </Typography>
                                  </TableCell>
                                  <TableCell colSpan={7} align="center">
                                    <Typography color="warning.main">쉬는시간</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
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
        onEdit={null} // SimpleSchedulePage에서는 편집 기능 비활성화
        onImageRetry={null} // SimpleSchedulePage에서는 이미지 재시도 기능 비활성화
        imageLoadErrors={{}}
        onImageLoadError={null}
      />
    </Container>
  );
};

export default SimpleSchedulePage; 