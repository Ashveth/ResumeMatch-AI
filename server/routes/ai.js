const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Analyze text sentiment
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
      originalText: text
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// Generate response for a mention
router.post('/response', async (req, res) => {
  try {
    const { mention, sentiment } = req.body;
    
    if (!mention || !sentiment) {
      return res.status(400).json({ error: 'Mention and sentiment are required' });
    }

    const response = await aiService.generateResponse(mention, sentiment);

    res.json({
      response,
      mention: {
        content: mention.content,
        author: mention.author?.username || 'Unknown',
        source: mention.source
      },
      sentiment
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Extract keywords from text
router.post('/keywords', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const keywords = await aiService.extractKeywords(text);

    res.json({
      keywords,
      originalText: text
    });
  } catch (error) {
    console.error('Error extracting keywords:', error);
    res.status(500).json({ error: 'Failed to extract keywords' });
  }
});

// Batch analyze multiple texts
router.post('/batch-analyze', async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    if (texts.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 texts allowed per batch' });
    }

    const results = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const sentiment = await aiService.analyzeSentiment(text);
          const keywords = await aiService.extractKeywords(text);
          
          return {
            index,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            sentiment,
            keywords,
            success: true
          };
        } catch (error) {
          return {
            index,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            error: error.message,
            success: false
          };
        }
      })
    );

    res.json({
      results,
      total: texts.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({ error: 'Failed to perform batch analysis' });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const testText = 'This is a test message for AI service health check.';
    const sentiment = await aiService.analyzeSentiment(testText);
    
    res.json({
      status: 'healthy',
      service: 'Google Gemini AI',
      testResult: {
        text: testText,
        sentiment
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI service health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      service: 'Google Gemini AI',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;