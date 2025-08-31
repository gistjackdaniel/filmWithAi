// 시간/타임라인 유틸리티 함수 모음

export function formatTimeFromSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatTimeShort(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// 줌 레벨 → 픽셀/초 환산. zoomLevel이 클수록 더 디테일하게(픽셀/초 증가)
export function pixelsPerSecondFromZoom(zoomLevel: number, basePps: number = 10): number {
  const clampedZoom = Math.max(0.25, Math.min(zoomLevel || 1, 32));
  return basePps * clampedZoom;
}

export function timeToPixels(seconds: number, pixelsPerSecond: number): number {
  return seconds * pixelsPerSecond;
}

export function pixelsToTime(pixels: number, pixelsPerSecond: number): number {
  if (pixelsPerSecond <= 0) return 0;
  return pixels / pixelsPerSecond;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface TimelineCutLike {
  id: string;
  shotNumber?: number;
  title?: string;
  description?: string;
  duration?: number | string; // seconds or flexible string
  estimatedDuration?: number | string; // seconds or flexible string
  imageUrl?: string;
  sceneId?: string; // scene ID for video generation
}

// 유연한 duration 파서: '90', '90s', '1m30s', '1h 20m', '5분', '1시간 20분 5초' 등
export function parseDurationFlexible(input: unknown): number {
  if (input == null) return 0;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const str = String(input).trim();
  if (str === '') return 0;
  // 숫자만: 초로 간주
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  let seconds = 0;
  // 영어 표기
  const hr = str.match(/(\d+)\s*h/);
  const min = str.match(/(\d+)\s*m/);
  const sec = str.match(/(\d+)\s*s/);
  if (hr) seconds += parseInt(hr[1], 10) * 3600;
  if (min) seconds += parseInt(min[1], 10) * 60;
  if (sec) seconds += parseInt(sec[1], 10);
  // 한국어 표기
  const krHr = str.match(/(\d+)\s*시간/);
  const krMin = str.match(/(\d+)\s*분/);
  const krSec = str.match(/(\d+)\s*초/);
  if (krHr) seconds += parseInt(krHr[1], 10) * 3600;
  if (krMin) seconds += parseInt(krMin[1], 10) * 60;
  if (krSec) seconds += parseInt(krSec[1], 10);
  // 'MM:SS' 혹은 'HH:MM:SS'
  if (seconds === 0 && /:/.test(str)) {
    const parts = str.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

export function getDurationSeconds(item?: { duration?: number | string; estimatedDuration?: number | string }): number {
  if (!item) return 0;
  const d = parseDurationFlexible((item as any).duration);
  if (d > 0) return d;
  const e = parseDurationFlexible((item as any).estimatedDuration);
  if (e > 0) return e;
  return 5;
}

export function accumulateUntil<T extends TimelineCutLike>(items: T[], time: number): { item: T | null; relativeTime: number } {
  let acc = 0;
  for (const it of items) {
    const d = getDurationSeconds(it);
    if (time >= acc && time < acc + d) {
      return { item: it, relativeTime: time - acc };
    }
    acc += d;
  }
  const last = items[items.length - 1] || null;
  return { item: last || null, relativeTime: 0 };
}


