/**
 * 스케줄러 서비스
 * Scene 데이터를 바탕으로 최적의 촬영 스케줄을 생성하는 서비스
 * PRD 스케줄러 기능의 핵심 로직
 */

/**
 * Scene 데이터를 바탕으로 최적의 촬영 스케줄 생성
 * @param {Array} sceneData - Scene 데이터 배열
 * @returns {Object} 최적화된 스케줄 데이터
 */
export const generateOptimalSchedule = (sceneData) => {
  try {
    console.log('🎬 스케줄러 시작 - 입력 데이터:', {
      totalCount: sceneData?.length || 0,
      isArray: Array.isArray(sceneData),
      firstItem: sceneData?.[0] ? {
        id: sceneData[0]._id,
        scene: sceneData[0].scene,
        title: sceneData[0].title,
        location: sceneData[0].location?.name,
        timeOfDay: sceneData[0].timeOfDay
      } : '없음'
    });
    
    // 모든 Scene을 사용 (Scene은 기본적으로 실사 촬영용)
    const scenes = sceneData;
    
    console.log('🎬 Scene 데이터 처리 결과:', {
      total: sceneData.length,
      scenes: scenes.length
    });
    
    if (scenes.length === 0) {
      console.warn('⚠️ 스케줄러: Scene이 없음');
      return { 
        days: [], 
        totalDays: 0,
        totalScenes: 0,
        estimatedTotalDuration: 0,
        message: 'Scene이 없습니다.'
      }
    }
    
    // 각 Scene의 스케줄링 정보 로깅
    scenes.forEach((scene, index) => {
      console.log(`🎬 Scene ${index + 1} 스케줄링 정보:`, {
        id: scene._id,
        scene: scene.scene,
        title: scene.title,
        location: scene.location?.name,
        timeOfDay: scene.timeOfDay,
        cast: scene.cast,
        crew: scene.crew,
        equipment: scene.equipment
      });
    });
    
    // 장소별로 그룹화
    const locationGroups = groupByLocation(scenes)
    console.log('🎬 장소별 그룹화 결과:', Object.keys(locationGroups));
    
    // 장비별로 그룹화
    const equipmentGroups = groupByEquipment(scenes)
    console.log('🎬 장비별 그룹화 결과:', Object.keys(equipmentGroups));
    
    // 가중치 계산 및 최적화
    const optimizedSchedule = optimizeScheduleWithWeights(scenes, locationGroups, equipmentGroups)
    
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
 * @param {Array} sceneData - Scene 데이터
 * @returns {Object} 장소별 그룹화된 데이터
 */
const groupByLocation = (sceneData) => {
  const groups = {}
  
  sceneData.forEach(scene => {
    // Scene에서 장소 정보 추출
    const location = extractLocationFromScene(scene) || '미정'
    
    if (!groups[location]) {
      groups[location] = []
    }
    groups[location].push(scene)
  })
  
  return groups
}

/**
 * Scene에서 장소 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {string} 추출된 장소 정보
 */
const extractLocationFromScene = (scene) => {
  console.log('📍 장소 추출:', {
    id: scene._id,
    scene: scene.scene,
    title: scene.title,
    locationName: scene.location?.name,
    realLocationId: scene.location?.realLocationId
  });
  
  // Scene의 location.name 사용
  if (scene.location && scene.location.name && scene.location.name !== '') {
    return scene.location.name
  }
  // 정보가 없으면 '미정' 반환
  return '미정'
}

/**
 * 장비별 그룹화 (Scene 스키마 기반)
 * @param {Array} sceneData - Scene 데이터
 * @returns {Object} 장비별 그룹화된 데이터
 */
const groupByEquipment = (sceneData) => {
  const groups = {}
  
  sceneData.forEach(scene => {
    // Scene에서 장비 정보 추출 (배열로 반환됨)
    const equipmentList = extractEquipmentFromScene(scene)
    
    // 각 장비별로 그룹화
    equipmentList.forEach(equipment => {
      if (!groups[equipment]) {
        groups[equipment] = []
      }
      // 중복 방지
      if (!groups[equipment].find(s => s._id === scene._id)) {
        groups[equipment].push(scene)
      }
    })
  })
  
  return groups
}

/**
 * 가중치 기반 스케줄 최적화
 * @param {Array} allScenes - 모든 Scene 데이터
 * @param {Object} locationGroups - 장소별 그룹
 * @param {Object} equipmentGroups - 장비별 그룹
 * @returns {Object} 최적화된 스케줄
 */
const optimizeScheduleWithWeights = (allScenes, locationGroups, equipmentGroups) => {
  // 각 Scene에 대한 가중치 계산
  const scenesWithWeights = allScenes.map(scene => ({
    ...scene,
    weight: calculateSceneWeight(scene, allScenes)
  }))
  
  // 가중치 기반으로 Scene들을 최적화된 순서로 정렬
  const optimizedScenes = optimizeSceneOrder(scenesWithWeights)
  
  // 최적화된 Scene들을 일정으로 배치
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
 * Scene의 가중치 계산 (우선순위 기반)
 * @param {Object} scene - Scene 객체
 * @param {Array} allScenes - 모든 Scene 배열
 * @returns {number} 가중치 점수
 */
const calculateSceneWeight = (scene, allScenes) => {
  let weight = 0
  
  // 1. 장소 가중치 (최우선) - 같은 장소의 Scene이 많을수록 높은 가중치
  const sameLocationScenes = allScenes.filter(s => 
    extractLocationFromScene(s) === extractLocationFromScene(scene)
  )
  weight += sameLocationScenes.length * 1000 // 최우선 가중치
  
  // 2. 배우 가중치 (두 번째 우선순위) - 같은 배우가 나오는 Scene이 많을수록 높은 가중치
  const sameActorScenes = allScenes.filter(s => 
    hasSameActors(s, scene)
  )
  weight += sameActorScenes.length * 500 // 두 번째 우선순위
  
  // 3. 촬영 시간대 가중치 (세 번째 우선순위) - 같은 시간대 촬영이 많을수록 높은 가중치
  const sameTimeSlotScenes = allScenes.filter(s => 
    hasSameTimeSlot(s, scene)
  )
  weight += sameTimeSlotScenes.length * 200 // 세 번째 우선순위
  
  // 4. 장비 가중치 (네 번째 우선순위) - 같은 장비의 Scene이 많을수록 높은 가중치
  const sameEquipmentScenes = allScenes.filter(s => 
    extractEquipmentFromScene(s) === extractEquipmentFromScene(scene)
  )
  weight += sameEquipmentScenes.length * 100 // 네 번째 우선순위
  
  // 5. 복잡도 가중치 (다섯 번째 우선순위) - 긴 Scene은 높은 가중치
  const duration = scene.estimatedDuration || '5분'
  const durationMinutes = parseDurationToMinutes(duration)
  weight += durationMinutes * 10 // 복잡도는 낮은 우선순위
  
  // 6. 우선순위 가중치 (Scene 번호가 낮을수록 높은 가중치)
  const sceneNumber = scene.scene || 1
  weight += (100 - sceneNumber) * 1
  
  // 7. Scene 우선순위 가중치 (Scene 스키마의 priorities 사용)
  if (scene.priorities) {
    weight += scene.priorities.location * 50
    weight += scene.priorities.cast * 30
    weight += scene.priorities.time * 20
    weight += scene.priorities.equipment * 10
  }
  
  return weight
}

/**
 * 시간 문자열을 분으로 변환
 * @param {string} duration - 시간 문자열 (예: "5분", "10분")
 * @returns {number} 분 단위 시간
 */
const parseDurationToMinutes = (duration) => {
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)분/)
    return match ? Number(match[1]) : 5
  }
  return typeof duration === 'number' ? duration : 5
}

