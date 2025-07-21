/**
 * 스케줄러 서비스
 * 콘티 데이터를 바탕으로 최적의 촬영 스케줄을 생성하는 서비스
 * PRD 스케줄러 기능의 핵심 로직
 */

import api from './api'

/**
 * 콘티 데이터를 바탕으로 최적의 촬영 스케줄 생성 (새로운 알고리즘)
 * @param {Array} conteData - 콘티 데이터 배열
 * @returns {Object} 최적화된 스케줄 데이터
 */
export const generateOptimalSchedule = async (conteData) => {
  try {
    if (!conteData || !Array.isArray(conteData) || conteData.length === 0) {
      return { 
        days: [], 
        totalDays: 0,
        totalScenes: 0,
        estimatedTotalDuration: 0,
        message: '콘티 데이터가 없습니다.'
      }
    }
    
    const liveActionConte = conteData.filter(conte => 
      conte.type === 'live_action' || 
      conte.type === 'LIVE_ACTION' || 
      conte.type === '실사 촬영용'
    )
    
    if (liveActionConte.length === 0) {
      return { 
        days: [], 
        totalDays: 0,
        totalScenes: 0,
        estimatedTotalDuration: 0,
        message: '실사 촬영용 콘티가 없습니다.'
      }
    }
    
    // 새로운 스케줄링 알고리즘 적용
    const newSchedule = await generateNewSchedule(liveActionConte)
    
    return newSchedule
  } catch (error) {
    console.error('❌ 스케줄 생성 중 오류:', error)
    throw new Error('스케줄 생성에 실패했습니다.')
  }
}

/**
 * 장소별 그룹화
 * @param {Array} conteData - 콘티 데이터
 * @returns {Object} 장소별 그룹화된 데이터
 */
const groupByLocation = (conteData) => {
  const groups = {}
  
  conteData.forEach(conte => {
    // 콘티에서 장소 정보 추출 (description에서 추출하거나 기본값 사용)
    const location = extractLocationFromConte(conte) || '미정'
    
    if (!groups[location]) {
      groups[location] = []
    }
    groups[location].push(conte)
  })
  
  return groups
}

/**
 * 콘티에서 장소 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {string} 추출된 장소 정보 (반드시 keywords.location 기반)
 */
const extractLocationFromConte = (conte) => {
  // 반드시 keywords.location만 사용 (description fallback 제거)
  if (conte.keywords && conte.keywords.location && conte.keywords.location !== '기본 장소') {
    return conte.keywords.location
  }
  // 정보가 없으면 '미정' 반환
  return '미정'
}

/**
 * 장비별 그룹화 (개선된 버전)
 * @param {Array} conteData - 콘티 데이터
 * @returns {Object} 장비별 그룹화된 데이터
 */
const groupByEquipment = (conteData) => {
  const groups = {}
  
  conteData.forEach(conte => {
    // 콘티에서 장비 정보 추출 (배열로 반환됨)
    const equipmentList = extractEquipmentFromConte(conte)
    
    // 각 장비별로 그룹화
    equipmentList.forEach(equipment => {
      if (!groups[equipment]) {
        groups[equipment] = []
      }
      // 중복 방지
      if (!groups[equipment].find(c => c.id === conte.id)) {
        groups[equipment].push(conte)
      }
    })
  })
  
  return groups
}







/**
 * 장소별 씬 그룹화
 * @param {Array} scenes - 씬 배열
 * @returns {Object} 장소별 그룹 객체
 */
const groupScenesByLocation = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const location = extractLocationFromConte(scene)
    if (!groups[location]) {
      groups[location] = []
    }
    groups[location].push(scene)
  })
  
  return groups
}

/**
 * 배우별 씬 그룹화
 * @param {Array} scenes - 씬 배열
 * @returns {Object} 배우별 그룹 객체
 */
const groupScenesByActors = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const actors = extractActorsFromConte(scene)
    actors.forEach(actor => {
      if (!groups[actor]) {
        groups[actor] = []
      }
      groups[actor].push(scene)
    })
  })
  
  return groups
}

/**
 * 시간대별 씬 그룹화
 * @param {Array} scenes - 씬 배열
 * @returns {Object} 시간대별 그룹 객체
 */
const groupScenesByTimeSlot = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const timeSlot = extractTimeSlotFromConte(scene)
    
    if (!groups[timeSlot]) {
      groups[timeSlot] = []
    }
    groups[timeSlot].push(scene)
  })
  
  return groups
}

/**
 * 장비별 씬 그룹화
 * @param {Array} scenes - 씬 배열
 * @returns {Object} 장비별 그룹 객체
 */
const groupScenesByEquipment = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const equipment = extractEquipmentFromConte(scene)
    if (!groups[equipment]) {
      groups[equipment] = []
    }
    groups[equipment].push(scene)
  })
  
  return groups
}

/**
 * 그룹 순서 결정 (우선순위 기반)
 * @param {Object} locationGroups - 장소별 그룹
 * @param {Object} actorGroups - 배우별 그룹
 * @param {Object} timeSlotGroups - 시간대별 그룹
 * @param {Object} equipmentGroups - 장비별 그룹
 * @returns {Array} 최적화된 그룹 순서
 */
const determineGroupOrder = (locationGroups, actorGroups, timeSlotGroups, equipmentGroups) => {
  const groupOrder = []
  
  // 1. 장소별 그룹 (최우선) - 가장 많은 씬이 있는 장소부터
  const locationEntries = Object.entries(locationGroups)
    .sort(([,a], [,b]) => b.length - a.length)
    .map(([location]) => ({ type: 'location', key: location, priority: 1 }))
  
  // 2. 배우별 그룹 (두 번째 우선순위) - 가장 많은 씬이 있는 배우부터
  const actorEntries = Object.entries(actorGroups)
    .sort(([,a], [,b]) => b.length - a.length)
    .map(([actor]) => ({ type: 'actor', key: actor, priority: 2 }))
  
  // 3. 시간대별 그룹 (세 번째 우선순위) - 가장 많은 씬이 있는 시간대부터
  const timeSlotEntries = Object.entries(timeSlotGroups)
    .filter(([timeSlot]) => timeSlot !== '미정')
    .sort(([,a], [,b]) => b.length - a.length)
    .map(([timeSlot]) => ({ type: 'timeSlot', key: timeSlot, priority: 3 }))
  
  // 4. 장비별 그룹 (네 번째 우선순위) - 가장 많은 씬이 있는 장비부터
  const equipmentEntries = Object.entries(equipmentGroups)
    .sort(([,a], [,b]) => b.length - a.length)
    .map(([equipment]) => ({ type: 'equipment', key: equipment, priority: 4 }))
  
  // 우선순위에 따라 정렬
  const allGroups = [...locationEntries, ...actorEntries, ...timeSlotEntries, ...equipmentEntries]
    .sort((a, b) => a.priority - b.priority)
  
  // 그룹 키만 반환
  return allGroups.map(group => group.key)
}

/**
 * 그룹 내 씬 순서 최적화
 * @param {Array} groupScenes - 그룹 내 씬들
 * @param {Array} currentOrder - 현재까지의 순서
 * @returns {Array} 최적화된 그룹 내 순서
 */
const optimizeGroupOrder = (groupScenes, currentOrder) => {
  if (groupScenes.length <= 1) {
    return groupScenes
  }
  
  // 그룹 내에서 최적 순서 찾기
  const optimizedGroupOrder = []
  const usedInGroup = new Set()
  
  while (optimizedGroupOrder.length < groupScenes.length) {
    let bestScene = null
    let bestScore = -1
    
    for (const scene of groupScenes) {
      if (usedInGroup.has(scene.id)) continue
      
      // 현재 그룹 순서에 씬을 추가했을 때의 점수 계산
      const score = calculateGroupCombinationScore([...optimizedGroupOrder, scene], currentOrder)
      
      if (score > bestScore) {
        bestScore = score
        bestScene = scene
      }
    }
    
    if (bestScene) {
      optimizedGroupOrder.push(bestScene)
      usedInGroup.add(bestScene.id)
    }
  }
  
  return optimizedGroupOrder
}

/**
 * 그룹 조합 점수 계산
 * @param {Array} groupScenes - 그룹 내 씬들
 * @param {Array} currentOrder - 현재까지의 전체 순서
 * @returns {number} 조합 점수
 */
const calculateGroupCombinationScore = (groupScenes, currentOrder) => {
  if (groupScenes.length === 0) return 0
  
  let score = 0
  
  // 그룹 내 연속성 보너스
  for (let i = 1; i < groupScenes.length; i++) {
    score += 100 // 같은 그룹 내 연속 보너스
  }
  
  // 전체 순서와의 조합 점수
  const combinedOrder = [...currentOrder, ...groupScenes]
  score += calculateCombinationScore(combinedOrder)
  
  return score
}

