const mongoose = require('mongoose');

const mentionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: {
    username: String,
    displayName: String,
    profileUrl: String,
    avatar: String
  },
  source: {
    type: String,
    required: true,
    enum: ['twitter', 'reddit', 'google_reviews', 'facebook', 'instagram']
  },
  sourceUrl: String,
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  sentiment: {
    score: {
      type: Number,
      required: true,
      min: -1,
      max: 1
    },
    label: {
      type: String,
      required: true,
      enum: ['positive', 'neutral', 'negative']
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    }
  },
  keywords: [String],
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  engagement: {
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 }
  },
  aiResponse: {
    suggested: String,
    generated: Date,
    used: { type: Boolean, default: false }
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  alertChannels: [{
    type: String,
    enum: ['slack', 'email']
  }],
  processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
mentionSchema.index({ timestamp: -1 });
mentionSchema.index({ 'sentiment.label': 1 });
mentionSchema.index({ source: 1 });
mentionSchema.index({ 'sentiment.score': -1 });
mentionSchema.index({ processed: 1 });

// Virtual for sentiment color
mentionSchema.virtual('sentimentColor').get(function() {
  if (this.sentiment.label === 'positive') return '#10B981'; // green
  if (this.sentiment.label === 'negative') return '#EF4444'; // red
  return '#F59E0B'; // yellow/amber
});

// Virtual for time ago
mentionSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

module.exports = mongoose.model('Mention', mentionSchema);