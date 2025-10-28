import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  ExternalLink,
  Bot
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const Mentions = () => {
  const { on } = useSocket();
  const [mentions, setMentions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    sentiment: '',
    source: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  useEffect(() => {
    fetchMentions();
    
    on('newMention', (data) => {
      toast.success('New mention received!');
      fetchMentions();
    });
  }, [on]);

  const fetchMentions = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/sentiment?${params}`);
      const data = await response.json();
      
      setMentions(data.mentions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching mentions:', error);
      toast.error('Failed to load mentions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchMentions(1);
  };

  const clearFilters = () => {
    setFilters({
      sentiment: '',
      source: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    fetchMentions(1);
  };

  const getSentimentColor = (label) => {
    switch (label) {
      case 'positive': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'negative': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getSentimentIcon = (label) => {
    switch (label) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mentions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor all customer mentions and sentiment analysis
          </p>
        </div>
        <Button onClick={() => fetchMentions(pagination.current)}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search mentions..."
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sentiment
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) => handleFilterChange('sentiment', e.target.value)}
              className="input"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="input"
            >
              <option value="">All Sources</option>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
              <option value="google_reviews">Google Reviews</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {mentions.length} of {pagination.total} mentions
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Mentions List */}
      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : mentions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No mentions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or check back later for new mentions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mentions.map((mention, index) => (
              <motion.div
                key={mention._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start space-x-4">
                  {/* Sentiment Indicator */}
                  <div className={`p-2 rounded-lg ${getSentimentColor(mention.sentiment.label)}`}>
                    {getSentimentIcon(mention.sentiment.label)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <img
                          src={mention.author.avatar || 'https://via.placeholder.com/32'}
                          alt={mention.author.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            @{mention.author.username}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            {mention.author.displayName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTimeAgo(mention.timestamp)}
                        </div>
                        <div className="flex items-center">
                          <span className="capitalize">{mention.source}</span>
                        </div>
                        <a
                          href={mention.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {mention.content}
                    </p>

                    {/* Metrics */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 dark:text-gray-400 mr-1">Score:</span>
                          <span className={`font-medium ${
                            mention.sentiment.score > 0 ? 'text-green-600 dark:text-green-400' :
                            mention.sentiment.score < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {mention.sentiment.score > 0 ? '+' : ''}{mention.sentiment.score.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 dark:text-gray-400 mr-1">Confidence:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(mention.sentiment.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        {mention.engagement && (
                          <div className="flex items-center space-x-4">
                            {mention.engagement.likes > 0 && (
                              <span className="text-gray-500 dark:text-gray-400">
                                ❤️ {mention.engagement.likes}
                              </span>
                            )}
                            {mention.engagement.comments > 0 && (
                              <span className="text-gray-500 dark:text-gray-400">
                                💬 {mention.engagement.comments}
                              </span>
                            )}
                            {mention.engagement.shares > 0 && (
                              <span className="text-gray-500 dark:text-gray-400">
                                🔄 {mention.engagement.shares}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {mention.alertSent && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                            Alert Sent
                          </span>
                        )}
                        {mention.aiResponse?.suggested && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full flex items-center">
                            <Bot className="w-3 h-3 mr-1" />
                            AI Response
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Response */}
                    {mention.aiResponse?.suggested && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-2">
                          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            AI Suggested Response:
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {mention.aiResponse.suggested}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.current} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                disabled={pagination.current === 1}
                onClick={() => fetchMentions(pagination.current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={pagination.current === pagination.pages}
                onClick={() => fetchMentions(pagination.current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Mentions;