/**
 * 씬 조합의 점수 계산 (우선순위 기반)
 * @param {Array} scenes - 씬 배열
 * @returns {number} 조합 점수
 */
const calculateCombinationScore = (scenes) => {
  if (scenes.length === 0) return 0
  
  let score = 0
  
  // 1. 같은 장소의 씬들이 연속되면 최우선 보너스 점수
  for (let i = 1; i < scenes.length; i++) {
    const prevLocation = extractLocationFromConte(scenes[i-1])
    const currLocation = extractLocationFromConte(scenes[i])
    
    if (prevLocation === currLocation) {
      score += 1000 // 최우선 보너스 (같은 장소)
    }
  }
  
  // 2. 같은 배우의 씬들이 연속되면 두 번째 우선순위 보너스
  for (let i = 1; i < scenes.length; i++) {
    if (hasSameActors(scenes[i-1], scenes[i])) {
      score += 500 // 두 번째 우선순위 보너스 (같은 배우)
    }
  }
  
  // 3. 같은 시간대의 씬들이 연속되면 세 번째 우선순위 보너스
  for (let i = 1; i < scenes.length; i++) {
    const prevTimeSlot = extractTimeSlotFromConte(scenes[i-1])
    const currTimeSlot = extractTimeSlotFromConte(scenes[i])
    
    if (prevTimeSlot === currTimeSlot && prevTimeSlot !== '미정') {
      score += 200 // 세 번째 우선순위 보너스 (같은 시간대)
    }
  }
  
  // 4. 같은 장비의 씬들이 연속되면 네 번째 우선순위 보너스
  for (let i = 1; i < scenes.length; i++) {
    const prevEquipment = extractEquipmentFromConte(scenes[i-1])
    const currEquipment = extractEquipmentFromConte(scenes[i])
    
    if (prevEquipment === currEquipment) {
      score += 100 // 네 번째 우선순위 보너스 (같은 장비)
    }
  }
  
  // 5. 복잡도 보너스 (긴 씬들이 연속되면 보너스)
  for (let i = 1; i < scenes.length; i++) {
    const prevDuration = scenes[i-1].estimatedDuration || 5
    const currDuration = scenes[i].estimatedDuration || 5
    
    if (prevDuration >= 8 && currDuration >= 8) {
      score += 50 // 복잡한 씬 연속 보너스
    }
  }
  
  // 전체 가중치 합계
  score += scenes.reduce((total, scene) => total + (scene.weight || 0), 0)
  
  return score
}

/**
 * 최적화된 씬들을 일정으로 배치 (시간대별 정확한 촬영시간 반영)
 * @param {Array} optimizedScenes - 최적화된 씬 배열
 * @returns {Array} 일정 배열
 */
const createScheduleFromOptimizedScenes = (optimizedScenes) => {
  // 1. 시간대별로 씬들을 그룹화
  const timeSlotGroups = groupScenesByTimeSlot(optimizedScenes)
  
  // 2. 장소별로 그룹화하고, 각 장소 내에서 시간대별로 정렬
  const locationGroups = {}
  
  for (const scene of optimizedScenes) {
    const location = extractLocationFromConte(scene)
    if (!locationGroups[location]) {
      locationGroups[location] = []
    }
    locationGroups[location].push(scene)
  }
  
  // 3. 각 장소 내에서 시간대별로 정렬
  const locationTimeSlotOptimizedScenes = []
  
  for (const [location, scenes] of Object.entries(locationGroups)) {
    
    // 장소 내 씬들을 시간대별로 그룹화
    const timeSlotGroupsInLocation = groupScenesByTimeSlot(scenes)
    
    // 시간대 순서 정의 (낮 → 밤)
    const timeSlotOrder = ['낮', '밤']
    
    // 정의된 순서대로 씬들을 추가
    for (const timeSlot of timeSlotOrder) {
      if (timeSlotGroupsInLocation[timeSlot]) {
        // 시간대별 최적화 실행 (실제 시간 계산 포함) - 같은 장소의 모든 씬들을 전달
        const optimizedScenesForTimeSlot = optimizeScenesByTimeSlot(timeSlotGroupsInLocation[timeSlot], timeSlot, scenes)
        
            // realLocationId 보존하여 결과 배열에 추가
    const optimizedScenesWithRealLocation = optimizedScenesForTimeSlot.map(scene => ({
      ...scene,
      realLocationId: scene.realLocationId
    }));
        
        // 최적화된 씬들을 결과 배열에 추가
        locationTimeSlotOptimizedScenes.push(...optimizedScenesWithRealLocation)
      }
    }
    
    // 미정 시간대 씬들은 마지막에 추가 (최적화 없이)
    if (timeSlotGroupsInLocation['미정']) {
      // 미정 시간대 씬들도 기본 시간 정보 추가
      const undefinedTimeScenes = timeSlotGroupsInLocation['미정'].map(scene => ({
        ...scene,
        timeSlot: '미정',
        actualShootingDuration: getSafeDuration(scene),
        sceneStartTime: '10:00', // 기본 시작 시간
        sceneEndTime: addMinutesToTime('10:00', getSafeDuration(scene)),
        timeSlotDisplay: `미정 (10:00 ~ ${addMinutesToTime('10:00', getSafeDuration(scene))})`,
        realLocationId: scene.realLocationId // realLocationId 보존
      }))
      
      locationTimeSlotOptimizedScenes.push(...undefinedTimeScenes)
    }
  }
  

  
  // 4. 시간대별로 최적화된 씬들을 일정으로 배치 (정확한 촬영시간 반영)
  const days = []
  let currentDay = 1
  let currentDayScenes = []
  let currentDayDuration = 0
  let currentDayLocation = null
  let currentDayTimeSlot = null
  
  // 하루 최대 촬영 시간 (8시간 = 480분)
  const MAX_DAILY_DURATION = 480
  // 씬 간 휴식 시간 (1시간 = 60분)
  const SCENE_BREAK_TIME = 60
  
  for (let i = 0; i < locationTimeSlotOptimizedScenes.length; i++) {
    const scene = locationTimeSlotOptimizedScenes[i]
    const sceneDuration = scene.actualShootingDuration || getSafeDuration(scene)
    const sceneLocation = extractLocationFromConte(scene)
    const sceneTimeSlot = extractTimeSlotFromConte(scene)
    
    // 하루에 배치할 수 없는 경우(시간 부족) 다음 날로 넘김
    const wouldExceed = (currentDayDuration + sceneDuration + (currentDayScenes.length > 0 ? SCENE_BREAK_TIME : 0)) > MAX_DAILY_DURATION;
    const needsNewDay = (
      currentDayScenes.length === 0 || // 첫 번째 씬
      currentDayLocation !== sceneLocation || // 다른 장소 (최우선 조건)
      wouldExceed || // 시간 초과
      currentDayScenes.length >= 6 // 하루 최대 6개 씬
    );

    if (needsNewDay && currentDayScenes.length > 0) {
      // 현재 날짜 완료하고 새 날짜 시작
      days.push(createDaySchedule(
        currentDay,
        currentDayScenes,
        currentDayDuration,
        currentDayLocation,
        currentDayTimeSlot
      ))
      currentDay++
      currentDayScenes = []
      currentDayDuration = 0
      currentDayLocation = null
      currentDayTimeSlot = null
    }

    // 만약 시간 부족(wouldExceed)로 인해 새 날이 시작된 경우, 이 씬을 바로 다음 날의 첫 씬으로 배치
    // (즉, 현재 씬을 건너뛰지 않고 반드시 다음 날에 추가)
    if (wouldExceed && currentDayScenes.length === 0) {
      // 새 날의 첫 씬으로 추가
      currentDayScenes.push(scene)
      currentDayDuration += sceneDuration
      currentDayLocation = sceneLocation
      currentDayTimeSlot = sceneTimeSlot
      continue;
    }

    // 씬을 현재 날짜에 추가
    currentDayScenes.push(scene)
    currentDayDuration += sceneDuration + (currentDayScenes.length > 1 ? SCENE_BREAK_TIME : 0)
    currentDayLocation = sceneLocation
    currentDayTimeSlot = sceneTimeSlot
  }
  
  // 마지막 날짜 추가
  if (currentDayScenes.length > 0) {
    days.push(createDaySchedule(
      currentDay,
      currentDayScenes,
      currentDayDuration,
      currentDayLocation,
      currentDayTimeSlot
    ))
  }
  
  return days
}

