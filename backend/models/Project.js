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
    required: false,
    default: '',
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
  
  // 즐겨찾기 여부
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 삭제 여부 (소프트 삭제)
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // 마지막 조회 시간
  lastViewedAt: {
    type: Date,
    default: Date.now
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

// 가상 필드: 콘티 목록 (실제 콘티 데이터)
projectSchema.virtual('contes', {
  ref: 'Conte',
  localField: '_id',
  foreignField: 'projectId',
  options: { sort: { order: 1 } }
});

// 인덱스 설정
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ projectTitle: 'text', synopsis: 'text' });
projectSchema.index({ tags: 1 });

// 미들웨어: 프로젝트 생성 시 상태 업데이트
projectSchema.pre('save', function(next) {
  // 시놉시스가 있고 스토리가 없으면 draft 상태 유지
  if (this.synopsis && this.synopsis.length > 0 && (!this.story || this.story.length === 0)) {
    this.status = 'draft';
  }
  
  // 스토리가 생성되면 story_ready 상태로 업데이트
  if (this.story && this.story.length > 0 && this.status === 'draft') {
    this.status = 'story_ready';
  }
  
  // 콘티가 생성되면 상태 업데이트 (콘티 수는 가상 필드이므로 별도 처리 필요)
  // 실제 콘티 생성 시에는 별도 API에서 상태 업데이트
  next();
});

// 정적 메서드: 사용자의 프로젝트 목록 조회
projectSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ lastViewedAt: -1, updatedAt: -1 }) // 최근 조회 순으로 정렬, 동일한 경우 수정일 순
    .populate('userId', 'name email picture')
    .limit(options.limit || 50);
};

// 정적 메서드: 프로젝트와 콘티 목록 함께 조회 (사용자 권한 확인 포함)
projectSchema.statics.findByIdWithContes = function(projectId, userId, options = {}) {
  const populateOptions = {
    path: 'contes',
    options: { sort: { order: 1 } }
  };
  
  if (options.conteType) {
    populateOptions.match = { type: options.conteType };
  }
  
  return this.findOne({
    _id: projectId,
    userId: userId,
    isDeleted: false
  })
    .populate('userId', 'name email picture')
    .populate(populateOptions);
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
  }).sort({ lastViewedAt: -1, updatedAt: -1 }); // 최근 조회 순으로 정렬
};

// 인스턴스 메서드: 프로젝트 상태 업데이트
projectSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// 인스턴스 메서드: 콘티 수에 따른 상태 자동 업데이트 (6단계로 간략화)
projectSchema.methods.updateStatusByConteCount = async function() {
  const Conte = require('./Conte');
  const conteCount = await Conte.countDocuments({ projectId: this._id });
  
  // 콘티가 있고 현재 상태가 conte_ready보다 낮은 경우에만 conte_ready로 업데이트
  if (conteCount > 0 && this.status !== 'conte_ready' && this.status !== 'cut_generating' && this.status !== 'cut_generated' && this.status !== 'production_ready') {
    this.status = 'conte_ready';
    console.log('✅ 프로젝트 상태를 conte_ready로 업데이트');
  } 
  // 콘티가 없고 스토리가 있는 경우 story_ready로 업데이트
  else if (conteCount === 0 && this.story && this.story.length > 0 && this.status !== 'story_ready' && this.status !== 'conte_ready' && this.status !== 'cut_generating' && this.status !== 'cut_generated' && this.status !== 'production_ready') {
    this.status = 'story_ready';
    console.log('✅ 프로젝트 상태를 story_ready로 업데이트');
  }
  // 시놉시스만 있고 스토리가 없는 경우 draft로 업데이트
  else if (conteCount === 0 && (!this.story || this.story.length === 0) && this.synopsis && this.synopsis.length > 0 && this.status !== 'draft' && this.status !== 'story_ready' && this.status !== 'conte_ready' && this.status !== 'cut_generating' && this.status !== 'cut_generated' && this.status !== 'production_ready') {
    this.status = 'draft';
    console.log('✅ 프로젝트 상태를 draft로 업데이트');
  }
  
  return this.save();
};

// 인스턴스 메서드: 콘티 생성 시에만 호출되는 상태 업데이트 (6단계로 간략화)
projectSchema.methods.updateStatusOnConteCreation = async function() {
  const Conte = require('./Conte');
  const conteCount = await Conte.countDocuments({ projectId: this._id });
  
  // 콘티가 생성되었고 현재 상태가 conte_ready보다 낮은 경우에만 conte_ready로 업데이트
  if (conteCount > 0 && this.status !== 'conte_ready' && this.status !== 'cut_generating' && this.status !== 'cut_generated' && this.status !== 'production_ready') {
    this.status = 'conte_ready';
    console.log('✅ 콘티 생성으로 인한 프로젝트 상태 업데이트: conte_ready');
    return this.save();
  }
  
  // 이미 conte_ready 이상인 상태는 유지
  console.log('✅ 프로젝트 상태 유지:', this.status);
  return this;
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