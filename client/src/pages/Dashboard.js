import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  AlertTriangle,
  Users,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { on } = useSocket();
  const [dashboardData, setDashboardData] = useState({
    recentMentions: [],
    sentiment24h: [],
    sourceDistribution: [],
    dailyTrend: [],
    topNegative: [],
    alertStats: {
      totalMentions: 0,
      alertsSent: 0,
      avgSentimentScore: 0,
      avgConfidence: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();

    // Set up real-time listeners
    on('newMention', (data) => {
      toast.success('New mention received!');
      fetchDashboardData();
    });

    on('newNegativeMention', (data) => {
      toast.error('Negative sentiment alert!', {
        duration: 6000,
        icon: '🚨'
      });
      fetchDashboardData();
    });

    on('collectionSummary', (data) => {
      toast.success(`Collected ${data.collected} mentions`);
      fetchDashboardData();
    });
  }, [on]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/data/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time sentiment monitoring and alerts
          </p>
        </div>
        <Button onClick={fetchDashboardData}>
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Mentions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.alertStats.totalMentions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Alerts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.alertStats.alertsSent}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Sentiment
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.alertStats.avgSentimentScore > 0 ? '+' : ''}
                  {dashboardData.alertStats.avgSentimentScore.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Confidence
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(dashboardData.alertStats.avgConfidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sentiment Distribution (24h)
            </h3>
            <div className="space-y-3">
              {dashboardData.sentiment24h.map((sentiment) => (
                <div key={sentiment._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${getSentimentColor(sentiment._id)}`}>
                      {getSentimentIcon(sentiment._id)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {sentiment._id}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {sentiment.count}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {sentiment.avgScore > 0 ? '+' : ''}{sentiment.avgScore?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Source Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Source Distribution
            </h3>
            <div className="space-y-3">
              {dashboardData.sourceDistribution.map((source) => (
                <div key={source._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {source._id.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {source.count}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {((source.count / dashboardData.alertStats.totalMentions) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Mentions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Mentions
            </h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {dashboardData.recentMentions.slice(0, 5).map((mention, index) => (
              <motion.div
                key={mention._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className={`p-2 rounded-lg ${getSentimentColor(mention.sentiment.label)}`}>
                  {getSentimentIcon(mention.sentiment.label)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        @{mention.author.username}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        on {mention.source}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(mention.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                    {mention.content.length > 150 
                      ? mention.content.substring(0, 150) + '...' 
                      : mention.content
                    }
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Score: {mention.sentiment.score.toFixed(2)}</span>
                    <span>Confidence: {(mention.sentiment.confidence * 100).toFixed(1)}%</span>
                    {mention.alertSent && (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Alert Sent
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Top Negative Mentions */}
      {dashboardData.topNegative.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Negative Mentions
              </h3>
              <div className="flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-medium">Requires Attention</span>
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.topNegative.slice(0, 3).map((mention, index) => (
                <motion.div
                  key={mention._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          @{mention.author.username}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          on {mention.source}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">
                        {mention.sentiment.score.toFixed(2)}
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                      {mention.content.length > 200 
                        ? mention.content.substring(0, 200) + '...' 
                        : mention.content
                      }
                    </p>
                    {mention.aiResponse?.suggested && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                          AI Suggested Response:
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {mention.aiResponse.suggested}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;