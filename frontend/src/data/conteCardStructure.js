/**
 * 캡션 카드 데이터 구조 및 키워드 노드 시스템
 * PRD 2.1.3 AI 콘티 생성 기능의 캡션 카드 구조 정의
 */

/**
 * 캡션 카드 기본 구조
 * 타임라인에서 각 씬을 대표하는 이미지 형태의 카드
 */
export const CAPTION_CARD_STRUCTURE = {
  // 기본 정보
  id: '', // 고유 식별자
  scene: 1, // 씬 번호
  title: '', // 씬 제목
  
  // 캡션 카드 구성 요소 (12개)
  description: '', // 인물들이 처한 상황에 대한 대략적인 설명
  dialogue: '', // 해당 장면을 대표하는 대사

  weather: '', // 날씨와 지형
  lighting: '', // 조명
  visualDescription: '', // 각 장면과 시퀀스를 직관적으로 이해시킬 대표적인 그림 설명
  transition: '', // 장면, 시퀀스의 전환점
  lensSpecs: '', // 렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식
  visualEffects: '', // 사용할 그래픽 툴, 넣어야하는 시각효과
  
  // 타임라인 분류
  type: 'generated_video', // 'generated_video' | 'live_action'
  estimatedDuration: '5분', // 예상 촬영 시간
  
  // 키워드 노드 (그래프 관계성)
  keywords: {
    userInfo: '', // 사용자 정보
    location: '', // 장소
    date: '', // 날짜
    equipment: '', // 장비
    cast: [], // 등장인물
    props: [], // 소품
    lighting: '', // 조명 설정
    weather: '', // 날씨 조건
    timeOfDay: '', // 시간대
    specialRequirements: [], // 특별 요구사항
  },
  
  // 스케줄링을 위한 상세 정보
  scheduling: {
    // 카메라 상세 정보
    camera: {
      model: '기본 카메라', // 카메라 모델
      lens: '기본 렌즈', // 렌즈 사양
      settings: '기본 설정', // 카메라 설정
      movement: '고정', // 카메라 워크
    },
    
    // 필요인력 상세 정보
    crew: {
      director: '감독',
      cinematographer: '촬영감독',
      cameraOperator: '카메라맨',
      lightingDirector: '조명감독',
      makeupArtist: '메이크업',
      costumeDesigner: '의상',
      soundEngineer: '음향감독',
      artDirector: '미술감독',
      additionalCrew: [], // 추가 인력
    },
    
    // 장비 상세 정보
    equipment: {
      cameras: [], // 카메라 목록
      lenses: [], // 렌즈 목록
      lighting: [], // 조명 장비
      audio: [], // 음향 장비
      grip: [], // 그립 장비
      special: [], // 특수 장비
    },
    
    // 촬영 설정
    shooting: {
      setupTime: 30, // 셋업 시간 (분)
      breakdownTime: 15, // 정리 시간 (분)
      complexity: '보통', // 복잡도
      specialNeeds: [], // 특별 요구사항
    },
  },
  
  // 그래프 가중치 (스케줄링용)
  weights: {
    locationPriority: 1, // 장소 우선순위
    equipmentPriority: 1, // 장비 우선순위
    castPriority: 1, // 배우 우선순위
    timePriority: 1, // 시간 우선순위
    complexity: 1, // 복잡도
  },
  
  // 편집 권한
  canEdit: true, // 편집 가능 여부
  lastModified: '', // 마지막 수정 시간
  modifiedBy: '', // 수정한 사용자
};

/**
 * 키워드 노드 타입 정의
 * 각 키워드는 노드의 형태로 저장되며 그래프로 관계성 표현
 */
export const KEYWORD_NODE_TYPES = {
  USER_INFO: 'userInfo',
  LOCATION: 'location',
  DATE: 'date',
  EQUIPMENT: 'equipment',
  CAST: 'cast',
  PROPS: 'props',
  LIGHTING: 'lighting',
  WEATHER: 'weather',
  TIME_OF_DAY: 'timeOfDay',
  SPECIAL_REQUIREMENTS: 'specialRequirements',
};

/**
 * 캡션 카드 타입별 분류
 */
export const CAPTION_CARD_TYPES = {
  GENERATED_VIDEO: 'generated_video', // 생성형 AI로 영상 생성 가능
  LIVE_ACTION: 'live_action', // 실사 촬영 필요
};

/**
 * 그래프 관계성 정의
 * 같은 키워드를 가진 캡션 카드들을 그룹화
 */
