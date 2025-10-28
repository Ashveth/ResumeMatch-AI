const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const Reddit = require('reddit');

class DataCollectionService {
  constructor() {
    this.twitterClient = null;
    this.redditClient = null;
    this.initializeClients();
  }

  initializeClients() {
    // Initialize Twitter client if token is available
    if (process.env.TWITTER_BEARER_TOKEN) {
      this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    }

    // Initialize Reddit client if credentials are available
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      this.redditClient = new Reddit({
        username: process.env.REDDIT_USERNAME || 'sentiment-bot',
        password: process.env.REDDIT_PASSWORD || 'password',
        appId: process.env.REDDIT_CLIENT_ID,
        appSecret: process.env.REDDIT_CLIENT_SECRET,
        userAgent: 'SentimentAlertBot/1.0.0'
      });
    }
  }

  async collectTwitterMentions(query, count = 50) {
    if (!this.twitterClient) {
      console.log('⚠️ Twitter client not initialized - using mock data');
      return this.getMockTwitterData();
    }

    try {
      const tweets = await this.twitterClient.v2.search(query, {
        max_results: count,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'context_annotations'],
        'user.fields': ['username', 'name', 'profile_image_url'],
        expansions: ['author_id']
      });

      return tweets.data?.map(tweet => ({
        id: `twitter_${tweet.id}`,
        content: tweet.text,
        author: {
          username: tweet.author?.username || 'unknown',
          displayName: tweet.author?.name || 'Unknown User',
          profileUrl: `https://twitter.com/${tweet.author?.username}`,
          avatar: tweet.author?.profile_image_url
        },
        source: 'twitter',
        sourceUrl: `https://twitter.com/${tweet.author?.username}/status/${tweet.id}`,
        timestamp: new Date(tweet.created_at),
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
          shares: tweet.public_metrics?.quote_count || 0
        }
      })) || [];
    } catch (error) {
      console.error('Twitter collection error:', error);
      return this.getMockTwitterData();
    }
  }

  async collectRedditMentions(subreddit, query, count = 50) {
    if (!this.redditClient) {
      console.log('⚠️ Reddit client not initialized - using mock data');
      return this.getMockRedditData();
    }

    try {
      const posts = await this.redditClient.getSubreddit(subreddit).search({
        query: query,
        sort: 'new',
        limit: count
      });

      return posts.map(post => ({
        id: `reddit_${post.id}`,
        content: post.selftext || post.title,
        author: {
          username: post.author,
          displayName: post.author,
          profileUrl: `https://reddit.com/u/${post.author}`,
          avatar: null
        },
        source: 'reddit',
        sourceUrl: `https://reddit.com${post.permalink}`,
        timestamp: new Date(post.created_utc * 1000),
        engagement: {
          likes: post.ups || 0,
          comments: post.num_comments || 0,
          shares: 0,
          retweets: 0
        }
      }));
    } catch (error) {
      console.error('Reddit collection error:', error);
      return this.getMockRedditData();
    }
  }

  async collectGoogleReviews(placeId, count = 50) {
    // Note: Google Places API requires API key and has rate limits
    // This is a mock implementation for demo purposes
    console.log('⚠️ Google Reviews collection - using mock data');
    return this.getMockGoogleReviewsData();
  }

  getMockTwitterData() {
    const mockTweets = [
      {
        id: 'twitter_mock_1',
        content: 'Just tried the new product and it\'s absolutely amazing! Best purchase I\'ve made this year. Highly recommend! 🚀',
        author: {
          username: 'happy_customer',
          displayName: 'Sarah Johnson',
          profileUrl: 'https://twitter.com/happy_customer',
          avatar: 'https://via.placeholder.com/40'
        },
        source: 'twitter',
        sourceUrl: 'https://twitter.com/happy_customer/status/123456789',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 15, retweets: 3, comments: 2, shares: 0 }
      },
      {
        id: 'twitter_mock_2',
        content: 'Really disappointed with the customer service. Waited 2 hours on hold and still couldn\'t get my issue resolved. This is unacceptable.',
        author: {
          username: 'frustrated_user',
          displayName: 'Mike Chen',
          profileUrl: 'https://twitter.com/frustrated_user',
          avatar: 'https://via.placeholder.com/40'
        },
        source: 'twitter',
        sourceUrl: 'https://twitter.com/frustrated_user/status/123456790',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 8, retweets: 12, comments: 5, shares: 0 }
      },
      {
        id: 'twitter_mock_3',
        content: 'The app works fine, nothing special but gets the job done. Could use some UI improvements though.',
        author: {
          username: 'neutral_reviewer',
          displayName: 'Alex Kim',
          profileUrl: 'https://twitter.com/neutral_reviewer',
          avatar: 'https://via.placeholder.com/40'
        },
        source: 'twitter',
        sourceUrl: 'https://twitter.com/neutral_reviewer/status/123456791',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 2, retweets: 0, comments: 1, shares: 0 }
      }
    ];

    return mockTweets;
  }

  getMockRedditData() {
    const mockPosts = [
      {
        id: 'reddit_mock_1',
        content: 'Has anyone else had issues with the new update? My app keeps crashing and I\'ve lost all my data. This is really frustrating.',
        author: {
          username: 'reddit_user_1',
          displayName: 'reddit_user_1',
          profileUrl: 'https://reddit.com/u/reddit_user_1',
          avatar: null
        },
        source: 'reddit',
        sourceUrl: 'https://reddit.com/r/technology/comments/mock1',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 25, comments: 8, shares: 0, retweets: 0 }
      },
      {
        id: 'reddit_mock_2',
        content: 'Just wanted to share how much I love this service! The team has been incredibly helpful and the product quality is outstanding.',
        author: {
          username: 'reddit_user_2',
          displayName: 'reddit_user_2',
          profileUrl: 'https://reddit.com/u/reddit_user_2',
          avatar: null
        },
        source: 'reddit',
        sourceUrl: 'https://reddit.com/r/reviews/comments/mock2',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 42, comments: 12, shares: 0, retweets: 0 }
      }
    ];

    return mockPosts;
  }

  getMockGoogleReviewsData() {
    const mockReviews = [
      {
        id: 'google_mock_1',
        content: 'Excellent service! The staff was friendly and the product exceeded my expectations. Will definitely come back.',
        author: {
          username: 'Google User',
          displayName: 'John Smith',
          profileUrl: 'https://google.com/user/johnsmith',
          avatar: 'https://via.placeholder.com/40'
        },
        source: 'google_reviews',
        sourceUrl: 'https://google.com/reviews/mock1',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 0, comments: 0, shares: 0, retweets: 0 }
      },
      {
        id: 'google_mock_2',
        content: 'Terrible experience. Product was broken when it arrived and customer service was unhelpful. Waste of money.',
        author: {
          username: 'Google User',
          displayName: 'Jane Doe',
          profileUrl: 'https://google.com/user/janedoe',
          avatar: 'https://via.placeholder.com/40'
        },
        source: 'google_reviews',
        sourceUrl: 'https://google.com/reviews/mock2',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        engagement: { likes: 0, comments: 0, shares: 0, retweets: 0 }
      }
    ];

    return mockReviews;
  }

  async collectAllMentions(queries) {
    const allMentions = [];
    
    try {
      // Collect from Twitter
      if (queries.twitter) {
        const twitterMentions = await this.collectTwitterMentions(queries.twitter);
        allMentions.push(...twitterMentions);
      }

      // Collect from Reddit
      if (queries.reddit) {
        const redditMentions = await this.collectRedditMentions(queries.reddit.subreddit, queries.reddit.query);
        allMentions.push(...redditMentions);
      }

      // Collect from Google Reviews
      if (queries.googleReviews) {
        const googleMentions = await this.collectGoogleReviews(queries.googleReviews.placeId);
        allMentions.push(...googleMentions);
      }

      return allMentions;
    } catch (error) {
      console.error('Error collecting mentions:', error);
      return [];
    }
  }
}

module.exports = new DataCollectionService();