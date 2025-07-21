const mongoose = require('mongoose');

/**
 * SceneLocationMapping 스키마
 * 씬(Scene)과 실제장소(RealLocation)를 매핑하는 스키마
 * 스케줄링 시 씬을 실제장소에 연결하는 용도
 */
const sceneLocationMappingSchema = new mongoose.Schema({
  // 프로젝트 참조 (외래키)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // 씬 ID (Conte 모델 참조)
  conteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conte',
    required: true,
    index: true
  },
  
  // 실제장소 ID (RealLocation 모델 참조)
  realLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RealLocation',
    required: true,
    index: true
  },
  
  // 매핑 상태
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 복합 인덱스: 프로젝트 내에서 씬-실제장소 매핑 중복 방지
sceneLocationMappingSchema.index({ projectId: 1, conteId: 1 }, { unique: true });

// 인덱스 설정
sceneLocationMappingSchema.index({ projectId: 1, realLocationId: 1 });
sceneLocationMappingSchema.index({ projectId: 1, status: 1 });

// 미들웨어: 수정 시 modifiedBy 업데이트
sceneLocationMappingSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.modifiedBy = 'User'; // 실제로는 현재 사용자 정보를 사용
  }
  next();
});

// 정적 메서드: 프로젝트별 매핑 조회
sceneLocationMappingSchema.statics.findByProject = function(projectId) {
  return this.find({ projectId, status: { $ne: 'archived' } })
    .populate('conteId')
    .populate('realLocationId')
    .populate('realLocationId.locationGroupId')
    .sort({ 'conteId.scene': 1 });
};

// 정적 메서드: 씬별 실제장소 조회
sceneLocationMappingSchema.statics.findByConte = function(projectId, conteId) {
  return this.findOne({ projectId, conteId, status: { $ne: 'archived' } })
    .populate('realLocationId')
    .populate('realLocationId.locationGroupId');
};

// 정적 메서드: 실제장소별 씬 목록 조회
sceneLocationMappingSchema.statics.findByRealLocation = function(projectId, realLocationId) {
  return this.find({ projectId, realLocationId, status: { $ne: 'archived' } })
    .populate('conteId')
    .sort({ 'conteId.scene': 1 });
};

// 정적 메서드: 매핑 생성 또는 업데이트
sceneLocationMappingSchema.statics.createOrUpdateMapping = function(projectId, conteId, realLocationId) {
  return this.findOneAndUpdate(
    { projectId, conteId },
    { 
      realLocationId,
      status: 'active',
      modifiedBy: 'User'
    },
    { 
      upsert: true, 
      new: true, 
      runValidators: true 
    }
  );
};

// 정적 메서드: AI 생성 매핑 조회
sceneLocationMappingSchema.statics.findAIGenerated = function(projectId) {
  return this.find({ projectId, isAIGenerated: true, status: { $ne: 'archived' } })
    .populate('conteId')
    .populate('realLocationId')
    .populate('realLocationId.locationGroupId')
    .sort({ 'conteId.scene': 1 });
};

module.exports = mongoose.model('SceneLocationMapping', sceneLocationMappingSchema); 