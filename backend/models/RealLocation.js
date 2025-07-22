const mongoose = require('mongoose');

/**
 * RealLocation(실제 장소) 스키마
 * 하나의 프로젝트 내 여러 실제 공간(강의실, 복도 등) 관리
 */
const realLocationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  }
}, {
  timestamps: true
});

realLocationSchema.index({ projectId: 1, name: 1 }, { unique: true }); // 프로젝트 내 이름 중복 방지

module.exports = mongoose.model('RealLocation', realLocationSchema); 