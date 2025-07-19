    const mongoose = require('mongoose');

/**
 * 컷 스키마 (샷)
 * 씬(Conte) 내의 개별 컷 정보를 저장하는 스키마
 * 프리프로덕션 중심으로 설계된 컷 세분화 시스템
 */
const cutSchema = new mongoose.Schema({
  // 씬(Conte) 참조 (외래키)
  conteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conte',
    required: true,
    index: true
  },
  
  // 프로젝트 참조 (외래키) - 직접 참조로 빠른 조회
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // 컷 기본 정보
  shotNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // 컷 상세 정보
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // 촬영 계획
  shootingPlan: {
    // 샷 사이즈 (영화 제작 표준)
    shotSize: {
      type: String,
      enum: ['EWS', 'WS', 'MS', 'CU', 'ECU'], // Extreme Wide Shot, Wide Shot, Medium Shot, Close Up, Extreme Close Up
      default: 'MS'
    },
    
    // 앵글 방향 (영화 제작 표준)
    angleDirection: {
      type: String,
      enum: ['Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye'], // Eye-level, High/Low, Dutch, Bird's eye
      default: 'Eye-level'
    },
    
    // 카메라 움직임 (영화 제작 표준)
    cameraMovement: {
      type: String,
      enum: ['Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld'], // Static, Pan, Tilt, Dolly, Zoom, Handheld
      default: 'Static'
    },
    
    lensSpecs: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    
    cameraSettings: {
      aperture: {
        type: String,
        default: '',
        trim: true
      },
      shutterSpeed: {
        type: String,
        default: '',
        trim: true
      },
      iso: {
        type: String,
        default: '',
        trim: true
      }
    },
    
    composition: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    }
  },
  
  // 컷 타입 (영화 제작 표준 - 샷 사이즈 기반)
  cutType: {
    type: String,
    enum: ['EWS', 'WS', 'MS', 'CU', 'ECU'], // Extreme Wide Shot, Wide Shot, Medium Shot, Close Up, Extreme Close Up
    default: 'MS'
  },
  
  // 대사 및 내레이션
  dialogue: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  
  narration: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  
  // 인물/동선 및 포지션
  characterMovement: {
    characters: [{
      name: {
        type: String,
        trim: true
      },
      position: {
        x: { type: Number, default: 0 }, // 화면상 X 좌표 (0-100%)
        y: { type: Number, default: 0 }  // 화면상 Y 좌표 (0-100%)
      },
      action: {
        type: String,
        trim: true,
        maxlength: 200
      },
      emotion: {
        type: String,
        trim: true,
        maxlength: 100
      }
    }],
    
    blocking: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    
    cameraPosition: {
      x: { type: Number, default: 50 }, // 카메라 X 좌표
      y: { type: Number, default: 50 }, // 카메라 Y 좌표
      z: { type: Number, default: 0 }   // 카메라 Z 좌표 (거리)
    }
  },
  
  // 제작 방법 (실사 촬영 vs AI 생성)
  productionMethod: {
    type: String,
    enum: ['live_action', 'ai_generated', 'hybrid'],
    default: 'live_action'
  },
  
  // 예상 지속 시간
  estimatedDuration: {
    type: Number, // 초 단위
    default: 5,
    min: 1,
    max: 300
  },
  
  // 촬영 조건
  shootingConditions: {
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    
    timeOfDay: {
      type: String,
      enum: ['새벽', '아침', '오후', '저녁', '밤'],
      default: '오후'
    },
    
    weather: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    
    lighting: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    
    // 조명 세팅 (씬의 기본 조명을 어떻게 세팅할지)
    lightingSetup: {
      mainLight: {
        type: String,
        default: '',
        trim: true,
        maxlength: 100
      },
      fillLight: {
        type: String,
        default: '',
        trim: true,
        maxlength: 100
      },
      backLight: {
        type: String,
        default: '',
        trim: true,
        maxlength: 100
      },
      specialEffects: {
        type: String,
        default: '',
        trim: true,
        maxlength: 200
      },
      intensity: {
        type: String,
        enum: ['낮음', '보통', '높음'],
        default: '보통'
      },
      color: {
        type: String,
        default: '',
        trim: true,
        maxlength: 100
      }
    },
    
    specialRequirements: [{
      type: String,
      trim: true
    }]
  },
  
  // 필요 인력
  requiredPersonnel: {
    director: {
      type: String,
      default: '',
      trim: true
    },
    cinematographer: {
      type: String,
      default: '',
      trim: true
    },
    cameraOperator: {
      type: String,
      default: '',
      trim: true
    },
    lightingDirector: {
      type: String,
      default: '',
      trim: true
    },
    additionalCrew: [{
      type: String,
      trim: true
    }]
  },
  
  // 필요 장비
  requiredEquipment: {
    cameras: [{
      type: String,
      trim: true
    }],
    lenses: [{
      type: String,
      trim: true
    }],
    lighting: [{
      type: String,
      trim: true
    }],
    audio: [{
      type: String,
      trim: true
    }],
    grip: [{
      type: String,
      trim: true
    }],
    special: [{
      type: String,
      trim: true
    }]
  },
  
  // 결과물 정보
  output: {
    // AI 생성 비디오인 경우
    aiVideoUrl: {
      type: String,
      default: null,
      trim: true
    },
    
    aiVideoPrompt: {
      type: String,
      default: null,
      trim: true
    },
    
    aiVideoModel: {
      type: String,
      default: null,
      trim: true
    },
    
    // 실사 촬영인 경우
    rawFootageUrl: {
      type: String,
      default: null,
      trim: true
    },
    
    // 편집된 최종 컷
    finalCutUrl: {
      type: String,
      default: null,
      trim: true
    },
    
    // 썸네일 이미지
    thumbnailUrl: {
      type: String,
      default: null,
      trim: true
    }
  },
  
  // 컷 상태
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'reviewed', 'approved'],
    default: 'planned'
  },
  
  // 컷 순서 (씬 내에서의 순서)
  order: {
    type: Number,
    default: 0
  },
  
  // 편집 권한
  canEdit: {
    type: Boolean,
    default: true
  },
  
  // 마지막 수정 정보
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  modifiedBy: {
    type: String,
    default: 'AI',
    trim: true
  },
  
  // 메타데이터
  metadata: {
    complexity: {
      type: String,
      enum: ['간단', '보통', '복잡', '매우 복잡'],
      default: '보통'
    },
    
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    
    tags: [{
      type: String,
      trim: true
    }],
    
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    }
  }
}, {
  // 자동으로 생성/수정 시간 관리
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 컷 번호 (순서 기반)
cutSchema.virtual('cutNumber').get(function() {
  return this.shotNumber || this.order + 1;
});

// 가상 필드: 지속 시간 포맷
cutSchema.virtual('durationFormatted').get(function() {
  const minutes = Math.floor(this.estimatedDuration / 60);
  const seconds = this.estimatedDuration % 60;
  
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
  }
  return `${seconds}초`;
});