/**
 * 가중치 기반으로 Scene 순서 최적화
 * @param {Array} scenesWithWeights - 가중치가 포함된 Scene 배열
 * @returns {Array} 최적화된 Scene 순서
 */
const optimizeSceneOrder = (scenesWithWeights) => {
  if (scenesWithWeights.length <= 2) {
    // Scene이 2개 이하일 때는 단순 정렬
    return [...scenesWithWeights].sort((a, b) => b.weight - a.weight)
  }
  
  // 다중 Scene을 위한 개선된 그리디 알고리즘
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
      
      // 사용되지 않은 Scene들만 추가
      for (const scene of sortedGroupScenes) {
        if (!usedScenes.has(scene._id)) {
          optimizedOrder.push(scene)
          usedScenes.add(scene._id)
        }
      }
    }
  }
  
  // 4단계: 남은 Scene들을 가중치 순으로 추가
  const remainingScenes = scenesWithWeights.filter(scene => !usedScenes.has(scene._id))
  remainingScenes.sort((a, b) => b.weight - a.weight)
  optimizedOrder.push(...remainingScenes)
  
  return optimizedOrder
}

/**
 * 장소별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 장소별 그룹 객체
 */
const groupScenesByLocation = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const location = extractLocationFromScene(scene)
    if (!groups[location]) {
      groups[location] = []
    }
    groups[location].push(scene)
  })
  
  return groups
}

/**
 * 배우별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 배우별 그룹 객체
 */
const groupScenesByActors = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const actors = extractActorsFromScene(scene)
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
 * 시간대별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 시간대별 그룹 객체
 */
const groupScenesByTimeSlot = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const timeSlot = extractTimeSlotFromScene(scene)
    if (!groups[timeSlot]) {
      groups[timeSlot] = []
    }
    groups[timeSlot].push(scene)
  })
  
  console.log('🕐 시간대별 그룹화 결과:', Object.keys(groups).map(key => `${key}: ${groups[key].length}개`));
  
  return groups
}

/**
 * 장비별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 장비별 그룹 객체
 */
