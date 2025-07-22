const mongoose = require('mongoose');

/**
 * Group(건물) 스키마
 * 하나의 프로젝트 내 여러 건물 단위 관리
 */
const groupSchema = new mongoose.Schema({
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
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

groupSchema.index({ projectId: 1, name: 1 }, { unique: true }); // 프로젝트 내 이름 중복 방지

module.exports = mongoose.model('Group', groupSchema); 