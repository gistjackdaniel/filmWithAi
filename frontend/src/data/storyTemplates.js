/**
 * 스토리 생성 템플릿 및 프리셋 데이터
 * 장르별 스토리 생성 프롬프트 템플릿과 사용자 정의 설정
 * PRD 2.1.2 AI 스토리 생성 기능의 템플릿 시스템
 */

/**
 * 장르별 기본 템플릿
 */
export const genreTemplates = {
  // 드라마 템플릿
  drama: {
    name: '드라마',
    description: '인간관계와 감정에 초점을 맞춘 스토리',
    prompt: `다음 시놉시스를 바탕으로 감정적이고 인간적인 드라마 스토리를 작성해주세요.

요구사항:
- 등장인물의 내적 갈등과 성장을 중심으로 구성
- 현실적이고 공감할 수 있는 상황 설정
- 감정의 기복과 극적 순간을 포함
- 인간관계의 복잡성과 화해의 가능성을 다룸
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 800,
      tone: '감정적',
      focus: '인간관계'
    }
  },

  // 액션 템플릿
  action: {
    name: '액션',
    description: '긴장감 넘치는 액션과 모험을 담은 스토리',
    prompt: `다음 시놉시스를 바탕으로 박진감 넘치는 액션 스토리를 작성해주세요.

요구사항:
- 긴장감 넘치는 액션 시퀀스 포함
- 명확한 목표와 장애물 설정
- 빠른 전개와 임팩트 있는 순간들
- 영웅의 용기와 결단력을 강조
- 시각적이고 역동적인 묘사
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 700,
      tone: '긴장감',
      focus: '액션'
    }
  },

  // 코미디 템플릿
  comedy: {
    name: '코미디',
    description: '유머와 재미를 담은 가벼운 스토리',
    prompt: `다음 시놉시스를 바탕으로 재미있고 유머러스한 코미디 스토리를 작성해주세요.

요구사항:
- 재미있고 예상치 못한 상황 전개
- 유머러스한 대화와 상황 설정
- 가벼운 톤으로 읽기 편하게 구성
- 웃음을 자아내는 캐릭터 설정
- 해피엔딩으로 마무리
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 600,
      tone: '유머러스',
      focus: '재미'
    }
  },

  // 로맨스 템플릿
  romance: {
    name: '로맨스',
    description: '사랑과 관계를 중심으로 한 감성적 스토리',
    prompt: `다음 시놉시스를 바탕으로 감성적이고 로맨틱한 스토리를 작성해주세요.

요구사항:
- 두 사람의 만남과 사랑의 발전 과정
- 감정적 깊이와 공감할 수 있는 상황
- 로맨틱한 순간들과 감동적인 결말
- 사랑의 어려움과 극복 과정
- 따뜻하고 감성적인 톤
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 750,
      tone: '감성적',
      focus: '사랑'
    }
  },

  // SF 템플릿
  scifi: {
    name: 'SF',
    description: '미래와 과학을 배경으로 한 상상력 풍부한 스토리',
    prompt: `다음 시놉시스를 바탕으로 상상력 풍부한 SF 스토리를 작성해주세요.

요구사항:
- 미래적이고 혁신적인 설정
- 과학적 요소와 인간적 감정의 조화
- 새로운 기술이나 세계관의 설명
- 인류의 미래와 가능성에 대한 탐구
- 시각적이고 임팩트 있는 묘사
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 900,
      tone: '상상력',
      focus: '미래'
    }
  },

  // 스릴러 템플릿
  thriller: {
    name: '스릴러',
    description: '긴장감과 미스터리를 담은 스토리',
    prompt: `다음 시놉시스를 바탕으로 긴장감 넘치는 스릴러 스토리를 작성해주세요.

요구사항:
- 미스터리와 서스펜스를 중심으로 구성
- 예상치 못한 반전과 긴장감
- 독자의 추리를 자극하는 요소들
- 긴박한 상황과 시간 압박
- 명확한 목표와 위험 요소
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 800,
      tone: '긴장감',
      focus: '미스터리'
    }
  },

  // 판타지 템플릿
  fantasy: {
    name: '판타지',
    description: '마법과 상상의 세계를 배경으로 한 스토리',
    prompt: `다음 시놉시스를 바탕으로 마법과 상상력이 가득한 판타지 스토리를 작성해주세요.

요구사항:
- 마법적 요소와 신비로운 세계관
- 영웅의 여정과 성장 스토리
- 상상력 풍부한 설정과 캐릭터
- 선과 악의 대립과 모험
- 시각적이고 임팩트 있는 묘사
- 최대 {maxLength}자로 작성

시놉시스: {synopsis}`,
    settings: {
      maxLength: 850,
      tone: '신비로움',
      focus: '모험'
    }
  }
}

