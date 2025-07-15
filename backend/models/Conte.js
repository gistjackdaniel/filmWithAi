const mongoose = require('mongoose');

/**
 * 콘티 스키마 (캡션 카드)
 * 영화 씬의 상세 정보를 저장하는 스키마
 * 12개 구성요소와 키워드 노드, 그래프 가중치 포함
 */
const conteSchema = new mongoose.Schema({
  // 프로젝트 참조 (외래키)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // 씬 기본 정보
  scene: {
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
  
  // 캡션 카드 12개 구성요소
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  dialogue: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  
  cameraAngle: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300
  },
  
  cameraWork: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300
  },
  
  characterLayout: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300
  },
  
  props: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300
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
  
  visualDescription: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  
  transition: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  
  lensSpecs: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  
  visualEffects: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300
  },
  
  // 콘티 타입 (AI 생성 비디오 vs 실사 촬영)
  type: {
    type: String,
    enum: ['generated_video', 'live_action'],
    default: 'live_action'
  },
  
  // 예상 지속 시간
  estimatedDuration: {
    type: String,
    default: '5분'
  },
  
  // 이미지 URL (AI 생성 이미지)
  imageUrl: {
    type: String,
    default: null,
    trim: true
  },
  
  // 이미지 생성 프롬프트
  imagePrompt: {
    type: String,
    default: null,
    trim: true
  },
  
  // 이미지 생성 시간
  imageGeneratedAt: {
    type: Date,
    default: null
  },
  
  // 이미지 생성 모델
  imageModel: {
    type: String,
    default: null,
    trim: true
  },
  
  // 무료 티어 여부
  isFreeTier: {
    type: Boolean,
    default: false
  },
  
  // 키워드 노드 구조 (그래프 노드)
  keywords: {
    userInfo: {
      type: String,
      default: '기본 사용자',
      trim: true
    },
    location: {
      type: String,
      default: '기본 장소',
      trim: true
    },
    date: {
      type: String,
      default: '2024-01-01',
      trim: true
    },
    equipment: {
      type: String,
      default: '기본 장비',
      trim: true
    },
    cast: [{
      type: String,
      trim: true
    }],
    props: [{
      type: String,
      trim: true
    }],
    lighting: {
      type: String,
      default: '기본 조명',
      trim: true
    },
    weather: {
      type: String,
      default: '맑음',
      trim: true
    },
    timeOfDay: {
      type: String,
      enum: ['새벽', '아침', '오후', '저녁', '밤', '낮'],
      default: '오후'
    },
    specialRequirements: [{
      type: String,
      trim: true
    }]
  },
  
  // 그래프 가중치 (최적화 스케줄링용)
  weights: {
    locationPriority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    equipmentPriority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    castPriority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    timePriority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    complexity: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    }
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
  
  // 씬 순서 (타임라인에서의 위치)
  order: {
    type: Number,
    default: 0
  },
  
  // 씬 상태
  status: {
    type: String,
    enum: ['draft', 'reviewed', 'approved', 'completed'],
    default: 'draft'
  }
}, {
  // 자동으로 생성/수정 시간 관리
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 씬 번호 (순서 기반)
conteSchema.virtual('sceneNumber').get(function() {
  return this.scene || this.order + 1;
});

// 인덱스 설정
conteSchema.index({ projectId: 1, order: 1 });
conteSchema.index({ projectId: 1, type: 1 });
conteSchema.index({ 'keywords.location': 1 });
conteSchema.index({ 'keywords.date': 1 });
conteSchema.index({ 'keywords.cast': 1 });

// 미들웨어: 씬 저장 시 순서 자동 설정
conteSchema.pre('save', function(next) {
  if (!this.order && this.scene) {
    this.order = this.scene;
  }
  next();
});

// 정적 메서드: 프로젝트의 콘티 목록 조회
conteSchema.statics.findByProjectId = function(projectId, options = {}) {
  const query = { projectId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('projectId', 'projectTitle status');
};

// 정적 메서드: 같은 장소의 콘티들 조회
conteSchema.statics.findByLocation = function(projectId, location) {
  return this.find({
    projectId,
    'keywords.location': location
  }).sort({ order: 1 });
};

// 정적 메서드: 같은 날짜의 콘티들 조회
conteSchema.statics.findByDate = function(projectId, date) {
  return this.find({
    projectId,
    'keywords.date': date
  }).sort({ order: 1 });
};

// 정적 메서드: 같은 배우가 출연하는 콘티들 조회
conteSchema.statics.findByCast = function(projectId, castMember) {
  return this.find({
    projectId,
    'keywords.cast': castMember
  }).sort({ order: 1 });
};

// 인스턴스 메서드: 씬 순서 변경
conteSchema.methods.updateOrder = function(newOrder) {
  this.order = newOrder;
  return this.save();
};

// 인스턴스 메서드: 키워드 업데이트
conteSchema.methods.updateKeywords = function(newKeywords) {
  this.keywords = { ...this.keywords, ...newKeywords };
  return this.save();
};

// 인스턴스 메서드: 가중치 업데이트
conteSchema.methods.updateWeights = function(newWeights) {
  this.weights = { ...this.weights, ...newWeights };
  return this.save();
};

// 인스턴스 메서드: 씬 상태 업데이트
conteSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('Conte', conteSchema); 