/**
 * 일일 스케줄 생성 (장소별로 분리, 시간대 정보 포함)
 * @param {number} dayNumber - 일차
 * @param {Array} scenes - 해당 장소의 씬 배열
 * @param {number} duration - 총 시간
 * @param {string} location - 촬영 장소명
 * @param {string} timeSlot - 시간대 정보
 * @returns {Object} (DAY, 장소, 시간대)별 스케줄 row
 */
const createDaySchedule = (dayNumber, scenes, duration, location, timeSlot = null) => {
  // 시간대별 시간 범위 설정
  const timeRange = timeSlot ? getTimeSlotRange(timeSlot) : null
  
  // 각 씬에 상세 정보 추가
  const scenesWithDetails = scenes.map(scene => ({
    ...scene,
    // realLocationId 명시적으로 보존
    realLocationId: scene.realLocationId,
    // 상세 카메라 정보 추가
    cameraDetails: extractCameraFromConte(scene),
    // 상세 인력 정보 추가
    crewDetails: extractCrewFromConte(scene),
    // 상세 장비 정보 추가
    equipmentDetails: extractEquipmentFromConte(scene)
  }));
  
  // 스케줄 row 반환
  return {
    day: dayNumber,
    date: `Day ${dayNumber}`,
    location: location,
    timeSlot: timeSlot,
    timeRange: timeRange,
    scenes: scenesWithDetails, // 상세 정보가 포함된 씬들
    totalScenes: scenes.length,
    estimatedDuration: duration,
    crew: getRequiredCrew(scenes),
    equipment: getRequiredEquipment(scenes),
    timeSlots: generateTimeSlots(scenes),

  }
}





/**
 * 가장 많이 사용된 장소 찾기
 * @param {Array} scenes - 씬 배열
 * @returns {string} 가장 많이 사용된 장소
 */
const getMostCommonLocation = (scenes) => {
  const locationCount = {}
  
  scenes.forEach(scene => {
    const location = extractLocationFromConte(scene)
    locationCount[location] = (locationCount[location] || 0) + 1
  })
  
  return Object.entries(locationCount)
    .sort(([,a], [,b]) => b - a)[0][0]
}



/**
 * 전체 스케줄의 최적화 점수 계산
 * @param {Array} days - 일정 배열
 * @returns {number} 전체 최적화 점수
 */
const calculateOptimizationScore = (days) => {
  const totalScore = days.reduce((total, day) => total + (day.optimizationScore || 0), 0)
  const averageScore = totalScore / days.length
  
  // 효율성 계산 개선: 단일 씬과 다중 씬을 구분하여 계산
  let efficiency = 0
  
  if (days.length === 1 && days[0].scenes && days[0].scenes.length === 1) {
    // 단일 씬인 경우: 기본 효율성 60% + 추가 보너스
    const singleScene = days[0].scenes[0]
    const duration = singleScene.estimatedDuration || 5
    
    // 촬영 시간에 따른 효율성 조정
    if (duration >= 30 && duration <= 60) {
      efficiency = 70 // 적절한 촬영 시간
    } else if (duration > 60) {
      efficiency = 80 // 긴 촬영 시간 (집중 촬영)
    } else {
      efficiency = 60 // 짧은 촬영 시간
    }
  } else {
    // 다중 씬인 경우: 기존 계산 방식 사용
    const maxPossibleScore = 2000 // 최대 가능한 점수
    efficiency = Math.min(100, Math.round((averageScore / maxPossibleScore) * 100))
  }
  
  return {
    total: totalScore,
    average: averageScore,
    efficiency: efficiency // 개선된 효율성 백분율
  }
}

/**
 * 배열을 청크로 분할
 * @param {Array} array - 분할할 배열
 * @param {number} chunkSize - 청크 크기
 * @returns {Array} 분할된 배열들
 */
const chunkArray = (array, chunkSize) => {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * 필요한 인력 계산
 * @param {Array} scenes - 씬 배열
 * @returns {Array} 필요한 인력 리스트
 */
const getRequiredCrew = (scenes) => {
  const crew = new Set(['감독', '촬영감독', '카메라맨'])
  
  scenes.forEach(scene => {
    const description = scene.description || ''
    
    // 인력 키워드들
    const crewKeywords = [
      '배우', '엑스트라', '스턴트', '메이크업', '의상', '소품',
      'actor', 'extra', 'stunt', 'makeup', 'costume', 'prop'
    ]
    
    crewKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        crew.add(keyword)
      }
    })
  })
  
  return Array.from(crew)
}

/**
 * 필요한 장비 계산
 * @param {Array} scenes - 씬 배열
 * @returns {Array} 필요한 장비 리스트
 */
const getRequiredEquipment = (scenes) => {
  const equipment = new Set(['카메라', '조명', '마이크'])
  
  scenes.forEach(scene => {
    const description = scene.description || ''
    
    // 장비 키워드들
    const equipmentKeywords = [
      '크레인', '돌리', '스테디캠', '그린스크린', '스탠드',
      'crane', 'dolly', 'steadicam', 'greenscreen', 'stand'
    ]
    
    equipmentKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        equipment.add(keyword)
      }
    })
  })
  
  return Array.from(equipment)
}

/**
 * 안전한 촬영 시간 계산 (실제 촬영 시간 고려)
 * @param {Object} scene - 씬 객체
 * @returns {number} 실제 촬영 시간 (분)
 */
function getSafeDuration(scene) {
  // estimatedDuration이 '3분', '4분' 등 문자열일 수 있으므로 숫자만 추출
  let raw = scene.estimatedDuration;
  if (typeof raw === 'string') {
    // 정규표현식으로 숫자만 추출
    const match = raw.match(/\d+/);
    raw = match ? Number(match[0]) : NaN;
  }
  const num = Number(raw);
  // 기본값: 5분
  if (isNaN(num) || num <= 0) return 5;
  // 실제 촬영 시간 계산 (분량 시간의 60배) - 현실적인 촬영 비율
  const contentDuration = num; // 분량 시간
  const shootingRatio = 60; // 60배 (1분 씬 → 1시간 촬영)
  const actualDuration = Math.round(contentDuration * shootingRatio);
  // 실제 계산된 촬영시간 반환 (제한 없음 - 스케줄러에서 자동 처리)
  return actualDuration;
}

/**
 * 시간대별 실제 촬영 시간 설정 (낮/밤으로 단순화)
 * @param {string} timeOfDay - 시간대 (낮, 밤)
 * @returns {Object} 시작 시간과 종료 시간
 */
const getTimeSlotRange = (timeOfDay, totalDayScenes = null, isLateStart = false) => {
  // 낮 씬을 늦은 낮부터 시작해야 하는 경우(같은 장소에 밤 씬이 있는 경우)
  if ((timeOfDay === '낮' || timeOfDay === 'day') && isLateStart && totalDayScenes && totalDayScenes.length > 0) {
    // 낮 씬 총 소요시간 계산
    const totalDuration = totalDayScenes.reduce((sum, scene) => sum + getSafeDuration(scene) + 60, -60); // 씬 간 휴식 포함, 첫 씬은 휴식 없음
    // 밤 씬 시작 가능 시간(18:00)에서 낮 씬 총 소요시간을 역산 + 두시간 쉬는시간간
    let lateStartHour = 18 * 60 - totalDuration - 60;
    if (lateStartHour < 7 * 60) lateStartHour = 7 * 60; // 최소 07:00 이후
    const lateStart = `${String(Math.floor(lateStartHour / 60)).padStart(2, '0')}:${String(lateStartHour % 60).padStart(2, '0')}`;
    return {
      start: '07:00',
      end: '17:00',
      label: `낮 (07:00-17:00, 늦은 시작: ${lateStart})`,
      availableMinutes: 600,
      optimalStartTime: lateStart,
      optimalEndTime: '17:00'
    };
  }
  switch (timeOfDay) {
    case '낮':
    case '오전':
    case '오후':
    case 'day':
    case 'morning':
    case 'afternoon':
      return { 
        start: '06:00', 
        end: '18:00', 
        label: '낮 (06:00-18:00)',
        availableMinutes: 720, // 12시간 = 720분
        optimalStartTime: '06:00',
        optimalEndTime: '18:00'
      }
    case '밤':
    case '저녁':
    case '새벽':
    case 'night':
    case 'evening':
    case 'dawn':
      return { 
        start: '18:00', 
        end: '06:00', 
        label: '밤 (18:00-06:00)',
        availableMinutes: 720, // 12시간 = 720분 (다음날 06:00까지)
        optimalStartTime: '18:00',
        optimalEndTime: '06:00'
      }
    default:
      return { 
        start: '06:00', 
        end: '18:00', 
        label: '낮 (06:00-18:00)',
        availableMinutes: 720, // 12시간 = 720분
        optimalStartTime: '06:00',
        optimalEndTime: '18:00'
      }
  }
}

