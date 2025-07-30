/**
 * 스케줄러 서비스
 * Scene 데이터를 바탕으로 최적의 촬영 스케줄을 생성하는 서비스
 * PRD 스케줄러 기능의 핵심 로직
 */

/**
 * 최적화된 촬영 스케줄 생성 (씬 기반 장소 관리 + 타임라인 생성)
 * @param {Array} sceneData - Scene 데이터 배열 (location.name, location.group_name 포함)
 * @param {string} projectId - 프로젝트 ID (선택사항)
 * @returns {Object} 최적화된 스케줄 데이터
 */
export const generateOptimalSchedule = (sceneData, projectId = null) => {
  try {
    console.log('🎬 스케줄러 시작 - 입력 데이터:', {
      totalCount: sceneData?.length || 0,
      isArray: Array.isArray(sceneData),
      firstItem: sceneData?.[0] ? {
        id: sceneData[0]._id,
        scene: sceneData[0].scene,
        title: sceneData[0].title,
        location: sceneData[0].location?.name,
        groupName: sceneData[0].location?.group_name,
        timeOfDay: sceneData[0].timeOfDay,
      } : '없음',
    });
    
    // 모든 Scene을 사용 (Scene은 기본적으로 실사 촬영용)
    let scenes = [...sceneData];
    const messages = [];
    
    // 씬 기반 장소 관리 (location.name과 location.group_name 사용)
    const scenesWithNoLocation = scenes.filter(s => !s.location?.name);
    if (scenesWithNoLocation.length > 0) {
      messages.push('촬영 위치가 지정되지 않은 Scene이 있습니다. 촬영 위치를 설정해주세요.');
    }
    
    const scenesWithNoGroup = scenes.filter(s => !s.location?.group_name);
    if (scenesWithNoGroup.length > 0) {
      messages.push('그룹이 지정되지 않은 Scene이 있습니다. 그룹을 설정해주세요.');
    }
    
    console.log('🎬 Scene 데이터 처리 결과:', {
      total: scenes.length,
      messages: messages,
    });
    
    if (scenes.length === 0) {
      console.warn('⚠️ 스케줄러: Scene이 없음');
      return { 
        days: [], 
        totalDays: 0,
        totalScenes: 0,
        estimatedTotalDuration: 0,
        message: 'Scene이 없습니다.',
        messages: messages,
      };
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
        equipment: scene.equipment,
      });
    });
    
    // 가중치 기반 최적화 (씬 기반 장소 관리)
    const optimizedSchedule = optimizeScheduleWithWeights(scenes);
    
    console.log('✅ 스케줄러 완료:', {
      totalDays: optimizedSchedule.totalDays,
      totalScenes: optimizedSchedule.totalScenes,
      estimatedDuration: optimizedSchedule.estimatedTotalDuration,
      messages: messages,
    });
    
    return {
      ...optimizedSchedule,
      messages: messages,
    };
  } catch (error) {
    console.error('❌ 스케줄 생성 중 오류:', error);
    throw new Error('스케줄 생성에 실패했습니다.');
  }
};

/**
 * 가중치 기반 스케줄 최적화 (씬 기반 장소 관리 + 타임라인 생성)
 * @param {Array} allScenes - 모든 Scene 데이터 (location.name, location.group_name 포함)
 * @returns {Object} 최적화된 스케줄
 */
const optimizeScheduleWithWeights = (allScenes) => {
  // 각 Scene에 대한 가중치 계산
  const scenesWithWeights = allScenes.map(scene => ({
    ...scene,
    weight: calculateSceneWeight(scene, allScenes),
  }));
  
  // 씬 기반 장소 관리 (location.name과 location.group_name 사용)
  const allScenesWithWeights = scenesWithWeights;
  
  // location.name별 → Scene 리스트로 묶기 (유동적 시간 분배)
  // 하루 최대 12시간(720분)으로 설정하여 유동적 처리
  const sceneDays = splitScenesByLocationAndTime(allScenesWithWeights, 720);
  
  // 각 날에 대해 타임라인 생성
  const scheduledDays = [];
  for(let i = 0; i < sceneDays.length; i++) {
    const day = sceneDays[i] || { sections: [], totalMinutes: 0 };
    
    // 통합 타임라인 생성 (낮/밤 구분 없이)
    const timeline = createUnifiedTimeline(day.sections);
    
    scheduledDays.push({
      day: i + 1,
      timeline: timeline,
      sections: day.sections,
      totalMinutes: day.totalMinutes,
      totalScenes: day.sections.length,
    });
  }
  
  return {
    days: scheduledDays,
    totalDays: scheduledDays.length,
    totalScenes: scheduledDays.reduce((total, day) => total + day.totalScenes, 0),
    estimatedTotalDuration: scheduledDays.reduce((total, day) => total + day.totalMinutes, 0),
  };
};

/**
 * Scene의 가중치 계산 (다차원 우선순위 기반)
 * @param {Object} scene - Scene 객체
 * @param {Array} allScenes - 모든 Scene 배열
 * @returns {Object} 다차원 가중치 객체
 */
const calculateSceneWeight = (scene, allScenes) => {
  // 1. 장소 가중치 (최우선)
  const sameLocationScenes = allScenes.filter(s => 
    extractLocationFromScene(s) === extractLocationFromScene(scene),
  );
  const locationWeight = sameLocationScenes.length * 1000;
  
  // 2. 배우 가중치 (두 번째 우선순위) - 배우별 대기시간 최적화
  const actorWeight = calculateActorWaitingTimeWeight(scene, allScenes);
  
  // 3. 시간대 가중치 (세 번째 우선순위)
  const sameTimeSlotScenes = allScenes.filter(s => 
    hasSameTimeSlot(s, scene),
  );
  const timeSlotWeight = sameTimeSlotScenes.length * 200;
  
  // 4. 장비 가중치 (네 번째 우선순위)
  const sameEquipmentScenes = allScenes.filter(s => 
    extractEquipmentFromScene(s) === extractEquipmentFromScene(scene),
  );
  const equipmentWeight = sameEquipmentScenes.length * 100;
  
  // 5. 복잡도 가중치 (다섯 번째 우선순위)
  const duration = scene.estimatedDuration || '5분';
  const durationMinutes = parseDurationToMinutes(duration);
  const complexityWeight = durationMinutes * 10;
  
  // 6. 우선순위 가중치 (Scene 번호가 낮을수록 높은 가중치)
  const sceneNumber = scene.scene || 1;
  const priorityWeight = (100 - sceneNumber) * 1;
  
  return {
    totalWeight: locationWeight + actorWeight + timeSlotWeight + equipmentWeight + complexityWeight + priorityWeight,
    locationWeight,
    actorWeight,
    timeSlotWeight,
    equipmentWeight,
    complexityWeight,
    priorityWeight,
    // 원본 데이터
    location: extractLocationFromScene(scene),
    actors: extractActorsFromScene(scene),
    timeOfDay: extractTimeSlotFromScene(scene),
    equipment: extractEquipmentFromScene(scene),
    duration: durationMinutes,
    sceneNumber,
  };
};

/**
 * 배우별 대기시간 최적화 가중치 계산
 * @param {Object} scene - 현재 씬
 * @param {Array} allScenes - 모든 씬 배열
 * @returns {number} 배우별 대기시간 최적화 가중치
 */
const calculateActorWaitingTimeWeight = (scene, allScenes) => {
  let totalWeight = 0;
  const sceneActors = extractActorsFromScene(scene);
  
  // 각 배우별로 대기시간 최적화 가중치 계산
  sceneActors.forEach(actor => {
    // 해당 배우가 나오는 모든 씬들 찾기
    const actorScenes = allScenes.filter(s => 
      extractActorsFromScene(s).includes(actor),
    );
    
    // 배우별 씬 개수에 따른 가중치 (많을수록 대기시간 최적화 필요)
    const actorSceneCount = actorScenes.length;
    totalWeight += actorSceneCount * 300;
    
    // 주연배우 보너스 (더 많은 씬에 나오는 배우 = 주연배우일 가능성)
    if (actorSceneCount >= 3) {
      totalWeight += 200; // 주연배우 보너스
    }
    
    // 배우별 씬 분산도 계산 (같은 장소/시간대에 몰려있으면 대기시간 최적화 필요)
    const sameLocationActorScenes = actorScenes.filter(s => 
      extractLocationFromScene(s) === extractLocationFromScene(scene),
    );
    const sameTimeSlotActorScenes = actorScenes.filter(s => 
      extractTimeSlotFromScene(s) === extractTimeSlotFromScene(scene),
    );
    
    // 같은 장소에 몰려있으면 높은 가중치 (연속 촬영 가능)
    totalWeight += sameLocationActorScenes.length * 100;
    
    // 같은 시간대에 몰려있으면 높은 가중치 (연속 촬영 가능)
    totalWeight += sameTimeSlotActorScenes.length * 50;
  });
  
  return totalWeight;
};

/**
 * 시간 문자열을 분으로 변환
 * @param {string} duration - 시간 문자열 (예: "5분", "10분")
 * @returns {number} 분 단위 시간
 */
const parseDurationToMinutes = (duration) => {
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)분/);
    return match ? Number(match[1]) : 5;
  }
  return typeof duration === 'number' ? duration : 5;
};



/**
 * 장소별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 장소별 그룹 객체
 */
const groupScenesByLocation = (scenes) => {
  const groups = {};
  
  scenes.forEach(scene => {
    const location = extractLocationFromScene(scene);
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(scene);
  });
  
  return groups;
};

/**
 * 배우별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 배우별 그룹 객체
 */
const groupScenesByActors = (scenes) => {
  const groups = {};
  
  scenes.forEach(scene => {
    const actors = extractActorsFromScene(scene);
    actors.forEach(actor => {
      if (!groups[actor]) {
        groups[actor] = [];
      }
      groups[actor].push(scene);
    });
  });
  
  return groups;
};

/**
 * 시간대별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 시간대별 그룹 객체
 */
const groupScenesByTimeSlot = (scenes) => {
  const groups = {};
  
  scenes.forEach(scene => {
    const timeSlot = extractTimeSlotFromScene(scene);
    if (!groups[timeSlot]) {
      groups[timeSlot] = [];
    }
    groups[timeSlot].push(scene);
  });
  
  console.log('🕐 시간대별 그룹화 결과:', Object.keys(groups).map(key => `${key}: ${groups[key].length}개`));
  
  return groups;
};

/**
 * 장비별 Scene 그룹화
 * @param {Array} scenes - Scene 배열
 * @returns {Object} 장비별 그룹 객체
 */
const groupScenesByEquipment = (scenes) => {
  const groups = {};
  
  scenes.forEach(scene => {
    const equipment = extractEquipmentFromScene(scene);
    if (!groups[equipment]) {
      groups[equipment] = [];
    }
    groups[equipment].push(scene);
  });
  
  return groups;
};

/**
 * 시간대별 씬 대기열 관리 (FIFO 방식)
 * @param {Object} pendingScenes - 대기열 객체 {day: [], night: []}
 * @param {Object} scene - 현재 씬
 * @param {string} timeSlot - 시간대 ('day' 또는 'night')
 */
const addToPendingQueue = (pendingScenes, scene, timeSlot) => {
  const queueKey = timeSlot === 'night' ? 'night' : 'day';
  pendingScenes[queueKey].push(scene);
  console.log(`[SchedulerService] 씬 ${scene.scene}을 ${queueKey} 대기열에 추가`);
};