export const GRAPH_RELATIONSHIPS = {
  SAME_USER: 'sameUser', // 같은 사용자
  SAME_LOCATION: 'sameLocation', // 같은 장소
  SAME_DATE: 'sameDate', // 같은 날짜
  SAME_EQUIPMENT: 'sameEquipment', // 같은 장비
  SAME_CAST: 'sameCast', // 같은 배우
  SAME_TIME: 'sameTime', // 같은 시간대
};

/**
 * 스케줄링 가중치 계산 함수 (스케줄러와 동일한 우선순위 기반)
 * @param {Object} card - 캡션 카드
 * @returns {number} 가중치 점수
 */
export const calculateScheduleWeight = (card) => {
  // 각 요소별 우선순위 가중치 (장소 > 배우 > 시간 > 장비 > 복잡도)
  // codeStyle: 항상 주석 작성
  const { weights } = card;
  return (
    (weights.locationPriority || 0) * 1000 + // 장소 최우선
    (weights.castPriority || 0) * 500 +      // 배우
    (weights.timePriority || 0) * 200 +      // 시간대
    (weights.equipmentPriority || 0) * 100 + // 장비
    (weights.complexity || 0) * 50           // 복잡도
  );
};

/**
 * 캡션 카드 그룹화 함수
 * @param {Array} cards - 캡션 카드 배열
 * @param {string} relationship - 관계성 타입
 * @returns {Object} 그룹화된 카드들
 */
export const groupCaptionCards = (cards, relationship) => {
  const groups = {};
  
  cards.forEach(card => {
    let key = '';
    
    switch (relationship) {
    case GRAPH_RELATIONSHIPS.SAME_USER:
      key = card.keywords.userInfo;
      break;
    case GRAPH_RELATIONSHIPS.SAME_LOCATION:
      key = card.keywords.location;
      break;
    case GRAPH_RELATIONSHIPS.SAME_DATE:
      key = card.keywords.date;
      break;
    case GRAPH_RELATIONSHIPS.SAME_EQUIPMENT:
      key = card.keywords.equipment;
      break;
    case GRAPH_RELATIONSHIPS.SAME_CAST:
      key = card.keywords.cast.join(',');
      break;
    case GRAPH_RELATIONSHIPS.SAME_TIME:
      key = card.keywords.timeOfDay;
      break;
    default:
      key = 'unknown';
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(card);
  });
  
  return groups;
};

/**
 * 최적 스케줄 계산 함수
 * @param {Array} cards - 캡션 카드 배열
 * @returns {Object} 일일 촬영 스케줄과 브레이크다운
 */
export const calculateOptimalSchedule = (cards) => {
  // 가중치 기반 정렬
  const sortedCards = cards.sort((a, b) => 
    calculateScheduleWeight(b) - calculateScheduleWeight(a),
  );
  
  // 같은 장소, 같은 장비로 그룹화
  const locationGroups = groupCaptionCards(cards, GRAPH_RELATIONSHIPS.SAME_LOCATION);
  const equipmentGroups = groupCaptionCards(cards, GRAPH_RELATIONSHIPS.SAME_EQUIPMENT);
  
  // 일일 스케줄 생성
  const dailySchedule = {};
  const breakdown = {
    locations: new Set(),
    equipment: new Set(),
    cast: new Set(),
    props: new Set(),
    specialRequirements: new Set(),
  };
  
  sortedCards.forEach(card => {
    // 브레이크다운 정보 수집
    breakdown.locations.add(card.keywords.location);
    breakdown.equipment.add(card.keywords.equipment);
    card.keywords.cast.forEach(actor => breakdown.cast.add(actor));
    card.keywords.props.forEach(prop => breakdown.props.add(prop));
    card.keywords.specialRequirements.forEach(req => breakdown.specialRequirements.add(req));
    
    // 날짜별 스케줄 생성
    const date = card.keywords.date;
    if (!dailySchedule[date]) {
      dailySchedule[date] = [];
    }
    dailySchedule[date].push(card);
  });
  
  return {
    dailySchedule,
    breakdown: {
      locations: Array.from(breakdown.locations),
      equipment: Array.from(breakdown.equipment),
      cast: Array.from(breakdown.cast),
      props: Array.from(breakdown.props),
      specialRequirements: Array.from(breakdown.specialRequirements),
    },
  };
};

export default {
  CAPTION_CARD_STRUCTURE,
  KEYWORD_NODE_TYPES,
  CAPTION_CARD_TYPES,
  GRAPH_RELATIONSHIPS,
  calculateScheduleWeight,
  groupCaptionCards,
  calculateOptimalSchedule,
}; 