/**
 * 시간대별 촬영 시간 최적화 (실제 촬영시간 정확히 반영)
 * @param {Array} scenes - 같은 시간대의 씬들
 * @param {string} timeOfDay - 시간대
 * @returns {Array} 시간대별로 최적화된 씬 순서
 */
const optimizeScenesByTimeSlot = (scenes, timeOfDay, allScenesInLocation = null) => {
  // 같은 장소에 밤 씬이 있는지 확인
  let isLateStart = false;
  if ((timeOfDay === '낮' || timeOfDay === 'day') && allScenesInLocation) {
    isLateStart = allScenesInLocation.some(s => {
      const t = extractTimeSlotFromConte(s);
      return t === '밤' || t === 'night';
    });
  }
  
  // 낮 씬이면서 밤 씬이 같은 장소에 있으면 늦은 낮부터 시작
  const timeRange = getTimeSlotRange(timeOfDay, scenes, isLateStart);

  
  // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
  const availableMinutes = timeRange.availableMinutes
  
  if (scenes.length <= 1) {
    const optimizedScenes = scenes.map(scene => {
      const sceneDuration = getSafeDuration(scene)
      const sceneStartTime = timeRange.optimalStartTime
      const sceneEndTime = addMinutesToTime(sceneStartTime, sceneDuration)
      
      return {
        ...scene,
        timeSlot: timeOfDay,
        timeRange: timeRange,
        actualShootingDuration: sceneDuration,
        sceneStartTime: sceneStartTime,
        sceneEndTime: sceneEndTime,
        breakTime: 0, // 단일 씬은 휴식시간 없음
        totalTimeSlot: sceneDuration,
        // 정확한 시간대 표시를 위한 추가 정보 (우선순위 높음)
        timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`,
        virtualLocationId: scene.virtualLocationId // virtualLocationId 보존
      }
    })
    
    return optimizedScenes
  }
  
  // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
  
  // 씬들을 실제 촬영시간 순으로 정렬 (긴 씬부터)
  const sortedScenes = [...scenes].sort((a, b) => {
    const durationA = getSafeDuration(a)
    const durationB = getSafeDuration(b)
    return durationB - durationA
  })
  
  // 시간대 내에서 최적 배치 (실제 촬영시간 고려)
  const optimizedScenes = []
  let remainingMinutes = availableMinutes
  let currentTime = timeRange.optimalStartTime
  
  for (const scene of sortedScenes) {
    const sceneDuration = getSafeDuration(scene)
    const sceneBreakTime = 60 // 씬 간 휴식 시간 (1시간 = 60분)
    const totalSceneTime = sceneDuration + sceneBreakTime
    
    if (totalSceneTime <= remainingMinutes) {
      // 씬 배치 가능
      const sceneStartTime = currentTime
      const sceneEndTime = addMinutesToTime(currentTime, sceneDuration)
      
      optimizedScenes.push({
        ...scene,
        timeSlot: timeOfDay,
        timeRange: timeRange,
        actualShootingDuration: sceneDuration,
        sceneStartTime: sceneStartTime,
        sceneEndTime: sceneEndTime,
        breakTime: sceneBreakTime,
        totalTimeSlot: totalSceneTime,
        // 정확한 시간대 표시를 위한 추가 정보 (우선순위 높음)
        timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`,
        realLocationId: scene.realLocationId // realLocationId 보존
      })
      
      remainingMinutes -= totalSceneTime
      currentTime = addMinutesToTime(sceneEndTime, sceneBreakTime)
    }
  }
  
  return optimizedScenes
}

/**
 * 시간에 분을 더하는 함수
 * @param {string} time - 시간 (HH:MM)
 * @param {number} minutes - 더할 분
 * @returns {string} 결과 시간 (HH:MM)
 */
const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number)
  let totalMinutes = hours * 60 + mins + minutes
  
  // 24시간을 넘어가는 경우 처리
  if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60
  }
  
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

/**
 * 시간대별 슬롯 생성 (실제 촬영시간 기준, 정확한 시간 계산)
 * @param {Array} scenes - 씬 배열
 * @returns {Array} 시간대별 슬롯
 */
const generateTimeSlots = (scenes) => {
  const timeSlots = []
  let currentTime = '09:00' // 기본 시작 시간 (오전 9시)
  
  scenes.forEach((scene, idx) => {
    // 실제 촬영시간 사용
    const durationMin = scene.actualShootingDuration || getSafeDuration(scene)
    const breakTime = 60 // 씬 간 휴식 시간 (1시간 = 60분)
    
    // 씬 시작 시간
    const startTime = currentTime
    
    // 씬 종료 시간 계산
    const endTime = addMinutesToTime(currentTime, durationMin)
    
    // 다음 씬 시작 시간 (휴식시간 포함)
    const nextStartTime = addMinutesToTime(endTime, breakTime)
    
    timeSlots.push({
      scene: scene.scene || idx + 1,
      title: scene.title,
      startTime,
      endTime,
      duration: durationMin,
      breakTime: breakTime,
      totalTime: durationMin + breakTime,
      description: scene.description,
      timeSlot: scene.timeSlot || '미정'
    })
    
    // 다음 씬을 위한 시간 업데이트
    currentTime = nextStartTime
  })
  
  return timeSlots
}

/**
 * 브레이크다운 생성
 * @param {Array} conteData - 콘티 데이터
 * @returns {Object} 브레이크다운 데이터
 */
export const generateBreakdown = (conteData) => {
  try {
    const breakdown = {
      locations: {},
      actors: {},
      timeSlots: {},
      equipment: {},
      crew: {},
      props: {},
      costumes: {},
      cameras: {} // 카메라 정보 추가
    }
    
    conteData.forEach(conte => {
      // 1. 장소별 분류 (최우선)
      const location = extractLocationFromConte(conte)
      if (!breakdown.locations[location]) {
        breakdown.locations[location] = []
      }
      breakdown.locations[location].push(conte)
      
      // 2. 배우별 분류 (두 번째 우선순위)
      const actors = extractActorsFromConte(conte)
      actors.forEach(actor => {
        if (!breakdown.actors[actor]) {
          breakdown.actors[actor] = []
        }
        breakdown.actors[actor].push(conte)
      })
      
      // 3. 시간대별 분류 (세 번째 우선순위)
      const timeSlot = extractTimeSlotFromConte(conte)
      if (!breakdown.timeSlots[timeSlot]) {
        breakdown.timeSlots[timeSlot] = []
      }
      breakdown.timeSlots[timeSlot].push(conte)
      
      // 4. 장비별 분류 (네 번째 우선순위)
      const equipment = extractEquipmentFromConte(conte)
      if (!breakdown.equipment[equipment]) {
        breakdown.equipment[equipment] = []
      }
      breakdown.equipment[equipment].push(conte)
      
      // 5. 인력별 분류
      const crew = extractCrewFromConte(conte)
      crew.forEach(member => {
        if (!breakdown.crew[member]) {
          breakdown.crew[member] = []
        }
        breakdown.crew[member].push(conte)
      })
      
      // 6. 소품별 분류
      const props = extractPropsFromConte(conte)
      props.forEach(prop => {
        if (!breakdown.props[prop]) {
          breakdown.props[prop] = []
        }
        breakdown.props[prop].push(conte)
      })
      
      // 7. 의상별 분류
      const costumes = extractCostumesFromConte(conte)
      costumes.forEach(costume => {
        if (!breakdown.costumes[costume]) {
          breakdown.costumes[costume] = []
        }
        breakdown.costumes[costume].push(conte)
      })
      
      // 8. 카메라별 분류
      const cameraInfo = extractCameraFromConte(conte)
      const cameraKey = `${cameraInfo.model} - ${cameraInfo.lens}`
      if (!breakdown.cameras[cameraKey]) {
        breakdown.cameras[cameraKey] = []
      }
      breakdown.cameras[cameraKey].push({
        ...conte,
        cameraInfo: cameraInfo
      })
    })
    
    return breakdown
  } catch (error) {
    console.error('브레이크다운 생성 중 오류:', error)
    throw new Error('브레이크다운 생성에 실패했습니다.')
  }
}

/**
 * 콘티에서 인력 정보 추출 (개선된 버전)
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 추출된 인력 리스트
 */
