import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scheduler, SchedulerDocument } from './schema/scheduler.schema';
import { CreateSchedulerRequestDto, UpdateSchedulerRequestDto } from './dto/request.dto';
import { SchedulerResponseDto } from './dto/response.dto';
import { SceneService } from 'src/scene/scene.service';
import { SceneResponseDto } from 'src/scene/dto/response.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectModel(Scheduler.name) private schedulerModel: Model<Scheduler>,
    private sceneService: SceneService
  ) {}

  createScheduler(scenes: SceneResponseDto[]): SchedulerResponseDto {
    const schedule = this.optimizeScheduleWithWeights(scenes);
    
    // 각 일일 스케줄에 breakdown 생성
    schedule.days = schedule.days.map(day => ({
      ...day,
      breakdown: this.generateBreakdown(day)
    }));
    
    return schedule;
  }
  

  async create(projectId: string, createSchedulerDto: CreateSchedulerRequestDto): Promise<SchedulerResponseDto> {
    console.log('🎬 Scheduler 생성 시작:', { projectId });
    
    const scenes = await this.sceneService.findByProjectId(projectId);
    console.log('📋 조회된 Scene 데이터:', {
      totalScenes: scenes.length,
      sceneIds: scenes.map(scene => scene._id),
      sceneTitles: scenes.map(scene => scene.title),
      sceneOrders: scenes.map(scene => scene.order)
    });
    
    const scheduler = this.createScheduler(scenes);

    const schedulerResult = new this.schedulerModel({
      ...createSchedulerDto,
      projectId: new Types.ObjectId(projectId),
      days: scheduler.days,
      totalDays: scheduler.totalDays,
      totalScenes: scheduler.totalScenes,
      totalDuration: scheduler.totalDuration,
    });

    await schedulerResult.save();
    
    console.log('✅ Scheduler 생성 완료:', {
      schedulerId: schedulerResult._id,
      totalDays: schedulerResult.totalDays,
      totalScenes: schedulerResult.totalScenes
    });
    
    return schedulerResult;
  }

  async findByProjectId(projectId: string): Promise<SchedulerResponseDto[]> {
    const schedulers = await this.schedulerModel.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).exec();
    return schedulers;
  }

  async findById(projectId: string, schedulerId: string): Promise<SchedulerResponseDto> {
    const scheduler = await this.schedulerModel.findOne({
      _id: new Types.ObjectId(schedulerId),
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).exec();

    if (!scheduler) {
      throw new NotFoundException('스케줄러를 찾을 수 없습니다.');
    }

    return scheduler;
  }

  async update(projectId: string, schedulerId: string, updateSchedulerDto: UpdateSchedulerRequestDto): Promise<SchedulerResponseDto> {
    const scheduler = await this.schedulerModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(schedulerId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
      {
        $set: {
          ...updateSchedulerDto
        }
      },
      { new: false }
    )

    if (!scheduler) {
      throw new NotFoundException('스케줄러를 찾을 수 없습니다.');
    }

    return scheduler;
  }

  async delete(projectId: string, schedulerId: string): Promise<SchedulerResponseDto> {
    const scheduler = await this.schedulerModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(schedulerId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
    )

    if (!scheduler) {
      throw new NotFoundException('스케줄러를 찾을 수 없습니다.');
    }

    return scheduler;
  }

  /**
   * 가중치 기반 스케줄 최적화
   */
  private optimizeScheduleWithWeights(allScenes: SceneResponseDto[]): SchedulerResponseDto {
    console.log('🎬 가중치 기반 스케줄 최적화 시작:', {
      totalScenes: allScenes.length,
      sceneIds: allScenes.map(scene => scene._id),
      sceneTitles: allScenes.map(scene => scene.title)
    });
    
    // 각 Scene에 대한 가중치 계산
    const scenesWithWeights = allScenes.map(scene => {
      const weight = this.calculateSceneWeight(scene, allScenes);
      console.log('🔍 개별 Scene 가중치 계산:', {
        id: scene._id,
        order: scene.order,
        title: scene.title,
        weight: weight
      });
      
      // Scene 객체를 명시적으로 복사하여 가중치 추가
      const sceneWithWeight = {
        _id: scene._id,
        order: scene.order,
        title: scene.title,
        location: scene.location,
        timeOfDay: scene.timeOfDay,
        estimatedDuration: scene.estimatedDuration,
        cast: scene.cast,
        crew: scene.crew,
        equipment: scene.equipment,
        projectId: scene.projectId,
        description: scene.description,
        dialogues: scene.dialogues,
        weather: scene.weather,
        lighting: scene.lighting,
        visualDescription: scene.visualDescription,
        scenePlace: scene.scenePlace,
        sceneDateTime: scene.sceneDateTime,
        vfxRequired: scene.vfxRequired,
        sfxRequired: scene.sfxRequired,
        extra: scene.extra,
        specialRequirements: scene.specialRequirements,
        isDeleted: scene.isDeleted,
        weight: weight
      };
      
      console.log('🔍 Scene with weight 생성:', {
        id: sceneWithWeight._id,
        order: sceneWithWeight.order,
        title: sceneWithWeight.title,
        weight: sceneWithWeight.weight
      });
      
      return sceneWithWeight;
    });
    
    console.log('✅ 가중치 계산 완료:', scenesWithWeights.length, '개 씬');
    console.log('🔍 가중치 계산된 씬 데이터:', scenesWithWeights.map(scene => ({
      id: scene._id,
      order: scene.order,
      title: scene.title,
      weight: scene.weight
    })));
    
    // 최적화된 일정 생성
    const days = this.createScheduleFromOptimizedScenes(scenesWithWeights, allScenes[0]?.projectId?.toString());
    
    return {
      _id: new Types.ObjectId(),
      days,
      totalDays: days.length,
      totalScenes: days.reduce((total, day) => total + day.scenes.length, 0),
      totalDuration: days.reduce((total, day) => total + day.estimatedDuration, 0)
    };
  }

  /**
   * Scene의 가중치 계산 (다차원 우선순위 기반)
   */
  private calculateSceneWeight(scene: SceneResponseDto, allScenes: SceneResponseDto[]) {
    // 1. 장소 가중치 (최우선)
    const sameLocationScenes = allScenes.filter(s => 
      this.extractLocationFromScene(s) === this.extractLocationFromScene(scene)
    );
    const locationWeight = sameLocationScenes.length * 1000;
    
    // 2. 배우 가중치 (두 번째 우선순위) - 배우별 대기시간 최적화
    const actorWeight = this.calculateActorWaitingTimeWeight(scene, allScenes);
    
    // 3. 시간대 가중치 (세 번째 우선순위)
    const sameTimeSlotScenes = allScenes.filter(s => 
      this.hasSameTimeSlot(s, scene)
    );
    const timeSlotWeight = sameTimeSlotScenes.length * 200;
    
    // 4. 장비 가중치 (네 번째 우선순위)
    const sameEquipmentScenes = allScenes.filter(s => 
      this.extractEquipmentFromScene(s) === this.extractEquipmentFromScene(scene)
    );
    const equipmentWeight = sameEquipmentScenes.length * 100;
    
    // 5. 복잡도 가중치 (다섯 번째 우선순위)
    const duration = scene.estimatedDuration || '5분';
    const durationMinutes = this.parseDurationToMinutes(duration);
    const complexityWeight = durationMinutes * 10;
    
    // 6. 우선순위 가중치 (Scene 번호가 낮을수록 높은 가중치)
    const sceneNumber = scene.order || 1;
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
      location: this.extractLocationFromScene(scene),
      actors: this.extractActorsFromScene(scene),
      timeOfDay: this.extractTimeSlotFromScene(scene),
      equipment: this.extractEquipmentFromScene(scene),
      duration: durationMinutes,
      sceneNumber
    };
  }

  /**
   * 배우별 대기시간 최적화 가중치 계산
   */
  private calculateActorWaitingTimeWeight(scene: SceneResponseDto, allScenes: SceneResponseDto[]): number {
    let totalWeight = 0;
    const sceneActors = this.extractActorsFromScene(scene);
    
    // 각 배우별로 대기시간 최적화 가중치 계산
    sceneActors.forEach(actor => {
      // 해당 배우가 나오는 모든 씬들 찾기
      const actorScenes = allScenes.filter(s => 
        this.extractActorsFromScene(s).includes(actor)
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
        this.extractLocationFromScene(s) === this.extractLocationFromScene(scene)
      );
      const sameTimeSlotActorScenes = actorScenes.filter(s => 
        this.extractTimeSlotFromScene(s) === this.extractTimeSlotFromScene(scene)
      );
      
      // 같은 장소에 몰려있으면 높은 가중치 (연속 촬영 가능)
      totalWeight += sameLocationActorScenes.length * 100;
      
      // 같은 시간대에 몰려있으면 높은 가중치 (연속 촬영 가능)
      totalWeight += sameTimeSlotActorScenes.length * 50;
    });
    
    return totalWeight;
  }

  /**
   * 시간 문자열을 분으로 변환
   */
  private parseDurationToMinutes(duration: string | number): number {
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)분/);
      return match ? Number(match[1]) : 5;
    }
    return typeof duration === 'number' ? duration : 5;
  }

  /**
   * 최적화된 씬들을 일정으로 배치
   */
  private createScheduleFromOptimizedScenes(scenesWithWeights: (SceneResponseDto & { weight: any })[], projectId?: string): any[] {
    console.log('🎬 스케줄 생성 시작:', scenesWithWeights.length, '개 씬');
    
    // Scene 데이터 검증
    console.log('🔍 Scene 데이터 검증:', scenesWithWeights.map(scene => ({
      id: scene._id,
      order: scene.order,
      title: scene.title,
      location: scene.location?.name,
      timeOfDay: scene.timeOfDay,
      estimatedDuration: scene.estimatedDuration,
      weight: scene.weight
    })));
    
    // Scene 데이터가 비어있는지 확인
    if (!scenesWithWeights || scenesWithWeights.length === 0) {
      console.log('⚠️ Scene 데이터가 비어있습니다.');
      return [];
    }
    
    // 1. 장소별로 그룹화
    const locationGroups: { [key: string]: (SceneResponseDto & { weight: any })[] } = {};
    
    for (const scene of scenesWithWeights) {
      console.log('🔍 개별 Scene 처리:', {
        id: scene._id,
        order: scene.order,
        title: scene.title,
        location: scene.location?.name,
        timeOfDay: scene.timeOfDay
      });
      
      const location = this.extractLocationFromScene(scene);
      if (!locationGroups[location]) {
        locationGroups[location] = [];
      }
      locationGroups[location].push(scene);
    }
    
    console.log('📍 장소별 그룹화 결과:', Object.keys(locationGroups).map(key => `${key}: ${locationGroups[key].length}개`));
    
    // 2. 각 장소 내에서 시간대별로 정렬
    const locationTimeSlotOptimizedScenes: (SceneResponseDto & { weight: any })[] = [];
    
    for (const [location, scenes] of Object.entries(locationGroups)) {
      console.log(`📍 ${location} 장소 내 시간대별 정렬 시작 (${scenes.length}개 씬)`);
      
      // 장소 내 씬들을 시간대별로 그룹화
      const timeSlotGroupsInLocation = this.groupScenesByTimeSlot(scenes);
      
      // 시간대 순서 정의 (새벽 → 아침 → 점심 → 저녁 → 밤)
      const timeSlotOrder = ['새벽', '아침', '점심', '저녁', '밤'];
      
      // 정의된 순서대로 씬들을 추가
      for (const timeSlot of timeSlotOrder) {
        if (timeSlotGroupsInLocation[timeSlot]) {
          console.log(`  ⏰ ${timeSlot} 시간대 정렬 시작 (${timeSlotGroupsInLocation[timeSlot].length}개 씬)`);
          
          // 시간대별 최적화 적용
          const optimizedScenesForTimeSlot = this.optimizeScenesByTimeSlot(
            timeSlotGroupsInLocation[timeSlot], 
            timeSlot, 
            scenes // 같은 장소의 모든 씬들
          );
          
          console.log(`  🎯 ${timeSlot} 시간대 최적화 결과:`, optimizedScenesForTimeSlot.map(scene => ({
            scene: scene.order,
            title: scene.title,
            totalWeight: scene.weight.totalWeight,
            sceneNumber: scene.weight.sceneNumber,
            timeSlotDisplay: scene.timeSlotDisplay
          })));
          
          // 최적화된 씬들을 결과 배열에 추가
          locationTimeSlotOptimizedScenes.push(...optimizedScenesForTimeSlot);
          
          console.log(`  ✅ ${timeSlot} 시간대 최적화 완료 (${optimizedScenesForTimeSlot.length}개 씬)`);
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
      scene: scene.order,
      title: scene.title,
      timeSlot: this.extractTimeSlotFromScene(scene),
      totalWeight: scene.weight.totalWeight,
      sceneNumber: scene.weight.sceneNumber
    })));
    
    // 3. 정렬된 씬들을 일정으로 배치
    const days: any[] = [];
    let currentDay = 1;
    let currentDayScenes: (SceneResponseDto & { weight: any })[] = [];
    let currentDayDuration = 0;
    let currentDayLocation: string | null = null;
    let currentDayTimeSlot: string | null = null;
    
    // 하루 최대 촬영 시간 (8시간 = 480분)
    const MAX_DAILY_DURATION = 480;
    // 씬 간 휴식 시간 (30분 = 30분)
    const SCENE_BREAK_TIME = 30;
    
    console.log('[SchedulerService] 스케줄 배치 시작:', {
      totalScenes: locationTimeSlotOptimizedScenes.length,
      maxDailyDuration: MAX_DAILY_DURATION
    });
    
    for (let i = 0; i < locationTimeSlotOptimizedScenes.length; i++) {
      const scene = locationTimeSlotOptimizedScenes[i];
      const sceneDuration = this.getSafeDuration(scene);
      const sceneLocation = this.extractLocationFromScene(scene);
      const sceneTimeSlot = this.extractTimeSlotFromScene(scene);
      
      // 하루에 배치할 수 없는 경우(시간 부족) 다음 날로 넘김
      const wouldExceed = (currentDayDuration + sceneDuration + (currentDayScenes.length > 0 ? SCENE_BREAK_TIME : 0)) > MAX_DAILY_DURATION;
      
      const needsNewDay = (
        currentDayScenes.length === 0 || // 첫 번째 씬
        this.shouldStartNewDayForLocation(currentDayLocation, sceneLocation, currentDayScenes) || // 장소 변경 조건
        wouldExceed || // 시간 초과
        currentDayScenes.length >= 6 // 하루 최대 6개 씬
      );

      if (needsNewDay && currentDayScenes.length > 0) {
        // 현재 날짜 완료하고 새 날짜 시작
        days.push(this.createDaySchedule(
          currentDay,
          currentDayScenes,
          currentDayDuration,
          currentDayLocation,
          currentDayTimeSlot,
          projectId
        ));
        currentDay++;
        currentDayScenes = [];
        currentDayDuration = 0;
        currentDayLocation = null;
        currentDayTimeSlot = null;
      }

      // 씬을 현재 날짜에 추가
      currentDayScenes.push(scene);
      const addedDuration = sceneDuration + (currentDayScenes.length > 1 ? SCENE_BREAK_TIME : 0);
      currentDayDuration += addedDuration;
      
      currentDayLocation = sceneLocation;
      currentDayTimeSlot = sceneTimeSlot;

      console.log(`[SchedulerService] 씬 ${scene.order} 추가:`, {
        day: currentDay,
        location: sceneLocation,
        timeSlot: sceneTimeSlot,
        duration: sceneDuration,
        totalDuration: currentDayDuration,
        scenesCount: currentDayScenes.length,
        sceneTitle: scene.title
      });
    }
    
    // 마지막 날짜 추가
    if (currentDayScenes.length > 0) {
      days.push(this.createDaySchedule(
        currentDay,
        currentDayScenes,
        currentDayDuration,
        currentDayLocation,
        currentDayTimeSlot,
        projectId
      ));
    }
    
    console.log('[SchedulerService] 스케줄 생성 완료:', {
      totalDays: days.length,
      totalScenes: days.reduce((total, day) => total + day.scenes.length, 0)
    });
    
    return days;
  }

  /**
   * 일일 스케줄 생성
   */
  private createDaySchedule(
    dayNumber: number, 
    scenes: (SceneResponseDto & { weight: any })[], 
    duration: number, 
    location: string | null, 
    timeSlot: string | null = null,
    projectId?: string
  ): any {
    console.log(`[SchedulerService] Day ${dayNumber}, 장소: ${location}, 시간대: ${timeSlot} 스케줄 생성:`, {
      scenesCount: scenes.length,
      totalDuration: duration,
      locations: scenes.map(scene => this.extractLocationFromScene(scene)),
      timeSlots: scenes.map(scene => this.extractTimeSlotFromScene(scene)),
      sceneTitles: scenes.map(scene => scene.title || `씬 ${scene.order}`)
    });
    
    // 시간대별 시간 범위 설정
    const timeRange = scenes.length > 0 ? (() => {
      // 낮/밤 씬 분류 및 시간 계산
      const dayScenes: (SceneResponseDto & { weight: any })[] = [];
      const nightScenes: (SceneResponseDto & { weight: any })[] = [];
      let dayTotalDuration = 0;
      let nightTotalDuration = 0;
      
      scenes.forEach((scene, index) => {
        const sceneDuration = this.getSafeDuration(scene);
        const breakTime = index > 0 ? 30 : 0;
        const totalSceneTime = sceneDuration + breakTime;
        
        const timeOfDay = scene.timeOfDay;
        if (timeOfDay === '새벽' || timeOfDay === '아침' || timeOfDay === '점심' || timeOfDay === '오후' || timeOfDay === '낮' || timeOfDay === 'M' || timeOfDay === 'D') {
          dayScenes.push(scene);
          dayTotalDuration += totalSceneTime;
        } else if (timeOfDay === '저녁' || timeOfDay === '밤' || timeOfDay === 'N') {
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
      const endTime = this.addMinutesToTime(startTime, totalDuration);
      
      return {
        start: startTime,
        end: endTime
      };
    })() : null;
    
    // 스케줄 표시용 핵심 정보만 추출
    const scenesWithDetails = scenes.map(scene => ({
      scene: scene.order,
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
        setProps: []
      }
    }));
    
    // 스케줄 row 반환
    return {
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      day: dayNumber,
      date: `Day ${dayNumber}`,
      timeRange: timeRange,
      scenes: scenesWithDetails,
      totalScenes: scenes.length,
      estimatedDuration: duration,
      crew: this.getRequiredCrew(scenes),
      equipment: this.getRequiredEquipment(scenes),
             timeSlots: this.generateTimeSlots(scenes, timeRange),
       location_groups: [location || '미정']
    };
  }

  /**
   * 필요한 인력 계산
   */
  private getRequiredCrew(scenes: (SceneResponseDto & { weight: any })[]): string[] {
    const crew = new Set(['감독', '촬영감독', '카메라맨']);
    
    scenes.forEach(scene => {
      const description = scene.description || '';
      
      // 인력 키워드들
      const crewKeywords = [
        '배우', '엑스트라', '스턴트', '메이크업', '의상', '소품',
        'actor', 'extra', 'stunt', 'makeup', 'costume', 'prop'
      ];
      
      crewKeywords.forEach(keyword => {
        if (description.toLowerCase().includes(keyword.toLowerCase())) {
          crew.add(keyword);
        }
      });
    });
    
    return Array.from(crew);
  }

  /**
   * 필요한 장비 계산
   */
  private getRequiredEquipment(scenes: (SceneResponseDto & { weight: any })[]): string[] {
    const equipment = new Set(['카메라', '조명', '마이크']);
    
    scenes.forEach(scene => {
      const description = scene.description || '';
      
      // 장비 키워드들
      const equipmentKeywords = [
        '크레인', '돌리', '스테디캠', '그린스크린', '스탠드',
        'crane', 'dolly', 'steadicam', 'greenscreen', 'stand'
      ];
      
      equipmentKeywords.forEach(keyword => {
        if (description.toLowerCase().includes(keyword.toLowerCase())) {
          equipment.add(keyword);
        }
      });
    });
    
    return Array.from(equipment);
  }

  /**
   * 안전한 촬영 시간 계산
   */
  private getSafeDuration(scene: SceneResponseDto): number {
    // estimatedDuration이 '3분', '4분' 등 문자열일 수 있으므로 숫자만 추출
    let raw: string | number = scene.estimatedDuration;
    let num: number;
    
    if (typeof raw === 'string') {
      // 정규표현식으로 숫자만 추출
      const match = raw.match(/\d+/);
      num = match ? Number(match[0]) : NaN;
    } else if (typeof raw === 'number') {
      num = raw;
    } else {
      num = NaN;
    }
    // 기본값: 5분
    if (isNaN(num) || num <= 0) return 5;
    // 실제 촬영 시간 계산 (분량 시간의 20배)
    const contentDuration = num; // 분량 시간
    const shootingRatio = 20; // 20배 고정 (현실적인 촬영 비율)
    const actualDuration = Math.round(contentDuration * shootingRatio);
    // 실제 계산된 촬영시간 반환
    return actualDuration;
  }

  /**
   * 시간대별 Scene 그룹화
   */
  private groupScenesByTimeSlot(scenes: (SceneResponseDto & { weight: any })[]): { [key: string]: (SceneResponseDto & { weight: any })[] } {
    const groups: { [key: string]: (SceneResponseDto & { weight: any })[] } = {};
    
    scenes.forEach(scene => {
      const timeSlot = this.extractTimeSlotFromScene(scene);
      if (!groups[timeSlot]) {
        groups[timeSlot] = [];
      }
      groups[timeSlot].push(scene);
    });
    
    console.log('🕐 시간대별 그룹화 결과:', Object.keys(groups).map(key => `${key}: ${groups[key].length}개`));
    
    return groups;
  }

  /**
   * 시간에 분을 더하는 함수
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + mins + minutes;
    
    // 24시간을 넘어가는 경우 처리
    if (totalMinutes >= 24 * 60) {
      totalMinutes -= 24 * 60;
    }
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * 시간대별 슬롯 생성
   */
  private generateTimeSlots(scenes: (SceneResponseDto & { weight: any })[], timeRange: any = null): any[] {
    const timeSlots: any[] = [];
    
    // breakdown.timeTable과 동일한 시작시간 사용
    let currentTime = timeRange?.start || '09:00';
    
    console.log('🕐 시간대별 슬롯 생성 시작:', scenes.length, '개 씬');
    console.log('📍 시작시간:', currentTime);
    
    // breakdown.timeTable과 동일한 씬 순서 적용
    // 낮/밤 씬 분류 및 최적화
    const dayScenes: (SceneResponseDto & { weight: any })[] = [];
    const nightScenes: (SceneResponseDto & { weight: any })[] = [];
    
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
    const optimizedDayScenes = this.optimizeScenesByTimeSlot(dayScenes, '낮', scenes);
    const optimizedNightScenes = this.optimizeScenesByTimeSlot(nightScenes, '밤', scenes);
    
    // 낮 씬 먼저, 밤 씬 나중에 배치 (breakdown.timeTable과 동일)
    const optimizedScenes = [...optimizedDayScenes, ...optimizedNightScenes];
    
    optimizedScenes.forEach((scene, idx) => {
      // 실제 촬영시간 사용
      const durationMin = scene.actualShootingDuration || this.getSafeDuration(scene);
      const breakTime = 30; // 씬 간 휴식 시간 (30분)
      
      // 씬 시작 시간
      const startTime = currentTime;
      
      // 씬 종료 시간 계산
      const endTime = this.addMinutesToTime(currentTime, durationMin);
      
      // 다음 씬 시작 시간 (휴식시간 포함)
      const nextStartTime = this.addMinutesToTime(endTime, breakTime);
      
      console.log(`  📋 씬 ${scene.order || idx + 1}:`);
      console.log(`    - 제목: ${scene.title}`);
      console.log(`    - 시작: ${startTime}, 종료: ${endTime}`);
      console.log(`    - 촬영시간: ${durationMin}분`);
      console.log(`    - 휴식시간: ${breakTime}분`);
      console.log(`    - 다음 씬 시작: ${nextStartTime}`);
      
      timeSlots.push({
        scene: scene.order || idx + 1,
        title: scene.title,
        startTime,
        endTime,
        duration: durationMin,
        breakTime: breakTime,
        totalTime: durationMin + breakTime,
        description: scene.description,
        timeSlot: this.extractTimeSlotFromScene(scene) || '미정'
      });
      
      // 다음 씬을 위한 시간 업데이트
      currentTime = nextStartTime;
    });
    
    console.log('✅ 시간대별 슬롯 생성 완료');
    
    return timeSlots;
  }

  /**
   * 시간대별 촬영 시간 최적화
   */
  private optimizeScenesByTimeSlot(scenes: (SceneResponseDto & { weight: any })[], timeOfDay: string, allScenesInLocation: (SceneResponseDto & { weight: any })[] | null = null): (SceneResponseDto & { weight: any } & { actualShootingDuration?: number; sceneStartTime?: string; sceneEndTime?: string; breakTime?: number; totalTimeSlot?: number; timeSlotDisplay?: string; timeRange?: any })[] {
    // 같은 장소에 밤 씬이 있는지 확인
    let isLateStart = false;
    if ((timeOfDay === '낮' || timeOfDay === 'day') && allScenesInLocation) {
      isLateStart = allScenesInLocation.some(s => {
        const t = this.extractTimeSlotFromScene(s);
        return t === '밤' || t === 'night';
      });
    }
    
    console.log(`🔍 [optimizeScenesByTimeSlot] 시간대: ${timeOfDay}, isLateStart: ${isLateStart}`);
    if (allScenesInLocation) {
      console.log(`📍 같은 장소의 모든 씬들:`, allScenesInLocation.map(s => ({
        scene: s.order,
        title: s.title,
        timeOfDay: this.extractTimeSlotFromScene(s)
      })));
    }
    
    // 시간대별 기본 시간 설정 (단순화)
    const getBasicTimeRange = (timeOfDay: string) => {
      const ranges: { [key: string]: { start: string; end: string; availableMinutes: number; optimalStartTime?: string; label?: string } } = {
        'M': { start: '06:00', end: '12:00', availableMinutes: 360, optimalStartTime: '06:00', label: '아침' },
        'D': { start: '12:00', end: '18:00', availableMinutes: 360, optimalStartTime: '12:00', label: '오후' },
        'N': { start: '18:00', end: '06:00', availableMinutes: 720, optimalStartTime: '18:00', label: '밤' },
        'morning': { start: '06:00', end: '12:00', availableMinutes: 360, optimalStartTime: '06:00', label: '아침' },
        'afternoon': { start: '12:00', end: '18:00', availableMinutes: 360, optimalStartTime: '12:00', label: '오후' },
        'night': { start: '18:00', end: '06:00', availableMinutes: 720, optimalStartTime: '18:00', label: '밤' },
        'day': { start: '06:00', end: '18:00', availableMinutes: 720, optimalStartTime: '06:00', label: '낮' },
        '낮': { start: '06:00', end: '18:00', availableMinutes: 720, optimalStartTime: '06:00', label: '낮' },
        '밤': { start: '18:00', end: '06:00', availableMinutes: 720, optimalStartTime: '18:00', label: '밤' },
        '아침': { start: '06:00', end: '12:00', availableMinutes: 360, optimalStartTime: '06:00', label: '아침' },
        '점심': { start: '12:00', end: '18:00', availableMinutes: 360, optimalStartTime: '12:00', label: '점심' },
        '오후': { start: '12:00', end: '18:00', availableMinutes: 360, optimalStartTime: '12:00', label: '오후' },
        '저녁': { start: '18:00', end: '06:00', availableMinutes: 720, optimalStartTime: '18:00', label: '저녁' },
        '새벽': { start: '00:00', end: '06:00', availableMinutes: 360, optimalStartTime: '00:00', label: '새벽' }
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
        const sceneDuration = this.getSafeDuration(scene);
        const sceneStartTime = timeRange.optimalStartTime || '09:00';
        const sceneEndTime = this.addMinutesToTime(sceneStartTime, sceneDuration);
        
        console.log(`  📋 단일 씬 "${scene.title}" 시간 설정:`);
        console.log(`    - 분량: ${scene.estimatedDuration}분`);
        console.log(`    - 실제 촬영시간: ${sceneDuration}분`);
        console.log(`    - 시작시간: ${sceneStartTime}, 종료시간: ${sceneEndTime}`);
        
                 return {
           ...scene,
           timeRange: timeRange,
           actualShootingDuration: sceneDuration,
           sceneStartTime: sceneStartTime,
           sceneEndTime: sceneEndTime,
           breakTime: 0, // 단일 씬은 휴식시간 없음
           totalTimeSlot: sceneDuration,
           // 정확한 시간대 표시를 위한 추가 정보 (우선순위 높음)
           timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`
         };
      });
      
      console.log(`  ✅ 단일 씬 최적화 완료: ${optimizedScenes.length}개 씬`);
      return optimizedScenes;
    }
    
    // 시간대별 시간 범위 설정 (실제 촬영 가능 시간)
    console.log(`  📅 시간 범위: ${timeRange.label} (총 ${availableMinutes}분)`);
    
    // 씬들을 실제 촬영시간 순으로 정렬 (긴 씬부터)
    const sortedScenes = [...scenes].sort((a, b) => {
      const durationA = this.getSafeDuration(a);
      const durationB = this.getSafeDuration(b);
      return durationB - durationA;
    });
    
         // 시간대 내에서 최적 배치 (실제 촬영시간 고려)
     const optimizedScenes: (SceneResponseDto & { weight: any } & { actualShootingDuration?: number; sceneStartTime?: string; sceneEndTime?: string; breakTime?: number; totalTimeSlot?: number; timeSlotDisplay?: string; timeRange?: any })[] = [];
    let remainingMinutes = availableMinutes;
    let currentTime = timeRange.optimalStartTime || '09:00';
    
    console.log(`  🎬 시간대별 촬영 스케줄 시작: ${currentTime}부터`);
    
    for (const scene of sortedScenes) {
      const sceneDuration = this.getSafeDuration(scene);
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
        const sceneEndTime = this.addMinutesToTime(currentTime, sceneDuration);
        
                 optimizedScenes.push({
           ...scene,
           timeRange: timeRange,
           actualShootingDuration: sceneDuration,
           sceneStartTime: sceneStartTime,
           sceneEndTime: sceneEndTime,
           breakTime: sceneBreakTime,
           totalTimeSlot: totalSceneTime,
           // 정확한 시간대 표시를 위한 추가 정보 (우선순위 높음)
           timeSlotDisplay: `${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`
         });
        
        console.log(`  ✅ 씬 "${scene.title}" timeSlotDisplay 설정: ${timeOfDay} (${sceneStartTime} ~ ${sceneEndTime})`);
        
        remainingMinutes -= totalSceneTime;
        currentTime = this.addMinutesToTime(sceneEndTime, sceneBreakTime);
        
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
  }

  // 유틸리티 함수들
  private extractLocationFromScene(scene: SceneResponseDto): string {
    console.log('📍 장소 추출:', {
      id: scene._id,
      order: scene.order,
      title: scene.title,
      locationName: scene.location?.name,
    });
    
    // Scene의 location.name 사용
    if (scene.location && scene.location.name && scene.location.name !== '') {
      return scene.location.name;
    }
    // 정보가 없으면 '미정' 반환
    return '미정';
  }

  private extractActorsFromScene(scene: SceneResponseDto): string[] {
    console.log('🎭 배우 추출:', {
      id: scene._id,
      title: scene.title,
      cast: scene.cast
    });
    
    // Scene 스키마의 cast 배열 사용
    if (scene.cast && Array.isArray(scene.cast)) {
      return scene.cast.map(actor => actor.name || actor.role);
    }
    
    return [];
  }

  private extractTimeSlotFromScene(scene: SceneResponseDto): string {
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

  private extractEquipmentFromScene(scene: SceneResponseDto): string {
    console.log('🎥 장비 추출:', {
      id: scene._id,
      title: scene.title,
      hasEquipment: !!scene.equipment
    });
    
    const equipment: string[] = [];
    
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
    return equipment.join(', ');
  }

  private hasSameTimeSlot(scene1: SceneResponseDto, scene2: SceneResponseDto): boolean {
    const time1 = this.extractTimeSlotFromScene(scene1);
    const time2 = this.extractTimeSlotFromScene(scene2);
    
    console.log('⏰ 시간대 비교:', {
      scene1: { id: scene1._id, title: scene1.title, time: time1 },
      scene2: { id: scene2._id, title: scene2.title, time: time2 }
    });
    
    return time1 === time2;
  }

  private shouldStartNewDayForLocation(currentLocation: string | null, newLocation: string, currentDayScenes: (SceneResponseDto & { weight: any })[], realLocations: any[] = []): boolean {
    // 첫 번째 씬이거나 현재 장소가 없는 경우
    if (!currentLocation || currentDayScenes.length === 0) {
      return false;
    }
    
    // 같은 장소인 경우
    if (currentLocation === newLocation) {
      return false;
    }
    
    // 현재 장소의 씬 개수 계산
    const currentLocationSceneCount = currentDayScenes.filter(scene => 
      this.extractLocationFromScene(scene) === currentLocation
    ).length;
    
    console.log(`[SchedulerService] 장소 변경 검토:`, {
      currentLocation,
      newLocation,
      currentLocationSceneCount
    });
    
    // 현재 장소에서 3개 이상 씬을 촬영했으면 새 날짜
    if (currentLocationSceneCount >= 3) {
      console.log(`[SchedulerService] 다른 장소로 이동, 현재 장소에서 ${currentLocationSceneCount}개 씬 완료, 새 날짜 시작`);
      return true;
    }
    
    // 현재 장소에서 씬이 적으면 같은 날에 다른 장소 씬 추가
    console.log(`[SchedulerService] 다른 장소로 이동, 현재 장소에서 ${currentLocationSceneCount}개 씬만 있어 효율적으로 계속`);
    return false;
  }

  /**
   * Breakdown 생성 (일일 촬영 계획서)
   */
  generateBreakdown(daySchedule: any): any {
    console.log('📋 Breakdown 생성 시작:', {
      day: daySchedule.day,
      scenesCount: daySchedule.scenes?.length || 0,
      location: daySchedule.location_groups?.[0]
    });

    const dayScenes = daySchedule.scenes || [];
    
    try {
      const breakdown = {
        // 기본 정보 섹션
        basicInfo: this.generateBasicInfo(daySchedule),
        
        // 연락처 정보 섹션
        contacts: this.generateContactInfo(daySchedule),
        
        // 씬 상세 정보 섹션
        sceneDetails: this.generateSceneDetails(dayScenes),
        
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
          art: {}             // 미술부 장비
        },
        crew: {
          direction: {},      // 연출부 인력
          production: {},     // 제작부 인력
          cinematography: {}, // 촬영부 인력
          lighting: {},       // 조명부 인력
          sound: {},          // 음향부 인력
          art: {}             // 미술부 인력
        },
        props: {},
        costumes: {},
        cameras: {}, // 카메라 정보 추가
        summary: {
          totalScenes: dayScenes.length,
          totalDuration: 0
        },
        // 집합시간 및 Time Table 정보
        meetingInfo: {
          meetingTime: null,        // 집합 시간
          meetingLocation: null,    // 집합 장소
          meetingPoints: []         // 여러 집합 지점 (1차, 2차, 3차)
        },
        timeTable: []               // 상세 타임 테이블
      };

      // 씬별 정보 분류
      dayScenes.forEach(scene => {
        // 1. 장소별 분류 (최우선)
        const location = this.extractLocationFromScene(scene);
        if (!breakdown.locations[location]) {
          breakdown.locations[location] = [];
        }
        breakdown.locations[location].push(scene);

        // 2. 배우별 분류
        const actors = this.extractActorsFromScene(scene);
        actors.forEach(actor => {
          if (!breakdown.actors[actor]) {
            breakdown.actors[actor] = [];
          }
          breakdown.actors[actor].push(scene);
        });

        // 3. 시간대별 분류
        const timeSlot = this.extractTimeSlotFromScene(scene);
        if (!breakdown.timeSlots[timeSlot]) {
          breakdown.timeSlots[timeSlot] = [];
        }
        breakdown.timeSlots[timeSlot].push(scene);

        // 4. 장비별 분류
        const equipment = this.extractEquipmentFromScene(scene);
        if (equipment) {
          const equipmentList = equipment.split(', ');
          equipmentList.forEach(eq => {
            if (!breakdown.equipment.cinematography[eq]) {
              breakdown.equipment.cinematography[eq] = [];
            }
            breakdown.equipment.cinematography[eq].push(scene);
          });
        }

        // 5. 소품별 분류
        const props = this.extractPropsFromScene(scene);
        props.forEach(prop => {
          if (!breakdown.props[prop]) {
            breakdown.props[prop] = [];
          }
          breakdown.props[prop].push(scene);
        });

        // 6. 의상별 분류
        const costumes = this.extractCostumesFromScene(scene);
        costumes.forEach(costume => {
          if (!breakdown.costumes[costume]) {
            breakdown.costumes[costume] = [];
          }
          breakdown.costumes[costume].push(scene);
        });

        // 7. 카메라별 분류
        const cameras = this.extractCameraFromScene(scene);
        cameras.forEach(camera => {
          if (!breakdown.cameras[camera]) {
            breakdown.cameras[camera] = [];
          }
          breakdown.cameras[camera].push(scene);
        });

        // 8. 인력별 분류
        const crew = this.extractCrewFromScene(scene);
        crew.forEach(member => {
          if (!breakdown.crew.direction[member]) {
            breakdown.crew.direction[member] = [];
          }
          breakdown.crew.direction[member].push(scene);
        });

        // 9. 총 소요시간 계산
        const sceneDuration = this.getSafeDuration(scene);
        breakdown.summary.totalDuration += sceneDuration;
      });

      // 집합 정보 및 타임 테이블 생성
      const meetingAndTimeTable = this.generateMeetingInfoAndTimeTable(breakdown, daySchedule);
      breakdown.meetingInfo = meetingAndTimeTable.meetingInfo;
      breakdown.timeTable = meetingAndTimeTable.timeTable;

      console.log('✅ Breakdown 생성 완료:', {
        totalScenes: breakdown.summary.totalScenes,
        totalDuration: breakdown.summary.totalDuration,
        locations: Object.keys(breakdown.locations),
        actors: Object.keys(breakdown.actors),
        timeSlots: Object.keys(breakdown.timeSlots)
      });

      return breakdown;
    } catch (error) {
      console.error('❌ Breakdown 생성 중 오류:', error);
      throw new Error('Breakdown 생성에 실패했습니다.');
    }
  }

  /**
   * 기본 정보 생성
   */
  private generateBasicInfo(daySchedule: any): any {
    return {
      projectTitle: daySchedule.projectTitle || '프로젝트 제목',
      shootNumber: daySchedule.shootNumber || `Day ${daySchedule.day}`,
      date: daySchedule.date || `Day ${daySchedule.day}`,
      dayOfWeek: daySchedule.dayOfWeek || '월요일',
      weather: daySchedule.weather || '맑음',
      temperature: {
        max: daySchedule.temperature?.max || 25,
        min: daySchedule.temperature?.min || 15
      },
      rainProbability: {
        morning: daySchedule.rainProbability?.morning || null,
        afternoon: daySchedule.rainProbability?.afternoon || null
      },
      sunrise: daySchedule.sunrise || null,
      sunset: daySchedule.sunset || null,
      documentInfo: {
        fix: daySchedule.documentInfo?.fix || null,
        writer: daySchedule.documentInfo?.writer || null
      }
    };
  }

  /**
   * 연락처 정보 생성
   */
  private generateContactInfo(daySchedule: any): any {
    return {
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
        props: {}          // 소품부 연락처
      }
    };
  }

  /**
   * 씬 상세 정보 생성
   */
  private generateSceneDetails(dayScenes: any[]): any {
    const sceneList = dayScenes.map(scene => ({
              sceneNumber: scene.order,
      location: this.extractLocationFromScene(scene),
      timeOfDay: this.extractTimeSlotFromScene(scene),
      sceneType: 'S', // S: Scene, O: OTS, L: Long Shot
      cutCount: 1, // 기본값
      description: scene.description || scene.title,
      mainCast: this.extractMainCast(scene),
      supportingCast: this.extractSupportingCast(scene),
      extras: this.extractExtras(scene),
      notes: scene.notes || ''
    }));

    const locations = [...new Set(sceneList.map(s => s.location))];
    const timeSlots = [...new Set(sceneList.map(s => s.timeOfDay))];

    return {
      sceneList,
      sceneSummary: {
        totalScenes: sceneList.length,
        totalCuts: sceneList.reduce((sum, s) => sum + s.cutCount, 0),
        locations,
        timeSlots
      }
    };
  }

  /**
   * 주연 배우 추출
   */
  private extractMainCast(scene: any): string[] {
    if (!scene.cast || !Array.isArray(scene.cast)) {
      return [];
    }

    return scene.cast
      .filter(actor => actor.role === 'main' || actor.role === '주연')
      .map(actor => actor.name || actor.role);
  }

  /**
   * 조연 배우 추출
   */
  private extractSupportingCast(scene: any): string[] {
    if (!scene.cast || !Array.isArray(scene.cast)) {
      return [];
    }

    return scene.cast
      .filter(actor => actor.role === 'supporting' || actor.role === '조연')
      .map(actor => actor.name || actor.role);
  }

  /**
   * 단역 배우 추출
   */
  private extractExtras(scene: any): string[] {
    if (!scene.cast || !Array.isArray(scene.cast)) {
      return [];
    }

    return scene.cast
      .filter(actor => actor.role === 'extra' || actor.role === '단역')
      .map(actor => actor.name || actor.role);
  }

  /**
   * 인력 정보 추출
   */
  private extractCrewFromScene(scene: any): string[] {
    const crew: string[] = [];
    
    if (scene.crew && Array.isArray(scene.crew)) {
      scene.crew.forEach(member => {
        if (member.name || member.role) {
          crew.push(member.name || member.role);
        }
      });
    }

    // 기본 인력 추가
    if (crew.length === 0) {
      crew.push('감독', '촬영감독', '카메라맨');
    }

    return crew;
  }

  /**
   * 소품 정보 추출
   */
  private extractPropsFromScene(scene: any): string[] {
    const props: string[] = [];
    
    if (scene.equipment?.art?.props) {
      const artProps = scene.equipment.art.props;
      if (artProps.characterProps) {
        props.push(...artProps.characterProps);
      }
      if (artProps.setProps) {
        props.push(...artProps.setProps);
      }
    }

    return props;
  }

  /**
   * 의상 정보 추출
   */
  private extractCostumesFromScene(scene: any): string[] {
    if (scene.equipment?.art?.costumes) {
      return scene.equipment.art.costumes;
    }
    return [];
  }

  /**
   * 카메라 정보 추출
   */
  private extractCameraFromScene(scene: any): string[] {
    const cameras: string[] = [];
    
    if (scene.equipment?.cinematography?.cameras) {
      cameras.push(...scene.equipment.cinematography.cameras);
    }

    // 기본 카메라 추가
    if (cameras.length === 0) {
      cameras.push('카메라 A', '카메라 B');
    }

    return cameras;
  }

  /**
   * 집합 정보 및 타임 테이블 생성
   */
  private generateMeetingInfoAndTimeTable(breakdown: any, daySchedule: any): any {
    const meetingInfo = this.generateMeetingPoints(daySchedule);
    const timeTable = this.generateDetailedTimeTable(daySchedule, breakdown);

    return {
      meetingInfo,
      timeTable
    };
  }

  /**
   * 집합 지점 생성
   */
  private generateMeetingPoints(daySchedule: any): any {
    const locations = Object.keys(daySchedule.locations || {});
    const meetingPoints: Array<{
      order: number;
      time: string;
      location: string;
      description: string;
    }> = [];

    if (locations.length > 0) {
      // 1차 집합: 첫 번째 장소
      meetingPoints.push({
        order: 1,
        time: '06:00',
        location: locations[0],
        description: '1차 집합'
      });

      // 2차 집합: 다른 장소가 있는 경우
      if (locations.length > 1) {
        meetingPoints.push({
          order: 2,
          time: '12:00',
          location: locations[1],
          description: '2차 집합'
        });
      }

      // 3차 집합: 세 번째 장소가 있는 경우
      if (locations.length > 2) {
        meetingPoints.push({
          order: 3,
          time: '18:00',
          location: locations[2],
          description: '3차 집합'
        });
      }
    }

    return {
      meetingTime: meetingPoints.length > 0 ? meetingPoints[0].time : '06:00',
      meetingLocation: meetingPoints.length > 0 ? meetingPoints[0].location : '미정',
      meetingPoints
    };
  }

  /**
   * 상세 타임 테이블 생성
   */
  private generateDetailedTimeTable(daySchedule: any, breakdown: any): any[] {
    const timeTable: any[] = [];
    const scenes = daySchedule.scenes || [];
    
    if (scenes.length === 0) {
      return timeTable;
    }

    let currentTime = this.timeToMinutes('06:00'); // 기본 시작 시간
    const timeRange = daySchedule.timeRange;

    if (timeRange?.start) {
      currentTime = this.timeToMinutes(timeRange.start);
    }

    // 낮/밤 씬 분류
    const dayScenes: any[] = [];
    const nightScenes: any[] = [];

    scenes.forEach(scene => {
      const timeOfDay = this.extractTimeSlotFromScene(scene);
      if (timeOfDay === '아침' || timeOfDay === '오후' || timeOfDay === '낮' || timeOfDay === 'M' || timeOfDay === 'D') {
        dayScenes.push(scene);
      } else if (timeOfDay === '저녁' || timeOfDay === '밤' || timeOfDay === '새벽' || timeOfDay === 'N') {
        nightScenes.push(scene);
      } else {
        dayScenes.push(scene);
      }
    });

    // 낮 씬 타임 테이블
    if (dayScenes.length > 0) {
      timeTable.push({
        timeType: 'day',
        label: '낮 촬영',
        sections: this.createTimeline(dayScenes, 'day')
      });
    }

    // 밤 씬 타임 테이블
    if (nightScenes.length > 0) {
      timeTable.push({
        timeType: 'night',
        label: '밤 촬영',
        sections: this.createTimeline(nightScenes, 'night')
      });
    }

    // 통합 타임라인 생성
    const unifiedTimeline = this.createUnifiedTimeline(timeTable);

    return unifiedTimeline;
  }

  /**
   * 타임라인 생성
   */
  private createTimeline(sections: any[], timeType: string): any[] {
    const timeline: any[] = [];
    let currentTime = timeType === 'day' ? 6 * 60 : 18 * 60; // 06:00 또는 18:00

    sections.forEach((scene, index) => {
      const sceneDuration = this.getSafeDuration(scene);
      const breakTime = index > 0 ? 30 : 0; // 씬 간 휴식 시간
      
      const startTime = currentTime;
      const endTime = currentTime + sceneDuration;
      
      timeline.push({
        scene: scene.order,
        title: scene.title,
        startTime: this.toTimeStr(startTime),
        endTime: this.toTimeStr(endTime),
        duration: sceneDuration,
        breakTime,
        totalTime: sceneDuration + breakTime,
        description: scene.description,
        timeSlot: this.extractTimeSlotFromScene(scene)
      });

      currentTime = endTime + breakTime;
    });

    return timeline;
  }

  /**
   * 통합 타임라인 생성
   */
  private createUnifiedTimeline(sections: any[]): any[] {
    const unifiedTimeline: any[] = [];
    
    sections.forEach(section => {
      if (section.sections && Array.isArray(section.sections)) {
        unifiedTimeline.push(...section.sections);
      }
    });

    return unifiedTimeline;
  }

  /**
   * 분을 시간 문자열로 변환
   */
  private toTimeStr(mins: number): string {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 시간 문자열을 분으로 변환
   */
  private timeToMinutes(str: string): number {
    const [hours, minutes] = str.split(':').map(Number);
    return hours * 60 + minutes;
  }
} 