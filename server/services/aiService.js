const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeSentiment(text) {
    try {
      const prompt = `
        Analyze the sentiment of the following text and provide a response in JSON format.
        
        Text: "${text}"
        
        Please respond with a JSON object containing:
        - score: a number between -1 (very negative) and 1 (very positive)
        - label: one of "positive", "neutral", or "negative"
        - confidence: a number between 0 and 1 indicating confidence in the analysis
        - reasoning: a brief explanation of why this sentiment was assigned
        
        Consider context, tone, sarcasm, and emotional indicators.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      
      // Try to parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(textResponse);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', textResponse);
        // Fallback to basic sentiment analysis
        return this.fallbackSentimentAnalysis(text);
      }

      return {
        score: parsedResponse.score || 0,
        label: parsedResponse.label || 'neutral',
        confidence: parsedResponse.confidence || 0.5,
        reasoning: parsedResponse.reasoning || 'AI analysis completed'
      };
    } catch (error) {
      console.error('AI sentiment analysis error:', error);
      return this.fallbackSentimentAnalysis(text);
    }
  }

  async generateResponse(mention, sentiment) {
    try {
      const prompt = `
        Generate a professional, friendly response to this ${sentiment.label} customer mention.
        
        Original mention: "${mention.content}"
        Author: ${mention.author?.username || 'Customer'}
        Source: ${mention.source}
        Sentiment: ${sentiment.label} (score: ${sentiment.score})
        
        Guidelines:
        - Be empathetic and understanding
        - Address the specific concern mentioned
        - Offer solutions or next steps
        - Keep it concise (under 200 characters)
        - Use a professional but warm tone
        - If negative, acknowledge the issue and offer to help
        - If positive, thank them genuinely
        - If neutral, engage positively
        
        Provide only the response text, no additional formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedResponse = response.text().trim();
      
      return generatedResponse;
    } catch (error) {
      console.error('AI response generation error:', error);
      return this.getFallbackResponse(sentiment.label);
    }
  }

  async extractKeywords(text) {
    try {
      const prompt = `
        Extract the most important keywords and topics from this text.
        
        Text: "${text}"
        
        Return a JSON array of 3-5 most relevant keywords that would be useful for:
        - Categorizing the content
        - Filtering similar mentions
        - Understanding the main topics
        
        Focus on nouns, product names, emotions, and key concepts.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text().trim();
      
      try {
        const keywords = JSON.parse(textResponse);
        return Array.isArray(keywords) ? keywords.slice(0, 5) : [];
      } catch (parseError) {
        return this.extractKeywordsFallback(text);
      }
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return this.extractKeywordsFallback(text);
    }
  }

  fallbackSentimentAnalysis(text) {
    // Simple keyword-based sentiment analysis as fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'perfect', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'angry', 'frustrated', 'annoyed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { score: 0, label: 'neutral', confidence: 0.3, reasoning: 'No clear sentiment indicators found' };
    }
    
    const score = (positiveCount - negativeCount) / total;
    let label = 'neutral';
    if (score > 0.2) label = 'positive';
    else if (score < -0.2) label = 'negative';
    
    return {
      score,
      label,
      confidence: Math.min(total / 10, 0.8),
      reasoning: 'Fallback keyword-based analysis'
    };
  }

  getFallbackResponse(sentimentLabel) {
    const responses = {
      positive: "Thank you for your positive feedback! We're thrilled to hear about your great experience. 🙏",
      negative: "We're sorry to hear about your experience. Please reach out to our support team so we can make this right for you.",
      neutral: "Thanks for sharing your thoughts! We appreciate your feedback and are always working to improve."
    };
    
    return responses[sentimentLabel] || responses.neutral;
  }

  extractKeywordsFallback(text) {
    // Simple keyword extraction as fallback
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other'].includes(word));
    
    // Return unique words, limited to 5
    return [...new Set(words)].slice(0, 5);
  }
}

module.exports = new AIService();