const extractCrewFromConte = (conte) => {

  
  const crew = [];
  
  // 1. 스케줄링 데이터에서 상세 인력 정보 추출
  if (conte.scheduling && conte.scheduling.crew) {
    const crewData = conte.scheduling.crew;
    
    // 필수 인력 추가
    if (crewData.director && crewData.director !== '감독') {
      crew.push(crewData.director);
    }
    if (crewData.cinematographer && crewData.cinematographer !== '촬영감독') {
      crew.push(crewData.cinematographer);
    }
    if (crewData.cameraOperator && crewData.cameraOperator !== '카메라맨') {
      crew.push(crewData.cameraOperator);
    }
    if (crewData.lightingDirector && crewData.lightingDirector !== '조명감독') {
      crew.push(crewData.lightingDirector);
    }
    if (crewData.makeupArtist && crewData.makeupArtist !== '메이크업') {
      crew.push(crewData.makeupArtist);
    }
    if (crewData.costumeDesigner && crewData.costumeDesigner !== '의상') {
      crew.push(crewData.costumeDesigner);
    }
    if (crewData.soundEngineer && crewData.soundEngineer !== '음향감독') {
      crew.push(crewData.soundEngineer);
    }
    if (crewData.artDirector && crewData.artDirector !== '미술감독') {
      crew.push(crewData.artDirector);
    }
    
    // 추가 인력
    if (crewData.additionalCrew && Array.isArray(crewData.additionalCrew)) {
      crew.push(...crewData.additionalCrew);
    }
  }
  
  // 2. keywords.cast에서 배우 정보 추가
  if (conte.keywords && conte.keywords.cast && Array.isArray(conte.keywords.cast)) {
    crew.push(...conte.keywords.cast);
  }
  
  // 3. 기본 인력 추가 (정보가 없는 경우)
  if (crew.length === 0) {
    crew.push('감독', '촬영감독', '카메라맨');
  }
  
  return crew;
}

/**
 * 콘티에서 소품 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 추출된 소품 리스트 (반드시 keywords.props 기반)
 */
const extractPropsFromConte = (conte) => {
  // 반드시 keywords.props만 사용 (description fallback 제거)
  if (conte.keywords && conte.keywords.props && Array.isArray(conte.keywords.props)) {
    return conte.keywords.props
  }
  // 정보가 없으면 빈 배열 반환
  return []
}

/**
 * 두 씬이 같은 배우를 가지고 있는지 확인
 * @param {Object} scene1 - 첫 번째 씬
 * @param {Object} scene2 - 두 번째 씬
 * @returns {boolean} 같은 배우가 있는지 여부
 */
const hasSameActors = (scene1, scene2) => {
  const actors1 = extractActorsFromConte(scene1)
  const actors2 = extractActorsFromConte(scene2)
  
  return actors1.some(actor => actors2.includes(actor))
}

/**
 * 콘티에서 배우 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 배우 배열
 */
const extractActorsFromConte = (conte) => {
  if (conte.keywords && conte.keywords.cast && Array.isArray(conte.keywords.cast)) {
    return conte.keywords.cast
  }
  return []
}

/**
 * 두 씬이 같은 시간대를 가지고 있는지 확인
 * @param {Object} scene1 - 첫 번째 씬
 * @param {Object} scene2 - 두 번째 씬
 * @returns {boolean} 같은 시간대인지 여부
 */
const hasSameTimeSlot = (scene1, scene2) => {
  const time1 = extractTimeSlotFromConte(scene1)
  const time2 = extractTimeSlotFromConte(scene2)
  
  return time1 === time2
}

/**
 * 콘티에서 시간대 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {string} 시간대 정보
 */
const extractTimeSlotFromConte = (conte) => {
  if (conte.keywords && conte.keywords.timeOfDay) {
    return conte.keywords.timeOfDay
  }
  return '오후' // 기본값
}

/**
 * 콘티에서 의상 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 추출된 의상 리스트
 */
const extractCostumesFromConte = (conte) => {
  const description = conte.description || ''
  const costumes = []
  
  const costumeKeywords = [
    '정장', '캐주얼', '유니폼', '드레스', '셔츠', '바지',
    'suit', 'casual', 'uniform', 'dress', 'shirt', 'pants'
  ]
  
  costumeKeywords.forEach(keyword => {
    if (description.toLowerCase().includes(keyword.toLowerCase())) {
      costumes.push(keyword)
    }
  })
  
  return costumes
}

/**
 * 스케줄 데이터를 CSV 형태로 변환
 * @param {Object} scheduleData - 스케줄 데이터
 * @returns {string} CSV 문자열
 */
export const generateScheduleCSV = (scheduleData) => {
  let csv = 'Day,Date,Location,Scenes,Estimated Duration,Crew,Equipment\n'
  
  scheduleData.days.forEach(day => {
    csv += `${day.day},${day.date},${day.location},${day.totalScenes},${day.estimatedDuration}분,${day.crew.join(', ')},${day.equipment.join(', ')}\n`
  })
  
  return csv
}

/**
 * 브레이크다운 데이터를 CSV 형태로 변환
 * @param {Object} breakdownData - 브레이크다운 데이터
 * @returns {string} CSV 문자열
 */
export const generateBreakdownCSV = (breakdownData) => {
  let csv = 'Category,Item,Scenes,Count\n'
  
  // 장소별
  Object.entries(breakdownData.locations).forEach(([location, scenes]) => {
    csv += `Location,${location},${scenes.map(s => s.scene).join(', ')},${scenes.length}\n`
  })
  
  // 장비별
  Object.entries(breakdownData.equipment).forEach(([equipment, scenes]) => {
    csv += `Equipment,${equipment},${scenes.map(s => s.scene).join(', ')},${scenes.length}\n`
  })
  
  // 인력별
  Object.entries(breakdownData.crew).forEach(([crew, scenes]) => {
    csv += `Crew,${crew},${scenes.map(s => s.scene).join(', ')},${scenes.length}\n`
  })
  
  return csv
}

/**
 * 새로운 스케줄링 알고리즘
 * @param {Array} conteData - 콘티 데이터 배열
 * @returns {Object} 새로운 스케줄 데이터
 */
const generateNewSchedule = async (conteData) => {
  console.log('🎬 새로운 스케줄링 알고리즘 시작:', conteData.length, '개 콘티')
  
  // 1. 촬영시간 계산 및 DB에서 실제장소/그룹 정보 조회
  const scenesWithLocationInfo = await Promise.all(conteData.map(async (conte) => {
    const contentDuration = parseContentDuration(conte.estimatedDuration)
    const shootingDuration = contentDuration * 60 // 60배
    
    // 장소 정보 추출 (부가설명용)
    const location = extractLocationFromConte(conte)
    
    // DB에서 씬의 실제장소와 그룹 정보 조회
    const locationInfo = await getRealLocationInfoFromDB(conte._id, conte.projectId)
    
    return {
      ...conte,
      contentDuration, // 실제 상영시간 (분)
      shootingDuration, // 실제 촬영시간 (분)
      location: location, // 부가설명용 장소
      locationGroupId: locationInfo.groupId,
      realLocationId: locationInfo.realLocationId,
      locationGroupName: locationInfo.groupName,
      realLocationName: locationInfo.realLocationName
    }
  }))
  
  console.log('📊 촬영시간 계산 및 실제장소 정보 조회 완료:', scenesWithLocationInfo.map(s => ({
    scene: s.scene,
    content: s.contentDuration,
    shooting: s.shootingDuration,
    location: s.location,
    groupId: s.locationGroupId,
    realLocationId: s.realLocationId
  })))
  
  // 2. 그룹별로 씬들을 분류
  const groupScenes = groupScenesByLocationGroup(scenesWithLocationInfo)
  console.log('🏢 그룹별 분류 완료:', Object.keys(groupScenes).map(group => ({
    group,
    sceneCount: groupScenes[group].length
  })))
  
  // 3. 각 그룹 내에서 실제장소별로 씬들을 정렬
  const optimizedGroups = optimizeGroupsByRealLocation(groupScenes)
  console.log('📍 실제장소별 최적화 완료')
  
  // 4. 일일 스케줄 생성 (6시간 제한)
  const dailySchedules = createDailySchedules(optimizedGroups)
  console.log('📅 일일 스케줄 생성 완료:', dailySchedules.length, '일')
  
  // 5. 최종 스케줄 데이터 구성
  const totalShootingTime = dailySchedules.reduce((total, day) => 
    total + day.scenes.reduce((dayTotal, scene) => dayTotal + scene.shootingDuration, 0), 0
  )
  
  const totalScenes = dailySchedules.reduce((total, day) => total + day.scenes.length, 0)
  
  return {
    days: dailySchedules,
    totalDays: dailySchedules.length,
    totalScenes: totalScenes,
    estimatedTotalDuration: totalShootingTime,

    message: '새로운 알고리즘으로 스케줄이 생성되었습니다.'
  }
}

/**
 * 콘티에서 실제 상영시간 파싱
 * @param {string} durationStr - 시간 문자열 (예: "2분", "1.5분")
 * @returns {number} 실제 상영시간 (분)
 */