/**
 * 스토리 길이 프리셋
 */
export const lengthPresets = {
  short: {
    name: '짧은 스토리',
    description: '간결하고 핵심적인 내용',
    maxLength: 300,
    estimatedTime: '1-2분'
  },
  medium: {
    name: '보통 스토리',
    description: '균형잡힌 길이의 스토리',
    maxLength: 600,
    estimatedTime: '3-4분'
  },
  long: {
    name: '긴 스토리',
    description: '상세하고 풍부한 내용',
    maxLength: 1000,
    estimatedTime: '5-7분'
  },
  epic: {
    name: '서사시',
    description: '매우 상세하고 긴 스토리',
    maxLength: 1500,
    estimatedTime: '8-10분'
  }
}

/**
 * 스토리 톤 프리셋
 */
export const tonePresets = {
  formal: {
    name: '격식있는',
    description: '정중하고 격식있는 어조',
    keywords: ['정중', '격식', '공식적']
  },
  casual: {
    name: '친근한',
    description: '편안하고 친근한 어조',
    keywords: ['친근', '편안', '일상적']
  },
  dramatic: {
    name: '극적인',
    description: '강렬하고 극적인 어조',
    keywords: ['강렬', '극적', '임팩트']
  },
  poetic: {
    name: '시적인',
    description: '아름답고 시적인 어조',
    keywords: ['아름다움', '시적', '감성적']
  },
  humorous: {
    name: '유머러스',
    description: '재미있고 유머러스한 어조',
    keywords: ['재미', '유머', '가벼운']
  }
}

/**
 * 사용자 정의 템플릿 저장소
 */
export const customTemplates = {
  // 로컬 스토리지에서 사용자 템플릿을 가져오는 함수
  get: () => {
    try {
      const saved = localStorage.getItem('custom-story-templates')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('사용자 템플릿 로드 실패:', error)
      return []
    }
  },

  // 사용자 템플릿을 저장하는 함수
  save: (templates) => {
    try {
      localStorage.setItem('custom-story-templates', JSON.stringify(templates))
      return true
    } catch (error) {
      console.error('사용자 템플릿 저장 실패:', error)
      return false
    }
  },

  // 새 템플릿 추가
  add: (template) => {
    const templates = customTemplates.get()
    const newTemplate = {
      id: `custom_${Date.now()}`,
      ...template,
      createdAt: new Date().toISOString()
    }
    templates.push(newTemplate)
    return customTemplates.save(templates)
  },

  // 템플릿 삭제
  remove: (templateId) => {
    const templates = customTemplates.get()
    const filtered = templates.filter(t => t.id !== templateId)
    return customTemplates.save(filtered)
  },

  // 템플릿 업데이트
  update: (templateId, updates) => {
    const templates = customTemplates.get()
    const updated = templates.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    )
    return customTemplates.save(updated)
  }
}

/**
 * 프롬프트 템플릿 렌더링 함수
 * @param {string} template - 템플릿 문자열
 * @param {Object} variables - 변수 객체
 * @returns {string} 렌더링된 프롬프트
 */
export const renderTemplate = (template, variables) => {
  let rendered = template
  
  // 변수 치환
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value)
  })
  
  return rendered
}

/**
 * 템플릿 추천 시스템
 * @param {string} synopsis - 시놉시스
 * @returns {Array} 추천 템플릿 목록
 */
export const getRecommendedTemplates = (synopsis) => {
  const recommendations = []
  const lowerSynopsis = synopsis.toLowerCase()
  
  // 키워드 기반 추천
  const keywordMap = {
    '사랑': 'romance',
    '로맨스': 'romance',
    '연애': 'romance',
    '액션': 'action',
    '싸움': 'action',
    '전투': 'action',
    '웃음': 'comedy',
    '재미': 'comedy',
    '유머': 'comedy',
    '드라마': 'drama',
    '감정': 'drama',
    '미래': 'scifi',
    '과학': 'scifi',
    '우주': 'scifi',
    '미스터리': 'thriller',
    '범죄': 'thriller',
    '추리': 'thriller',
    '마법': 'fantasy',
    '판타지': 'fantasy',
    '모험': 'fantasy'
  }
  
  Object.entries(keywordMap).forEach(([keyword, genre]) => {
    if (lowerSynopsis.includes(keyword)) {
      recommendations.push(genreTemplates[genre])
    }
  })
  
  // 중복 제거
  return [...new Set(recommendations)]
}

export default {
  genreTemplates,
  lengthPresets,
  tonePresets,
  customTemplates,
  renderTemplate,
  getRecommendedTemplates
} 