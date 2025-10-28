const express = require('express');
const router = express.Router();
const Mention = require('../models/Mention');
const dataCollectionService = require('../services/dataCollectionService');

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Recent mentions
    const recentMentions = await Mention.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Sentiment distribution (last 24h)
    const sentiment24h = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: last24h }
        }
      },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' }
        }
      }
    ]);

    // Source distribution (last 7d)
    const sourceDistribution = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: last7d }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          sentiment: {
            $push: '$sentiment.label'
          }
        }
      }
    ]);

    // Daily trend (last 7 days)
    const dailyTrend = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: last7d }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' },
          positive: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0]
            }
          },
          negative: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0]
            }
          },
          neutral: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Top negative mentions
    const topNegative = await Mention.find({
      'sentiment.label': 'negative'
    })
    .sort({ 'sentiment.score': 1, timestamp: -1 })
    .limit(5)
    .lean();

    // Alert statistics
    const alertStats = await Mention.aggregate([
      {
        $group: {
          _id: null,
          totalMentions: { $sum: 1 },
          alertsSent: {
            $sum: {
              $cond: ['$alertSent', 1, 0]
            }
          },
          avgSentimentScore: { $avg: '$sentiment.score' },
          avgConfidence: { $avg: '$sentiment.confidence' }
        }
      }
    ]);

    res.json({
      recentMentions,
      sentiment24h,
      sourceDistribution,
      dailyTrend,
      topNegative,
      alertStats: alertStats[0] || {
        totalMentions: 0,
        alertsSent: 0,
        avgSentimentScore: 0,
        avgConfidence: 0
      },
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get mentions for charts
router.get('/charts', async (req, res) => {
  try {
    const { period = '7d', granularity = 'daily' } = req.query;
    
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
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    let groupBy;
    if (granularity === 'hourly') {
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
    } else if (granularity === 'daily') {
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
    } else {
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      };
    }

    const chartData = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' },
          positive: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0]
            }
          },
          negative: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0]
            }
          },
          neutral: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      chartData,
      period,
      granularity,
      startDate
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get keyword analysis
router.get('/keywords', async (req, res) => {
  try {
    const { period = '7d', limit = 20 } = req.query;
    
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

    const keywordStats = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          keywords: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$keywords'
      },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 },
          avgSentiment: { $avg: '$sentiment.score' },
          sentiment: {
            $push: '$sentiment.label'
          }
        }
      },
      {
        $addFields: {
          positiveCount: {
            $size: {
              $filter: {
                input: '$sentiment',
                cond: { $eq: ['$$this', 'positive'] }
              }
            }
          },
          negativeCount: {
            $size: {
              $filter: {
                input: '$sentiment',
                cond: { $eq: ['$$this', 'negative'] }
              }
            }
          },
          neutralCount: {
            $size: {
              $filter: {
                input: '$sentiment',
                cond: { $eq: ['$$this', 'neutral'] }
              }
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      keywords: keywordStats,
      period,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching keyword data:', error);
    res.status(500).json({ error: 'Failed to fetch keyword data' });
  }
});

// Get source performance
router.get('/sources', async (req, res) => {
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

    const sourceStats = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' },
          avgConfidence: { $avg: '$sentiment.confidence' },
          positive: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0]
            }
          },
          negative: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0]
            }
          },
          neutral: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0]
            }
          },
          alertsSent: {
            $sum: {
              $cond: ['$alertSent', 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      sources: sourceStats,
      period,
      startDate
    });
  } catch (error) {
    console.error('Error fetching source data:', error);
    res.status(500).json({ error: 'Failed to fetch source data' });
  }
});

module.exports = router;