const parseContentDuration = (durationStr) => {
  if (typeof durationStr === 'string') {
    const match = durationStr.match(/(\d+(?:\.\d+)?)분/)
    return match ? parseFloat(match[1]) : 1
  }
  return 1
}

/**
 * 그룹별로 씬들을 분류
 * @param {Array} scenes - 씬 배열
 * @returns {Object} 그룹별 씬 객체
 */
const groupScenesByLocationGroup = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const groupId = scene.locationGroupId || 'unknown'
    if (!groups[groupId]) {
      groups[groupId] = []
    }
    groups[groupId].push(scene)
  })
  
  // unknown 그룹이 있으면 다른 그룹으로 분산
  if (groups['unknown'] && groups['unknown'].length > 0) {
    const unknownScenes = groups['unknown']
    delete groups['unknown']
    
    // 각 씬을 개별 그룹으로 분리
    unknownScenes.forEach((scene, index) => {
      const individualGroupId = `individual_${index + 1}`
      groups[individualGroupId] = [scene]
    })
  }
  
  return groups
}

/**
 * 그룹 내에서 실제장소별로 씬들을 최적화
 * @param {Object} groupScenes - 그룹별 씬 객체
 * @returns {Object} 최적화된 그룹별 씬 객체
 */
const optimizeGroupsByRealLocation = (groupScenes) => {
  const optimized = {}
  
  Object.keys(groupScenes).forEach(groupId => {
    const scenes = groupScenes[groupId]
    
    // 실제장소별로 그룹화
    const realLocationGroups = {}
    scenes.forEach(scene => {
      const realLocationId = scene.realLocationId || 'unknown'
      if (!realLocationGroups[realLocationId]) {
        realLocationGroups[realLocationId] = []
      }
      realLocationGroups[realLocationId].push(scene)
    })
    
    // 각 실제장소 내에서 씬 번호순으로 정렬
    Object.keys(realLocationGroups).forEach(realLocationId => {
      realLocationGroups[realLocationId].sort((a, b) => a.scene - b.scene)
    })
    
    // 실제장소별로 정렬된 씬들을 하나의 배열로 합치기
    const sortedScenes = []
    Object.keys(realLocationGroups).forEach(realLocationId => {
      sortedScenes.push(...realLocationGroups[realLocationId])
    })
    
    optimized[groupId] = sortedScenes
  })
  
  return optimized
}

/**
 * 일일 스케줄 생성 (6시간 제한)
 * @param {Object} optimizedGroups - 최적화된 그룹별 씬 객체
 * @returns {Array} 일일 스케줄 배열 (시간, 씬, 장소, 카메라, 주요 인물, 필요 인력, 필요 장비 포함)
 */
const createDailySchedules = (optimizedGroups) => {
  const dailySchedules = []
  let dayCounter = 1
  
  Object.keys(optimizedGroups).forEach(groupId => {
    const scenes = optimizedGroups[groupId]
    const MAX_DAILY_SHOOTING_TIME = 6 * 60 // 6시간 = 360분
    
    let currentDayScenes = []
    let currentDayShootingTime = 0
    
    scenes.forEach(scene => {
      // 리허설 시간 계산 (촬영시간의 20%)
      const rehearsalTime = Math.ceil(scene.shootingDuration * 0.2)
      const totalSceneTime = scene.shootingDuration + rehearsalTime
      
      // 6시간을 초과하는지 확인
      if (currentDayShootingTime + totalSceneTime > MAX_DAILY_SHOOTING_TIME) {
        // 현재 날짜 완료하고 새 날짜 시작
        if (currentDayScenes.length > 0) {
          const daySchedule = createNewDaySchedule(dayCounter, currentDayScenes, groupId)
          dailySchedules.push(daySchedule)
          dayCounter++
          currentDayScenes = []
          currentDayShootingTime = 0
        }
      }
      
      currentDayScenes.push(scene)
      currentDayShootingTime += totalSceneTime
    })
    
    // 마지막 날짜 처리
    if (currentDayScenes.length > 0) {
      const daySchedule = createNewDaySchedule(dayCounter, currentDayScenes, groupId)
      dailySchedules.push(daySchedule)
      dayCounter++
    }
  })
  
  // 각 일차별로 요청하신 정보들을 정리하여 반환
  const schedulesWithDetails = dailySchedules.map(daySchedule => {
    return {
      // 기본 정보
      day: daySchedule.day,
      date: daySchedule.date,
      location: daySchedule.location,
      totalScenes: daySchedule.totalScenes,
      
      // 요청하신 상세 정보들
      time: daySchedule.scheduleDetails.time,           // 시간별 활동
      scenes: daySchedule.scheduleDetails.scenes,       // 씬별 정보
      location: daySchedule.scheduleDetails.location,   // 장소 정보
      camera: daySchedule.scheduleDetails.camera,       // 카메라 정보
      actors: daySchedule.scheduleDetails.actors,       // 주요 인물
      crew: daySchedule.scheduleDetails.crew,           // 필요 인력
      equipment: daySchedule.scheduleDetails.equipment, // 필요 장비
      
      // 기존 정보들 (호환성 유지)
      scenes: daySchedule.scenes,
      dailySchedule: daySchedule.dailySchedule,
      estimatedDuration: daySchedule.estimatedDuration,
      rehearsalDuration: daySchedule.rehearsalDuration,
      totalDuration: daySchedule.totalDuration,
      crew: daySchedule.crew,
      equipment: daySchedule.equipment
    }
  })
  
  return schedulesWithDetails
}

/**
 * 일일 스케줄 생성 (새로운 알고리즘)
 * @param {number} dayNumber - 일차
 * @param {Array} scenes - 씬 배열
 * @param {string} groupId - 그룹 ID
 * @returns {Object} 일일 스케줄 객체
 */
const createNewDaySchedule = (dayNumber, scenes, groupId) => {
  const totalShootingTime = scenes.reduce((total, scene) => total + scene.shootingDuration, 0)
  const totalRehearsalTime = Math.ceil(totalShootingTime * 0.2)
  
  // 일일 상세 스케줄 생성
  const dailySchedule = generateDailyDetailedSchedule(scenes, totalRehearsalTime)
  
  // 각 씬별 상세 정보 추출
  const scenesWithDetails = scenes.map(scene => {
    // 카메라 정보 추출
    const cameraInfo = extractCameraFromConte(scene)
    
    // 주요 인물 (배우) 정보 추출
    const actors = extractActorsFromConte(scene)
    
    // 필요 인력 정보 추출
    const crewInfo = extractCrewFromConte(scene)
    
    // 필요 장비 정보 추출
    const equipmentInfo = extractEquipmentFromConte(scene)
    
    // 시간대 정보 추출
    const timeSlot = extractTimeSlotFromConte(scene)
    
    return {
      ...scene,
      rehearsalTime: Math.ceil(scene.shootingDuration * 0.2),
      totalTime: scene.shootingDuration + Math.ceil(scene.shootingDuration * 0.2),
      // 추가 상세 정보
      camera: cameraInfo,
      actors: actors,
      crew: crewInfo,
      equipment: equipmentInfo,
      timeSlot: timeSlot,
      // 시간 정보 (dailySchedule에서 계산된 실제 촬영 시간)
      shootingStartTime: null, // dailySchedule에서 설정
      shootingEndTime: null,   // dailySchedule에서 설정
      // 장소 정보
      location: scene.keywords?.location || '미정',
      realLocation: scene.realLocationId || '미정'
    }
  })
  
  // dailySchedule에서 실제 촬영 시간 정보를 씬에 매핑
  const updatedScenesWithDetails = scenesWithDetails.map(scene => {
    const shootingSchedule = dailySchedule.find(schedule => 
      schedule.activity === '촬영' && schedule.description.includes(`씬 ${scene.scene}`)
    )
    
    if (shootingSchedule) {
      const [startTime, endTime] = shootingSchedule.time.split('-')
      return {
        ...scene,
        shootingStartTime: startTime,
        shootingEndTime: endTime
      }
    }
    
    return scene
  })
  
  return {
    day: dayNumber,
    date: `Day ${dayNumber}`,
    location: getGroupName(groupId),
    locationGroupId: groupId,
    scenes: updatedScenesWithDetails,
    totalScenes: scenes.length,
    estimatedDuration: totalShootingTime,
    rehearsalDuration: totalRehearsalTime,
    totalDuration: totalShootingTime + totalRehearsalTime,
    crew: getRequiredCrew(scenes),
    equipment: getRequiredEquipment(scenes),
    dailySchedule: dailySchedule,
    
    // 요청하신 정보들을 포함한 상세 데이터
    scheduleDetails: {
      time: dailySchedule.map(schedule => ({
        time: schedule.time,
        activity: schedule.activity,
        description: schedule.description
      })),
      scenes: updatedScenesWithDetails.map(scene => ({
        scene: scene.scene,
        title: scene.title,
        time: `${scene.shootingStartTime || '미정'}-${scene.shootingEndTime || '미정'}`,
        duration: scene.shootingDuration
      })),
      location: getGroupName(groupId),
      camera: updatedScenesWithDetails.map(scene => ({
        scene: scene.scene,
        camera: typeof scene.camera === 'string' ? scene.camera : '기본 카메라'
      })),
      actors: updatedScenesWithDetails.map(scene => ({
        scene: scene.scene,
        actors: Array.isArray(scene.actors) ? scene.actors : []
      })),
      crew: updatedScenesWithDetails.map(scene => ({
        scene: scene.scene,
        crew: Array.isArray(scene.crew) ? scene.crew : []
      })),
      equipment: updatedScenesWithDetails.map(scene => ({
        scene: scene.scene,
        equipment: Array.isArray(scene.equipment) ? scene.equipment : []
      }))
    }
  }
}

