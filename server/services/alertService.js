const axios = require('axios');
const nodemailer = require('nodemailer');

class AlertService {
  constructor() {
    this.emailTransporter = this.initializeEmailTransporter();
  }

  initializeEmailTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
    return null;
  }

  async sendSlackAlert(mention, aiResponse) {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.log('⚠️ Slack webhook URL not configured');
      return { success: false, error: 'Slack webhook not configured' };
    }

    try {
      const color = mention.sentiment.label === 'negative' ? '#FF0000' : 
                   mention.sentiment.label === 'positive' ? '#00FF00' : '#FFFF00';

      const payload = {
        text: `🚨 New ${mention.sentiment.label} mention detected!`,
        attachments: [
          {
            color: color,
            fields: [
              {
                title: 'Content',
                value: mention.content.length > 500 ? 
                  mention.content.substring(0, 500) + '...' : 
                  mention.content,
                short: false
              },
              {
                title: 'Author',
                value: `@${mention.author.username}`,
                short: true
              },
              {
                title: 'Source',
                value: mention.source.toUpperCase(),
                short: true
              },
              {
                title: 'Sentiment Score',
                value: `${mention.sentiment.score.toFixed(2)} (${mention.sentiment.confidence.toFixed(2)} confidence)`,
                short: true
              },
              {
                title: 'Timestamp',
                value: mention.timestamp.toISOString(),
                short: true
              },
              {
                title: 'Suggested Response',
                value: aiResponse || 'No response generated',
                short: false
              }
            ],
            actions: [
              {
                type: 'button',
                text: 'View Original',
                url: mention.sourceUrl
              }
            ],
            footer: 'Sentiment Alert System',
            ts: Math.floor(mention.timestamp.getTime() / 1000)
          }
        ]
      };

      const response = await axios.post(process.env.SLACK_WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      return { success: true, response: response.data };
    } catch (error) {
      console.error('Slack alert error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmailAlert(mention, aiResponse, recipients = []) {
    if (!this.emailTransporter) {
      console.log('⚠️ Email transporter not configured');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const recipientsList = recipients.length > 0 ? recipients : [process.env.EMAIL_USER];
      
      const mailOptions = {
        from: `"Sentiment Alert System" <${process.env.EMAIL_USER}>`,
        to: recipientsList.join(', '),
        subject: `🚨 ${mention.sentiment.label.toUpperCase()} Sentiment Alert - ${mention.source.toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${mention.sentiment.label === 'negative' ? '#fee2e2' : 
                          mention.sentiment.label === 'positive' ? '#d1fae5' : '#fef3c7'}; 
                        padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; color: ${mention.sentiment.label === 'negative' ? '#dc2626' : 
                          mention.sentiment.label === 'positive' ? '#059669' : '#d97706'};">
                ${mention.sentiment.label.toUpperCase()} Sentiment Detected
              </h2>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0;">Mention Details</h3>
              <p><strong>Content:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                "${mention.content}"
              </p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div>
                  <strong>Author:</strong><br>
                  @${mention.author.username} (${mention.author.displayName})
                </div>
                <div>
                  <strong>Source:</strong><br>
                  ${mention.source.toUpperCase()}
                </div>
                <div>
                  <strong>Sentiment Score:</strong><br>
                  ${mention.sentiment.score.toFixed(2)} (${(mention.sentiment.confidence * 100).toFixed(1)}% confidence)
                </div>
                <div>
                  <strong>Timestamp:</strong><br>
                  ${mention.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
            
            ${aiResponse ? `
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1d4ed8;">🤖 AI Suggested Response</h3>
              <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                "${aiResponse}"
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${mention.sourceUrl}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                View Original Post
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                        color: #6b7280; font-size: 14px;">
              <p>This alert was generated by the Sentiment Alert System.</p>
              <p>To manage your alert preferences, please contact your system administrator.</p>
            </div>
          </div>
        `
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email alert error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAlert(mention, aiResponse, channels = ['slack', 'email']) {
    const results = {};

    for (const channel of channels) {
      try {
        if (channel === 'slack') {
          results.slack = await this.sendSlackAlert(mention, aiResponse);
        } else if (channel === 'email') {
          results.email = await this.sendEmailAlert(mention, aiResponse);
        }
      } catch (error) {
        console.error(`Error sending ${channel} alert:`, error);
        results[channel] = { success: false, error: error.message };
      }
    }

    return results;
  }

  async sendDigestEmail(mentions, period = 'daily') {
    if (!this.emailTransporter) {
      console.log('⚠️ Email transporter not configured for digest');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const negativeMentions = mentions.filter(m => m.sentiment.label === 'negative');
      const positiveMentions = mentions.filter(m => m.sentiment.label === 'positive');
      const neutralMentions = mentions.filter(m => m.sentiment.label === 'neutral');

      const mailOptions = {
        from: `"Sentiment Alert System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `📊 ${period.charAt(0).toUpperCase() + period.slice(1)} Sentiment Digest`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #1f2937;">📊 Sentiment Digest Report</h1>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="color: #dc2626; margin: 0;">${negativeMentions.length}</h3>
                <p style="margin: 5px 0 0 0;">Negative Mentions</p>
              </div>
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="color: #d97706; margin: 0;">${neutralMentions.length}</h3>
                <p style="margin: 5px 0 0 0;">Neutral Mentions</p>
              </div>
              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="color: #059669; margin: 0;">${positiveMentions.length}</h3>
                <p style="margin: 5px 0 0 0;">Positive Mentions</p>
              </div>
            </div>

            ${negativeMentions.length > 0 ? `
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">🚨 Top Negative Mentions</h3>
              ${negativeMentions.slice(0, 5).map(mention => `
                <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #dc2626;">
                  <p style="margin: 0 0 10px 0;"><strong>@${mention.author.username}</strong> on ${mention.source}</p>
                  <p style="margin: 0;">"${mention.content.length > 200 ? mention.content.substring(0, 200) + '...' : mention.content}"</p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                    Score: ${mention.sentiment.score.toFixed(2)} | ${mention.timestamp.toLocaleString()}
                  </p>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                        color: #6b7280; font-size: 14px;">
              <p>Total mentions analyzed: ${mentions.length}</p>
              <p>Report generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Digest email error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AlertService();