import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Send, 
  Mail, 
  MessageSquare,
  Bell,
  Zap
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const Alerts = () => {
  const { on } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    status: [],
    severity: [],
    type: []
  });

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    
    on('newNegativeMention', (data) => {
      toast.error('New negative sentiment alert!', {
        duration: 6000,
        icon: '🚨'
      });
      fetchAlerts();
      fetchStats();
    });
  }, [on]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/alerts/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching alert stats:', error);
    }
  };

  const testAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: ['slack', 'email'] })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Test alerts sent successfully!');
      } else {
        toast.error('Failed to send test alerts');
      }
    } catch (error) {
      console.error('Error testing alerts:', error);
      toast.error('Failed to test alerts');
    }
  };

  const sendDigest = async () => {
    try {
      const response = await fetch('/api/alerts/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'daily' })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Digest email sent successfully!');
      } else {
        toast.error('Failed to send digest email');
      }
    } catch (error) {
      console.error('Error sending digest:', error);
      toast.error('Failed to send digest email');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'acknowledged': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'slack': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor sentiment alerts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={testAlerts}>
            Test Alerts
          </Button>
          <Button variant="outline" onClick={sendDigest}>
            Send Digest
          </Button>
          <Button onClick={fetchAlerts}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.status.map((stat) => (
          <motion.div
            key={stat._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {stat._id} Alerts
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.count}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Alerts
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {alerts.length} total alerts
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No alerts found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Alerts will appear here when negative sentiment is detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Alert Icon */}
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {alert.message.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {alert.message.content}
                      </p>

                      {/* Channels */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Channels:</span>
                        {alert.channels.map((channel) => (
                          <div key={channel} className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            {getChannelIcon(channel)}
                            <span className="capitalize">{channel}</span>
                          </div>
                        ))}
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Created: {new Date(alert.createdAt).toLocaleString()}
                        </div>
                        {alert.sentAt && (
                          <div className="flex items-center">
                            <Send className="w-3 h-3 mr-1" />
                            Sent: {new Date(alert.sentAt).toLocaleString()}
                          </div>
                        )}
                        {alert.acknowledgedAt && (
                          <div className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {alert.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        Acknowledge
                      </Button>
                    )}
                    {alert.retryCount > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Retries: {alert.retryCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mention Details */}
                {alert.mentionId && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Related Mention:
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.mentionId.content?.substring(0, 200)}...
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Alerts;