/**
 * 일일 상세 스케줄 생성
 * @param {Array} scenes - 씬 배열
 * @param {number} totalRehearsalTime - 총 리허설 시간
 * @returns {Array} 상세 스케줄 배열
 */
const generateDailyDetailedSchedule = (scenes, totalRehearsalTime) => {
  const schedule = []
  let currentTime = { hour: 6, minute: 0 }
  
  // 6:00 - 집합
  schedule.push({
    time: '06:00-07:00',
    activity: '집합',
    description: '전체 스태프 집합',
    realLocation: null,
    scene: null
  })
  
  // 7:00-8:00 - 이동
  schedule.push({
    time: '07:00-08:00',
    activity: '이동',
    description: '촬영 현장으로 이동',
    realLocation: null,
    scene: null
  })
  
  // 8:00 - 현장 도착 및 리허설
  currentTime = { hour: 8, minute: 0 } // 8시로 설정
  const rehearsalStartTime = formatTime(currentTime)
  currentTime = addMinutes(currentTime, totalRehearsalTime)
  const rehearsalEndTime = formatTime(currentTime)
  
  schedule.push({
    time: `${rehearsalStartTime}-${rehearsalEndTime}`,
    activity: '리허설',
    description: `전체 씬 리허설 (씬 ${scenes.map(s => s.scene).join(', ')})`,
    realLocation: scenes.length > 0 ? scenes[0].realLocationId : null,
    scene: scenes.map(s => s.scene).join(', ')
  })
  
  // 씬별 촬영
  scenes.forEach((scene, index) => {
    const prevScene = index > 0 ? scenes[index - 1] : null
    
    // 점심시간 체크 (12:00-13:00)
    if (currentTime.hour === 12 && currentTime.minute === 0) {
      schedule.push({
        time: '12:00-13:00',
        activity: '점심식사',
        description: '1시간 휴식',
        realLocation: null,
        scene: null
      })
      currentTime = { hour: 13, minute: 0 }
    }
    
    // 저녁시간 체크 (18:00-19:00)
    if (currentTime.hour === 18 && currentTime.minute === 0) {
      schedule.push({
        time: '18:00-19:00',
        activity: '저녁식사',
        description: '1시간 휴식',
        realLocation: null,
        scene: null
      })
      currentTime = { hour: 19, minute: 0 }
    }
    
    // 실제장소 변경 시 세팅 시간 (30분)
    if (prevScene && prevScene.realLocationId !== scene.realLocationId) {
      const setupStartTime = formatTime(currentTime)
      currentTime = addMinutes(currentTime, 30)
      const setupEndTime = formatTime(currentTime)
      
      schedule.push({
        time: `${setupStartTime}-${setupEndTime}`,
        activity: '세팅',
        description: `${scene.keywords?.location || '새 장소'} 세팅`,
        realLocation: scene.realLocationId,
        scene: null
      })
    }
    
    // 씬 촬영
    const shootingStartTime = formatTime(currentTime)
    currentTime = addMinutes(currentTime, scene.shootingDuration)
    const shootingEndTime = formatTime(currentTime)
    
          schedule.push({
        time: `${shootingStartTime}-${shootingEndTime}`,
        activity: '촬영',
        description: `씬 ${scene.scene}: ${scene.title} (${scene.shootingDuration}분)`,
        realLocation: scene.realLocationId,
        scene: scene.scene
      })
  })
  
  // 정리 및 해산
  const cleanupStartTime = formatTime(currentTime)
  currentTime = addMinutes(currentTime, 60)
  const cleanupEndTime = formatTime(currentTime)
  
  schedule.push({
    time: `${cleanupStartTime}-${cleanupEndTime}`,
    activity: '정리 및 해산',
    description: '촬영 완료, 장비 정리',
    realLocation: scenes.length > 0 ? scenes[scenes.length - 1].realLocationId : null,
    scene: null
  })
  
  return schedule
}

/**
 * 시간 포맷팅
 * @param {Object} time - 시간 객체 {hour, minute}
 * @returns {string} 포맷된 시간 (HH:MM)
 */
const formatTime = (time) => {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}

/**
 * 시간에 분 추가
 * @param {Object} time - 시간 객체 {hour, minute}
 * @param {number} minutes - 추가할 분
 * @returns {Object} 업데이트된 시간 객체
 */
const addMinutes = (time, minutes) => {
  const totalMinutes = time.hour * 60 + time.minute + minutes
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60
  }
}

/**
 * location에서 그룹 ID 생성
 * @param {string} location - 장소명
 * @returns {string} 그룹 ID
 */
const generateLocationGroupId = (location) => {
  if (!location || location === '미정') return 'unknown'
  
  // 장소명에서 그룹 추출
  const locationLower = location.toLowerCase()
  
  if (locationLower.includes('학교') || locationLower.includes('교실') || locationLower.includes('강의실') || locationLower.includes('도서관')) {
    return 'school'
  } else if (locationLower.includes('병원') || locationLower.includes('의원') || locationLower.includes('진료실')) {
    return 'hospital'
  } else if (locationLower.includes('회사') || locationLower.includes('사무실') || locationLower.includes('오피스')) {
    return 'office'
  } else if (locationLower.includes('집') || locationLower.includes('집안') || locationLower.includes('거실') || locationLower.includes('방')) {
    return 'home'
  } else if (locationLower.includes('카페') || locationLower.includes('커피')) {
    return 'cafe'
  } else if (locationLower.includes('레스토랑') || locationLower.includes('식당')) {
    return 'restaurant'
  } else if (locationLower.includes('공원') || locationLower.includes('산') || locationLower.includes('바다')) {
    return 'outdoor'
  } else {
    // 기본적으로 location을 그룹 ID로 사용
    return location.replace(/\s+/g, '_').toLowerCase()
  }
}

/**
 * location과 콘티에서 가상장소 ID 생성
 * @param {string} location - 장소명
 * @param {Object} conte - 콘티 객체
 * @returns {string} 가상장소 ID
 */
const generateVirtualLocationId = (location, conte) => {
  if (!location || location === '미정') return 'unknown'
  
  // 씬 번호와 장소를 조합하여 고유한 가상장소 ID 생성
  const sceneNumber = conte.scene || 1
  const locationKey = location.replace(/\s+/g, '_').toLowerCase()
  
  return `${locationKey}_scene_${sceneNumber}`
}

/**
 * 그룹 이름 가져오기
 * @param {string} groupId - 그룹 ID
 * @returns {string} 그룹 이름
 */
const getGroupName = (groupId) => {
  // 실제로는 데이터베이스에서 그룹 정보를 가져와야 함
  const groupNames = {
    'school': '학교',
    'hospital': '병원',
    'office': '회사',
    'home': '집',
    'cafe': '카페',
    'restaurant': '레스토랑',
    'outdoor': '야외',
    'unknown': '미정'
  }
  
  // individual 그룹 처리
  if (groupId.startsWith('individual_')) {
    return '개별 촬영'
  }
  
  return groupNames[groupId] || groupId
}



/**
 * 콘티에서 장비 정보 추출 (개선된 버전)
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 추출된 장비 리스트
 */
