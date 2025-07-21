const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 스케줄 기본 정보
  totalDays: {
    type: Number,
    required: true
  },
  totalScenes: {
    type: Number,
    required: true
  },
  estimatedTotalDuration: {
    type: Number,
    required: true
  },
  optimizationScore: {
    efficiency: Number,
    cost: Number,
    time: Number
  },
  // 일별 스케줄 데이터
  days: [{
    day: Number,
    date: String,
    location: String,
    locationGroupId: String,
    totalScenes: Number,
    estimatedDuration: Number,
    rehearsalDuration: Number,
    totalDuration: Number,
    crew: [String],
    equipment: [String],
    // 씬 데이터
    scenes: [{
      _id: mongoose.Schema.Types.ObjectId,
      scene: Number,
      title: String,
      description: String,
      estimatedDuration: String,
      shootingDuration: Number,
      rehearsalTime: Number,
      totalTime: Number,
      // 장소 정보
      location: String,
      virtualLocationId: String,
      // 시간 정보
      timeSlot: String,
      shootingStartTime: String,
      shootingEndTime: String,
      timeSlotDisplay: String,
      // 상세 정보
      camera: mongoose.Schema.Types.Mixed, // String 또는 Object
      actors: [String],
      crew: [String],
      equipment: [String],
      // 키워드 정보
      keywords: {
        location: String,
        timeOfDay: String,
        cast: [String],
        props: [String],
        lighting: String,
        weather: String
      }
    }],
    // 일일 상세 스케줄
    dailySchedule: [{
      time: String,
      activity: String,
      description: String
    }],
    // 스케줄 상세 정보
    scheduleDetails: {
      time: [{
        time: String,
        activity: String,
        description: String
      }],
      scenes: [{
        scene: Number,
        title: String,
        time: String,
        duration: Number
      }],
      location: String,
      camera: [{
        scene: Number,
        camera: String
      }],
      actors: [{
        scene: Number,
        actors: [String]
      }],
      crew: [{
        scene: Number,
        crew: [String]
      }],
      equipment: [{
        scene: Number,
        equipment: [String]
      }]
    }
  }],
  // 콘티 데이터 해시 (변경 감지용)
  conteDataHash: {
    type: String,
    required: true
  },
  // 생성/수정 시간
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시 updatedAt 자동 설정
ScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 인덱스 설정
ScheduleSchema.index({ projectId: 1, userId: 1 });
ScheduleSchema.index({ conteDataHash: 1 });

module.exports = mongoose.model('Schedule', ScheduleSchema); 