/**
 * 스케줄러 서비스
 * 콘티 데이터를 바탕으로 최적의 촬영 스케줄을 생성하는 서비스
 * PRD 스케줄러 기능의 핵심 로직
 */

/**
 * 콘티 데이터를 바탕으로 최적의 촬영 스케줄 생성
 * @param {Array} conteData - 콘티 데이터 배열
 * @returns {Object} 최적화된 스케줄 데이터
 */
export const generateOptimalSchedule = (conteData) => {
  try {
    console.log('🎬 스케줄러 시작 - 입력 데이터:', {
      totalCount: conteData?.length || 0,
      isArray: Array.isArray(conteData),
      firstItem: conteData?.[0] ? {
        id: conteData[0].id,
        title: conteData[0].title,
        type: conteData[0].type,
        hasKeywords: !!conteData[0].keywords,
        keywords: conteData[0].keywords
      } : '없음'
    });
    
    if (!conteData || !Array.isArray(conteData) || conteData.length === 0) {
      console.warn('⚠️ 스케줄러: 유효하지 않은 콘티 데이터');
      return { 
        days: [], 
        totalDays: 0,
        totalScenes: 0,
        estimatedTotalDuration: 0,
        message: '콘티 데이터가 없습니다.'
      }
    }
    
    // 실사 촬영용 콘티만 필터링 (여러 타입명 지원)
    const liveActionConte = conteData.filter(conte => 
      conte.type === 'live_action' || 
      conte.type === 'LIVE_ACTION' || 
      conte.type === '실사 촬영용'
    )
    
    console.log('🎬 실사 촬영용 콘티 필터링 결과:', {
      total: conteData.length,
      liveAction: liveActionConte.length,
      types: [...new Set(conteData.map(c => c.type))]
    });
    
    if (liveActionConte.length === 0) {
      console.warn('⚠️ 스케줄러: 실사 촬영용 콘티가 없음');
      return { 
        days: [], 
        totalDays: 0,
        totalScenes: 0,
        estimatedTotalDuration: 0,
        message: '실사 촬영용 콘티가 없습니다.'
      }
    }
    
    // 각 콘티의 keywords 정보 로깅
    liveActionConte.forEach((conte, index) => {
      console.log(`🎬 콘티 ${index + 1} keywords:`, {
        id: conte.id,
        title: conte.title,
        keywords: conte.keywords,
        location: conte.keywords?.location,
        equipment: conte.keywords?.equipment
      });
    });
    
    // 장소별로 그룹화
    const locationGroups = groupByLocation(liveActionConte)
    console.log('🎬 장소별 그룹화 결과:', Object.keys(locationGroups));
    
    // 장비별로 그룹화
    const equipmentGroups = groupByEquipment(liveActionConte)
    console.log('🎬 장비별 그룹화 결과:', Object.keys(equipmentGroups));
    
    // 가중치 계산 및 최적화
    const optimizedSchedule = optimizeScheduleWithWeights(liveActionConte, locationGroups, equipmentGroups)
    
    console.log('✅ 스케줄러 완료:', {
      totalDays: optimizedSchedule.totalDays,
      totalScenes: optimizedSchedule.totalScenes,
      estimatedDuration: optimizedSchedule.estimatedTotalDuration
    });
    
    return optimizedSchedule
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
  console.log('📍 장소 추출:', {
    id: conte.id,
    title: conte.title,
    hasKeywords: !!conte.keywords,
    keywordsLocation: conte.keywords?.location,
    fallbackLocation: conte.location
  });
  
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
 * 가중치 기반 스케줄 최적화
 * @param {Array} allScenes - 모든 씬 데이터
 * @param {Object} locationGroups - 장소별 그룹
 * @param {Object} equipmentGroups - 장비별 그룹
 * @returns {Object} 최적화된 스케줄
 */
const optimizeScheduleWithWeights = (allScenes, locationGroups, equipmentGroups) => {
  // 각 씬에 대한 가중치 계산
  const scenesWithWeights = allScenes.map(scene => ({
    ...scene,
    weight: calculateSceneWeight(scene, allScenes)
  }))
  
  // 가중치 기반으로 씬들을 최적화된 순서로 정렬
  const optimizedScenes = optimizeSceneOrder(scenesWithWeights)
  
  // 최적화된 씬들을 일정으로 배치
  const days = createScheduleFromOptimizedScenes(optimizedScenes)
  
  return {
    days,
    totalDays: days.length,
    totalScenes: days.reduce((total, day) => total + day.totalScenes, 0),
    estimatedTotalDuration: days.reduce((total, day) => total + day.estimatedDuration, 0),
    optimizationScore: calculateOptimizationScore(days)
  }
}

/**
 * 씬의 가중치 계산 (우선순위 기반)
 * @param {Object} scene - 씬 객체
 * @param {Array} allScenes - 모든 씬 배열
 * @returns {number} 가중치 점수
 */
const calculateSceneWeight = (scene, allScenes) => {
  let weight = 0
  
  // 1. 장소 가중치 (최우선) - 같은 장소의 씬이 많을수록 높은 가중치
  const sameLocationScenes = allScenes.filter(s => 
    extractLocationFromConte(s) === extractLocationFromConte(scene)
  )
  weight += sameLocationScenes.length * 1000 // 최우선 가중치
  
  // 2. 배우 가중치 (두 번째 우선순위) - 같은 배우가 나오는 씬이 많을수록 높은 가중치
  const sameActorScenes = allScenes.filter(s => 
    hasSameActors(s, scene)
  )
  weight += sameActorScenes.length * 500 // 두 번째 우선순위
  
  // 3. 촬영 시간대 가중치 (세 번째 우선순위) - 같은 시간대 촬영이 많을수록 높은 가중치
  const sameTimeSlotScenes = allScenes.filter(s => 
    hasSameTimeSlot(s, scene)
  )
  weight += sameTimeSlotScenes.length * 200 // 세 번째 우선순위
  
  // 4. 장비 가중치 (네 번째 우선순위) - 같은 장비의 씬이 많을수록 높은 가중치
  const sameEquipmentScenes = allScenes.filter(s => 
    extractEquipmentFromConte(s) === extractEquipmentFromConte(scene)
  )
  weight += sameEquipmentScenes.length * 100 // 네 번째 우선순위
  
  // 5. 복잡도 가중치 (다섯 번째 우선순위) - 긴 씬은 높은 가중치
  const duration = scene.estimatedDuration || 5
  weight += duration * 10 // 복잡도는 낮은 우선순위
  
  // 6. 우선순위 가중치 (씬 번호가 낮을수록 높은 가중치)
  const sceneNumber = scene.scene || 1
  weight += (100 - sceneNumber) * 1
  
  return weight
}

/**
 * 가중치 기반으로 씬 순서 최적화 (다중 씬 지원)
 * @param {Array} scenesWithWeights - 가중치가 포함된 씬 배열
 * @returns {Array} 최적화된 씬 순서
 */
const optimizeSceneOrder = (scenesWithWeights) => {
  if (scenesWithWeights.length <= 2) {
    // 씬이 2개 이하일 때는 단순 정렬
    return [...scenesWithWeights].sort((a, b) => b.weight - a.weight)
  }
  
  // 다중 씬을 위한 개선된 그리디 알고리즘
  const optimizedOrder = []
  const usedScenes = new Set()
  
  // 1단계: 우선순위별 그룹화
  const locationGroups = groupScenesByLocation(scenesWithWeights)
  const actorGroups = groupScenesByActors(scenesWithWeights)
  const timeSlotGroups = groupScenesByTimeSlot(scenesWithWeights)
  const equipmentGroups = groupScenesByEquipment(scenesWithWeights)
  
  // 2단계: 우선순위에 따라 그룹 순서 결정
  const groupOrder = determineGroupOrder(locationGroups, actorGroups, timeSlotGroups, equipmentGroups)
  
  // 3단계: 각 그룹 내에서 최적 순서 결정
  for (const groupKey of groupOrder) {
    const groupScenes = locationGroups[groupKey] || actorGroups[groupKey] || 
                       timeSlotGroups[groupKey] || equipmentGroups[groupKey] || []
    
    if (groupScenes.length > 0) {
      // 그룹 내에서 가중치 순으로 정렬
      const sortedGroupScenes = groupScenes.sort((a, b) => b.weight - a.weight)
      
      // 사용되지 않은 씬들만 추가
      for (const scene of sortedGroupScenes) {
        if (!usedScenes.has(scene.id)) {
          optimizedOrder.push(scene)
          usedScenes.add(scene.id)
        }
      }
    }
  }
  
  // 4단계: 남은 씬들을 가중치 순으로 추가
  const remainingScenes = scenesWithWeights.filter(scene => !usedScenes.has(scene.id))
  remainingScenes.sort((a, b) => b.weight - a.weight)
  optimizedOrder.push(...remainingScenes)
  
  return optimizedOrder
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
  
  console.log('🕐 시간대별 그룹화 결과:', Object.keys(groups).map(key => `${key}: ${groups[key].length}개`));
  
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
  console.log('🎬 시간대별 스케줄 생성 시작:', optimizedScenes.length, '개 씬');
  
  // 1. 시간대별로 씬들을 그룹화
  const timeSlotGroups = groupScenesByTimeSlot(optimizedScenes)
  
  console.log('🕐 시간대별 그룹화 결과:', timeSlotGroups);
  
  // 2. 장소별로 그룹화하고, 각 장소 내에서 시간대별로 정렬
  const locationGroups = {}
  
  for (const scene of optimizedScenes) {
    const location = extractLocationFromConte(scene)
    if (!locationGroups[location]) {
      locationGroups[location] = []
    }
    locationGroups[location].push(scene)
  }
  
  console.log('📍 장소별 그룹화 결과:', Object.keys(locationGroups).map(key => `${key}: ${locationGroups[key].length}개`));
  
  // 3. 각 장소 내에서 시간대별로 정렬
  const locationTimeSlotOptimizedScenes = []
  
  for (const [location, scenes] of Object.entries(locationGroups)) {
    console.log(`📍 ${location} 장소 내 시간대별 정렬 시작 (${scenes.length}개 씬)`);
    
    // 장소 내 씬들을 시간대별로 그룹화
    const timeSlotGroupsInLocation = groupScenesByTimeSlot(scenes)
    
    // 시간대 순서 정의 (낮 → 밤)
    const timeSlotOrder = ['낮', '밤']
    
    // 정의된 순서대로 씬들을 추가
    for (const timeSlot of timeSlotOrder) {
      if (timeSlotGroupsInLocation[timeSlot]) {
        console.log(`  ⏰ ${timeSlot} 시간대 최적화 시작 (${timeSlotGroupsInLocation[timeSlot].length}개 씬)`);
        
        // 시간대별 최적화 실행 (실제 시간 계산 포함) - 같은 장소의 모든 씬들을 전달
        const optimizedScenesForTimeSlot = optimizeScenesByTimeSlot(timeSlotGroupsInLocation[timeSlot], timeSlot, scenes)
        
        console.log(`  🎯 ${timeSlot} 시간대 최적화 결과:`, optimizedScenesForTimeSlot.map(scene => ({
          scene: scene.scene,
          title: scene.title,
          timeSlotDisplay: scene.timeSlotDisplay,
          sceneStartTime: scene.sceneStartTime,
          sceneEndTime: scene.sceneEndTime,
          actualShootingDuration: scene.actualShootingDuration
        })));
        
        // 최적화된 씬들을 결과 배열에 추가
        locationTimeSlotOptimizedScenes.push(...optimizedScenesForTimeSlot)
        
        console.log(`  ✅ ${timeSlot} 시간대 최적화 완료 (${optimizedScenesForTimeSlot.length}개 씬)`);
        
        // 디버깅: 최적화된 씬들의 시간 정보 확인
        optimizedScenesForTimeSlot.forEach(scene => {
          console.log(`    - 씬 ${scene.scene}: ${scene.timeSlotDisplay || scene.timeSlot}`);
          console.log(`      시작시간: ${scene.sceneStartTime}, 종료시간: ${scene.sceneEndTime}`);
          console.log(`      촬영시간: ${scene.actualShootingDuration}분`);
          console.log(`      timeSlotDisplay: ${scene.timeSlotDisplay}`);
        });
      }
    }
    
    // 미정 시간대 씬들은 마지막에 추가 (최적화 없이)
    if (timeSlotGroupsInLocation['미정']) {
      console.log(`  ⏰ 미정 시간대 씬들 추가 (${timeSlotGroupsInLocation['미정'].length}개 씬)`);
      
      // 미정 시간대 씬들도 기본 시간 정보 추가
      const undefinedTimeScenes = timeSlotGroupsInLocation['미정'].map(scene => ({
        ...scene,
        timeSlot: '미정',
        actualShootingDuration: getSafeDuration(scene),
        sceneStartTime: '10:00', // 기본 시작 시간
        sceneEndTime: addMinutesToTime('10:00', getSafeDuration(scene)),
        timeSlotDisplay: `미정 (10:00 ~ ${addMinutesToTime('10:00', getSafeDuration(scene))})`
      }))
      
      locationTimeSlotOptimizedScenes.push(...undefinedTimeScenes)
    }
  }
  
  console.log('🎯 최종 최적화된 씬들:', locationTimeSlotOptimizedScenes.map(scene => ({
    scene: scene.scene,
    title: scene.title,
    timeSlot: scene.timeSlot,
    timeSlotDisplay: scene.timeSlotDisplay,
    sceneStartTime: scene.sceneStartTime,
    sceneEndTime: scene.sceneEndTime,
    actualShootingDuration: scene.actualShootingDuration,
    keywords: scene.keywords
  })));
  
  // 디버깅: 시간대별 최적화 결과 확인
  locationTimeSlotOptimizedScenes.forEach((scene, index) => {
    console.log(`[DEBUG] 최종 씬 ${index + 1}:`, {
      scene: scene.scene,
      title: scene.title,
      timeSlot: scene.timeSlot,
      timeSlotDisplay: scene.timeSlotDisplay,
      sceneStartTime: scene.sceneStartTime,
      sceneEndTime: scene.sceneEndTime,
      actualShootingDuration: scene.actualShootingDuration,
      keywords: scene.keywords?.timeOfDay
    });
  });
  
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
  
  console.log('[SchedulerService] 장소별 시간대별 스케줄 배치 시작:', {
    totalScenes: locationTimeSlotOptimizedScenes.length,
    maxDailyDuration: MAX_DAILY_DURATION
  })
  
  for (let i = 0; i < locationTimeSlotOptimizedScenes.length; i++) {
    const scene = locationTimeSlotOptimizedScenes[i]
    const sceneDuration = scene.actualShootingDuration || getSafeDuration(scene)
    const sceneLocation = extractLocationFromConte(scene)
    const sceneTimeSlot = extractTimeSlotFromConte(scene)
    
    // 디버깅: 최적화된 씬 정보 확인
    console.log(`[SchedulerService] 최적화된 씬 ${i + 1}:`, {
      scene: scene.scene,
      title: scene.title,
      timeSlot: scene.timeSlot,
      timeSlotDisplay: scene.timeSlotDisplay,
      sceneStartTime: scene.sceneStartTime,
      sceneEndTime: scene.sceneEndTime,
      actualShootingDuration: scene.actualShootingDuration,
      sceneLocation,
      sceneTimeSlot
    });
    
    // 디버깅: 분량과 실제 촬영 시간 출력
    console.log(`[DEBUG] 씬 ${scene.scene} - 분량: ${scene.estimatedDuration}, 실제촬영: ${sceneDuration}, 시간대: ${sceneTimeSlot}`);
    
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
      console.log(`[SchedulerService] 시간 부족으로 씬 ${scene.scene}을 다음 날(${currentDay})의 첫 씬으로 배치`);
      continue;
    }

    // 씬을 현재 날짜에 추가
    currentDayScenes.push(scene)
    currentDayDuration += sceneDuration + (currentDayScenes.length > 1 ? SCENE_BREAK_TIME : 0)
    currentDayLocation = sceneLocation
    currentDayTimeSlot = sceneTimeSlot

    console.log(`[SchedulerService] 씬 ${scene.scene} 추가:`, {
      day: currentDay,
      location: sceneLocation,
      timeSlot: sceneTimeSlot,
      duration: sceneDuration,
      totalDuration: currentDayDuration,
      scenesCount: currentDayScenes.length,
      sceneTitle: scene.title
    })
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
  
  console.log('[SchedulerService] 시간대별 스케줄 생성 완료:', {
    totalDays: days.length,
    totalScenes: days.reduce((total, day) => total + day.totalScenes, 0)
  })
  
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
  // 디버깅용 로그
  console.log(`[SchedulerService] Day ${dayNumber}, 장소: ${location}, 시간대: ${timeSlot} 스케줄 생성:`, {
    scenesCount: scenes.length,
    totalDuration: duration,
    locations: scenes.map(scene => extractLocationFromConte(scene)),
    timeSlots: scenes.map(scene => extractTimeSlotFromConte(scene)),
    sceneTitles: scenes.map(scene => scene.title || `씬 ${scene.scene}`)
  })
  
  // 시간대별 시간 범위 설정
  const timeRange = timeSlot ? getTimeSlotRange(timeSlot) : null
  
  // 디버깅: 씬들의 시간 정보 확인
  console.log(`[SchedulerService] Day ${dayNumber} 씬들의 시간 정보:`, scenes.map(scene => ({
    scene: scene.scene,
    title: scene.title,
    timeSlot: scene.timeSlot,
    timeSlotDisplay: scene.timeSlotDisplay,
    sceneStartTime: scene.sceneStartTime,
    sceneEndTime: scene.sceneEndTime,
    actualShootingDuration: scene.actualShootingDuration
  })));
  
  // 각 씬에 상세 정보 추가
  const scenesWithDetails = scenes.map(scene => ({
    ...scene,
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
    optimizationScore: calculateDayOptimizationScore(scenes),
    efficiency: calculateDayEfficiency(scenes, duration)
  }
}

/**
 * 일일 효율성 계산
 * @param {Array} scenes - 씬 배열
 * @param {number} duration - 총 시간
 * @returns {number} 효율성 점수
 */
const calculateDayEfficiency = (scenes, duration) => {
  // scenes의 duration을 안전하게 합산
  const safeDuration = typeof duration === 'number' && !isNaN(duration) && duration > 0
    ? duration
    : scenes.reduce((total, scene) => total + getSafeDuration(scene), 0);
  if (scenes.length === 0) return 0;
  
  // 단일 씬인 경우 특별 처리
  if (scenes.length === 1) {
    const singleScene = scenes[0]
    const sceneDuration = getSafeDuration(singleScene)
    
    // 단일 씬 효율성: 기본 60% + 촬영시간에 따른 보너스
    let efficiency = 60 // 기본 효율성
    
    // 촬영시간에 따른 조정
    if (sceneDuration >= 30 && sceneDuration <= 60) {
      efficiency += 10 // 적절한 촬영시간 보너스
    } else if (sceneDuration > 60) {
      efficiency += 20 // 긴 촬영시간 보너스
    } else if (sceneDuration < 30) {
      efficiency -= 10 // 짧은 촬영시간 페널티
    }
    
    console.log(`📊 단일 씬 효율성 계산:`, {
      scene: singleScene.scene,
      duration: `${sceneDuration}분`,
      efficiency: `${efficiency}%`
    });
    
    return Math.min(100, Math.max(0, efficiency))
  }
  
  // 다중 씬인 경우 기존 계산 방식 사용
  // 장소 효율성 (같은 장소에서 연속 촬영 시 100% 효율성)
  const locations = scenes.map(scene => extractLocationFromConte(scene))
  const uniqueLocations = new Set(locations)
  
  // 같은 장소에서 연속 촬영 시 100% 효율성, 다른 장소가 있으면 비례 계산
  const locationEfficiency = uniqueLocations.size === 1 ? 1 : (scenes.length - uniqueLocations.size) / scenes.length
  
  // 시간 효율성 (6-8시간이 가장 효율적) - 분 단위로 변환
  const timeEfficiency = safeDuration >= 360 && safeDuration <= 480 ? 1 : 
                        safeDuration >= 240 && safeDuration <= 600 ? 0.7 : 0.3
  
  // 배우 효율성 (같은 배우들이 연속 출연하는 경우 100% 효율성)
  const allActors = scenes.map(scene => extractActorsFromConte(scene))
  
  let actorEfficiency = 0 // 변수를 블록 외부에서 선언
  
  if (allActors.length > 0) {
    // 모든 씬에서 동일한 배우들이 나오는지 확인
    const firstActors = new Set(allActors[0])
    const allActorsSets = allActors.map(actors => new Set(actors))
    
    // 모든 씬에서 동일한 배우들이 나오는지 확인
    const allSameActors = allActorsSets.every(actorSet => {
      if (actorSet.size !== firstActors.size) return false
      return Array.from(actorSet).every(actor => firstActors.has(actor))
    })
    
    // 동일한 배우들이 연속 출연하면 100%, 아니면 비례 계산
    actorEfficiency = allSameActors ? 1 : 
      (allActors.flat().length - new Set(allActors.flat()).size) / allActors.flat().length
  }
  
  return Math.round((locationEfficiency * 0.5 + timeEfficiency * 0.3 + actorEfficiency * 0.2) * 100)
}

/**
 * 일정 최적화 (빈 날 제거, 효율성 개선)
 * @param {Array} days - 일정 배열
 * @returns {Array} 최적화된 일정 배열
 */
const optimizeScheduleDays = (days) => {
  if (days.length <= 1) return days
  
  const optimizedDays = []
  let dayCounter = 1
  
  for (const day of days) {
    // 효율성이 너무 낮은 날은 다음 날과 병합 시도
    if (day.efficiency < 30 && optimizedDays.length > 0) {
      const lastDay = optimizedDays[optimizedDays.length - 1]
      const combinedScenes = [...lastDay.scenes, ...day.scenes]
      const combinedDuration = lastDay.estimatedDuration + day.estimatedDuration
      
      // 병합 가능한지 확인 (총 10시간 이하, 8개 씬 이하) - 분 단위로 변환
      if (combinedDuration <= 600 && combinedScenes.length <= 8) {
        // 병합
        optimizedDays[optimizedDays.length - 1] = createDaySchedule(
          lastDay.day, 
          combinedScenes, 
          combinedDuration,
          lastDay.location // 병합 시 장소 유지
        )
        continue
      }
    }
    
    // 새로운 날로 추가
    optimizedDays.push({
      ...day,
      day: dayCounter
    })
    dayCounter++
  }
  
  return optimizedDays
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
 * 일일 최적화 점수 계산 (우선순위 기반)
 * @param {Array} scenes - 씬 배열
 * @returns {number} 최적화 점수
 */
const calculateDayOptimizationScore = (scenes) => {
  if (scenes.length === 0) return 0
  
  let score = 0
  
  // 1. 같은 장소 보너스 (최우선)
  const locations = scenes.map(scene => extractLocationFromConte(scene))
  const uniqueLocations = new Set(locations)
  score += (scenes.length - uniqueLocations.size) * 1000 // 최우선 가중치
  
  // 2. 같은 배우 보너스 (두 번째 우선순위)
  const actors = scenes.map(scene => extractActorsFromConte(scene)).flat()
  const uniqueActors = new Set(actors)
  const actorEfficiency = actors.length - uniqueActors.size
  score += actorEfficiency * 500 // 두 번째 우선순위
  
  // 3. 같은 시간대 보너스 (세 번째 우선순위)
  const timeSlots = scenes.map(scene => extractTimeSlotFromConte(scene))
  const uniqueTimeSlots = new Set(timeSlots.filter(slot => slot !== '미정'))
  const timeSlotEfficiency = timeSlots.length - uniqueTimeSlots.size
  score += timeSlotEfficiency * 200 // 세 번째 우선순위
  
  // 4. 같은 장비 보너스 (네 번째 우선순위)
  const equipments = scenes.map(scene => extractEquipmentFromConte(scene))
  const uniqueEquipments = new Set(equipments)
  score += (scenes.length - uniqueEquipments.size) * 100 // 네 번째 우선순위
  
  // 5. 복잡도 보너스 (다섯 번째 우선순위)
  const totalDuration = scenes.reduce((total, scene) => total + (scene.estimatedDuration || 5), 0)
  if (totalDuration >= 360 && totalDuration <= 480) { // 6-8시간을 분 단위로 변환
    score += 50 // 적절한 작업량 보너스
  }
  
  // 6. 효율성 보너스
  if (scenes.length >= 3 && score > 1000) {
    score += 100 // 높은 효율성 보너스
  }
  
  return score
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
    
    console.log(`📊 단일 씬 효율성 계산:`, {
      duration: `${duration}분`,
      efficiency: `${efficiency}%`
    });
  } else {
    // 다중 씬인 경우: 기존 계산 방식 사용
    const maxPossibleScore = 2000 // 최대 가능한 점수
    efficiency = Math.min(100, Math.round((averageScore / maxPossibleScore) * 100))
    
    console.log(`📊 다중 씬 최적화 점수 계산:`, {
      totalScore,
      averageScore,
      maxPossibleScore,
      efficiency: `${efficiency}%`
    });
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
  // 실제 촬영 시간 계산 (분량 시간의 20배)
  const contentDuration = num; // 분량 시간
  const shootingRatio = 20; // 20배 고정 (현실적인 촬영 비율)
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
  
  // isLateStart 값 콘솔 출력
  console.log(`🔍 [optimizeScenesByTimeSlot] 시간대: ${timeOfDay}, isLateStart: ${isLateStart}`);
  if (allScenesInLocation) {
    console.log(`📍 같은 장소의 모든 씬들:`, allScenesInLocation.map(s => ({
      scene: s.scene,
      title: s.title,
      timeOfDay: extractTimeSlotFromConte(s)
    })));
  }
  
  // 낮 씬이면서 밤 씬이 같은 장소에 있으면 늦은 낮부터 시작
  const timeRange = getTimeSlotRange(timeOfDay, scenes, isLateStart);
  console.log(`⏰ 시간대별 최적화: ${timeOfDay} (${scenes.length}개 씬)`);
  
  // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
  const availableMinutes = timeRange.availableMinutes
  
  console.log(`  📅 시간 범위: ${timeRange.label} (총 ${availableMinutes}분)`);
  
  // 씬이 1개 이하일 때도 시간 정보 설정
  if (scenes.length <= 1) {
    const optimizedScenes = scenes.map(scene => {
      const sceneDuration = getSafeDuration(scene)
      const sceneStartTime = timeRange.optimalStartTime
      const sceneEndTime = addMinutesToTime(sceneStartTime, sceneDuration)
      
      console.log(`  📋 단일 씬 "${scene.title}" 시간 설정:`);
      console.log(`    - 분량: ${scene.estimatedDuration}분`);
      console.log(`    - 실제 촬영시간: ${sceneDuration}분`);
      console.log(`    - 시작시간: ${sceneStartTime}, 종료시간: ${sceneEndTime}`);
      
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
        timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`
      }
    })
    
    console.log(`  ✅ 단일 씬 최적화 완료: ${optimizedScenes.length}개 씬`);
    return optimizedScenes
  }
  
  // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
  console.log(`  📅 시간 범위: ${timeRange.label} (총 ${availableMinutes}분)`);
  
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
  
  console.log(`  🎬 시간대별 촬영 스케줄 시작: ${currentTime}부터`);
  
  for (const scene of sortedScenes) {
    const sceneDuration = getSafeDuration(scene)
    const sceneBreakTime = 60 // 씬 간 휴식 시간 (1시간 = 60분)
    const totalSceneTime = sceneDuration + sceneBreakTime
    
    console.log(`  📋 씬 "${scene.title}" 검토:`);
    console.log(`    - 분량: ${scene.estimatedDuration}분`);
    console.log(`    - 실제 촬영시간: ${sceneDuration}분`);
    console.log(`    - 휴식시간 포함: ${totalSceneTime}분`);
    console.log(`    - 남은 시간: ${remainingMinutes}분`);
    
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
        timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`
      })
      
      console.log(`  ✅ 씬 "${scene.title}" timeSlotDisplay 설정: ${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`)
      
      remainingMinutes -= totalSceneTime
      currentTime = addMinutesToTime(sceneEndTime, sceneBreakTime)
      
      console.log(`  ✅ 씬 "${scene.title}" 배치 완료:`);
      console.log(`    - 시작: ${sceneStartTime}, 종료: ${sceneEndTime}`);
      console.log(`    - 남은 시간: ${remainingMinutes}분`);
    } else {
      console.log(`  ⚠️ 씬 "${scene.title}" 시간 부족으로 배치 불가`);
      console.log(`    - 필요 시간: ${totalSceneTime}분`);
      console.log(`    - 남은 시간: ${remainingMinutes}분`);
    }
  }
  
  console.log(`  🎯 시간대별 최적화 완료: ${optimizedScenes.length}개 씬 배치됨`);
  
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
  
  console.log('🕐 시간대별 슬롯 생성 시작:', scenes.length, '개 씬');
  
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
    
    console.log(`  📋 씬 ${scene.scene || idx + 1}:`);
    console.log(`    - 제목: ${scene.title}`);
    console.log(`    - 시작: ${startTime}, 종료: ${endTime}`);
    console.log(`    - 촬영시간: ${durationMin}분`);
    console.log(`    - 휴식시간: ${breakTime}분`);
    console.log(`    - 다음 씬 시작: ${nextStartTime}`);
    
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
  
  console.log('✅ 시간대별 슬롯 생성 완료');
  
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
  console.log('👥 인력 추출:', {
    id: conte.id,
    title: conte.title,
    hasScheduling: !!conte.scheduling,
    hasKeywords: !!conte.keywords
  });
  
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
  
  console.log('✅ 추출된 인력:', crew);
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
  
  console.log('🎭 배우 비교:', {
    scene1: { id: scene1.id, title: scene1.title, actors: actors1 },
    scene2: { id: scene2.id, title: scene2.title, actors: actors2 }
  });
  
  return actors1.some(actor => actors2.includes(actor))
}

/**
 * 콘티에서 배우 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 배우 배열
 */
const extractActorsFromConte = (conte) => {
  console.log('🎭 배우 추출:', {
    id: conte.id,
    title: conte.title,
    hasKeywords: !!conte.keywords,
    keywordsCast: conte.keywords?.cast,
    fallbackCast: conte.cast
  });
  
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
  
  console.log('⏰ 시간대 비교:', {
    scene1: { id: scene1.id, title: scene1.title, time: time1 },
    scene2: { id: scene2.id, title: scene2.title, time: time2 }
  });
  
  return time1 === time2
}

/**
 * 콘티에서 시간대 정보 추출
 * @param {Object} conte - 콘티 객체
 * @returns {string} 시간대 정보
 */
const extractTimeSlotFromConte = (conte) => {
  console.log('⏰ 시간대 추출:', {
    id: conte.id,
    title: conte.title,
    hasKeywords: !!conte.keywords,
    keywordsTimeOfDay: conte.keywords?.timeOfDay,
    fallbackTimeOfDay: conte.timeOfDay
  });
  
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
 * 콘티에서 장비 정보 추출 (개선된 버전)
 * @param {Object} conte - 콘티 객체
 * @returns {Array} 추출된 장비 리스트
 */
const extractEquipmentFromConte = (conte) => {
  console.log('🎥 장비 추출:', {
    id: conte.id,
    title: conte.title,
    hasScheduling: !!conte.scheduling,
    hasKeywords: !!conte.keywords
  });
  
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
  
  console.log('✅ 추출된 장비:', equipment);
  return equipment;
}

/**
 * 콘티에서 카메라 정보 추출 (개선된 버전)
 * @param {Object} conte - 콘티 객체
 * @returns {Object} 추출된 카메라 정보
 */
const extractCameraFromConte = (conte) => {
  console.log('📹 카메라 정보 추출:', {
    id: conte.id,
    title: conte.title,
    hasScheduling: !!conte.scheduling,
    hasKeywords: !!conte.keywords
  });
  
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
  
  console.log('✅ 추출된 카메라 정보:', cameraInfo);
  return cameraInfo;
} 