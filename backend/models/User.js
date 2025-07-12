const mongoose = require('mongoose');

/**
 * 사용자 스키마
 * Google OAuth 2.0을 통한 사용자 인증 정보 저장
 */
const userSchema = new mongoose.Schema({
  // Google OAuth 정보
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 사용자 프로필 정보
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  picture: {
    type: String,
    default: null
  },
  
  // 계정 상태
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 마지막 로그인 시간
  lastLoginAt: {
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

// 가상 필드: 사용자의 프로젝트 수
userSchema.virtual('projectCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// 인덱스 설정 (중복 제거)
userSchema.index({ createdAt: -1 });

// 정적 메서드: Google ID로 사용자 찾기
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// 정적 메서드: 이메일로 사용자 찾기
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// 인스턴스 메서드: 사용자 정보 업데이트
userSchema.methods.updateProfile = function(profileData) {
  Object.assign(this, profileData);
  return this.save();
};

// 인스턴스 메서드: 마지막 로그인 시간 업데이트
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 