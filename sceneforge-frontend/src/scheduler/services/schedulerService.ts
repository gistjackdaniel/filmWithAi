import type { Scene } from '../../scene/services/sceneService';

export type TimeRange = { start: string; end: string } | null;

export interface TimeSlotItem {
  startTime: string;
  endTime: string;
  activity: '촬영' | '휴식' | '셋팅' | '집합' | '이동' | '점심시간' | '저녁시간' | '철수' | '리허설';
  details?: string;
  sceneNumber?: number;
  sceneTitle?: string;
}

export interface ScheduleDay {
  day: number;
  date: string;
  timeRange: TimeRange;
  scenes: Array<{
    scene: number;
    title: string;
    description?: string;
    location?: { name?: string } | null;
    timeOfDay?: string;
    estimatedDuration?: string | number;
  }>;
  totalScenes: number;
  estimatedDuration: number; // minutes
  timeSlots: TimeSlotItem[];
}

export interface ScheduleResult {
  days: ScheduleDay[];
  totalDays: number;
  totalScenes: number;
  estimatedTotalDuration: number; // minutes
}

// -----------------------------
// Public API
// -----------------------------

export function generateOptimalSchedule(scenes: Scene[]): ScheduleResult {
  const MAX_DAILY_DURATION = 8 * 60; // 8 hours per day
  const BREAK_MINUTES = 30;

  // 안정적 처리용 사본 및 정렬(장소 -> 시간대 -> 씬번호)
  const sorted = [...scenes].sort((a, b) => {
    const locA = (a.location?.name || '').localeCompare(b.location?.name || '');
    if (locA !== 0) return locA;
    const tA = timeOfDayOrder(a.timeOfDay);
    const tB = timeOfDayOrder(b.timeOfDay);
    if (tA !== tB) return tA - tB;
    const sA = safeSceneNumber(a);
    const sB = safeSceneNumber(b);
    return sA - sB;
  });

  const days: ScheduleDay[] = [];
  let dayScenes: Scene[] = [];
  let dayDuration = 0;
  let dayIndex = 1;

  for (let i = 0; i < sorted.length; i++) {
    const scene = sorted[i];
    const duration = getSafeDuration(scene);
    const extra = dayScenes.length > 0 ? BREAK_MINUTES : 0;
    const wouldExceed = dayDuration + duration + extra > MAX_DAILY_DURATION;

    if (wouldExceed && dayScenes.length > 0) {
      days.push(createDaySchedule(dayIndex, dayScenes));
      dayIndex++;
      dayScenes = [];
      dayDuration = 0;
    }

    dayScenes.push(scene);
    dayDuration += duration + (dayScenes.length > 1 ? BREAK_MINUTES : 0);
  }

  if (dayScenes.length > 0) {
    days.push(createDaySchedule(dayIndex, dayScenes));
  }

  return {
    days,
    totalDays: days.length,
    totalScenes: days.reduce((acc, d) => acc + d.totalScenes, 0),
    estimatedTotalDuration: days.reduce((acc, d) => acc + d.estimatedDuration, 0)
  };
}

// -----------------------------
// Internal helpers
// -----------------------------

function createDaySchedule(dayNumber: number, scenes: Scene[]): ScheduleDay {
  const BREAK_MINUTES = 30;
  const startTime = decideStartTime(scenes);

  let current = startTime;
  const timeSlots: TimeSlotItem[] = [];
  let totalMinutes = 0;

  // 집합 → 셋팅 → 리허설 기본 시퀀스
  timeSlots.push({ activity: '집합', startTime: current, endTime: current, details: '집합' });
  timeSlots.push({ activity: '셋팅', startTime: current, endTime: addMinutesToTime(current, 60), details: '카메라/조명/미술 셋팅' });
  current = addMinutesToTime(current, 60);
  totalMinutes += 60;
  timeSlots.push({ activity: '리허설', startTime: current, endTime: addMinutesToTime(current, 30), details: '씬 리허설' });
  current = addMinutesToTime(current, 30);
  totalMinutes += 30;

  // 낮/밤 분리 후 낮 → 밤 순서 배치
  const dayScenes = scenes.filter(s => isDayTime(s.timeOfDay));
  const nightScenes = scenes.filter(s => isNightTime(s.timeOfDay));
  const ordered = [...dayScenes, ...nightScenes, ...scenes.filter(s => !s.timeOfDay)];

  ordered.forEach((scene, idx) => {
    const duration = getSafeDuration(scene);
    const end = addMinutesToTime(current, duration);
    timeSlots.push({
      activity: '촬영',
      startTime: current,
      endTime: end,
      details: `씬 ${safeSceneNumber(scene)}: ${scene.title}`,
      sceneNumber: safeSceneNumber(scene),
      sceneTitle: scene.title
    });
    current = end;
    totalMinutes += duration;

    if (idx < ordered.length - 1) {
      timeSlots.push({ activity: '휴식', startTime: current, endTime: addMinutesToTime(current, BREAK_MINUTES), details: '씬 간 휴식' });
      current = addMinutesToTime(current, BREAK_MINUTES);
      totalMinutes += BREAK_MINUTES;
    }
  });

  // 철수
  timeSlots.push({ activity: '철수', startTime: current, endTime: current, details: '촬영 종료 및 철수' });

  const endTime = current;
  return {
    day: dayNumber,
    date: `Day ${dayNumber}`,
    timeRange: { start: startTime, end: endTime },
    scenes: scenes.map(s => ({
      scene: safeSceneNumber(s),
      title: s.title,
      description: s.description,
      location: s.location,
      timeOfDay: s.timeOfDay,
      estimatedDuration: s.estimatedDuration
    })),
    totalScenes: scenes.length,
    estimatedDuration: totalMinutes,
    timeSlots
  };
}

function getSafeDuration(scene: Scene): number {
  const raw = scene.estimatedDuration as any;
  let minutes = 5;
  if (typeof raw === 'string') {
    const m = raw.match(/(\d+)/);
    minutes = m ? Number(m[1]) : 5;
  } else if (typeof raw === 'number') {
    minutes = raw;
  }
  // 실제 촬영시간: 분량의 20배
  return Math.max(1, Math.round(minutes * 20));
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const mod = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hh = Math.floor(mod / 60).toString().padStart(2, '0');
  const mm = (mod % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function decideStartTime(scenes: Scene[]): string {
  const dayCount = scenes.filter(s => isDayTime(s.timeOfDay)).length;
  const nightCount = scenes.filter(s => isNightTime(s.timeOfDay)).length;
  if (dayCount > 0 && nightCount === 0) return '06:00';
  if (nightCount > 0 && dayCount === 0) return '18:00';
  if (nightCount > dayCount) return '14:00';
  return '09:00';
}

function isDayTime(v?: string): boolean {
  return v === '아침' || v === '오후' || v === '낮' || v === 'M' || v === 'D' || v === 'day' || v === 'morning' || v === 'afternoon';
}

function isNightTime(v?: string): boolean {
  return v === '저녁' || v === '밤' || v === '새벽' || v === 'N' || v === 'night';
}

function timeOfDayOrder(v?: string): number {
  if (isDayTime(v)) return 0;
  if (isNightTime(v)) return 2;
  return 1;
}

function safeSceneNumber(scene: Scene): number {
  const n = (scene as any).scene;
  if (typeof n === 'number') return n;
  if (typeof n === 'string') {
    const m = n.match(/(\d+)/);
    return m ? Number(m[1]) : 9999;
  }
  return 9999;
}


