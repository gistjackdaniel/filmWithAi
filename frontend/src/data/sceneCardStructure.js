/**
 * 씬 카드 구조 데이터
 * 씬 카드에서 표시할 정보의 구조를 정의
 */

export const sceneCardStructure = {
  // 기본 정보
  basic: {
    title: {
      label: '제목',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    description: {
      label: '설명',
      type: 'textarea',
      required: true,
      maxLength: 500,
    },
    sceneNumber: {
      label: '씬 번호',
      type: 'number',
      required: true,
      min: 1,
    },
  },

  // 촬영 정보
  shooting: {
    location: {
      label: '장소',
      type: 'select',
      options: [
        '실내',
        '야외',
        '스튜디오',
        '로케이션',
        '기타',
      ],
      required: true,
    },
    timeOfDay: {
      label: '시간대',
      type: 'select',
      options: [
        '낮',
        '밤',
        '새벽',
        '황혼',
        '기타',
      ],
      required: true,
    },
    estimatedDuration: {
      label: '예상 시간 (분)',
      type: 'number',
      min: 1,
      max: 480,
    },
  },

  // 촬영 기술 정보
  technical: {
    shotType: {
      label: '촬영 타입',
      type: 'select',
      options: [
        '클로즈업',
        '미디엄 클로즈업',
        '미디엄 샷',
        '풀 샷',
        '와이드 샷',
        '익스트림 클로즈업',
        '익스트림 와이드 샷',
        '기타',
      ],
    },
    cameraAngle: {
      label: '카메라 앵글',
      type: 'select',
      options: [
        '정면',
        '측면',
        '로우앵글',
        '하이앵글',
        '버드아이뷰',
        '웜아이뷰',
        '기타',
      ],
    },
    cameraMovement: {
      label: '카메라 움직임',
      type: 'select',
      options: [
        '고정',
        '팬',
        '틸트',
        '줌 인',
        '줌 아웃',
        '돌리',
        '트래킹',
        '기타',
      ],
    },
  },

  // 등장 인물 및 소품
  elements: {
    characters: {
      label: '등장 인물',
      type: 'array',
      itemType: 'text',
      maxItems: 10,
    },
    props: {
      label: '소품',
      type: 'array',
      itemType: 'text',
      maxItems: 20,
    },
    equipment: {
      label: '장비',
      type: 'array',
      itemType: 'text',
      maxItems: 15,
    },
  },

  // 추가 정보
  additional: {
    notes: {
      label: '추가 노트',
      type: 'textarea',
      maxLength: 1000,
    },
    specialRequirements: {
      label: '특별 요구사항',
      type: 'textarea',
      maxLength: 500,
    },
    weather: {
      label: '날씨',
      type: 'select',
      options: [
        '맑음',
        '흐림',
        '비',
        '눈',
        '안개',
        '바람',
        '기타',
      ],
    },
  },
};

// 씬 카드 표시 순서
export const sceneCardDisplayOrder = [
  'basic',
  'shooting',
  'technical',
  'elements',
  'additional',
];

// 필수 필드 목록
export const requiredFields = [
  'title',
  'description',
  'sceneNumber',
  'location',
  'timeOfDay',
];

// 기본 씬 카드 데이터
export const defaultSceneCard = {
  title: '',
  description: '',
  sceneNumber: 1,
  location: '실내',
  timeOfDay: '낮',
  estimatedDuration: 5,
  shotType: '미디엄 샷',
  cameraAngle: '정면',
  cameraMovement: '고정',
  characters: [],
  props: [],
  equipment: [],
  notes: '',
  specialRequirements: '',
  weather: '맑음',
};

// 씬 카드 유효성 검사
export const validateSceneCard = (sceneCard) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!sceneCard[field] || sceneCard[field].toString().trim() === '') {
      errors.push(`${sceneCardStructure.basic[field]?.label || field}은(는) 필수입니다.`);
    }
  });
  
  if (sceneCard.estimatedDuration && (sceneCard.estimatedDuration < 1 || sceneCard.estimatedDuration > 480)) {
    errors.push('예상 시간은 1분에서 480분 사이여야 합니다.');
  }
  
  if (sceneCard.sceneNumber && sceneCard.sceneNumber < 1) {
    errors.push('씬 번호는 1 이상이어야 합니다.');
  }
  
  return errors;
};

// 씬 카드 정렬 함수
export const sortSceneCards = (sceneCards, sortBy = 'sceneNumber', order = 'asc') => {
  return [...sceneCards].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // 숫자 필드는 숫자로 변환
    if (['sceneNumber', 'estimatedDuration'].includes(sortBy)) {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export default {
  sceneCardStructure,
  sceneCardDisplayOrder,
  requiredFields,
  defaultSceneCard,
  validateSceneCard,
  sortSceneCards,
}; 