const groupScenesByEquipment = (scenes) => {
  const groups = {}
  
  scenes.forEach(scene => {
    const equipment = extractEquipmentFromScene(scene)
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
      if (usedInGroup.has(scene._id)) continue
      
      // 현재 그룹 순서에 씬을 추가했을 때의 점수 계산
      const score = calculateGroupCombinationScore([...optimizedGroupOrder, scene], currentOrder)
      
      if (score > bestScore) {
        bestScore = score
        bestScene = scene
      }
    }
    
    if (bestScene) {
      optimizedGroupOrder.push(bestScene)
      usedInGroup.add(bestScene._id)
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
    const prevLocation = extractLocationFromScene(scenes[i-1])
    const currLocation = extractLocationFromScene(scenes[i])
    
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
    const prevTimeSlot = extractTimeSlotFromScene(scenes[i-1])
    const currTimeSlot = extractTimeSlotFromScene(scenes[i])
    
    if (prevTimeSlot === currTimeSlot && prevTimeSlot !== '미정') {
      score += 200 // 세 번째 우선순위 보너스 (같은 시간대)
    }
  }
  
  // 4. 같은 장비의 씬들이 연속되면 네 번째 우선순위 보너스
  for (let i = 1; i < scenes.length; i++) {
    const prevEquipment = extractEquipmentFromScene(scenes[i-1])
    const currEquipment = extractEquipmentFromScene(scenes[i])
    
    if (prevEquipment === currEquipment) {
      score += 100 // 네 번째 우선순위 보너스 (같은 장비)
    }
  }
  
  // 5. 복잡도 보너스 (긴 Scene들이 연속되면 보너스)
  for (let i = 1; i < scenes.length; i++) {
    const prevDuration = parseDurationToMinutes(scenes[i-1].estimatedDuration || '5분')
    const currDuration = parseDurationToMinutes(scenes[i].estimatedDuration || '5분')
    
    if (prevDuration >= 8 && currDuration >= 8) {
      score += 50 // 복잡한 Scene 연속 보너스
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
    const location = extractLocationFromScene(scene)
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
    const sceneLocation = extractLocationFromScene(scene)
    const sceneTimeSlot = extractTimeSlotFromScene(scene)
    
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
    locations: scenes.map(scene => extractLocationFromScene(scene)),
    timeSlots: scenes.map(scene => extractTimeSlotFromScene(scene)),
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
    cameraDetails: extractCameraFromScene(scene),
    // 상세 인력 정보 추가
    crewDetails: extractCrewFromScene(scene),
    // 상세 장비 정보 추가
    equipmentDetails: extractEquipmentFromScene(scene)
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
  const locations = scenes.map(scene => extractLocationFromScene(scene))
  const uniqueLocations = new Set(locations)
  
  // 같은 장소에서 연속 촬영 시 100% 효율성, 다른 장소가 있으면 비례 계산
  const locationEfficiency = uniqueLocations.size === 1 ? 1 : (scenes.length - uniqueLocations.size) / scenes.length
  
  // 시간 효율성 (6-8시간이 가장 효율적) - 분 단위로 변환
  const timeEfficiency = safeDuration >= 360 && safeDuration <= 480 ? 1 : 
                        safeDuration >= 240 && safeDuration <= 600 ? 0.7 : 0.3
  
  // 배우 효율성 (같은 배우들이 연속 출연하는 경우 100% 효율성)
  const allActors = scenes.map(scene => extractActorsFromScene(scene))
  
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
    const location = extractLocationFromScene(scene)
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
  const locations = scenes.map(scene => extractLocationFromScene(scene))
  const uniqueLocations = new Set(locations)
  score += (scenes.length - uniqueLocations.size) * 1000 // 최우선 가중치
  
  // 2. 같은 배우 보너스 (두 번째 우선순위)
  const actors = scenes.map(scene => extractActorsFromScene(scene)).flat()
  const uniqueActors = new Set(actors)
  const actorEfficiency = actors.length - uniqueActors.size
  score += actorEfficiency * 500 // 두 번째 우선순위
  
  // 3. 같은 시간대 보너스 (세 번째 우선순위)
  const timeSlots = scenes.map(scene => extractTimeSlotFromScene(scene))
  const uniqueTimeSlots = new Set(timeSlots.filter(slot => slot !== '미정'))
  const timeSlotEfficiency = timeSlots.length - uniqueTimeSlots.size
  score += timeSlotEfficiency * 200 // 세 번째 우선순위
  
  // 4. 같은 장비 보너스 (네 번째 우선순위)
  const equipments = scenes.map(scene => extractEquipmentFromScene(scene))
  const uniqueEquipments = new Set(equipments)
  score += (scenes.length - uniqueEquipments.size) * 100 // 네 번째 우선순위
  
  // 5. 복잡도 보너스 (다섯 번째 우선순위)
  const totalDuration = scenes.reduce((total, scene) => total + parseDurationToMinutes(scene.estimatedDuration || '5분'), 0)
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
    // 단일 Scene인 경우: 기본 효율성 60% + 추가 보너스
    const singleScene = days[0].scenes[0]
    const duration = parseDurationToMinutes(singleScene.estimatedDuration || '5분')
    
    // 촬영 시간에 따른 효율성 조정
    if (duration >= 30 && duration <= 60) {
      efficiency = 70 // 적절한 촬영 시간
    } else if (duration > 60) {
      efficiency = 80 // 긴 촬영 시간 (집중 촬영)
    } else {
      efficiency = 60 // 짧은 촬영 시간
    }
    
    console.log(`📊 단일 Scene 효율성 계산:`, {
      duration: `${duration}분`,
      efficiency: `${efficiency}%`
    });
  } else {
    // 다중 Scene인 경우: 기존 계산 방식 사용
    const maxPossibleScore = 2000 // 최대 가능한 점수
    efficiency = Math.min(100, Math.round((averageScore / maxPossibleScore) * 100))
    
    console.log(`📊 다중 Scene 최적화 점수 계산:`, {
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
 * @param {Array} scenes - Scene 배열
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
 * @param {Array} scenes - Scene 배열
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
 * @param {Object} scene - Scene 객체
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
      const t = extractTimeSlotFromScene(s);
      return t === '밤' || t === 'night';
    });
  }
  
  // isLateStart 값 콘솔 출력
  console.log(`🔍 [optimizeScenesByTimeSlot] 시간대: ${timeOfDay}, isLateStart: ${isLateStart}`);
  if (allScenesInLocation) {
    console.log(`📍 같은 장소의 모든 씬들:`, allScenesInLocation.map(s => ({
      scene: s.scene,
      title: s.title,
      timeOfDay: extractTimeSlotFromScene(s)
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
 * @param {Array} sceneData - Scene 데이터
 * @returns {Object} 브레이크다운 데이터
 */
export const generateBreakdown = (sceneData) => {
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
    
    sceneData.forEach(scene => {
      // 1. 장소별 분류 (최우선)
      const location = extractLocationFromScene(scene)
      if (!breakdown.locations[location]) {
        breakdown.locations[location] = []
      }
      breakdown.locations[location].push(scene)
      
      // 2. 배우별 분류 (두 번째 우선순위)
      const actors = extractActorsFromScene(scene)
      actors.forEach(actor => {
        if (!breakdown.actors[actor]) {
          breakdown.actors[actor] = []
        }
        breakdown.actors[actor].push(scene)
      })
      
      // 3. 시간대별 분류 (세 번째 우선순위)
      const timeSlot = extractTimeSlotFromScene(scene)
      if (!breakdown.timeSlots[timeSlot]) {
        breakdown.timeSlots[timeSlot] = []
      }
      breakdown.timeSlots[timeSlot].push(scene)
      
      // 4. 장비별 분류 (네 번째 우선순위)
      const equipment = extractEquipmentFromScene(scene)
      if (!breakdown.equipment[equipment]) {
        breakdown.equipment[equipment] = []
      }
      breakdown.equipment[equipment].push(scene)
      
      // 5. 인력별 분류
      const crew = extractCrewFromScene(scene)
      crew.forEach(member => {
        if (!breakdown.crew[member]) {
          breakdown.crew[member] = []
        }
        breakdown.crew[member].push(scene)
      })
      
      // 6. 소품별 분류
      const props = extractPropsFromScene(scene)
      props.forEach(prop => {
        if (!breakdown.props[prop]) {
          breakdown.props[prop] = []
        }
        breakdown.props[prop].push(scene)
      })
      
      // 7. 의상별 분류
      const costumes = extractCostumesFromScene(scene)
      costumes.forEach(costume => {
        if (!breakdown.costumes[costume]) {
          breakdown.costumes[costume] = []
        }
        breakdown.costumes[costume].push(scene)
      })
      
      // 8. 카메라별 분류
      const cameraInfo = extractCameraFromScene(scene)
      const cameraKey = `${cameraInfo.model} - ${cameraInfo.lens}`
      if (!breakdown.cameras[cameraKey]) {
        breakdown.cameras[cameraKey] = []
      }
      breakdown.cameras[cameraKey].push({
        ...scene,
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
 * Scene에서 인력 정보 추출 (Scene 스키마 기반)
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 인력 리스트
 */
const extractCrewFromScene = (scene) => {
  console.log('👥 인력 추출:', {
    id: scene._id,
    title: scene.title,
    hasCrew: !!scene.crew
  });
  
  const crew = [];
  
  // Scene 스키마의 crew 구조 사용
  if (scene.crew) {
    // 연출부
    if (scene.crew.direction) {
      const direction = scene.crew.direction;
      if (direction.director) crew.push(direction.director);
      if (direction.assistantDirector) crew.push(direction.assistantDirector);
      if (direction.scriptSupervisor) crew.push(direction.scriptSupervisor);
      if (direction.continuity) crew.push(direction.continuity);
    }
    
    // 제작부
    if (scene.crew.production) {
      const production = scene.crew.production;
      if (production.producer) crew.push(production.producer);
      if (production.lineProducer) crew.push(production.lineProducer);
      if (production.productionManager) crew.push(production.productionManager);
      if (production.productionAssistant) crew.push(production.productionAssistant);
    }
    
    // 촬영부
    if (scene.crew.cinematography) {
      const cinematography = scene.crew.cinematography;
      if (cinematography.cinematographer) crew.push(cinematography.cinematographer);
      if (cinematography.cameraOperator) crew.push(cinematography.cameraOperator);
      if (cinematography.firstAssistant) crew.push(cinematography.firstAssistant);
      if (cinematography.secondAssistant) crew.push(cinematography.secondAssistant);
      if (cinematography.dollyGrip) crew.push(cinematography.dollyGrip);
    }
    
    // 조명부
    if (scene.crew.lighting) {
      const lighting = scene.crew.lighting;
      if (lighting.gaffer) crew.push(lighting.gaffer);
      if (lighting.bestBoy) crew.push(lighting.bestBoy);
      if (lighting.electrician) crew.push(lighting.electrician);
      if (lighting.generatorOperator) crew.push(lighting.generatorOperator);
    }
    
    // 음향부
    if (scene.crew.sound) {
      const sound = scene.crew.sound;
      if (sound.soundMixer) crew.push(sound.soundMixer);
      if (sound.boomOperator) crew.push(sound.boomOperator);
      if (sound.soundAssistant) crew.push(sound.soundAssistant);
      if (sound.utility) crew.push(sound.utility);
    }
    
    // 미술부
    if (scene.crew.art) {
      const art = scene.crew.art;
      if (art.productionDesigner) crew.push(art.productionDesigner);
      if (art.artDirector) crew.push(art.artDirector);
      if (art.setDecorator) crew.push(art.setDecorator);
      if (art.propMaster) crew.push(art.propMaster);
      if (art.makeupArtist) crew.push(art.makeupArtist);
      if (art.costumeDesigner) crew.push(art.costumeDesigner);
      if (art.hairStylist) crew.push(art.hairStylist);
    }
  }
  
  // 기본 인력 추가 (정보가 없는 경우)
  if (crew.length === 0) {
    crew.push('감독', '촬영감독', '카메라맨');
  }
  
  console.log('✅ 추출된 인력:', crew);
  return crew;
}

/**
 * Scene에서 소품 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 소품 리스트
 */
const extractPropsFromScene = (scene) => {
  console.log('🎭 소품 추출:', {
    id: scene._id,
    title: scene.title,
    props: scene.props
  });
  
  // Scene 스키마의 props 배열 사용
  if (scene.props && Array.isArray(scene.props)) {
    return scene.props;
  }
  
  // 기본 소품 추가 (정보가 없는 경우)
  return ['기본 소품'];
}

/**
 * Scene에서 배우 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {Array} 배우 배열
 */
const extractActorsFromScene = (scene) => {
  console.log('🎭 배우 추출:', {
    id: scene._id,
    title: scene.title,
    cast: scene.cast
  });
  
  // Scene 스키마의 cast 배열 사용
  if (scene.cast && Array.isArray(scene.cast)) {
    return scene.cast;
  }
  
  return [];
}

/**
 * Scene에서 시간대 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {string} 시간대 정보
 */
const extractTimeSlotFromScene = (scene) => {
  console.log('⏰ 시간대 추출:', {
    id: scene._id,
    title: scene.title,
    timeOfDay: scene.timeOfDay
  });
  
  // Scene 스키마의 timeOfDay 사용
  if (scene.timeOfDay) {
    return scene.timeOfDay;
  }
  
  return '오후'; // 기본값
}

/**
 * Scene에서 장비 정보 추출 (Scene 스키마 기반)
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 장비 리스트
 */
const extractEquipmentFromScene = (scene) => {
  console.log('🎥 장비 추출:', {
    id: scene._id,
    title: scene.title,
    hasEquipment: !!scene.equipment
  });
  
  const equipment = [];
  
  // Scene 스키마의 equipment 구조 사용
  if (scene.equipment) {
    // 연출부 장비
    if (scene.equipment.direction) {
      equipment.push(...scene.equipment.direction.monitors || []);
      equipment.push(...scene.equipment.direction.communication || []);
      equipment.push(...scene.equipment.direction.scriptBoards || []);
    }
    
    // 제작부 장비
    if (scene.equipment.production) {
      equipment.push(...scene.equipment.production.scheduling || []);
      equipment.push(...scene.equipment.production.safety || []);
      equipment.push(...scene.equipment.production.transportation || []);
    }
    
    // 촬영부 장비
    if (scene.equipment.cinematography) {
      equipment.push(...scene.equipment.cinematography.cameras || []);
      equipment.push(...scene.equipment.cinematography.lenses || []);
      equipment.push(...scene.equipment.cinematography.supports || []);
      equipment.push(...scene.equipment.cinematography.filters || []);
      equipment.push(...scene.equipment.cinematography.accessories || []);
    }
    
    // 조명부 장비
    if (scene.equipment.lighting) {
      equipment.push(...scene.equipment.lighting.keyLights || []);
      equipment.push(...scene.equipment.lighting.fillLights || []);
      equipment.push(...scene.equipment.lighting.backLights || []);
      equipment.push(...scene.equipment.lighting.backgroundLights || []);
      equipment.push(...scene.equipment.lighting.specialEffectsLights || []);
      equipment.push(...scene.equipment.lighting.softLights || []);
      equipment.push(...scene.equipment.lighting.power || []);
    }
    
    // 음향부 장비
    if (scene.equipment.sound) {
      equipment.push(...scene.equipment.sound.microphones || []);
      equipment.push(...scene.equipment.sound.recorders || []);
      equipment.push(...scene.equipment.sound.wireless || []);
      equipment.push(...scene.equipment.sound.monitoring || []);
    }
    
    // 미술부 장비
    if (scene.equipment.art) {
      equipment.push(...scene.equipment.art.setConstruction || []);
      equipment.push(...scene.equipment.art.setDressing || []);
      equipment.push(...scene.equipment.art.costumes || []);
      equipment.push(...scene.equipment.art.specialEffects || []);
    }
  }
  
  // 기본 장비 추가 (정보가 없는 경우)
  if (equipment.length === 0) {
    equipment.push('카메라', '조명', '마이크');
  }
  
  console.log('✅ 추출된 장비:', equipment);
  return equipment;
}

/**
 * Scene에서 카메라 정보 추출 (Scene 스키마 기반)
 * @param {Object} scene - Scene 객체
 * @returns {Object} 추출된 카메라 정보
 */
const extractCameraFromScene = (scene) => {
  console.log('📹 카메라 정보 추출:', {
    id: scene._id,
    title: scene.title,
    hasEquipment: !!scene.equipment
  });
  
  const cameraInfo = {
    model: '기본 카메라',
    lens: '기본 렌즈',
    settings: '기본 설정',
    movement: '고정',
    angle: '',
    work: ''
  };
  
  // Scene 스키마의 cinematography 장비에서 카메라 정보 추출
  if (scene.equipment && scene.equipment.cinematography) {
    const cinematography = scene.equipment.cinematography;
    
    // 카메라 모델
    if (cinematography.cameras && cinematography.cameras.length > 0) {
      cameraInfo.model = cinematography.cameras[0];
    }
    
    // 렌즈 정보
    if (cinematography.lenses && cinematography.lenses.length > 0) {
      cameraInfo.lens = cinematography.lenses[0];
    }
    
    // 필터 정보
    if (cinematography.filters && cinematography.filters.length > 0) {
      cameraInfo.settings = cinematography.filters.join(', ');
    }
    
    // 지지대 정보 (카메라 워크)
    if (cinematography.supports && cinematography.supports.length > 0) {
      cameraInfo.movement = cinematography.supports[0];
    }
  }
  
  // Scene의 기본 카메라 정보
  if (scene.cameraAngle) {
    cameraInfo.angle = scene.cameraAngle;
  }
  if (scene.cameraWork) {
    cameraInfo.work = scene.cameraWork;
  }
  
  console.log('✅ 추출된 카메라 정보:', cameraInfo);
  return cameraInfo;
}

/**
 * 프로젝트 촬영 스케쥴을 생성한다 (새 알고리즘)
 * @param {Array} scenes - Scene 목록
 * @param {Array} realLocations - 실제 장소 목록
 * @param {Array} groups - 그룹(건물) 목록
 * @param {string} projectId - 프로젝트 ID
 * @returns {Object} schedule - 스케쥴 결과(날짜별 씬 배치, 안내문 등 포함)
 */
export async function scheduleShooting(scenes, realLocations, groups, projectId) {
  let messages = [];
  let updatedScenes = [...scenes];
  let updatedRealLocations = [...realLocations];
  let updatedGroups = [...groups];

  // 1. 빈 realLocation 자동 할당
  let emptyRealLocation = updatedRealLocations.find(loc => loc.name === '빈 realLocation' && loc.projectId === projectId);
  if (!emptyRealLocation) {
    emptyRealLocation = {
      _id: 'empty_realLocation',
      projectId,
      name: '빈 realLocation',
      groupId: null
    };
    updatedRealLocations.push(emptyRealLocation);
  }
  let scenesWithNoLocation = updatedScenes.filter(s => !s.location?.realLocationId);
  if (scenesWithNoLocation.length > 0) {
    updatedScenes = updatedScenes.map(s =>
      s.location?.realLocationId
        ? s
        : { ...s, location: { ...s.location, realLocationId: emptyRealLocation._id } }
    );
    messages.push('촬영 위치가 지정되지 않은 Scene이 있습니다. "빈 realLocation"이 자동 할당되었습니다. 촬영 위치를 채워주세요.');
  }

  // 2. 빈 group 자동 할당
  let emptyGroup = updatedGroups.find(g => g.name === '빈 group' && g.projectId === projectId);
  if (!emptyGroup) {
    emptyGroup = {
      _id: 'empty_group',
      projectId,
      name: '빈 group',
      address: ''
    };
    updatedGroups.push(emptyGroup);
  }
  let realLocationsWithNoGroup = updatedRealLocations.filter(loc => !loc.groupId);
  if (realLocationsWithNoGroup.length > 0) {
    updatedRealLocations = updatedRealLocations.map(loc =>
      loc.groupId
        ? loc
        : { ...loc, groupId: emptyGroup._id }
    );
    messages.push('그룹이 없는 장소가 있습니다. "빈 group"이 자동 할당되었습니다. 그룹을 할당해주세요.');
  }

  // [낮/밤 분리 로직 추가]
  const isDay = (scene) => {
    const t = scene.timeOfDay;
    return t === '아침' || t === '오후' || t === '낮';
  };
  const isNight = (scene) => {
    const t = scene.timeOfDay;
    return t === '저녁' || t === '밤' || t === '새벽';
  };
  const dayScenes = scenes.filter(isDay);
  const nightScenes = scenes.filter(isNight);

  // 2, 3단계: realLocation별 → Scene 리스트로 묶기 → 그룹별 구간을 하루 6/3시간(360/180분) 이내로 분배
  const dayDays = splitScenesByLocationAndTime(dayScenes, 360, updatedRealLocations);
  const nightDays = splitScenesByLocationAndTime(nightScenes, 180, updatedRealLocations);

  const maxLen = Math.max(dayDays.length, nightDays.length);

  // 4단계: days 배열의 각 날에 대해 타임라인 생성
  const scheduledDays = [];
  for(let i = 0; i < maxLen; i++) {
    const day = dayDays[i] || { sections: [], totalMinutes: 0 };
    const night = nightDays[i] || { sections: [], totalMinutes: 0 };
    const daySceneItems = day.sections.map((section, idx) => {
      return {type: '촬영', duration: section.totalMinutes, scene: section};
    });
    const nightSceneItems = night.sections.map((section, idx) => {
      return {type: '촬영', duration: section.totalMinutes, scene: section};
    });
    const nightTimeline = [];
    for(let j = 0; j < nightScenes.length; j++) {
        if( j === 0 || nightScenes[j].scene.location?.realLocationId !== nightScenes[j-1].scene.location?.realLocationId) {
            nightTimeline.push({type: ( j === 0 ? '밤 세팅' : '장소 이동 및 세팅'), duration: 60});
            nightTimeline.push({type: '리허설', duration: 30});
        }
        nightTimeline.push({type: '촬영', duration: nightScenes[j].duration, scene: nightScenes[j].scene});
    }
    let dayTimeline = [];
    for(let j = 0; j < dayScenes.length; j++) {
        if(j === 0 || dayScenes[j].scene.location?.realLocationId !== dayScenes[j-1].scene.location?.realLocationId) {
            dayTimeline.push({type: (j === 0 ? '세팅' : '장소 이동 및 세팅'), duration: 60});
            dayTimeline.push({type: '리허설', duration: 30});
        }
        dayTimeline.push({type: '촬영', duration: dayScenes[j].duration, scene: dayScenes[j].scene});
    }
    let currentTime = 0;
    let lunchIdx = undefined;
    for(let j = dayTimeline.length - 1; j >= 0; j--) {
        if(currentTime >= 5 * 60 && dayTimeline[j].type === '촬영') {
            lunchIdx = j;
            break;
        }
        currentTime += dayTimeline[j].duration;
    }
    if(lunchIdx !== undefined) {
        dayTimeline = [...dayTimeline.slice(0, lunchIdx + 1), {type: '점심', duration: 60}, ...dayTimeline.slice(lunchIdx + 1)];
    }


    const timeline = [
        {type: '집합', duration: 0}, 
        {type: '이동', duration: 60},
        ...dayTimeline, 
        {type: '저녁', duration: 60}, 
        ...nightTimeline,
        {type: '철수', duration: 0}
    ];
    currentTime = 7 * 60;
    let deltaTime = 0;
    let scheduledDay = timeline.map((block, idx) => {
      const ret = (idx === 0 || idx === timeline.length - 1) ? {
        ...block,
        time: toTimeStr(currentTime),
      } : {
        ...block,
        time: toTimeStr(currentTime) + " ~ " + toTimeStr(currentTime + block.duration),
      };
      if(block.type === '저녁') deltaTime = 18 * 60 - currentTime;
      currentTime += block.duration;
      return ret;
    });
    currentTime = 7 * 60 + deltaTime;
    scheduledDay = timeline.map((block, idx) => {
        const ret = (idx === 0 || idx === timeline.length - 1) ? {
          ...block,
          time: toTimeStr(currentTime),
        } : {
          ...block,
          time: toTimeStr(currentTime) + " ~ " + toTimeStr(currentTime + block.duration),
        };
        currentTime += block.duration;
        return ret;
    });
    scheduledDays.push(scheduledDay);
 }

  // 유틸: 분→HH:MM, HH:MM→분
  function toTimeStr(mins) {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    let prefix = '';
    if (h >= 24) {
      prefix = '익일 ';
      h -= 24;
    }
    return `${prefix}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  function timeToMinutes(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  }
  // 이후 단계에서 scheduledDays 사용
  const returnScheduledDays = [];
  for(let i = 0; i < scheduledDays.length; i++) {
    const day = scheduledDays[i];
    const sections = [];
    let totalTime = 0;
    day.map((block, idx) => {
        if(block.type === '촬영') {
            sections.push(block.scene);
        }
        totalTime += block.duration;
    });
    returnScheduledDays.push({
        sections: sections,
        timeline: day,
        totalMinutes: totalTime,
    });
  }

  // 최종 결과 리턴
  return {
    days: returnScheduledDays,
    messages,
  };
}

/**
 * scenes를 realLocationId 기준으로 정렬한 뒤, maxTime(분) 단위로 Day 배열로 분할
 * @param {Scene[]} scenes - Scene 목록
 * @param {number} maxTime - 한 Day의 최대 촬영 시간(분)
 * @returns {Array<{ scenes: Scene[], totalMinutes: number }>} Day 배열
 */
export function splitScenesByLocationAndTime(scenes, maxTime, realLocations) {
  // 1. realLocationId 기준으로 정렬
  const sorted = [...scenes].sort((a, b) => {
    const groupA = realLocations.find(loc => loc._id === a.location?.realLocationId)?.groupId;
    const groupB = realLocations.find(loc => loc._id === b.location?.realLocationId)?.groupId;
    const locA = a.location?.realLocationId || '';
    const locB = b.location?.realLocationId || '';
    if(groupA === groupB) {
        if (locA < locB) return -1;
        if (locA > locB) return 1;
        return 0;
    }
    if(groupA < groupB) return -1;
    if(groupA > groupB) return 1;
    if (locA < locB) return -1;
    if (locA > locB) return 1;
    return 0;
  });

  // 2. maxTime 단위로 Day 분배
  const days = [];
  let currentDay = { sections: [], totalMinutes: 0 };
  for (const scene of sorted) {
    // estimatedDuration이 '3분' 등 문자열일 수 있으므로 숫자만 추출
    let min = 0;
    const est = scene.estimatedDuration;
    if (typeof est === 'string') {
      const match = est.match(/\d+/);
      min = match ? Number(match[0]) : 0;
    } else if (typeof est === 'number') {
      min = est;
    }
    // 실제 촬영시간(분)으로 변환 (예: 60배 등, 필요시 조정)
    const actualMin = min * 60;
    // Day에 추가
    if (currentDay.totalMinutes + actualMin > maxTime && currentDay.sections.length > 0) {
      days.push(currentDay);
      currentDay = { sections: [], totalMinutes: 0 };
    }
    currentDay.sections.push({
        ...scene,
        totalMinutes: actualMin
    });
    currentDay.totalMinutes += actualMin;
  }
  if (currentDay.sections.length > 0) days.push(currentDay);
  return days;
}

/**
 * 두 Scene이 같은 배우를 가지고 있는지 확인
 * @param {Object} scene1 - 첫 번째 Scene
 * @param {Object} scene2 - 두 번째 Scene
 * @returns {boolean} 같은 배우가 있는지 여부
 */
const hasSameActors = (scene1, scene2) => {
  const actors1 = extractActorsFromScene(scene1)
  const actors2 = extractActorsFromScene(scene2)
  
  console.log('🎭 배우 비교:', {
    scene1: { id: scene1._id, title: scene1.title, actors: actors1 },
    scene2: { id: scene2._id, title: scene2.title, actors: actors2 }
  });
  
  return actors1.some(actor => actors2.includes(actor))
}

/**
 * 두 Scene이 같은 시간대를 가지고 있는지 확인
 * @param {Object} scene1 - 첫 번째 Scene
 * @param {Object} scene2 - 두 번째 Scene
 * @returns {boolean} 같은 시간대인지 여부
 */
const hasSameTimeSlot = (scene1, scene2) => {
  const time1 = extractTimeSlotFromScene(scene1)
  const time2 = extractTimeSlotFromScene(scene2)
  
  console.log('⏰ 시간대 비교:', {
    scene1: { id: scene1._id, title: scene1.title, time: time1 },
    scene2: { id: scene2._id, title: scene2.title, time: time2 }
  });
  
  return time1 === time2
}

/**
 * Scene에서 의상 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 의상 리스트
 */
const extractCostumesFromScene = (scene) => {
  console.log('👗 의상 추출:', {
    id: scene._id,
    title: scene.title,
    hasEquipment: !!scene.equipment
  });
  
  const costumes = [];
  
  // Scene 스키마의 art 장비에서 의상 정보 추출
  if (scene.equipment && scene.equipment.art && scene.equipment.art.costumes) {
    costumes.push(...scene.equipment.art.costumes);
  }
  
  // 기본 의상 추가 (정보가 없는 경우)
  if (costumes.length === 0) {
    costumes.push('기본 의상');
  }
  
  console.log('✅ 추출된 의상:', costumes);
  return costumes;
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