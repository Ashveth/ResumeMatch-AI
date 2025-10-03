const express = require('express');
const router = express.Router();
const Mention = require('../models/Mention');
const aiService = require('../services/aiService');
const dataCollectionService = require('../services/dataCollectionService');
const alertService = require('../services/alertService');

// Get all mentions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sentiment,
      source,
      startDate,
      endDate,
      search
    } = req.query;

    const filter = {};
    
    if (sentiment) filter['sentiment.label'] = sentiment;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'author.username': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const mentions = await Mention.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Mention.countDocuments(filter);

    res.json({
      mentions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

// Get sentiment statistics
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
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const stats = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' },
          avgConfidence: { $avg: '$sentiment.confidence' }
        }
      }
    ]);

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
          sentiment: {
            $push: '$sentiment.label'
          }
        }
      }
    ]);

    const dailyStats = await Mention.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
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
          sentiment: {
            $push: '$sentiment.label'
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      sentiment: stats,
      sources: sourceStats,
      daily: dailyStats,
      period,
      startDate
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Analyze new text for sentiment
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sentiment = await aiService.analyzeSentiment(text);
    const keywords = await aiService.extractKeywords(text);

    res.json({
      sentiment,
      keywords,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Collect mentions from external sources
router.post('/collect', async (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries) {
      return res.status(400).json({ error: 'Queries are required' });
    }

    const mentions = await dataCollectionService.collectAllMentions(queries);
    
    // Process each mention
    const processedMentions = [];
    for (const mention of mentions) {
      try {
        // Check if mention already exists
        const existingMention = await Mention.findOne({ id: mention.id });
        if (existingMention) {
          continue;
        }

        // Analyze sentiment
        const sentiment = await aiService.analyzeSentiment(mention.content);
        const keywords = await aiService.extractKeywords(mention.content);

        // Create mention record
        const newMention = new Mention({
          ...mention,
          sentiment,
          keywords,
          processed: true
        });

        await newMention.save();
        processedMentions.push(newMention);

        // Send alert if negative sentiment
        if (sentiment.label === 'negative' && sentiment.confidence > 0.7) {
          const aiResponse = await aiService.generateResponse(newMention, sentiment);
          newMention.aiResponse = {
            suggested: aiResponse,
            generated: new Date()
          };
          await newMention.save();

          // Send alerts
          const alertResults = await alertService.sendAlert(newMention, aiResponse);
          newMention.alertSent = true;
          newMention.alertChannels = Object.keys(alertResults).filter(channel => 
            alertResults[channel].success
          );
          await newMention.save();

          // Emit real-time update
          req.app.get('io').emit('newNegativeMention', {
            mention: newMention,
            alertResults
          });
        }

        // Emit real-time update for all mentions
        req.app.get('io').emit('newMention', newMention);
      } catch (error) {
        console.error('Error processing mention:', error);
      }
    }

    res.json({
      collected: mentions.length,
      processed: processedMentions.length,
      mentions: processedMentions
    });
  } catch (error) {
    console.error('Error collecting mentions:', error);
    res.status(500).json({ error: 'Failed to collect mentions' });
  }
});

// Get top negative mentions
router.get('/negative', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const negativeMentions = await Mention.find({
      'sentiment.label': 'negative'
    })
    .sort({ 'sentiment.score': 1, timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json(negativeMentions);
  } catch (error) {
    console.error('Error fetching negative mentions:', error);
    res.status(500).json({ error: 'Failed to fetch negative mentions' });
  }
});

// Generate AI response for a mention
router.post('/:id/response', async (req, res) => {
  try {
    const mention = await Mention.findById(req.params.id);
    
    if (!mention) {
      return res.status(404).json({ error: 'Mention not found' });
    }

    const aiResponse = await aiService.generateResponse(mention, mention.sentiment);
    
    mention.aiResponse = {
      suggested: aiResponse,
      generated: new Date()
    };
    
    await mention.save();

    res.json({
      response: aiResponse,
      mention: mention
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

module.exports = router;