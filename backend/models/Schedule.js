const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  days: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema); 