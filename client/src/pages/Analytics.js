import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar,
  Filter
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const Analytics = () => {
  const [chartData, setChartData] = useState([]);
  const [keywordData, setKeywordData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [granularity, setGranularity] = useState('daily');

  useEffect(() => {
    fetchAnalyticsData();
  }, [period, granularity]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const [chartResponse, keywordResponse, sourceResponse] = await Promise.all([
        fetch(`/api/data/charts?period=${period}&granularity=${granularity}`),
        fetch(`/api/data/keywords?period=${period}`),
        fetch(`/api/data/sources?period=${period}`)
      ]);

      const [chartData, keywordData, sourceData] = await Promise.all([
        chartResponse.json(),
        keywordResponse.json(),
        sourceResponse.json()
      ]);

      setChartData(chartData.chartData || []);
      setKeywordData(keywordData.keywords || []);
      setSourceData(sourceData.sources || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const { year, month, day, hour } = dateObj;
    const date = new Date(year, month - 1, day, hour || 0);
    
    if (granularity === 'hourly') {
      return date.toLocaleString();
    } else if (granularity === 'daily') {
      return date.toLocaleDateString();
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const getSentimentTrend = (data) => {
    if (data.length < 2) return 'stable';
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const diff = latest.avgScore - previous.avgScore;
    
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  };

  const trend = getSentimentTrend(chartData);
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed sentiment analysis and trends
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            className="input"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
          <Button onClick={fetchAnalyticsData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Trend Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sentiment Trend
                </p>
                <p className={`text-2xl font-bold ${trendColor} capitalize`}>
                  {trend}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${trendColor.replace('text-', 'bg-').replace('-600', '-100')} dark:bg-opacity-20`}>
                {React.createElement(trendIcon, { className: `w-6 h-6 ${trendColor}` })}
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Mentions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {chartData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Sentiment
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {chartData.length > 0 
                    ? (chartData.reduce((sum, item) => sum + item.avgScore, 0) / chartData.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sentiment Over Time
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {chartData.slice(-10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(item._id)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.count} mentions
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Score: {item.avgScore.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex space-x-2 text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          +{item.positive}
                        </span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          ~{item.neutral}
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          -{item.negative}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Source Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Source Performance
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {sourceData.map((source, index) => (
                  <div key={source._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {source._id.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {source.count} mentions
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 dark:text-green-400">
                          {source.positive}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {source.neutral}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-600 dark:text-red-400">
                          {source.negative}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(source.count / Math.max(...sourceData.map(s => s.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Keywords Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Keywords
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keywordData.slice(0, 12).map((keyword, index) => (
                <div key={keyword._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {keyword._id}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {keyword.count}x
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      +{keyword.positiveCount}
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      ~{keyword.neutralCount}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      -{keyword.negativeCount}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Avg: {keyword.avgSentiment.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Analytics;