/**
 * 최적화된 씬들을 일정으로 배치 (시간대별 정확한 촬영시간 반영)
 * @param {Array} optimizedScenes - 최적화된 씬 배열
 * @returns {Array} 일정 배열
 */
const createScheduleFromOptimizedScenes = (scenesWithWeights) => {
  console.log('🎬 스케줄 생성 시작:', scenesWithWeights.length, '개 씬');
  
  // 1. 장소별로 그룹화
  const locationGroups = {};
  
  for (const scene of scenesWithWeights) {
    const location = extractLocationFromScene(scene);
    if (!locationGroups[location]) {
      locationGroups[location] = [];
    }
    locationGroups[location].push(scene);
  }
  
  console.log('📍 장소별 그룹화 결과:', Object.keys(locationGroups).map(key => `${key}: ${locationGroups[key].length}개`));
  
  // 2. 각 장소 내에서 시간대별로 정렬
  const locationTimeSlotOptimizedScenes = [];
  
  for (const [location, scenes] of Object.entries(locationGroups)) {
    console.log(`📍 ${location} 장소 내 시간대별 정렬 시작 (${scenes.length}개 씬)`);
    
    // 장소 내 씬들을 시간대별로 그룹화
    const timeSlotGroupsInLocation = groupScenesByTimeSlot(scenes);
    
    // 시간대 순서 정의 (낮 → 밤)
    const timeSlotOrder = ['낮', '밤'];
    
    // 정의된 순서대로 씬들을 추가
    for (const timeSlot of timeSlotOrder) {
      if (timeSlotGroupsInLocation[timeSlot]) {
        console.log(`  ⏰ ${timeSlot} 시간대 정렬 시작 (${timeSlotGroupsInLocation[timeSlot].length}개 씬)`);
        
        // 시간대별 그룹 내에서 가중치 기반 정렬
        const sortedScenesForTimeSlot = timeSlotGroupsInLocation[timeSlot].sort((a, b) => {
          // 1. totalWeight (내림차순) - 가장 높은 가중치부터
          if (b.weight.totalWeight !== a.weight.totalWeight) {
            return b.weight.totalWeight - a.weight.totalWeight;
          }
          
          // 2. sceneNumber (오름차순) - 같은 가중치일 때
          return a.weight.sceneNumber - b.weight.sceneNumber;
        });
        
        console.log(`  🎯 ${timeSlot} 시간대 정렬 결과:`, sortedScenesForTimeSlot.map(scene => ({
          scene: scene.scene,
          title: scene.title,
          totalWeight: scene.weight.totalWeight,
          sceneNumber: scene.weight.sceneNumber,
        })));
        
        // 정렬된 씬들을 결과 배열에 추가
        locationTimeSlotOptimizedScenes.push(...sortedScenesForTimeSlot);
        
        console.log(`  ✅ ${timeSlot} 시간대 정렬 완료 (${sortedScenesForTimeSlot.length}개 씬)`);
      }
    }
    
    // 미정 시간대 씬들은 마지막에 추가 (가중치 기반 정렬)
    if (timeSlotGroupsInLocation['미정']) {
      console.log(`  ⏰ 미정 시간대 씬들 정렬 (${timeSlotGroupsInLocation['미정'].length}개 씬)`);
      
      const sortedUndefinedTimeScenes = timeSlotGroupsInLocation['미정'].sort((a, b) => {
        // 1. totalWeight (내림차순)
        if (b.weight.totalWeight !== a.weight.totalWeight) {
          return b.weight.totalWeight - a.weight.totalWeight;
        }
        
        // 2. sceneNumber (오름차순)
        return a.weight.sceneNumber - b.weight.sceneNumber;
      });
      
      locationTimeSlotOptimizedScenes.push(...sortedUndefinedTimeScenes);
    }
  }
  
  console.log('🎯 최종 정렬된 씬들:', locationTimeSlotOptimizedScenes.map(scene => ({
    scene: scene.scene,
    title: scene.title,
    timeSlot: extractTimeSlotFromScene(scene),
    totalWeight: scene.weight.totalWeight,
    sceneNumber: scene.weight.sceneNumber,
  })));
  
  // 3. 정렬된 씬들을 일정으로 배치 (FIFO 방식)
  const days = [];
  let currentDay = 1;
  let currentDayScenes = [];
  let currentDayDuration = 0;
  let currentDayLocation = null;
  let currentDayTimeSlot = null;
  
  // 시간 부족으로 새 날이 필요한 씬들을 FIFO로 관리
  const pendingScenes = {
    day: [],    // 낮 씬 대기열
    night: [],   // 밤 씬 대기열
  };
  
  // 주간 근로시간 추적 (1주 최대 52시간 제한)
  let weeklyWorkHours = 0;
  const MAX_WEEKLY_HOURS = 52 * 60; // 52시간을 분으로 변환
  const MAX_DAILY_HOURS = 8 * 60;   // 하루 최대 8시간 (분)
  
  // 개선된 주간 스케줄링: Day 1-6은 유동적으로 8-12시간, Day 7은 휴일
  const MIN_DAY_HOURS = 8 * 60;       // 최소 8시간 (분)
  const MAX_DAY_HOURS = 12 * 60;      // 최대 12시간 (분)
  const REST_DAY = 7;                  // 7일째를 휴일로 설정
  
  // 하루 최대 촬영 시간 (8시간 = 480분)
  const MAX_DAILY_DURATION = 480;
  // 씬 간 휴식 시간 (30분 = 30분)
  const SCENE_BREAK_TIME = 30;
  
  console.log('[SchedulerService] 스케줄 배치 시작:', {
    totalScenes: locationTimeSlotOptimizedScenes.length,
    maxDailyDuration: MAX_DAILY_DURATION,
  });
  
  for (let i = 0; i < locationTimeSlotOptimizedScenes.length; i++) {
    const scene = locationTimeSlotOptimizedScenes[i];
    const sceneDuration = getSafeDuration(scene);
    const sceneLocation = extractLocationFromScene(scene);
    const sceneTimeSlot = extractTimeSlotFromScene(scene);
    
    // 디버깅: 정렬된 씬 정보 확인
    console.log(`[SchedulerService] 정렬된 씬 ${i + 1}:`, {
      scene: scene.scene,
      title: scene.title,
      timeSlot: sceneTimeSlot,
      totalWeight: scene.weight.totalWeight,
      sceneNumber: scene.weight.sceneNumber,
      sceneLocation,
      currentDay,
      weekDay: currentWeekDay,
      isRestDay,
      maxDailyHours: Math.round(maxDailyHours / 60 * 10) / 10, // 시간 단위로 변환
      weeklyWorkHours: Math.round(weeklyWorkHours / 60 * 10) / 10, // 시간 단위로 변환
      remainingWeeklyHours: Math.round((MAX_WEEKLY_HOURS - weeklyWorkHours) / 60 * 10) / 10, // 시간 단위로 변환
    });
    
    // 하루에 배치할 수 없는 경우(시간 부족) 다음 날로 넘김
    const wouldExceed = (currentDayDuration + sceneDuration + (currentDayScenes.length > 0 ? SCENE_BREAK_TIME : 0)) > MAX_DAILY_DURATION;
    
    // 주간 근로시간 초과 확인 (Day 1-6은 유동적으로 8-12시간, Day 7은 휴일)
    const currentWeekDay = ((currentDay - 1) % 7) + 1;
    const isRestDay = currentWeekDay === REST_DAY;
    
    // 현재 날짜의 최대 근로시간 결정 (유동적)
    let maxDailyHours;
    if (isRestDay) {
      maxDailyHours = 0; // 휴일
    } else {
      // Day 1-6: 유동적으로 8-12시간, 단 주간 총 52시간을 넘지 않도록
      const remainingWeeklyHours = MAX_WEEKLY_HOURS - weeklyWorkHours;
      const remainingDays = 7 - currentWeekDay; // 남은 평일 수 (휴일 제외)
      
      if (remainingDays === 0) {
        // 마지막 평일인 경우
        maxDailyHours = Math.min(MAX_DAY_HOURS, remainingWeeklyHours);
      } else {
        // 남은 평일이 있는 경우: 최소 8시간, 최대 12시간, 단 주간 총 52시간을 넘지 않도록
        const minRequiredPerDay = Math.ceil(remainingWeeklyHours / remainingDays); // 남은 시간을 균등 분배
        maxDailyHours = Math.min(MAX_DAY_HOURS, Math.max(MIN_DAY_HOURS, minRequiredPerDay));
      }
    }
    
    const wouldExceedWeekly = (weeklyWorkHours + sceneDuration + (currentDayScenes.length > 0 ? SCENE_BREAK_TIME : 0)) > maxDailyHours;
    
    const needsNewDay = (
      currentDayScenes.length === 0 || // 첫 번째 씬
      shouldStartNewDayForLocation(currentDayLocation, sceneLocation, currentDayScenes) || // 개선된 장소 변경 조건
      wouldExceed || // 시간 초과
      wouldExceedWeekly || // 주간 근로시간 초과
      isRestDay || // 휴일인 경우
      currentDayScenes.length >= 6 // 하루 최대 6개 씬
    );

    if (needsNewDay && currentDayScenes.length > 0) {
      // 현재 날짜 완료하고 새 날짜 시작
      days.push(createDaySchedule(
        currentDay,
        currentDayScenes,
        currentDayDuration,
        currentDayLocation,
        currentDayTimeSlot,
      ));
      currentDay++;
      currentDayScenes = [];
      currentDayDuration = 0;
      currentDayLocation = null;
      currentDayTimeSlot = null;
      
      // 주간 근로시간 리셋 (7일마다)
      if (currentDay % 7 === 1) {
        weeklyWorkHours = 0;
        console.log(`[SchedulerService] 주간 근로시간 리셋: Day ${currentDay}`);
      }
      
      // 휴일인 경우 로깅
      const nextWeekDay = ((currentDay - 1) % 7) + 1;
      if (nextWeekDay === REST_DAY) {
        console.log(`[SchedulerService] 휴일 시작: Day ${currentDay} (${nextWeekDay}일차)`);
      }
    }

    // 시간 부족 또는 휴일로 새 날이 필요한 경우 대기열에 추가
    if ((wouldExceed || isRestDay) && currentDayScenes.length === 0) {
      const timeSlotKey = (sceneTimeSlot === '밤' || sceneTimeSlot === 'night') ? 'night' : 'day';
      const reason = isRestDay ? '휴일' : '시간 부족';
      addToPendingQueue(pendingScenes, scene, timeSlotKey);
      console.log(`[SchedulerService] ${reason}로 씬 ${scene.scene}을 대기열에 추가`);
      continue;
    }

    // 씬을 현재 날짜에 추가
    currentDayScenes.push(scene);
    const addedDuration = sceneDuration + (currentDayScenes.length > 1 ? SCENE_BREAK_TIME : 0);
    currentDayDuration += addedDuration;
    
    // 휴일이 아닌 경우에만 주간 근로시간에 추가
    if (!isRestDay) {
      weeklyWorkHours += addedDuration;
    }
    
    currentDayLocation = sceneLocation;
    currentDayTimeSlot = sceneTimeSlot;

    console.log(`[SchedulerService] 씬 ${scene.scene} 추가:`, {
      day: currentDay,
      location: sceneLocation,
      timeSlot: sceneTimeSlot,
      duration: sceneDuration,
      totalDuration: currentDayDuration,
      weeklyWorkHours: Math.round(weeklyWorkHours / 60 * 10) / 10, // 시간 단위로 변환
      scenesCount: currentDayScenes.length,
      sceneTitle: scene.title,
      isRestDay,
    });
  }
  
  // 마지막 날짜 추가
  if (currentDayScenes.length > 0) {
    days.push(createDaySchedule(
      currentDay,
      currentDayScenes,
      currentDayDuration,
      currentDayLocation,
      currentDayTimeSlot,
    ));
  }
  
  // 대기열에 있는 씬들을 처리
  console.log('[SchedulerService] 대기열 처리 시작:', {
    dayQueue: pendingScenes.day.length,
    nightQueue: pendingScenes.night.length,
  });
  
  // 낮 씬 대기열 처리
  for (const pendingScene of pendingScenes.day) {
    const pendingDuration = getSafeDuration(pendingScene);
    const pendingLocation = extractLocationFromScene(pendingScene);
    const pendingTimeSlot = extractTimeSlotFromScene(pendingScene);
    
    // 주간 근로시간 초과 확인 (Day 1-6은 유동적으로 8-12시간, Day 7은 휴일)
    const currentWeekDay = ((currentDay - 1) % 7) + 1;
    const isRestDay = currentWeekDay === REST_DAY;
    
    // 현재 날짜의 최대 근로시간 결정 (유동적)
    let maxDailyHours;
    if (isRestDay) {
      maxDailyHours = 0; // 휴일
    } else {
      // Day 1-6: 유동적으로 8-12시간, 단 주간 총 52시간을 넘지 않도록
      const remainingWeeklyHours = MAX_WEEKLY_HOURS - weeklyWorkHours;
      const remainingDays = 7 - currentWeekDay; // 남은 평일 수 (휴일 제외)
      
      if (remainingDays === 0) {
        // 마지막 평일인 경우
        maxDailyHours = Math.min(MAX_DAY_HOURS, remainingWeeklyHours);
      } else {
        // 남은 평일이 있는 경우: 최소 8시간, 최대 12시간, 단 주간 총 52시간을 넘지 않도록
        const minRequiredPerDay = Math.ceil(remainingWeeklyHours / remainingDays); // 남은 시간을 균등 분배
        maxDailyHours = Math.min(MAX_DAY_HOURS, Math.max(MIN_DAY_HOURS, minRequiredPerDay));
      }
    }
    
    if (weeklyWorkHours + pendingDuration > maxDailyHours) {
      const reason = isRestDay ? '휴일' : '주간 근로시간 초과';
      console.log(`[SchedulerService] ${reason}로 대기열 낮 씬 ${pendingScene.scene} 처리 중단`);
      break;
    }
    
    // 새 날짜 시작
    if (currentDayScenes.length > 0) {
      days.push(createDaySchedule(
        currentDay,
        currentDayScenes,
        currentDayDuration,
        currentDayLocation,
        currentDayTimeSlot,
      ));
      currentDay++;
      
      // 주간 근로시간 리셋 (7일마다)
      if (currentDay % 7 === 1) {
        weeklyWorkHours = 0;
        console.log(`[SchedulerService] 주간 근로시간 리셋: Day ${currentDay}`);
      }
    }
    
    currentDayScenes = [pendingScene];
    currentDayDuration = pendingDuration;
    
    // 휴일이 아닌 경우에만 주간 근로시간에 추가
    if (!isRestDay) {
      weeklyWorkHours += pendingDuration;
    }
    
    currentDayLocation = pendingLocation;
    currentDayTimeSlot = pendingTimeSlot;
    
    console.log(`[SchedulerService] 대기열 낮 씬 ${pendingScene.scene} 처리: Day ${currentDay}, 주간 근로시간: ${Math.round(weeklyWorkHours / 60 * 10) / 10}시간, 휴일: ${isRestDay}`);
  }
  
  // 밤 씬 대기열 처리
  for (const pendingScene of pendingScenes.night) {
    const pendingDuration = getSafeDuration(pendingScene);
    const pendingLocation = extractLocationFromScene(pendingScene);
    const pendingTimeSlot = extractTimeSlotFromScene(pendingScene);
    
    // 주간 근로시간 초과 확인 (Day 1-6은 유동적으로 8-12시간, Day 7은 휴일)
    const currentWeekDay = ((currentDay - 1) % 7) + 1;
    const isRestDay = currentWeekDay === REST_DAY;
    
    // 현재 날짜의 최대 근로시간 결정 (유동적)
    let maxDailyHours;
    if (isRestDay) {
      maxDailyHours = 0; // 휴일
    } else {
      // Day 1-6: 유동적으로 8-12시간, 단 주간 총 52시간을 넘지 않도록
      const remainingWeeklyHours = MAX_WEEKLY_HOURS - weeklyWorkHours;
      const remainingDays = 7 - currentWeekDay; // 남은 평일 수 (휴일 제외)
      
      if (remainingDays === 0) {
        // 마지막 평일인 경우
        maxDailyHours = Math.min(MAX_DAY_HOURS, remainingWeeklyHours);
      } else {
        // 남은 평일이 있는 경우: 최소 8시간, 최대 12시간, 단 주간 총 52시간을 넘지 않도록
        const minRequiredPerDay = Math.ceil(remainingWeeklyHours / remainingDays); // 남은 시간을 균등 분배
        maxDailyHours = Math.min(MAX_DAY_HOURS, Math.max(MIN_DAY_HOURS, minRequiredPerDay));
      }
    }
    
    if (weeklyWorkHours + pendingDuration > maxDailyHours) {
      const reason = isRestDay ? '휴일' : '주간 근로시간 초과';
      console.log(`[SchedulerService] ${reason}로 대기열 밤 씬 ${pendingScene.scene} 처리 중단`);
      break;
    }
    
    // 새 날짜 시작
    if (currentDayScenes.length > 0) {
      days.push(createDaySchedule(
        currentDay,
        currentDayScenes,
        currentDayDuration,
        currentDayLocation,
        currentDayTimeSlot,
      ));
      currentDay++;
      
      // 주간 근로시간 리셋 (7일마다)
      if (currentDay % 7 === 1) {
        weeklyWorkHours = 0;
        console.log(`[SchedulerService] 주간 근로시간 리셋: Day ${currentDay}`);
      }
    }
    
    currentDayScenes = [pendingScene];
    currentDayDuration = pendingDuration;
    
    // 휴일이 아닌 경우에만 주간 근로시간에 추가
    if (!isRestDay) {
      weeklyWorkHours += pendingDuration;
    }
    
    currentDayLocation = pendingLocation;
    currentDayTimeSlot = pendingTimeSlot;
    
    console.log(`[SchedulerService] 대기열 밤 씬 ${pendingScene.scene} 처리: Day ${currentDay}, 주간 근로시간: ${Math.round(weeklyWorkHours / 60 * 10) / 10}시간, 휴일: ${isRestDay}`);
  }
  
  // 마지막 대기열 날짜 추가
  if (currentDayScenes.length > 0) {
    days.push(createDaySchedule(
      currentDay,
      currentDayScenes,
      currentDayDuration,
      currentDayLocation,
      currentDayTimeSlot,
    ));
  }
  
  console.log('[SchedulerService] 스케줄 생성 완료:', {
    totalDays: days.length,
    totalScenes: days.reduce((total, day) => total + day.totalScenes, 0),
    pendingDayScenes: pendingScenes.day.length,
    pendingNightScenes: pendingScenes.night.length,
  });
  
  return days;
};

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
    sceneTitles: scenes.map(scene => scene.title || `씬 ${scene.scene}`),
  });
  
  // 시간대별 시간 범위 설정 (낮/밤 씬 비율에 따른 유동적 시작시간)
  const timeRange = scenes.length > 0 ? (() => {
    // 낮/밤 씬 분류 및 시간 계산
    const dayScenes = [];
    const nightScenes = [];
    let dayTotalDuration = 0;
    let nightTotalDuration = 0;
    
    scenes.forEach((scene, index) => {
      const sceneDuration = getSafeDuration(scene);
      const breakTime = index > 0 ? 30 : 0;
      const totalSceneTime = sceneDuration + breakTime;
      
      const timeOfDay = scene.timeOfDay;
      if (timeOfDay === '아침' || timeOfDay === '오후' || timeOfDay === '낮' || timeOfDay === 'M' || timeOfDay === 'D') {
        dayScenes.push(scene);
        dayTotalDuration += totalSceneTime;
      } else if (timeOfDay === '저녁' || timeOfDay === '밤' || timeOfDay === '새벽' || timeOfDay === 'N') {
        nightScenes.push(scene);
        nightTotalDuration += totalSceneTime;
      } else {
        // 미정인 경우 낮 씬으로 처리
        dayScenes.push(scene);
        dayTotalDuration += totalSceneTime;
      }
    });
    
    // 시작 시간 결정 (낮/밤 씬 비율에 따라)
    let startTime = '09:00'; // 기본값
    
    if (dayScenes.length > 0 && nightScenes.length > 0) {
      // 낮/밤 씬이 모두 있는 경우
      if (nightTotalDuration > dayTotalDuration) {
        // 밤 씬이 더 많은 경우: 늦게 시작 (14:00)
        startTime = '14:00';
      } else {
        // 낮 씬이 더 많은 경우: 일찍 시작 (06:00)
        startTime = '06:00';
      }
    } else if (dayScenes.length > 0) {
      // 낮 씬만 있는 경우: 일찍 시작 (06:00)
      startTime = '06:00';
    } else if (nightScenes.length > 0) {
      // 밤 씬만 있는 경우: 늦게 시작 (18:00)
      startTime = '18:00';
    }
    
    // 전체 소요시간 계산
    const totalDuration = dayTotalDuration + nightTotalDuration;
    const endTime = addMinutesToTime(startTime, totalDuration);
    
    return {
      start: startTime,
      end: endTime,
    };
  })() : null;
  
  // 디버깅: 씬들의 시간 정보 확인
  console.log(`[SchedulerService] Day ${dayNumber} 씬들의 시간 정보:`, scenes.map(scene => ({
    scene: scene.scene,
    title: scene.title,
    timeSlot: scene.timeSlot,
    timeSlotDisplay: scene.timeSlotDisplay,
    sceneStartTime: scene.sceneStartTime,
    sceneEndTime: scene.sceneEndTime,
    actualShootingDuration: scene.actualShootingDuration,
  })));
  
  // 스케줄 표시용 핵심 정보만 추출
  const scenesWithDetails = scenes.map(scene => ({
    scene: scene.scene,
    title: scene.title,
    description: scene.description,
    location: scene.location,
    timeOfDay: scene.timeOfDay,
    cast: scene.cast,
    estimatedDuration: scene.estimatedDuration,
    // 미술부 정보 (의상, 소품)
    costumes: scene.equipment?.art?.costumes || [],
    props: scene.equipment?.art?.props || {
      characterProps: [],
      setProps: [],
    },
  }));
  
  // 스케줄 row 반환
  return {
    day: dayNumber,
    date: `Day ${dayNumber}`,
    timeRange: timeRange,
    scenes: scenesWithDetails, // 상세 정보가 포함된 씬들
    totalScenes: scenes.length,
    estimatedDuration: duration,
    crew: getRequiredCrew(scenes),
    equipment: getRequiredEquipment(scenes),
    timeSlots: generateTimeSlots(scenes, timeRange),
  };
};