// 인덱스 설정
cutSchema.index({ conteId: 1, order: 1 });
cutSchema.index({ projectId: 1, status: 1 });
cutSchema.index({ 'shootingConditions.location': 1 });
cutSchema.index({ 'shootingConditions.timeOfDay': 1 });
cutSchema.index({ productionMethod: 1 });

// 미들웨어: 컷 저장 시 순서 자동 설정
cutSchema.pre('save', function(next) {
  if (!this.order && this.shotNumber) {
    this.order = this.shotNumber;
  }
  next();
});

// 정적 메서드: 씬의 컷 목록 조회
cutSchema.statics.findByConteId = function(conteId, options = {}) {
  const query = { conteId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.productionMethod) {
    query.productionMethod = options.productionMethod;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('conteId', 'scene title');
};

// 정적 메서드: 프로젝트의 모든 컷 조회
cutSchema.statics.findByProjectId = function(projectId, options = {}) {
  const query = { projectId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.productionMethod) {
    query.productionMethod = options.productionMethod;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('conteId', 'scene title')
    .populate('projectId', 'projectTitle');
};

// 정적 메서드: 같은 장소의 컷들 조회
cutSchema.statics.findByLocation = function(projectId, location) {
  return this.find({
    projectId,
    'shootingConditions.location': location
  }).sort({ order: 1 });
};

// 정적 메서드: 같은 시간대의 컷들 조회
cutSchema.statics.findByTimeOfDay = function(projectId, timeOfDay) {
  return this.find({
    projectId,
    'shootingConditions.timeOfDay': timeOfDay
  }).sort({ order: 1 });
};

// 정적 메서드: 제작 방법별 컷들 조회
cutSchema.statics.findByProductionMethod = function(projectId, method) {
  return this.find({
    projectId,
    productionMethod: method
  }).sort({ order: 1 });
};

// 인스턴스 메서드: 컷 순서 변경
cutSchema.methods.updateOrder = function(newOrder) {
  this.order = newOrder;
  return this.save();
};

// 인스턴스 메서드: 컷 상태 업데이트
cutSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// 인스턴스 메서드: 촬영 계획 업데이트
cutSchema.methods.updateShootingPlan = function(newPlan) {
  this.shootingPlan = { ...this.shootingPlan, ...newPlan };
  return this.save();
};

// 인스턴스 메서드: 결과물 정보 업데이트
cutSchema.methods.updateOutput = function(newOutput) {
  this.output = { ...this.output, ...newOutput };
  return this.save();
};

module.exports = mongoose.model('Cut', cutSchema); 