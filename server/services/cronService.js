const cron = require('node-cron');
const Mention = require('../models/Mention');
const dataCollectionService = require('./dataCollectionService');
const aiService = require('./aiService');
const alertService = require('./alertService');

class CronService {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.setupJobs();
  }

  setupJobs() {
    // Collect mentions every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (!this.isRunning) {
        await this.collectMentions();
      }
    });

    // Send daily digest at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.sendDailyDigest();
    });

    // Clean up old mentions (older than 90 days) daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldMentions();
    });

    // Process pending mentions every minute
    cron.schedule('* * * * *', async () => {
      await this.processPendingMentions();
    });
  }

  async collectMentions() {
    try {
      this.isRunning = true;
      console.log('🔄 Starting automated mention collection...');

      // Define search queries for different platforms
      const queries = {
        twitter: 'customer service OR support OR complaint OR review',
        reddit: {
          subreddit: 'customer_service',
          query: 'complaint OR review OR feedback'
        },
        googleReviews: {
          placeId: 'demo_place_id' // Replace with actual place ID
        }
      };

      const mentions = await dataCollectionService.collectAllMentions(queries);
      console.log(`📥 Collected ${mentions.length} mentions`);

      // Process each mention
      let processedCount = 0;
      let alertCount = 0;

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
          processedCount++;

          // Send alert if negative sentiment with high confidence
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

            alertCount++;

            // Emit real-time update
            this.io.emit('newNegativeMention', {
              mention: newMention,
              alertResults,
              timestamp: new Date()
            });
          }

          // Emit real-time update for all mentions
          this.io.emit('newMention', {
            mention: newMention,
            timestamp: new Date()
          });

        } catch (error) {
          console.error('Error processing mention:', error);
        }
      }

      console.log(`✅ Processed ${processedCount} new mentions, sent ${alertCount} alerts`);
      
      // Emit collection summary
      this.io.emit('collectionSummary', {
        collected: mentions.length,
        processed: processedCount,
        alertsSent: alertCount,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Error in automated collection:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async sendDailyDigest() {
    try {
      console.log('📧 Sending daily digest...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mentions = await Mention.find({
        timestamp: { $gte: yesterday }
      }).sort({ timestamp: -1 }).lean();

      if (mentions.length > 0) {
        const result = await alertService.sendDigestEmail(mentions, 'daily');
        
        if (result.success) {
          console.log('✅ Daily digest sent successfully');
          this.io.emit('digestSent', {
            type: 'daily',
            mentionsCount: mentions.length,
            timestamp: new Date()
          });
        } else {
          console.error('❌ Failed to send daily digest:', result.error);
        }
      } else {
        console.log('ℹ️ No mentions found for daily digest');
      }
    } catch (error) {
      console.error('❌ Error sending daily digest:', error);
    }
  }

  async cleanupOldMentions() {
    try {
      console.log('🧹 Cleaning up old mentions...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep mentions for 90 days

      const result = await Mention.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`🗑️ Deleted ${result.deletedCount} old mentions`);
      
      this.io.emit('cleanupCompleted', {
        deletedCount: result.deletedCount,
        cutoffDate,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error cleaning up old mentions:', error);
    }
  }

  async processPendingMentions() {
    try {
      const pendingMentions = await Mention.find({
        processed: false
      }).limit(10);

      if (pendingMentions.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingMentions.length} pending mentions...`);

      for (const mention of pendingMentions) {
        try {
          // Analyze sentiment if not already done
          if (!mention.sentiment) {
            const sentiment = await aiService.analyzeSentiment(mention.content);
            mention.sentiment = sentiment;
          }

          // Extract keywords if not already done
          if (!mention.keywords || mention.keywords.length === 0) {
            const keywords = await aiService.extractKeywords(mention.content);
            mention.keywords = keywords;
          }

          mention.processed = true;
          await mention.save();

          // Check for alerts
          if (mention.sentiment.label === 'negative' && mention.sentiment.confidence > 0.7 && !mention.alertSent) {
            const aiResponse = await aiService.generateResponse(mention, mention.sentiment);
            
            mention.aiResponse = {
              suggested: aiResponse,
              generated: new Date()
            };
            await mention.save();

            const alertResults = await alertService.sendAlert(mention, aiResponse);
            mention.alertSent = true;
            mention.alertChannels = Object.keys(alertResults).filter(channel => 
              alertResults[channel].success
            );
            await mention.save();

            this.io.emit('newNegativeMention', {
              mention,
              alertResults,
              timestamp: new Date()
            });
          }

          this.io.emit('mentionProcessed', {
            mentionId: mention._id,
            timestamp: new Date()
          });

        } catch (error) {
          console.error('Error processing pending mention:', error);
        }
      }

    } catch (error) {
      console.error('❌ Error processing pending mentions:', error);
    }
  }

  // Manual trigger methods
  async triggerCollection() {
    await this.collectMentions();
  }

  async triggerDigest() {
    await this.sendDailyDigest();
  }

  async triggerCleanup() {
    await this.cleanupOldMentions();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date()
    };
  }
}

module.exports = CronService;