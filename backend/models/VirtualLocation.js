const mongoose = require('mongoose');

/**
 * RealLocation 스키마
 * 실제 촬영 장소를 관리하는 스키마
 * 각 씬(Scene)과 매핑되어 스케줄링에 사용됨
 */
const realLocationSchema = new mongoose.Schema({
  // 프로젝트 참조 (외래키)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // LocationGroup 참조 (외래키) - 선택적 (그룹에 속하지 않을 수 있음)
  locationGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocationGroup',
    required: false,
    index: true
  },
  
  // 실제장소 기본 정보
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // 실제장소 설명
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // 실제장소 상태
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // 정렬 순서 (그룹 내에서의 순서)
  order: {
    type: Number,
    default: 0
  },
  
  // 생성/수정 정보
  createdBy: {
    type: String,
    default: 'AI',
    trim: true
  },
  
  modifiedBy: {
    type: String,
    default: 'AI',
    trim: true
  },
  
  // AI 생성 여부
  isAIGenerated: {
    type: Boolean,
    default: true
  },
  
  // 실제장소 특성 정보
  characteristics: {
    environment: {
      type: String,
      enum: ['실내', '실외', '반실내'],
      default: '실내'
    },
    lighting: {
      type: String,
      enum: ['자연광', '인공조명', '혼합조명', '특수조명'],
      default: '자연광'
    },
    noise: {
      type: String,
      enum: ['조용함', '보통', '시끄러움'],
      default: '보통'
    },
    accessibility: {
      type: String,
      enum: ['좋음', '보통', '나쁨'],
      default: '보통'
    }
  },
  
  // 촬영 정보
  shootingInfo: {
    timeOfDay: {
      type: String,
      enum: ['새벽', '아침', '오전', '오후', '저녁', '밤', '낮'],
      default: '오후'
    },
    weather: {
      type: String,
      enum: ['맑음', '흐림', '비', '눈', '안개'],
      default: '맑음'
    },
    restrictions: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 해당 실제장소를 사용하는 씬 수
realLocationSchema.virtual('sceneCount', {
  ref: 'Conte',
  localField: '_id',
  foreignField: 'realLocationId',
  count: true
});

// 가상 필드: 해당 실제장소를 사용하는 씬 목록
realLocationSchema.virtual('scenes', {
  ref: 'Conte',
  localField: '_id',
  foreignField: 'realLocationId',
  options: { sort: { scene: 1 } }
});

// 인덱스 설정
realLocationSchema.index({ projectId: 1, locationGroupId: 1 });
realLocationSchema.index({ projectId: 1, name: 1 });
realLocationSchema.index({ projectId: 1, status: 1 });
realLocationSchema.index({ locationGroupId: 1, order: 1 });

// 복합 인덱스: 프로젝트 내에서 이름 중복 방지
realLocationSchema.index({ projectId: 1, name: 1 }, { unique: true });

// 미들웨어: 수정 시 modifiedBy 업데이트
realLocationSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.modifiedBy = 'User'; // 실제로는 현재 사용자 정보를 사용
  }
  next();
});

// 정적 메서드: 프로젝트별 실제장소 조회
realLocationSchema.statics.findByProject = function(projectId) {
  return this.find({ projectId, status: { $ne: 'archived' } })
    .populate('locationGroupId')
    .populate('scenes')
    .sort({ 'locationGroupId.order': 1, order: 1, name: 1 });
};

// 정적 메서드: 그룹별 실제장소 조회
realLocationSchema.statics.findByGroup = function(locationGroupId) {
  return this.find({ locationGroupId, status: { $ne: 'archived' } })
    .populate('scenes')
    .sort({ order: 1, name: 1 });
};

// 정적 메서드: AI 생성 실제장소 조회
realLocationSchema.statics.findAIGenerated = function(projectId) {
  return this.find({ projectId, isAIGenerated: true, status: { $ne: 'archived' } })
    .populate('locationGroupId')
    .sort({ 'locationGroupId.order': 1, order: 1, name: 1 });
};

// 정적 메서드: 사용자 생성 실제장소 조회
realLocationSchema.statics.findUserGenerated = function(projectId) {
  return this.find({ projectId, isAIGenerated: false, status: { $ne: 'archived' } })
    .populate('locationGroupId')
    .sort({ 'locationGroupId.order': 1, order: 1, name: 1 });
};

// 정적 메서드: 이름으로 실제장소 검색
realLocationSchema.statics.findByName = function(projectId, name) {
  return this.findOne({ 
    projectId, 
    name: { $regex: name, $options: 'i' },
    status: { $ne: 'archived' }
  }).populate('locationGroupId');
};

module.exports = mongoose.model('RealLocation', realLocationSchema); 