/**
 * 필요한 인력 계산
 * @param {Array} scenes - Scene 배열
 * @returns {Array} 필요한 인력 리스트
 */
const getRequiredCrew = (scenes) => {
  const crew = new Set(['감독', '촬영감독', '카메라맨']);
  
  scenes.forEach(scene => {
    const description = scene.description || '';
    
    // 인력 키워드들
    const crewKeywords = [
      '배우', '엑스트라', '스턴트', '메이크업', '의상', '소품',
      'actor', 'extra', 'stunt', 'makeup', 'costume', 'prop',
    ];
    
    crewKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        crew.add(keyword);
      }
    });
  });
  
  return Array.from(crew);
};

/**
 * 필요한 장비 계산
 * @param {Array} scenes - Scene 배열
 * @returns {Array} 필요한 장비 리스트
 */
const getRequiredEquipment = (scenes) => {
  const equipment = new Set(['카메라', '조명', '마이크']);
  
  scenes.forEach(scene => {
    const description = scene.description || '';
    
    // 장비 키워드들
    const equipmentKeywords = [
      '크레인', '돌리', '스테디캠', '그린스크린', '스탠드',
      'crane', 'dolly', 'steadicam', 'greenscreen', 'stand',
    ];
    
    equipmentKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        equipment.add(keyword);
      }
    });
  });
  
  return Array.from(equipment);
};

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
    console.log('📍 같은 장소의 모든 씬들:', allScenesInLocation.map(s => ({
      scene: s.scene,
      title: s.title,
      timeOfDay: extractTimeSlotFromScene(s),
    })));
  }
  
  // 시간대별 기본 시간 설정 (단순화)
  const getBasicTimeRange = (timeOfDay) => {
    const ranges = {
      'M': { start: '06:00', end: '12:00', availableMinutes: 360 },
      'D': { start: '12:00', end: '18:00', availableMinutes: 360 },
      'N': { start: '18:00', end: '06:00', availableMinutes: 720 },
      'morning': { start: '06:00', end: '12:00', availableMinutes: 360 },
      'afternoon': { start: '12:00', end: '18:00', availableMinutes: 360 },
      'night': { start: '18:00', end: '06:00', availableMinutes: 720 },
      'day': { start: '06:00', end: '18:00', availableMinutes: 720 },
      '낮': { start: '06:00', end: '18:00', availableMinutes: 720 },
      '밤': { start: '18:00', end: '06:00', availableMinutes: 720 },
      '아침': { start: '06:00', end: '12:00', availableMinutes: 360 },
      '오후': { start: '12:00', end: '18:00', availableMinutes: 360 },
      '저녁': { start: '18:00', end: '06:00', availableMinutes: 720 },
      '새벽': { start: '00:00', end: '06:00', availableMinutes: 360 },
    };
    return ranges[timeOfDay] || ranges['D'];
  };
  
  const timeRange = getBasicTimeRange(timeOfDay);
  console.log(`⏰ 시간대별 최적화: ${timeOfDay} (${scenes.length}개 씬)`);
  
  // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
  const availableMinutes = timeRange.availableMinutes;
  
  console.log(`  📅 시간 범위: ${timeRange.label} (총 ${availableMinutes}분)`);
  
  // 씬이 1개 이하일 때도 시간 정보 설정
  if (scenes.length <= 1) {
    const optimizedScenes = scenes.map(scene => {
      const sceneDuration = getSafeDuration(scene);
      const sceneStartTime = timeRange.optimalStartTime;
      const sceneEndTime = addMinutesToTime(sceneStartTime, sceneDuration);
      
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
        timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`,
      };
    });
    
    console.log(`  ✅ 단일 씬 최적화 완료: ${optimizedScenes.length}개 씬`);
    return optimizedScenes;
  }
  
  // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
  console.log(`  📅 시간 범위: ${timeRange.label} (총 ${availableMinutes}분)`);
  
  // 씬들을 실제 촬영시간 순으로 정렬 (긴 씬부터)
  const sortedScenes = [...scenes].sort((a, b) => {
    const durationA = getSafeDuration(a);
    const durationB = getSafeDuration(b);
    return durationB - durationA;
  });
  
  // 시간대 내에서 최적 배치 (실제 촬영시간 고려)
  const optimizedScenes = [];
  let remainingMinutes = availableMinutes;
  let currentTime = timeRange.optimalStartTime;
  
  console.log(`  🎬 시간대별 촬영 스케줄 시작: ${currentTime}부터`);
  
  for (const scene of sortedScenes) {
    const sceneDuration = getSafeDuration(scene);
    const sceneBreakTime = 30; // 씬 간 휴식 시간 (30분 = 30분)
    const totalSceneTime = sceneDuration + sceneBreakTime;
    
    console.log(`  📋 씬 "${scene.title}" 검토:`);
    console.log(`    - 분량: ${scene.estimatedDuration}분`);
    console.log(`    - 실제 촬영시간: ${sceneDuration}분`);
    console.log(`    - 휴식시간 포함: ${totalSceneTime}분`);
    console.log(`    - 남은 시간: ${remainingMinutes}분`);
    
    if (totalSceneTime <= remainingMinutes) {
      // 씬 배치 가능
      const sceneStartTime = currentTime;
      const sceneEndTime = addMinutesToTime(currentTime, sceneDuration);
      
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
      });
      
      console.log(`  ✅ 씬 "${scene.title}" timeSlotDisplay 설정: ${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`);
      
      remainingMinutes -= totalSceneTime;
      currentTime = addMinutesToTime(sceneEndTime, sceneBreakTime);
      
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
  
  return optimizedScenes;
};

/**
 * 시간에 분을 더하는 함수
 * @param {string} time - 시간 (HH:MM)
 * @param {number} minutes - 더할 분
 * @returns {string} 결과 시간 (HH:MM)
 */
const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // 24시간을 넘어가는 경우 처리
  if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
  }
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
};

/**
 * 시간대별 슬롯 생성 (breakdown.timeTable과 동일한 시간대 사용)
 * @param {Array} scenes - Scene 배열
 * @param {Object} timeRange - 시간 범위 (createDaySchedule에서 계산된 값)
 * @returns {Array} 시간대별 슬롯 배열
 */
const generateTimeSlots = (scenes, timeRange = null) => {
  const timeSlots = [];
  
  // breakdown.timeTable과 동일한 시작시간 사용
  let currentTime = timeRange?.start || '09:00';
  
  console.log('🕐 시간대별 슬롯 생성 시작:', scenes.length, '개 씬');
  console.log('📍 시작시간:', currentTime);
  
  // breakdown.timeTable과 동일한 씬 순서 적용
  // 낮/밤 씬 분류 및 최적화
  const dayScenes = [];
  const nightScenes = [];
  
  scenes.forEach(scene => {
    const timeOfDay = scene.timeOfDay;
    if (timeOfDay === '아침' || timeOfDay === '오후' || timeOfDay === '낮' || timeOfDay === 'M' || timeOfDay === 'D') {
      dayScenes.push(scene);
    } else if (timeOfDay === '저녁' || timeOfDay === '밤' || timeOfDay === '새벽' || timeOfDay === 'N') {
      nightScenes.push(scene);
    } else {
      // 미정인 경우 낮 씬으로 처리
      dayScenes.push(scene);
    }
  });
  
  // breakdown.timeTable과 동일한 최적화 적용
  const optimizedDayScenes = optimizeScenesByTimeSlot(dayScenes, '낮', scenes);
  const optimizedNightScenes = optimizeScenesByTimeSlot(nightScenes, '밤', scenes);
  
  // 낮 씬 먼저, 밤 씬 나중에 배치 (breakdown.timeTable과 동일)
  const optimizedScenes = [...optimizedDayScenes, ...optimizedNightScenes];
  
  optimizedScenes.forEach((scene, idx) => {
    // 실제 촬영시간 사용
    const durationMin = scene.actualShootingDuration || getSafeDuration(scene);
    const breakTime = 30; // 씬 간 휴식 시간 (30분)
    
    // 씬 시작 시간
    const startTime = currentTime;
    
    // 씬 종료 시간 계산
    const endTime = addMinutesToTime(currentTime, durationMin);
    
    // 다음 씬 시작 시간 (휴식시간 포함)
    const nextStartTime = addMinutesToTime(endTime, breakTime);
    
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
      timeSlot: scene.timeSlot || '미정',
    });
    
    // 다음 씬을 위한 시간 업데이트
    currentTime = nextStartTime;
  });
  
  console.log('✅ 시간대별 슬롯 생성 완료');
  
  return timeSlots;
};

/**
 * 브레이크다운 생성
 * @param {Array} sceneData - Scene 데이터
 * @returns {Object} 브레이크다운 데이터
 */


/**
 * 일별 상세 브레이크다운 생성 (집합시간 + Time Table 포함)
 * @param {Object} daySchedule - 해당 날짜의 스케줄 객체 (generateOptimalSchedule의 days 배열 요소)
 * @returns {Object} 일별 상세 브레이크다운 데이터
 */
export const generateBreakdown = (daySchedule) => {
  // daySchedule에서 scenes 추출
  const dayScenes = daySchedule.scenes || [];
  try {
    const breakdown = {
      // 🆕 기본 정보 섹션 추가
      basicInfo: {
        projectTitle: daySchedule.projectTitle,        // 프로젝트 제목
        shootNumber: daySchedule.shootNumber,         // 촬영 회차 (예: "국내 39차 중 11회차")
        date: daySchedule.date,                // 촬영 날짜
        dayOfWeek: daySchedule.dayOfWeek,          // 요일
        weather: daySchedule.weather,             // 날씨 정보
        temperature: {             // 온도 정보
          max: daySchedule.temperature.max,               // 최고온도
          min: daySchedule.temperature.min,                // 최저온도
        },
        rainProbability: {         // 비올 확률
          morning: null,           // 오전 확률
          afternoon: null,          // 오후 확률
        },
        sunrise: null,             // 일출 시간
        sunset: null,              // 일몰 시간
        documentInfo: {            // 문서 정보
          fix: null,               // 수정 정보
          writer: null,             // 작성자
        },
      },
      // 🆕 연락처 정보 섹션 추가
      contacts: {
        producer: { name: null, contact: null },
        productionManager: { name: null, contact: null },
        assistantDirector: { name: null, contact: null },
        director: { name: null, contact: null },
        // 부서별 연락처
        departments: {
          direction: {},      // 연출부 연락처
          production: {},     // 제작부 연락처
          art: {},           // 미술부 연락처
          cinematography: {}, // 촬영부 연락처
          lighting: {},      // 조명부 연락처
          sound: {},         // 음향부 연락처
          costume: {},       // 의상부 연락처
          makeup: {},        // 분장부 연락처
          props: {},          // 소품부 연락처
        },
      },
      // 🆕 씬 상세 정보 섹션 추가
      sceneDetails: {
        sceneList: [],           // 씬 목록 (S#, 장소, M/D/N, S/O/L, 컷수, 장면내용, 등장인물, 단역, 비고)
        sceneSummary: {          // 씬 요약
          totalScenes: 0,
          totalCuts: 0,
          locations: [],
          timeSlots: [],
        },
      },
      // 기존 분류 정보
      locations: {},
      actors: {},
      timeSlots: {},
      equipment: {
        direction: {},      // 연출부 장비
        production: {},     // 제작부 장비
        cinematography: {}, // 촬영부 장비
        lighting: {},       // 조명부 장비
        sound: {},          // 음향부 장비
        art: {},             // 미술부 장비
      },
      crew: {
        direction: {},      // 연출부 인력
        production: {},     // 제작부 인력
        cinematography: {}, // 촬영부 인력
        lighting: {},       // 조명부 인력
        sound: {},          // 음향부 인력
        art: {},             // 미술부 인력
      },
      props: {},
      costumes: {},
      cameras: {}, // 카메라 정보 추가
      summary: {
        totalScenes: dayScenes.length,
        totalDuration: 0,
      },
      // 🆕 집합시간 및 Time Table 정보 추가
      meetingInfo: {
        meetingTime: null,        // 집합 시간
        meetingLocation: null,    // 집합 장소
        meetingPoints: [],         // 여러 집합 지점 (1차, 2차, 3차)
      },
      timeTable: [],               // 상세 타임 테이블
    };
    
    dayScenes.forEach(scene => {
      // 1. 장소별 분류 (최우선)
      const location = extractLocationFromScene(scene);
      if (!breakdown.locations[location]) {
        breakdown.locations[location] = [];
      }
      breakdown.locations[location].push(scene);
      
      // 2. 배우별 분류 (두 번째 우선순위)
      const actors = extractActorsFromScene(scene);
      actors.forEach(actor => {
        if (!breakdown.actors[actor]) {
          breakdown.actors[actor] = [];
        }
        breakdown.actors[actor].push(scene);
      });
      
      // 3. 시간대별 분류 (세 번째 우선순위)
      const timeSlot = extractTimeSlotFromScene(scene);
      if (!breakdown.timeSlots[timeSlot]) {
        breakdown.timeSlots[timeSlot] = [];
      }
      breakdown.timeSlots[timeSlot].push(scene);
      
      // 4. 장비별 분류 (부서별)
      if (scene.equipment) {
        // 연출부 장비
        if (scene.equipment.direction) {
          Object.entries(scene.equipment.direction).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (!breakdown.equipment.direction[item]) {
                  breakdown.equipment.direction[item] = [];
                }
                breakdown.equipment.direction[item].push(scene);
              });
            }
          });
        }
        
        // 제작부 장비
        if (scene.equipment.production) {
          Object.entries(scene.equipment.production).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (!breakdown.equipment.production[item]) {
                  breakdown.equipment.production[item] = [];
                }
                breakdown.equipment.production[item].push(scene);
              });
            }
          });
        }
        
        // 촬영부 장비
        if (scene.equipment.cinematography) {
          Object.entries(scene.equipment.cinematography).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (!breakdown.equipment.cinematography[item]) {
                  breakdown.equipment.cinematography[item] = [];
                }
                breakdown.equipment.cinematography[item].push(scene);
              });
            }
          });
        }
        
        // 조명부 장비
        if (scene.equipment.lighting) {
          Object.entries(scene.equipment.lighting).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (!breakdown.equipment.lighting[item]) {
                  breakdown.equipment.lighting[item] = [];
                }
                breakdown.equipment.lighting[item].push(scene);
              });
            }
          });
        }
        
        // 음향부 장비
        if (scene.equipment.sound) {
          Object.entries(scene.equipment.sound).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (!breakdown.equipment.sound[item]) {
                  breakdown.equipment.sound[item] = [];
                }
                breakdown.equipment.sound[item].push(scene);
              });
            }
          });
        }
        
        // 미술부 장비
        if (scene.equipment.art) {
          Object.entries(scene.equipment.art).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (!breakdown.equipment.art[item]) {
                  breakdown.equipment.art[item] = [];
                }
                breakdown.equipment.art[item].push(scene);
              });
            }
          });
        }
      }
      
      // 5. 인력별 분류 (부서별)
      if (scene.crew) {
        // 연출부 인력
        if (scene.crew.direction) {
          Object.entries(scene.crew.direction).forEach(([role, person]) => {
            if (person && person.trim() !== '') {
              if (!breakdown.crew.direction[person]) {
                breakdown.crew.direction[person] = [];
              }
              breakdown.crew.direction[person].push({
                ...scene,
                role: role,
              });
            }
          });
        }
        
        // 제작부 인력
        if (scene.crew.production) {
          Object.entries(scene.crew.production).forEach(([role, person]) => {
            if (person && person.trim() !== '') {
              if (!breakdown.crew.production[person]) {
                breakdown.crew.production[person] = [];
              }
              breakdown.crew.production[person].push({
                ...scene,
                role: role,
              });
            }
          });
        }
        
        // 촬영부 인력
        if (scene.crew.cinematography) {
          Object.entries(scene.crew.cinematography).forEach(([role, person]) => {
            if (person && person.trim() !== '') {
              if (!breakdown.crew.cinematography[person]) {
                breakdown.crew.cinematography[person] = [];
              }
              breakdown.crew.cinematography[person].push({
                ...scene,
                role: role,
              });
            }
          });
        }
        
        // 조명부 인력
        if (scene.crew.lighting) {
          Object.entries(scene.crew.lighting).forEach(([role, person]) => {
            if (person && person.trim() !== '') {
              if (!breakdown.crew.lighting[person]) {
                breakdown.crew.lighting[person] = [];
              }
              breakdown.crew.lighting[person].push({
                ...scene,
                role: role,
              });
            }
          });
        }
        
        // 음향부 인력
        if (scene.crew.sound) {
          Object.entries(scene.crew.sound).forEach(([role, person]) => {
            if (person && person.trim() !== '') {
              if (!breakdown.crew.sound[person]) {
                breakdown.crew.sound[person] = [];
              }
              breakdown.crew.sound[person].push({
                ...scene,
                role: role,
              });
            }
          });
        }
        
        // 미술부 인력
        if (scene.crew.art) {
          Object.entries(scene.crew.art).forEach(([role, person]) => {
            if (person && person.trim() !== '') {
              if (!breakdown.crew.art[person]) {
                breakdown.crew.art[person] = [];
              }
              breakdown.crew.art[person].push({
                ...scene,
                role: role,
              });
            }
          });
        }
      }
      
      // 6. 소품별 분류
      const props = extractPropsFromScene(scene);
      props.forEach(prop => {
        if (!breakdown.props[prop]) {
          breakdown.props[prop] = [];
        }
        breakdown.props[prop].push(scene);
      });
      
      // 7. 의상별 분류
      const costumes = extractCostumesFromScene(scene);
      costumes.forEach(costume => {
        if (!breakdown.costumes[costume]) {
          breakdown.costumes[costume] = [];
        }
        breakdown.costumes[costume].push(scene);
      });
      
      // 8. 카메라별 분류
      const cameraInfo = extractCameraFromScene(scene);
      const cameraKey = `${cameraInfo.model} - ${cameraInfo.lens}`;
      if (!breakdown.cameras[cameraKey]) {
        breakdown.cameras[cameraKey] = [];
      }
      breakdown.cameras[cameraKey].push({
        ...scene,
        cameraInfo: cameraInfo,
      });
    });
    
    // 9. 일별 요약 정보 생성
    breakdown.summary.totalScenes = dayScenes.length;
    breakdown.summary.totalDuration = dayScenes.reduce((total, scene) => {
      return total + getSafeDuration(scene);
    }, 0);
    
    // 🆕 기본 정보 생성
    generateBasicInfo(breakdown, daySchedule);
    
    // 🆕 연락처 정보 생성
    generateContactInfo(breakdown, daySchedule);
    
    // 🆕 씬 상세 정보 생성
    generateSceneDetails(breakdown, dayScenes);
    
    // 🆕 집합시간 및 Time Table 생성
    generateMeetingInfoAndTimeTable(breakdown, daySchedule);
    
    return breakdown;
  } catch (error) {
    console.error('일별 브레이크다운 생성 중 오류:', error);
    throw new Error('일별 브레이크다운 생성에 실패했습니다.');
  }
};

/**
 * 기본 정보 생성
 * @param {Object} breakdown - 브레이크다운 객체
 * @param {Object} daySchedule - 일별 스케줄 객체
 */
const generateBasicInfo = (breakdown, daySchedule) => {
  try {
    const { scenes, date } = daySchedule;
    
    // 프로젝트 제목 (첫 번째 씬에서 추출)
    if (scenes.length > 0) {
      breakdown.basicInfo.projectTitle = scenes[0].projectTitle || '프로젝트 제목 미정';
    }
    
    // 촬영 날짜 및 요일
    const today = new Date();
    breakdown.basicInfo.date = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    breakdown.basicInfo.dayOfWeek = today.toLocaleDateString('ko-KR', { weekday: 'long' });
    
    // 날씨 정보 (첫 번째 씬에서 추출)
    if (scenes.length > 0) {
      breakdown.basicInfo.weather = scenes[0].weather || '맑음';
    }
    
    // 온도 정보 (기본값)
    breakdown.basicInfo.temperature = {
      max: '28°C',
      min: '22°C',
    };
    
    // 비올 확률 (기본값)
    breakdown.basicInfo.rainProbability = {
      morning: '60%',
      afternoon: '30%',
    };
    
    // 일출/일몰 시간 (기본값)
    breakdown.basicInfo.sunrise = '05:20';
    breakdown.basicInfo.sunset = '20:00';
    
    // 문서 정보
    breakdown.basicInfo.documentInfo = {
      fix: `${today.getMonth() + 1}월${today.getDate()}일`,
      writer: '연출부',
    };
    
  } catch (error) {
    console.error('기본 정보 생성 중 오류:', error);
  }
};

/**
 * 연락처 정보 생성
 * @param {Object} breakdown - 브레이크다운 객체
 * @param {Object} daySchedule - 일별 스케줄 객체
 */
const generateContactInfo = (breakdown, daySchedule) => {
  try {
    const { scenes } = daySchedule;
    
    // 기본 연락처 정보 (실제로는 DB에서 가져와야 함)
    breakdown.contacts.producer = { name: '김재홍', contact: '019-334-2180' };
    breakdown.contacts.productionManager = { name: '백진동', contact: '011-9536-3868' };
    breakdown.contacts.assistantDirector = { name: '김미선', contact: '011-9927-7879' };
    breakdown.contacts.director = { name: '이언희', contact: '010-0000-0000' };
    
    // 부서별 연락처
    breakdown.contacts.departments.direction = {
      '연출부 미술/소품': { name: '안상훈', contact: '019-368-1676' },
    };
    
    breakdown.contacts.departments.production = {
      '제작부': { name: '유인교', contact: '011-9182-5194' },
      '라인프로듀서': { name: '온정준', contact: '011-899-0592' },
    };
    
    breakdown.contacts.departments.art = {
      '소품/특분/CG': { name: '한재빈', contact: '016-650-3048' },
    };
    
    breakdown.contacts.departments.costume = {
      '의상': { name: '유동식', contact: '016-291-8115' },
    };
    
    breakdown.contacts.departments.makeup = {
      '분장/헤어': { name: '장형수', contact: '016-272-6030' },
    };
    
  } catch (error) {
    console.error('연락처 정보 생성 중 오류:', error);
  }
};

/**
 * 씬 상세 정보 생성
 * @param {Object} breakdown - 브레이크다운 객체
 * @param {Array} dayScenes - 해당 날짜의 씬 배열
 */
const generateSceneDetails = (breakdown, dayScenes) => {
  try {
    const sceneList = [];
    let totalCuts = 0;
    const locations = new Set();
    const timeSlots = new Set();
    
    dayScenes.forEach(scene => {
      // 씬 상세 정보 생성
      const sceneDetail = {
        sceneNumber: scene.scene,                    // S#
        location: scene.location?.name || '미정',    // 장소
        timeOfDay: scene.timeOfDay || '낮',         // M/D/N
        sol: scene.sol || 'L',                      // S/O/L (Studio/Outside/Location)
        cutCount: scene.totalCuts || 1,             // 컷수
        description: scene.description || '',        // 장면 내용
        mainCast: extractMainCast(scene),           // 등장인물 (주연)
        supportingCast: extractSupportingCast(scene), // 조연
        extras: extractExtras(scene),               // 단역 및 보조출연
        remarks: scene.specialRequirements || '',     // 비고
      };
      
      sceneList.push(sceneDetail);
      
      // 요약 정보 업데이트
      totalCuts += sceneDetail.cutCount;
      locations.add(sceneDetail.location);
      timeSlots.add(sceneDetail.timeOfDay);
    });
    
    breakdown.sceneDetails.sceneList = sceneList;
    breakdown.sceneDetails.sceneSummary = {
      totalScenes: dayScenes.length,
      totalCuts: totalCuts,
      locations: Array.from(locations),
      timeSlots: Array.from(timeSlots),
    };
    
  } catch (error) {
    console.error('씬 상세 정보 생성 중 오류:', error);
  }
};

/**
 * 주연 배우 추출
 * @param {Object} scene - 씬 객체
 * @returns {String} 주연 배우 목록
 */
const extractMainCast = (scene) => {
  if (!scene.cast) return '';
  
  const mainActors = scene.cast.filter(actor => 
    actor.role === '주연' || actor.role === '주인공',
  ).map(actor => actor.name || actor.role);
  
  return mainActors.join(', ');
};

/**
 * 조연 배우 추출
 * @param {Object} scene - 씬 객체
 * @returns {String} 조연 배우 목록
 */
const extractSupportingCast = (scene) => {
  if (!scene.cast) return '';
  
  const supportingActors = scene.cast.filter(actor => 
    actor.role === '조연' || actor.role === '지원',
  ).map(actor => actor.name || actor.role);
  
  return supportingActors.join(', ');
};

/**
 * 단역 및 보조출연 추출
 * @param {Object} scene - 씬 객체
 * @returns {String} 단역 및 보조출연 목록
 */
const extractExtras = (scene) => {
  if (!scene.cast) return '';
  
  const extras = scene.cast.filter(actor => 
    actor.role === '단역' || actor.role === '보조출연' || actor.role === '엑스트라',
  ).map(actor => {
    if (actor.count) {
      return `${actor.name || actor.role}:${actor.count}명`;
    }
    return actor.name || actor.role;
  });
  
  return extras.join(', ');
};

/**
 * 집합시간 및 Time Table 생성
 * @param {Object} breakdown - 브레이크다운 객체
 * @param {Object} daySchedule - 일별 스케줄 객체
 */
const generateMeetingInfoAndTimeTable = (breakdown, daySchedule) => {
  try {
    const { scenes, timeRange, timeSlots, location, timeSlot } = daySchedule;
    
    // 1. 집합시간 설정
    if (timeRange && timeRange.start) {
      breakdown.meetingInfo.meetingTime = timeRange.start;
      breakdown.meetingInfo.meetingLocation = location || '미정';
    } else {
      // 기본 집합시간 설정 (09:00)
      breakdown.meetingInfo.meetingTime = '09:00';
      breakdown.meetingInfo.meetingLocation = location || '미정';
    }
    
    // 2. 여러 집합 지점 생성 (1차, 2차, 3차)
    breakdown.meetingInfo.meetingPoints = generateMeetingPoints(daySchedule);
    
    // 3. 상세 Time Table 생성
    breakdown.timeTable = generateDetailedTimeTable(daySchedule, breakdown);
    
  } catch (error) {
    console.error('집합시간 및 Time Table 생성 중 오류:', error);
  }
};

/**
 * 여러 집합 지점 생성 (location_group 기반, 유동적 시간 계산)
 * @param {Object} daySchedule - 일별 스케줄 객체
 * @returns {Array} 집합 지점 배열
 */
const generateMeetingPoints = (daySchedule) => {
  const { scenes, timeRange } = daySchedule;
  const meetingPoints = [];
  
  // location_group별로 씬 그룹화
  const groupScenes = {};
  scenes.forEach(scene => {
    const group = scene.location?.location_group || '미정';
    if (!groupScenes[group]) {
      groupScenes[group] = [];
    }
    groupScenes[group].push(scene);
  });
  
  // 각 location_group별로 집합 정보 생성
  const groups = Object.keys(groupScenes);
  
  groups.forEach((group, groupIndex) => {
    const groupScenesList = groupScenes[group];
    
    // 해당 그룹의 첫 번째 씬에서 대표 장소명 추출
    const representativeLocation = groupScenesList[0]?.location?.name || group;
    
    if (groupIndex === 0) {
      // 첫 번째 그룹: 1차 집합
      if (timeRange && timeRange.start) {
        meetingPoints.push({
          order: 1,
          time: timeRange.start,
          location: representativeLocation,
          group: group,
          description: '1차 집합',
        });
      }
      
      // 2차 집합: 첫 번째 그룹의 촬영 시간을 고려하여 계산
      if (timeRange && timeRange.start) {
        const firstGroupDuration = calculateGroupDuration(groupScenesList);
        const lunchTime = timeToMinutes(timeRange.start) + (4 * 60); // 4시간 후 점심
        const afterLunchTime = lunchTime + (1 * 60); // 점심 1시간 후
        
        // 첫 번째 그룹 촬영이 점심 전에 끝나는지 확인
        const firstGroupEndTime = timeToMinutes(timeRange.start) + firstGroupDuration;
        
        let secondMeetingTime;
        if (firstGroupEndTime <= lunchTime) {
          // 첫 번째 그룹이 점심 전에 끝나는 경우: 점심 후
          secondMeetingTime = afterLunchTime;
        } else {
          // 첫 번째 그룹이 점심 후에도 이어지는 경우: 첫 번째 그룹 완료 후
          secondMeetingTime = firstGroupEndTime + (30 * 60); // 30분 휴식 후
        }
        
        meetingPoints.push({
          order: 2,
          time: toTimeStr(secondMeetingTime),
          location: representativeLocation,
          group: group,
          description: '2차 집합 (점심 후)',
        });
      }
      
      // 3차 집합: 밤 씬이 있는 경우에만 생성
      const nightScenes = groupScenesList.filter(scene => 
        scene.timeOfDay === '밤' || scene.timeOfDay === 'night',
      );
      
      if (nightScenes.length > 0) {
        // 밤 씬들의 시작 시간 계산
        const dayScenes = groupScenesList.filter(scene => 
          scene.timeOfDay === '아침' || scene.timeOfDay === '오후' || scene.timeOfDay === '낮' || scene.timeOfDay === 'M' || scene.timeOfDay === 'D',
        );
        
        let nightStartTime;
        if (dayScenes.length > 0) {
          // 낮 씬이 있는 경우: 낮 씬 완료 후
          const dayDuration = calculateGroupDuration(dayScenes);
          nightStartTime = timeToMinutes(timeRange.start) + dayDuration + (30 * 60); // 30분 휴식 후
        } else {
          // 밤 씬만 있는 경우: 시작시간 + 2시간 후
          nightStartTime = timeToMinutes(timeRange.start) + (2 * 60);
        }
        
        meetingPoints.push({
          order: 3,
          time: toTimeStr(nightStartTime),
          location: representativeLocation,
          group: group,
          description: '3차 집합 (밤 촬영)',
        });
      }
    } else {
      // 추가 그룹: 이전 그룹들의 총 촬영 시간을 고려하여 계산
      const previousGroupsDuration = calculatePreviousGroupsDuration(groups.slice(0, groupIndex), groupScenes);
      const moveStartTime = timeToMinutes(timeRange?.start || '09:00') + previousGroupsDuration + (30 * 60); // 30분 이동시간
      
      meetingPoints.push({
        order: groupIndex + 1,
        time: toTimeStr(moveStartTime),
        location: representativeLocation,
        group: group,
        description: `${groupIndex + 1}차 집합 (${groups[groupIndex - 1]} → ${group})`,
      });
    }
  });
  
  return meetingPoints;
};

/**
 * 그룹의 총 촬영 시간 계산
 * @param {Array} groupScenes - 그룹의 씬들
 * @returns {number} 총 촬영 시간 (분)
 */
const calculateGroupDuration = (groupScenes) => {
  let totalDuration = 0;
  
  groupScenes.forEach((scene, index) => {
    const sceneDuration = getSafeDuration(scene);
    const breakTime = index > 0 ? 30 : 0; // 씬 간 휴식 30분
    totalDuration += sceneDuration + breakTime;
  });
  
  return totalDuration;
};

/**
 * 이전 그룹들의 총 촬영 시간 계산
 * @param {Array} previousGroups - 이전 그룹명들
 * @param {Object} groupScenes - 모든 그룹의 씬들
 * @returns {number} 총 촬영 시간 (분)
 */
const calculatePreviousGroupsDuration = (previousGroups, groupScenes) => {
  let totalDuration = 0;
  
  previousGroups.forEach(groupName => {
    const groupScenesList = groupScenes[groupName] || [];
    totalDuration += calculateGroupDuration(groupScenesList);
  });
  
  return totalDuration;
};

/**
 * 상세 Time Table 생성 (optimizeScenesByTimeSlot 로직 적용)
 * @param {Object} daySchedule - 일별 스케줄 객체
 * @param {Object} breakdown - 브레이크다운 객체
 * @returns {Array} Time Table 배열
 */
const generateDetailedTimeTable = (daySchedule, breakdown) => {
  const { scenes, timeRange, location } = daySchedule;
  const timeTable = [];
  
  if (!timeRange || !timeRange.start) {
    return timeTable;
  }
  
  let currentTime = timeToMinutes(timeRange.start);
  
  // 낮/밤 씬 분류
  const dayScenes = [];
  const nightScenes = [];
  
  scenes.forEach(scene => {
    const timeOfDay = scene.timeOfDay;
    if (timeOfDay === '아침' || timeOfDay === '오후' || timeOfDay === '낮' || timeOfDay === 'M' || timeOfDay === 'D') {
      dayScenes.push(scene);
    } else if (timeOfDay === '저녁' || timeOfDay === '밤' || timeOfDay === '새벽' || timeOfDay === 'N') {
      nightScenes.push(scene);
    } else {
      // 미정인 경우 낮 씬으로 처리
      dayScenes.push(scene);
    }
  });
  
  // 1. 집합
  timeTable.push({
    startTime: toTimeStr(currentTime),
    endTime: toTimeStr(currentTime),
    activity: '집합',
    details: `${location} 집합`,
    type: 'meeting',
  });
  
  // 2. 이동 (필요한 경우)
  if (location !== breakdown.meetingInfo?.meetingLocation) {
    timeTable.push({
      startTime: toTimeStr(currentTime),
      endTime: toTimeStr(currentTime + 60),
      activity: '이동',
      details: `${breakdown.meetingInfo?.meetingLocation || '집합장소'} → ${location}`,
      type: 'movement',
    });
    currentTime += 60;
  }
  
  // 3. 낮 씬이 있는 경우 낮 타임라인 추가 (optimizeScenesByTimeSlot 로직 적용)
  if (dayScenes.length > 0) {
    // 아침식사
    timeTable.push({
      startTime: toTimeStr(currentTime),
      endTime: toTimeStr(currentTime + 40),
      activity: '아침식사',
      details: '아침식사',
      type: 'meal',
    });
    currentTime += 40;
    
    // 셋팅
    timeTable.push({
      startTime: toTimeStr(currentTime),
      endTime: toTimeStr(currentTime + 80),
      activity: '셋팅',
      details: '카메라, 조명, 미술 셋팅 / 보조출연 준비',
      type: 'setup',
    });
    currentTime += 80;
    
    // 리허설
    timeTable.push({
      startTime: toTimeStr(currentTime),
      endTime: toTimeStr(currentTime + 30),
      activity: '리허설',
      details: '씬별 리허설',
      type: 'rehearsal',
    });
    currentTime += 30;
    
    // 낮 씬 최적화 (optimizeScenesByTimeSlot 로직 적용)
    const optimizedDayScenes = optimizeScenesByTimeSlot(dayScenes, '낮', scenes);
    
    // 최적화된 낮 씬 촬영
    optimizedDayScenes.forEach((scene, index) => {
      const sceneDuration = getSafeDuration(scene);
      
      timeTable.push({
        startTime: toTimeStr(currentTime),
        endTime: toTimeStr(currentTime + sceneDuration),
        activity: '촬영',
        details: `씬 ${scene.scene}: ${scene.title}`,
        type: 'shooting',
        sceneNumber: scene.scene,
        sceneTitle: scene.title,
      });
      
      currentTime += sceneDuration;
      
      // 씬 간 휴식 (마지막 씬이 아닌 경우)
      if (index < optimizedDayScenes.length - 1) {
        timeTable.push({
          startTime: toTimeStr(currentTime),
          endTime: toTimeStr(currentTime + 30),
          activity: '휴식',
          details: '씬 간 휴식',
          type: 'break',
        });
        currentTime += 30;
      }
    });
    
    // 점심시간 (낮 촬영 중간)
    const lunchTime = timeToMinutes(timeRange.start) + (4 * 60); // 4시간 후
    if (currentTime > lunchTime) {
      const lunchIndex = timeTable.findIndex(item => 
        timeToMinutes(item.startTime) >= lunchTime,
      );
      
      if (lunchIndex !== -1) {
        timeTable.splice(lunchIndex, 0, {
          startTime: toTimeStr(lunchTime),
          endTime: toTimeStr(lunchTime + 60),
          activity: '점심시간',
          details: '점심식사',
          type: 'meal',
        });
      }
    }
  }
  
  // 4. 밤 씬이 있는 경우 밤 타임라인 추가 (optimizeScenesByTimeSlot 로직 적용)
  if (nightScenes.length > 0) {
    // 저녁시간
    timeTable.push({
      startTime: toTimeStr(currentTime),
      endTime: toTimeStr(currentTime + 60),
      activity: '저녁시간',
      details: '저녁식사',
      type: 'meal',
    });
    currentTime += 60;
    
    // 밤 씬 최적화 (optimizeScenesByTimeSlot 로직 적용)
    const optimizedNightScenes = optimizeScenesByTimeSlot(nightScenes, '밤', scenes);
    
    // 최적화된 밤 씬 촬영
    optimizedNightScenes.forEach((scene, index) => {
      const sceneDuration = getSafeDuration(scene);
      
      timeTable.push({
        startTime: toTimeStr(currentTime),
        endTime: toTimeStr(currentTime + sceneDuration),
        activity: '촬영',
        details: `씬 ${scene.scene}: ${scene.title}`,
        type: 'shooting',
        sceneNumber: scene.scene,
        sceneTitle: scene.title,
      });
      
      currentTime += sceneDuration;
      
      // 씬 간 휴식 (마지막 씬이 아닌 경우)
      if (index < optimizedNightScenes.length - 1) {
        timeTable.push({
          startTime: toTimeStr(currentTime),
          endTime: toTimeStr(currentTime + 30),
          activity: '휴식',
          details: '씬 간 휴식',
          type: 'break',
        });
        currentTime += 30;
      }
    });
  }
  
  // 5. 철수
  timeTable.push({
    startTime: toTimeStr(currentTime),
    endTime: toTimeStr(currentTime),
    activity: '철수',
    details: '촬영 종료 및 철수',
    type: 'wrap',
  });
  
  return timeTable;
};



/**
 * Scene에서 인력 정보 추출 (Scene 스키마 기반)
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 인력 리스트
 */
const extractCrewFromScene = (scene) => {
  console.log('👥 인력 추출:', {
    id: scene._id,
    title: scene.title,
    hasCrew: !!scene.crew,
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
};

/**
 * Scene에서 소품 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 소품 리스트
 */
const extractPropsFromScene = (scene) => {
  console.log('🎭 소품 추출:', {
    id: scene._id,
    title: scene.title,
    props: scene.props,
  });
  
  // Scene 스키마의 props 배열 사용
  if (scene.props && Array.isArray(scene.props)) {
    return scene.props;
  }
  
  // 기본 소품 추가 (정보가 없는 경우)
  return ['기본 소품'];
};

/**
 * Scene에서 배우 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {Array} 배우 배열
 */
const extractActorsFromScene = (scene) => {
  console.log('🎭 배우 추출:', {
    id: scene._id,
    title: scene.title,
    cast: scene.cast,
  });
  
  // Scene 스키마의 cast 배열 사용
  if (scene.cast && Array.isArray(scene.cast)) {
    return scene.cast;
  }
  
  return [];
};

/**
 * Scene에서 시간대 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {string} 시간대 정보
 */
const extractTimeSlotFromScene = (scene) => {
  console.log('⏰ 시간대 추출:', {
    id: scene._id,
    title: scene.title,
    timeOfDay: scene.timeOfDay,
  });
  
  // Scene 스키마의 timeOfDay 사용
  if (scene.timeOfDay) {
    return scene.timeOfDay;
  }
  
  return '오후'; // 기본값
};

/**
 * Scene에서 장비 정보 추출 (Scene 스키마 기반)
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 장비 리스트
 */
const extractEquipmentFromScene = (scene) => {
  console.log('🎥 장비 추출:', {
    id: scene._id,
    title: scene.title,
    hasEquipment: !!scene.equipment,
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
};

/**
 * Scene에서 카메라 정보 추출 (Scene 스키마 기반)
 * @param {Object} scene - Scene 객체
 * @returns {Object} 추출된 카메라 정보
 */
const extractCameraFromScene = (scene) => {
  console.log('📹 카메라 정보 추출:', {
    id: scene._id,
    title: scene.title,
    hasEquipment: !!scene.equipment,
  });
  
  const cameraInfo = {
    model: '기본 카메라',
    lens: '기본 렌즈',
    settings: '기본 설정',
    movement: '고정',
    angle: '',
    work: '',
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
};

/**
 * 프로젝트 촬영 스케쥴을 생성한다 (새 알고리즘)
 * @param {Array} scenes - Scene 목록
 * @param {Array} realLocations - 실제 장소 목록
 * @param {Array} groups - 그룹(건물) 목록
 * @param {string} projectId - 프로젝트 ID
 * @returns {Object} schedule - 스케쥴 결과(날짜별 씬 배치, 안내문 등 포함)
 */



/**
 * scenes를 realLocationId 기준으로 정렬한 뒤, maxTime(분) 단위로 Day 배열로 분할
 * @param {Scene[]} scenes - Scene 목록
 * @param {number} maxTime - 한 Day의 최대 촬영 시간(분)
 * @returns {Array<{ scenes: Scene[], totalMinutes: number }>} Day 배열
 */
export function splitScenesByLocationAndTime(scenes, maxTime) {
  // 1. location.name 기준으로 정렬 (씬 기반 장소 관리)
  const sorted = [...scenes].sort((a, b) => {
    const groupA = a.location?.group_name || '';
    const groupB = b.location?.group_name || '';
    const locA = a.location?.name || '';
    const locB = b.location?.name || '';
    
    // 그룹별로 먼저 정렬
    if(groupA !== groupB) {
      if (groupA < groupB) return -1;
      if (groupA > groupB) return 1;
    }
    
    // 같은 그룹 내에서는 장소명으로 정렬
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
      totalMinutes: actualMin,
    });
    currentDay.totalMinutes += actualMin;
  }
  if (currentDay.sections.length > 0) days.push(currentDay);
  return days;
}



/**
 * 두 Scene이 같은 시간대를 가지고 있는지 확인
 * @param {Object} scene1 - 첫 번째 Scene
 * @param {Object} scene2 - 두 번째 Scene
 * @returns {boolean} 같은 시간대인지 여부
 */
const hasSameTimeSlot = (scene1, scene2) => {
  const time1 = extractTimeSlotFromScene(scene1);
  const time2 = extractTimeSlotFromScene(scene2);
  
  console.log('⏰ 시간대 비교:', {
    scene1: { id: scene1._id, title: scene1.title, time: time1 },
    scene2: { id: scene2._id, title: scene2.title, time: time2 },
  });
  
  return time1 === time2;
};

/**
 * Scene에서 의상 정보 추출
 * @param {Object} scene - Scene 객체
 * @returns {Array} 추출된 의상 리스트
 */
const extractCostumesFromScene = (scene) => {
  console.log('👗 의상 추출:', {
    id: scene._id,
    title: scene.title,
    hasEquipment: !!scene.equipment,
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
};

/**
 * 스케줄 데이터를 CSV 형태로 변환
 * @param {Object} scheduleData - 스케줄 데이터
 * @returns {string} CSV 문자열
 */
export const generateScheduleCSV = (scheduleData) => {
  let csv = 'Day,Date,Location,Scenes,Estimated Duration,Crew,Equipment\n';
  
  scheduleData.days.forEach(day => {
    csv += `${day.day},${day.date},${day.location},${day.totalScenes},${day.estimatedDuration}분,${day.crew.join(', ')},${day.equipment.join(', ')}\n`;
  });
  
  return csv;
};

/**
 * 브레이크다운 데이터를 CSV 형태로 변환
 * @param {Object} breakdownData - 브레이크다운 데이터
 * @returns {string} CSV 문자열
 */
export const generateBreakdownCSV = (breakdownData) => {
  try {
    let csv = '일별 브레이크다운\n\n';
    
    // 🆕 기본 정보 (이미지 참조)
    if (breakdownData.basicInfo) {
      csv += '기본 정보\n';
      csv += '프로젝트 제목,' + (breakdownData.basicInfo.projectTitle || '미정') + '\n';
      csv += '촬영 회차,' + (breakdownData.basicInfo.shootNumber || '미정') + '\n';
      csv += '촬영 날짜,' + (breakdownData.basicInfo.date || '미정') + '\n';
      csv += '요일,' + (breakdownData.basicInfo.dayOfWeek || '미정') + '\n';
      csv += '날씨,' + (breakdownData.basicInfo.weather || '미정') + '\n';
      csv += '최고온도,' + (breakdownData.basicInfo.temperature?.max || '미정') + '\n';
      csv += '최저온도,' + (breakdownData.basicInfo.temperature?.min || '미정') + '\n';
      csv += '비올 확률 (오전),' + (breakdownData.basicInfo.rainProbability?.morning || '미정') + '\n';
      csv += '비올 확률 (오후),' + (breakdownData.basicInfo.rainProbability?.afternoon || '미정') + '\n';
      csv += '일출,' + (breakdownData.basicInfo.sunrise || '미정') + '\n';
      csv += '일몰,' + (breakdownData.basicInfo.sunset || '미정') + '\n';
      csv += '문서 수정,' + (breakdownData.basicInfo.documentInfo?.fix || '미정') + '\n';
      csv += '작성자,' + (breakdownData.basicInfo.documentInfo?.writer || '미정') + '\n\n';
    }
    
    // 🆕 연락처 정보
    if (breakdownData.contacts) {
      csv += '연락처 정보\n';
      csv += '역할,이름,연락처\n';
      csv += 'PRODUCER,' + (breakdownData.contacts.producer?.name || '미정') + ',' + (breakdownData.contacts.producer?.contact || '미정') + '\n';
      csv += '제작부장,' + (breakdownData.contacts.productionManager?.name || '미정') + ',' + (breakdownData.contacts.productionManager?.contact || '미정') + '\n';
      csv += '조감독,' + (breakdownData.contacts.assistantDirector?.name || '미정') + ',' + (breakdownData.contacts.assistantDirector?.contact || '미정') + '\n';
      csv += '감독,' + (breakdownData.contacts.director?.name || '미정') + ',' + (breakdownData.contacts.director?.contact || '미정') + '\n\n';
      
      // 부서별 연락처
      Object.entries(breakdownData.contacts.departments).forEach(([department, contacts]) => {
        Object.entries(contacts).forEach(([role, info]) => {
          csv += `${department} ${role},${info.name || '미정'},${info.contact || '미정'}\n`;
        });
      });
      csv += '\n';
    }
    
    // 🆕 씬 상세 정보
    if (breakdownData.sceneDetails && breakdownData.sceneDetails.sceneList.length > 0) {
      csv += '씬 상세 정보\n';
      csv += 'S#,장소,M/D/N,S/O/L,컷수,장면 내용,등장인물,조연,단역 및 보조출연,비고\n';
      breakdownData.sceneDetails.sceneList.forEach(scene => {
        csv += `${scene.sceneNumber},${scene.location},${scene.timeOfDay},${scene.sol},${scene.cutCount},${scene.description},${scene.mainCast},${scene.supportingCast},${scene.extras},${scene.remarks}\n`;
      });
      csv += '\n';
    }
    
    // 기본 정보 (요약)
    csv += '요약 정보\n';
    csv += '총 씬 수,' + breakdownData.summary.totalScenes + '\n';
    csv += '총 시간,' + breakdownData.summary.totalDuration + '분\n\n';
    
    // 🆕 집합시간 정보
    if (breakdownData.meetingInfo) {
      csv += '집합시간 정보\n';
      csv += '차수,시간,장소,설명\n';
      breakdownData.meetingInfo.meetingPoints.forEach(point => {
        csv += `${point.order},${point.time},${point.location},${point.description}\n`;
      });
      csv += '\n';
    }
    
    // 🆕 Time Table
    if (breakdownData.timeTable && breakdownData.timeTable.length > 0) {
      csv += 'Time Table\n';
      csv += '시작시간,종료시간,활동,세부내용\n';
      breakdownData.timeTable.forEach(item => {
        csv += `${item.startTime},${item.endTime},${item.activity},${item.details}\n`;
      });
      csv += '\n';
    }
    
    // 장비 정보 (부서별)
    csv += '장비 정보 (부서별)\n';
    csv += '부서,장비명,사용 씬\n';
    Object.entries(breakdownData.equipment).forEach(([department, equipments]) => {
      Object.entries(equipments).forEach(([equipment, scenes]) => {
        csv += department + ',' + equipment + ',' + scenes.map(s => s.scene).join(', ') + '\n';
      });
    });
    csv += '\n';
    
    // 인력 정보 (부서별)
    csv += '인력 정보 (부서별)\n';
    csv += '부서,이름,역할,담당 씬\n';
    Object.entries(breakdownData.crew).forEach(([department, crews]) => {
      Object.entries(crews).forEach(([crew, scenes]) => {
        scenes.forEach(scene => {
          csv += department + ',' + crew + ',' + scene.role + ',' + scene.scene + '\n';
        });
      });
    });
    csv += '\n';
    
    // 소품 정보
    csv += '소품 정보\n';
    csv += '소품명,사용 씬\n';
    Object.entries(breakdownData.props).forEach(([prop, scenes]) => {
      csv += prop + ',' + scenes.map(s => s.scene).join(', ') + '\n';
    });
    csv += '\n';
    
    // 의상 정보
    csv += '의상 정보\n';
    csv += '의상명,사용 씬\n';
    Object.entries(breakdownData.costumes).forEach(([costume, scenes]) => {
      csv += costume + ',' + scenes.map(s => s.scene).join(', ') + '\n';
    });
    csv += '\n';
    
    // 카메라 정보
    csv += '카메라 정보\n';
    csv += '카메라/렌즈,사용 씬\n';
    Object.entries(breakdownData.cameras).forEach(([camera, scenes]) => {
      csv += camera + ',' + scenes.map(s => s.scene).join(', ') + '\n';
    });
    
    return csv;
  } catch (error) {
    console.error('CSV 생성 중 오류:', error);
    throw new Error('CSV 생성에 실패했습니다.');
  }
};

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
    realLocationId: scene.location?.realLocationId,
  });
  
  // Scene의 location.name 사용
  if (scene.location && scene.location.name && scene.location.name !== '') {
    return scene.location.name;
  }
  // 정보가 없으면 '미정' 반환
  return '미정';
};

/**
 * 장소 변경 시 새 날짜 시작 여부 판단 (씬 기반 그룹 관리)
 * @param {string} currentLocation - 현재 장소명
 * @param {string} newLocation - 새로운 장소명
 * @param {Array} currentDayScenes - 현재 날짜의 씬들
 * @returns {boolean} 새 날짜 시작 여부
 */
const shouldStartNewDayForLocation = (currentLocation, newLocation, currentDayScenes) => {
  // 첫 번째 씬이거나 현재 장소가 없는 경우
  if (!currentLocation || currentDayScenes.length === 0) {
    return false;
  }
  
  // 같은 장소인 경우
  if (currentLocation === newLocation) {
    return false;
  }
  
  // 현재 장소의 씬 개수 계산
  const currentLocationScenes = currentDayScenes.filter(scene => 
    extractLocationFromScene(scene) === currentLocation
  );
  
  const currentLocationSceneCount = currentLocationScenes.length;
  
  console.log('[SchedulerService] 장소 변경 검토:', {
    currentLocation,
    newLocation,
    currentLocationSceneCount,
  });
  
  // 현재 장소에서 3개 이상 씬을 촬영했으면 새 날짜
  if (currentLocationSceneCount >= 3) {
    console.log(`[SchedulerService] 현재 장소에서 ${currentLocationSceneCount}개 씬 완료, 새 날짜 시작`);
    return true;
  }
  
  // 현재 장소에서 씬이 적으면 같은 날에 다른 장소 씬 추가
  console.log(`[SchedulerService] 다른 장소로 이동, 현재 장소에서 ${currentLocationSceneCount}개 씬만 있어 효율적으로 계속`);
  return false;
};

/**
 * 타임라인 생성 (세팅, 리허설, 촬영, 점심시간 포함)
 * @param {Array} sections - 씬 섹션 배열
 * @param {string} timeType - 'day' 또는 'night'
 * @returns {Array} 타임라인 배열
 */
const createTimeline = (sections, timeType) => {
  const timeline = [];
  
  for(let j = 0; j < sections.length; j++) {
    const section = sections[j];
    const prevSection = j > 0 ? sections[j-1] : null;
    
    // 장소 변경 시 세팅/이동 시간 추가
    if(j === 0 || (prevSection && section.location?.realLocationId !== prevSection.location?.realLocationId)) {
      const setupType = j === 0 ? 
        (timeType === 'day' ? '세팅' : '밤 세팅') : 
        '장소 이동 및 세팅';
      timeline.push({ type: setupType, duration: 60 });
      timeline.push({ type: '리허설', duration: 30 });
    }
    
    // 촬영 시간 추가
    const duration = section.totalMinutes || parseDurationToMinutes(section.estimatedDuration || '5분') * 20;
    timeline.push({ type: '촬영', duration: duration, scene: section });
  }
  
  // 낮 타임라인의 경우 점심시간 추가
  if(timeType === 'day' && timeline.length > 0) {
    let currentTime = 0;
    let lunchIdx = undefined;
    
    // 5시간(300분) 후에 점심시간 배치
    for(let j = timeline.length - 1; j >= 0; j--) {
      if(currentTime >= 5 * 60 && timeline[j].type === '촬영') {
        lunchIdx = j;
        break;
      }
      currentTime += timeline[j].duration;
    }
    
    if(lunchIdx !== undefined) {
      timeline.splice(lunchIdx + 1, 0, { type: '점심', duration: 60 });
    }
  }
  
  return timeline;
};

/**
 * 분을 HH:MM 형식으로 변환
 * @param {number} mins - 분
 * @returns {string} HH:MM 형식의 시간 문자열
 */
const toTimeStr = (mins) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  let prefix = '';
  if (h >= 24) {
    prefix = '익일 ';
    h -= 24;
  }
  return `${prefix}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * HH:MM 형식을 분으로 변환
 * @param {string} str - HH:MM 형식의 시간 문자열
 * @returns {number} 분
 */
const timeToMinutes = (str) => {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
};

/**
 * 통합 타임라인 생성 (낮/밤 구분 없이 유동적 처리)
 * @param {Array} sections - 씬 섹션 배열
 * @returns {Array} 통합 타임라인 배열
 */
const createUnifiedTimeline = (sections) => {
  const timeline = [];
  
  // 낮/밤 씬 분류
  const daySections = [];
  const nightSections = [];
  
  sections.forEach(section => {
    const timeOfDay = section.timeOfDay;
    if (timeOfDay === '아침' || timeOfDay === '오후' || timeOfDay === '낮') {
      daySections.push(section);
    } else if (timeOfDay === '저녁' || timeOfDay === '밤' || timeOfDay === '새벽') {
      nightSections.push(section);
    } else {
      // 미정인 경우 낮 씬으로 처리
      daySections.push(section);
    }
  });
  
  // 전체 타임라인 구성
  timeline.push({ type: '집합', duration: 0 });
  timeline.push({ type: '이동', duration: 60 });
  
  // 낮 씬이 있는 경우 낮 타임라인 추가
  if (daySections.length > 0) {
    const dayTimeline = createTimeline(daySections, 'day');
    timeline.push(...dayTimeline);
  }
  
  // 밤 씬이 있는 경우 밤 타임라인 추가
  if (nightSections.length > 0) {
    timeline.push({ type: '저녁', duration: 60 });
    const nightTimeline = createTimeline(nightSections, 'night');
    timeline.push(...nightTimeline);
  }
  
  timeline.push({ type: '철수', duration: 0 });
  
  return timeline;
};

