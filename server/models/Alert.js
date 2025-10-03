const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  mentionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mention',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['negative_sentiment', 'spike_alert', 'keyword_alert', 'volume_alert']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  channels: [{
    type: String,
    enum: ['slack', 'email', 'webhook']
  }],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'sent', 'failed', 'acknowledged']
  },
  message: {
    title: String,
    content: String,
    data: mongoose.Schema.Types.Mixed
  },
  sentAt: Date,
  acknowledgedBy: String,
  acknowledgedAt: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ status: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ mentionId: 1 });

module.exports = mongoose.model('Alert', alertSchema);