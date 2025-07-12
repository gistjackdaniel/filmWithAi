const mongoose = require('mongoose');

/**
 * 프로젝트 스키마
 * 사용자별 영화 프로젝트 정보 저장
 */
const projectSchema = new mongoose.Schema({
  // 사용자 참조 (외래키)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 프로젝트 기본 정보
  projectTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // 시놉시스 (AI 스토리 생성의 입력)
  synopsis: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // AI 생성된 스토리
  story: {
    type: String,
    default: '',
    trim: true,
    maxlength: 10000
  },
  
  // 프로젝트 상태
  status: {
    type: String,
    enum: ['draft', 'story_generated', 'conte_generated', 'completed'],
    default: 'draft'
  },
  
  // 프로젝트 설정
  settings: {
    genre: {
      type: String,
      default: '일반',
      trim: true
    },
    maxScenes: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    estimatedDuration: {
      type: String,
      default: '90분'
    }
  },
  
  // 태그 (검색 및 분류용)
  tags: [{
    type: String,
    trim: true
  }],
  
  // 프로젝트 공개 설정
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // 삭제 여부 (소프트 삭제)
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  // 자동으로 생성/수정 시간 관리
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 콘티 수
projectSchema.virtual('conteCount', {
  ref: 'Conte',
  localField: '_id',
  foreignField: 'projectId',
  count: true
});

// 가상 필드: 생성된 콘티 수
projectSchema.virtual('generatedConteCount', {
  ref: 'Conte',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
  match: { type: 'generated_video' }
});

// 가상 필드: 실사 촬영 콘티 수
projectSchema.virtual('liveActionConteCount', {
  ref: 'Conte',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
  match: { type: 'live_action' }
});

// 인덱스 설정
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ projectTitle: 'text', synopsis: 'text' });
projectSchema.index({ tags: 1 });

// 미들웨어: 프로젝트 생성 시 상태 업데이트
projectSchema.pre('save', function(next) {
  // 스토리가 생성되면 상태 업데이트
  if (this.story && this.story.length > 0 && this.status === 'draft') {
    this.status = 'story_generated';
  }
  next();
});

// 정적 메서드: 사용자의 프로젝트 목록 조회
projectSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ updatedAt: -1 })
    .populate('userId', 'name email picture')
    .limit(options.limit || 50);
};

// 정적 메서드: 프로젝트 검색
projectSchema.statics.searchProjects = function(userId, searchTerm) {
  return this.find({
    userId,
    isDeleted: false,
    $or: [
      { projectTitle: { $regex: searchTerm, $options: 'i' } },
      { synopsis: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  }).sort({ updatedAt: -1 });
};

// 인스턴스 메서드: 프로젝트 상태 업데이트
projectSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// 인스턴스 메서드: 소프트 삭제
projectSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

// 인스턴스 메서드: 프로젝트 복원
projectSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema); 