const extractEquipmentFromConte = (conte) => {
  
  const equipment = [];
  
  // 1. 스케줄링 데이터에서 상세 장비 정보 추출
  if (conte.scheduling && conte.scheduling.equipment) {
    const equipData = conte.scheduling.equipment;
    
    // 카메라 장비
    if (equipData.cameras && Array.isArray(equipData.cameras)) {
      equipment.push(...equipData.cameras);
    }
    
    // 렌즈
    if (equipData.lenses && Array.isArray(equipData.lenses)) {
      equipment.push(...equipData.lenses);
    }
    
    // 조명 장비
    if (equipData.lighting && Array.isArray(equipData.lighting)) {
      equipment.push(...equipData.lighting);
    }
    
    // 음향 장비
    if (equipData.audio && Array.isArray(equipData.audio)) {
      equipment.push(...equipData.audio);
    }
    
    // 그립 장비
    if (equipData.grip && Array.isArray(equipData.grip)) {
      equipment.push(...equipData.grip);
    }
    
    // 특수 장비
    if (equipData.special && Array.isArray(equipData.special)) {
      equipment.push(...equipData.special);
    }
  }
  
  // 2. 스케줄링 카메라 정보 추가
  if (conte.scheduling && conte.scheduling.camera) {
    const cameraData = conte.scheduling.camera;
    if (cameraData.model && cameraData.model !== '기본 카메라') {
      equipment.push(cameraData.model);
    }
    if (cameraData.lens && cameraData.lens !== '기본 렌즈') {
      equipment.push(cameraData.lens);
    }
    if (cameraData.movement && cameraData.movement !== '고정') {
      equipment.push(cameraData.movement);
    }
  }
  
  // 3. keywords.equipment 추가
  if (conte.keywords && conte.keywords.equipment && conte.keywords.equipment !== '기본 장비') {
    equipment.push(conte.keywords.equipment);
  }
  
  // 4. 기본 장비 추가 (정보가 없는 경우)
  if (equipment.length === 0) {
    equipment.push('카메라', '조명', '마이크');
  }
  
  return equipment;
}

/**
 * 콘티에서 카메라 정보 추출 (개선된 버전)
 * @param {Object} conte - 콘티 객체
 * @returns {string} 추출된 카메라 정보 문자열
 */
const extractCameraFromConte = (conte) => {
  const cameraInfo = {
    model: '기본 카메라',
    lens: '기본 렌즈',
    settings: '기본 설정',
    movement: '고정',
    angle: '',
    work: ''
  };
  
  // 1. 스케줄링 카메라 정보
  if (conte.scheduling && conte.scheduling.camera) {
    const cameraData = conte.scheduling.camera;
    if (cameraData.model && cameraData.model !== '기본 카메라') {
      cameraInfo.model = cameraData.model;
    }
    if (cameraData.lens && cameraData.lens !== '기본 렌즈') {
      cameraInfo.lens = cameraData.lens;
    }
    if (cameraData.settings && cameraData.settings !== '기본 설정') {
      cameraInfo.settings = cameraData.settings;
    }
    if (cameraData.movement && cameraData.movement !== '고정') {
      cameraInfo.movement = cameraData.movement;
    }
  }
  
  // 2. 기본 카메라 정보 (cameraAngle, cameraWork)
  if (conte.cameraAngle) {
    cameraInfo.angle = conte.cameraAngle;
  }
  if (conte.cameraWork) {
    cameraInfo.work = conte.cameraWork;
  }
  
  // 3. 렌즈 사양
  if (conte.lensSpecs) {
    cameraInfo.lens = conte.lensSpecs;
  }
  
  // 4. 카메라 정보를 문자열로 변환
  const cameraParts = [];
  
  if (cameraInfo.model && cameraInfo.model !== '기본 카메라') {
    cameraParts.push(cameraInfo.model);
  }
  
  if (cameraInfo.lens && cameraInfo.lens !== '기본 렌즈') {
    cameraParts.push(cameraInfo.lens);
  }
  
  if (cameraInfo.movement && cameraInfo.movement !== '고정') {
    cameraParts.push(cameraInfo.movement);
  }
  
  if (cameraInfo.angle) {
    cameraParts.push(cameraInfo.angle);
  }
  
  if (cameraInfo.work) {
    cameraParts.push(cameraInfo.work);
  }
  
  // 기본값이거나 정보가 없는 경우
  if (cameraParts.length === 0) {
    return '기본 카메라';
  }
  
  return cameraParts.join(', ');
} 

/**
 * 일일촬영계획표 생성 API
 * @param {Object} requestData - 요청 데이터
 * @returns {Promise<Object>} 생성된 일일촬영계획표
 */
export const generateDailyShootingPlan = async (requestData) => {
  try {
    console.log('🎬 일일촬영계획표 생성 요청:', {
      projectTitle: requestData.projectTitle,
      shootingDate: requestData.shootingDate,
      scenesCount: requestData.scenes?.length || 0,
      requestData: requestData
    })

    const response = await api.post('/scheduler/generate-daily-plan', requestData, {
      timeout: 120000, // 2분 타임아웃
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('✅ 일일촬영계획표 생성 완료:', {
      status: response.status,
      responseData: response.data
    })

    return response.data

  } catch (error) {
    console.error('❌ 일일촬영계획표 생성 실패:', error)
    
    if (error.response?.status === 401) {
      throw new Error('로그인이 필요합니다.')
    } else if (error.response?.status === 500) {
      throw new Error('서버 오류가 발생했습니다.')
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('요청 시간이 초과되었습니다.')
    } else {
      throw new Error(error.message || '일일촬영계획표 생성에 실패했습니다.')
    }
  }
}

/**
 * 일일촬영계획표 재생성 (재시도 로직 포함)
 * @param {Object} requestData - 요청 데이터
 * @param {number} maxRetries - 최대 재시도 횟수
 * @returns {Promise<Object>} 생성된 일일촬영계획표
 */
export const generateDailyShootingPlanWithRetry = async (requestData, maxRetries = 3) => {
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎬 일일촬영계획표 생성 시도 ${attempt}/${maxRetries}`)
      
      const result = await generateDailyShootingPlan(requestData)
      
      console.log(`✅ 일일촬영계획표 생성 성공 (시도 ${attempt})`)
      return result
      
    } catch (error) {
      console.error(`❌ 일일촬영계획표 생성 실패 (시도 ${attempt}):`, error.message)
      lastError = error
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 지수 백오프
        console.log(`⏳ ${delay}ms 후 재시도...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
} 

/**
 * DB에서 씬의 실제장소 정보 조회
 * @param {string} conteId - 씬 ID
 * @param {string} projectId - 프로젝트 ID
 * @returns {Object} 실제장소와 그룹 정보
 */
const getRealLocationInfoFromDB = async (conteId, projectId) => {
  try {
    console.log('🔍 DB에서 씬의 실제장소 정보 조회:', { conteId, projectId })
    
    // API 호출을 위한 기본 설정
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
    
    // 1. 씬의 실제장소 매핑 조회
    const mappingResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/contes/${conteId}/real-location`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!mappingResponse.ok) {
      console.warn('⚠️ 씬-실제장소 매핑 조회 실패, 기본값 사용:', conteId)
      return {
        groupId: 'unknown',
        realLocationId: `unknown_scene_${conteId}`,
        groupName: '미정',
        realLocationName: '미정'
      }
    }
    
    const mappingData = await mappingResponse.json()
    const mapping = mappingData.data
    
    if (!mapping || !mapping.realLocationId) {
      console.warn('⚠️ 씬에 매핑된 실제장소 없음, 기본값 사용:', conteId)
      return {
        groupId: 'unknown',
        realLocationId: `unknown_scene_${conteId}`,
        groupName: '미정',
        realLocationName: '미정'
      }
    }
    
    const realLocation = mapping.realLocationId
    const locationGroup = mapping.realLocationId.locationGroupId
    
    console.log('✅ 실제장소 정보 조회 완료:', {
      conteId,
      realLocationId: realLocation._id,
      realLocationName: realLocation.name,
      groupId: locationGroup?._id || 'unknown',
      groupName: locationGroup?.name || '미정'
    })
    
    return {
      groupId: locationGroup?._id || 'unknown',
      realLocationId: realLocation._id,
      groupName: locationGroup?.name || '미정',
      realLocationName: realLocation.name
    }
    
  } catch (error) {
    console.error('❌ 실제장소 정보 조회 오류:', error)
    return {
      groupId: 'unknown',
      realLocationId: `unknown_scene_${conteId}`,
      groupName: '미정',
      realLocationName: '미정'
    }
  }
}

/**
 * 인증 토큰 가져오기
 * @returns {string} 인증 토큰
 */
const getAuthToken = () => {
  // 세션 스토리지에서 토큰 확인
  let token = sessionStorage.getItem('auth-token')
  
  // 세션 스토리지에 없으면 로컬 스토리지에서 확인
  if (!token) {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const parsedToken = JSON.parse(authStorage)
        if (parsedToken.state?.token) {
          token = parsedToken.state.token
          // 세션 스토리지에도 저장
          sessionStorage.setItem('auth-token', token)
        }
      } catch (error) {
        console.error('토큰 파싱 오류:', error)
      }
    }
  }
  
  return token
}