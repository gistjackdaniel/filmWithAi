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

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

시놉시스: {synopsis}`,
    settings: {
      maxLength: 800,
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

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

시놉시스: {synopsis}`,
    settings: {
      maxLength: 700,
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

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

시놉시스: {synopsis}`,
    settings: {
      maxLength: 600,
      focus: '재미'
    }
  },

  // 로맨스 템플릿
  romance: {
    name: '로맨스',
    description: '사랑과 관계를 중심으로 한 감성적 스토리',
    prompt: `다음 시놉시스를 바탕으로 감성적이고 로맨틱한 스토리를 작성해주세요.

요구사항:
- 사랑과 관계의 복잡성과 아름다움을 다룸
- 감성적이고 공감할 수 있는 상황 설정
- 로맨틱한 순간과 갈등의 균형
- 캐릭터의 감정적 성장을 포함
- 따뜻하고 희망적인 메시지
- 최대 {maxLength}자로 작성

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

시놉시스: {synopsis}`,
    settings: {
      maxLength: 750,
      focus: '사랑'
    }
  },

  // 스릴러 템플릿
  thriller: {
    name: '스릴러',
    description: '긴장감과 서스펜스를 담은 스토리',
    prompt: `다음 시놉시스를 바탕으로 긴장감 넘치는 스릴러 스토리를 작성해주세요.

요구사항:
- 긴장감과 서스펜스를 유지하는 구성
- 예상치 못한 반전과 임팩트
- 독자의 추리를 자극하는 요소들
- 강렬한 클라이맥스와 해결
- 시각적이고 임팩트 있는 묘사
- 최대 {maxLength}자로 작성

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

시놉시스: {synopsis}`,
    settings: {
      maxLength: 800,
      focus: '긴장감'
    }
  },

  // 판타지 템플릿
  fantasy: {
    name: '판타지',
    description: '상상력과 마법을 담은 환상적 스토리',
    prompt: `다음 시놉시스를 바탕으로 상상력 넘치는 판타지 스토리를 작성해주세요.

요구사항:
- 독창적이고 신비로운 세계관 설정
- 마법과 초자연적 요소들의 자연스러운 통합
- 영웅의 여정과 성장을 포함
- 시각적이고 몰입감 있는 묘사
- 희망과 모험의 메시지
- 최대 {maxLength}자로 작성

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

시놉시스: {synopsis}`,
    settings: {
      maxLength: 850,
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
      t.id === templateId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    )
    return customTemplates.save(updated)
  }
}

/**
 * 템플릿 렌더링 함수
 * 변수를 템플릿에 적용
 */
export const renderTemplate = (template, variables) => {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g')
    result = result.replace(regex, value || '')
  })
  
  return result
}

/**
 * 시놉시스 기반 추천 템플릿
 */
export const getRecommendedTemplates = (synopsis) => {
  const recommendations = []
  
  if (!synopsis) return recommendations
  
  const lowerSynopsis = synopsis.toLowerCase()
  
  // 키워드 기반 추천
  if (lowerSynopsis.includes('사랑') || lowerSynopsis.includes('연애') || lowerSynopsis.includes('로맨스')) {
    recommendations.push('romance')
  }
  
  if (lowerSynopsis.includes('액션') || lowerSynopsis.includes('싸움') || lowerSynopsis.includes('전투')) {
    recommendations.push('action')
  }
  
  if (lowerSynopsis.includes('웃음') || lowerSynopsis.includes('재미') || lowerSynopsis.includes('코미디')) {
    recommendations.push('comedy')
  }
  
  if (lowerSynopsis.includes('긴장') || lowerSynopsis.includes('스릴') || lowerSynopsis.includes('미스터리')) {
    recommendations.push('thriller')
  }
  
  if (lowerSynopsis.includes('판타지') || lowerSynopsis.includes('마법') || lowerSynopsis.includes('환상')) {
    recommendations.push('fantasy')
    }
  
  // 기본 추천
  if (recommendations.length === 0) {
    recommendations.push('drama')
  }
  
  return recommendations
} 