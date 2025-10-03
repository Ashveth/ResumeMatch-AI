const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Mention = require('../models/Mention');
const alertService = require('../services/alertService');

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      severity,
      type
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const alerts = await Alert.find(filter)
      .populate('mentionId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Alert.countDocuments(filter);

    res.json({
      alerts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const stats = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityStats = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      status: stats,
      severity: severityStats,
      type: typeStats,
      period,
      startDate
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

// Send manual alert
router.post('/send', async (req, res) => {
  try {
    const { mentionId, channels = ['slack', 'email'], recipients } = req.body;
    
    const mention = await Mention.findById(mentionId);
    if (!mention) {
      return res.status(404).json({ error: 'Mention not found' });
    }

    const aiResponse = mention.aiResponse?.suggested || 
      await require('../services/aiService').generateResponse(mention, mention.sentiment);

    const alertResults = await alertService.sendAlert(mention, aiResponse, channels);

    // Create alert record
    const alert = new Alert({
      mentionId: mention._id,
      type: 'negative_sentiment',
      severity: mention.sentiment.confidence > 0.8 ? 'high' : 'medium',
      channels,
      status: Object.values(alertResults).some(result => result.success) ? 'sent' : 'failed',
      message: {
        title: `${mention.sentiment.label.toUpperCase()} Sentiment Alert`,
        content: `New ${mention.sentiment.label} mention detected from ${mention.source}`,
        data: { mention, aiResponse, alertResults }
      },
      sentAt: new Date()
    });

    await alert.save();

    res.json({
      alert,
      results: alertResults
    });
  } catch (error) {
    console.error('Error sending alert:', error);
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedBy } = req.body;
    
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    
    await alert.save();

    res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Send digest email
router.post('/digest', async (req, res) => {
  try {
    const { period = 'daily', recipients } = req.body;
    
    let startDate = new Date();
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    const mentions = await Mention.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).lean();

    const result = await alertService.sendDigestEmail(mentions, period);

    res.json({
      success: result.success,
      messageId: result.messageId,
      mentionsCount: mentions.length,
      period
    });
  } catch (error) {
    console.error('Error sending digest:', error);
    res.status(500).json({ error: 'Failed to send digest' });
  }
});

// Test alert channels
router.post('/test', async (req, res) => {
  try {
    const { channels = ['slack', 'email'] } = req.body;
    
    const testMention = {
      id: 'test_mention',
      content: 'This is a test mention to verify alert functionality.',
      author: {
        username: 'test_user',
        displayName: 'Test User',
        profileUrl: 'https://example.com/test',
        avatar: 'https://via.placeholder.com/40'
      },
      source: 'test',
      sourceUrl: 'https://example.com/test',
      timestamp: new Date(),
      sentiment: {
        score: -0.8,
        label: 'negative',
        confidence: 0.9
      },
      engagement: { likes: 0, shares: 0, comments: 0, retweets: 0 }
    };

    const testResponse = 'Thank you for your feedback. We appreciate you taking the time to share your experience with us.';

    const results = await alertService.sendAlert(testMention, testResponse, channels);

    res.json({
      success: true,
      results,
      message: 'Test alerts sent successfully'
    });
  } catch (error) {
    console.error('Error testing alerts:', error);
    res.status(500).json({ error: 'Failed to test alerts' });
  }
});

module.exports = router;