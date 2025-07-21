const mongoose = require('mongoose');

/**
 * LocationGroup 스키마
 * 실제 촬영 장소 그룹을 관리하는 스키마
 * VirtualLocation들을 논리적으로 묶는 그룹
 */
const locationGroupSchema = new mongoose.Schema({
  // 프로젝트 참조 (외래키)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // 그룹 기본 정보
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // 실제 물리적 주소 정보
  realAddress: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // 지리 좌표
  coordinates: {
    latitude: {
      type: Number,
      required: false,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: false,
      min: -180,
      max: 180
    }
  },
  
  // 추가 주소 정보
  addressDetails: {
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    district: {
      type: String,
      trim: true,
      maxlength: 100
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },
  
  // 촬영 관련 정보
  shootingInfo: {
    contactPerson: {
      type: String,
      trim: true,
      maxlength: 100
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    permissionRequired: {
      type: Boolean,
      default: false
    },
    permissionStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_required'],
      default: 'not_required'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  
  // 그룹 상태
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // 정렬 순서
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 해당 그룹에 속한 VirtualLocation 수
locationGroupSchema.virtual('virtualLocationCount', {
  ref: 'VirtualLocation',
  localField: '_id',
  foreignField: 'locationGroupId',
  count: true
});

// 가상 필드: 해당 그룹에 속한 VirtualLocation 목록
locationGroupSchema.virtual('virtualLocations', {
  ref: 'VirtualLocation',
  localField: '_id',
  foreignField: 'locationGroupId',
  options: { sort: { order: 1 } }
});

// 인덱스 설정
locationGroupSchema.index({ projectId: 1, name: 1 });
locationGroupSchema.index({ projectId: 1, status: 1 });
locationGroupSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// 미들웨어: 수정 시 modifiedBy 업데이트
locationGroupSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.modifiedBy = 'User'; // 실제로는 현재 사용자 정보를 사용
  }
  next();
});

// 정적 메서드: 프로젝트별 그룹 조회
locationGroupSchema.statics.findByProject = function(projectId) {
  return this.find({ projectId, status: { $ne: 'archived' } })
    .populate('virtualLocations')
    .sort({ order: 1, name: 1 });
};

// 정적 메서드: 활성 그룹만 조회
locationGroupSchema.statics.findActive = function(projectId) {
  return this.find({ projectId, status: 'active' })
    .populate('virtualLocations')
    .sort({ order: 1, name: 1 });
};

// 인스턴스 메서드: 그룹 내 VirtualLocation 추가
locationGroupSchema.methods.addVirtualLocation = function(virtualLocationId) {
  // VirtualLocation 모델을 동적으로 import
  const VirtualLocation = mongoose.model('VirtualLocation');
  return VirtualLocation.findByIdAndUpdate(
    virtualLocationId,
    { locationGroupId: this._id },
    { new: true }
  );
};

// 인스턴스 메서드: 그룹 내 VirtualLocation 제거
locationGroupSchema.methods.removeVirtualLocation = function(virtualLocationId) {
  const VirtualLocation = mongoose.model('VirtualLocation');
  return VirtualLocation.findByIdAndUpdate(
    virtualLocationId,
    { locationGroupId: null },
    { new: true }
  );
};

module.exports = mongoose.model('LocationGroup', locationGroupSchema); 