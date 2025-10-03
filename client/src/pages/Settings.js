import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Save, 
  TestTube, 
  Mail, 
  MessageSquare,
  Bell,
  Database,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    alerts: {
      email: {
        enabled: true,
        recipients: ['admin@example.com'],
        frequency: 'immediate'
      },
      slack: {
        enabled: true,
        webhookUrl: 'https://hooks.slack.com/services/...',
        channel: '#alerts'
      },
      digest: {
        enabled: true,
        frequency: 'daily',
        time: '09:00'
      }
    },
    monitoring: {
      sources: {
        twitter: { enabled: true, keywords: ['customer service', 'support'] },
        reddit: { enabled: true, subreddits: ['customer_service'] },
        googleReviews: { enabled: true, placeId: 'demo_place_id' }
      },
      sensitivity: 'medium',
      autoResponse: true
    },
    ai: {
      confidenceThreshold: 0.7,
      responseStyle: 'professional',
      autoGenerate: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  const tabs = [
    { id: 'alerts', name: 'Alerts', icon: Bell },
    { id: 'monitoring', name: 'Monitoring', icon: Globe },
    { id: 'ai', name: 'AI Settings', icon: Zap },
    { id: 'system', name: 'System', icon: SettingsIcon }
  ];

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (section, subsection, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testEmail = async () => {
    try {
      toast.success('Test email sent!');
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  const testSlack = async () => {
    try {
      toast.success('Test Slack message sent!');
    } catch (error) {
      toast.error('Failed to send test Slack message');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your sentiment monitoring system
          </p>
        </div>
        <Button onClick={saveSettings} loading={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Alert Settings */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Email Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Email Alerts
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={testEmail}>
                <TestTube className="w-4 h-4 mr-1" />
                Test
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Email Alerts
                </label>
                <input
                  type="checkbox"
                  checked={settings.alerts.email.enabled}
                  onChange={(e) => handleNestedSettingChange('alerts', 'email', 'enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipients
                </label>
                <input
                  type="text"
                  value={settings.alerts.email.recipients.join(', ')}
                  onChange={(e) => handleNestedSettingChange('alerts', 'email', 'recipients', e.target.value.split(', '))}
                  placeholder="admin@example.com, team@example.com"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={settings.alerts.email.frequency}
                  onChange={(e) => handleNestedSettingChange('alerts', 'email', 'frequency', e.target.value)}
                  className="input"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly Digest</option>
                  <option value="daily">Daily Digest</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Slack Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Slack Alerts
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={testSlack}>
                <TestTube className="w-4 h-4 mr-1" />
                Test
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Slack Alerts
                </label>
                <input
                  type="checkbox"
                  checked={settings.alerts.slack.enabled}
                  onChange={(e) => handleNestedSettingChange('alerts', 'slack', 'enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.alerts.slack.webhookUrl}
                  onChange={(e) => handleNestedSettingChange('alerts', 'slack', 'webhookUrl', e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Channel
                </label>
                <input
                  type="text"
                  value={settings.alerts.slack.channel}
                  onChange={(e) => handleNestedSettingChange('alerts', 'slack', 'channel', e.target.value)}
                  placeholder="#alerts"
                  className="input"
                />
              </div>
            </div>
          </Card>

          {/* Digest Settings */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Digest Settings
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Daily Digest
                </label>
                <input
                  type="checkbox"
                  checked={settings.alerts.digest.enabled}
                  onChange={(e) => handleNestedSettingChange('alerts', 'digest', 'enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send Time
                </label>
                <input
                  type="time"
                  value={settings.alerts.digest.time}
                  onChange={(e) => handleNestedSettingChange('alerts', 'digest', 'time', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Monitoring Settings */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Sources
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Twitter */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Twitter</h4>
                  <input
                    type="checkbox"
                    checked={settings.monitoring.sources.twitter.enabled}
                    onChange={(e) => handleNestedSettingChange('monitoring', 'sources', 'twitter', {
                      ...settings.monitoring.sources.twitter,
                      enabled: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={settings.monitoring.sources.twitter.keywords.join(', ')}
                    onChange={(e) => handleNestedSettingChange('monitoring', 'sources', 'twitter', {
                      ...settings.monitoring.sources.twitter,
                      keywords: e.target.value.split(', ')
                    })}
                    placeholder="customer service, support, complaint"
                    className="input"
                  />
                </div>
              </div>

              {/* Reddit */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Reddit</h4>
                  <input
                    type="checkbox"
                    checked={settings.monitoring.sources.reddit.enabled}
                    onChange={(e) => handleNestedSettingChange('monitoring', 'sources', 'reddit', {
                      ...settings.monitoring.sources.reddit,
                      enabled: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subreddits
                  </label>
                  <input
                    type="text"
                    value={settings.monitoring.sources.reddit.subreddits.join(', ')}
                    onChange={(e) => handleNestedSettingChange('monitoring', 'sources', 'reddit', {
                      ...settings.monitoring.sources.reddit,
                      subreddits: e.target.value.split(', ')
                    })}
                    placeholder="customer_service, reviews"
                    className="input"
                  />
                </div>
              </div>

              {/* Google Reviews */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Google Reviews</h4>
                  <input
                    type="checkbox"
                    checked={settings.monitoring.sources.googleReviews.enabled}
                    onChange={(e) => handleNestedSettingChange('monitoring', 'sources', 'googleReviews', {
                      ...settings.monitoring.sources.googleReviews,
                      enabled: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Place ID
                  </label>
                  <input
                    type="text"
                    value={settings.monitoring.sources.googleReviews.placeId}
                    onChange={(e) => handleNestedSettingChange('monitoring', 'sources', 'googleReviews', {
                      ...settings.monitoring.sources.googleReviews,
                      placeId: e.target.value
                    })}
                    placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                    className="input"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monitoring Settings
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sensitivity Level
                </label>
                <select
                  value={settings.monitoring.sensitivity}
                  onChange={(e) => handleSettingChange('monitoring', 'sensitivity', e.target.value)}
                  className="input"
                >
                  <option value="low">Low - Only critical negative sentiment</option>
                  <option value="medium">Medium - Moderate negative sentiment</option>
                  <option value="high">High - All negative sentiment</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-generate AI responses
                </label>
                <input
                  type="checkbox"
                  checked={settings.monitoring.autoResponse}
                  onChange={(e) => handleSettingChange('monitoring', 'autoResponse', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Settings */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Configuration
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confidence Threshold
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.1"
                  value={settings.ai.confidenceThreshold}
                  onChange={(e) => handleSettingChange('ai', 'confidenceThreshold', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>50%</span>
                  <span className="font-medium">{(settings.ai.confidenceThreshold * 100).toFixed(0)}%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Style
                </label>
                <select
                  value={settings.ai.responseStyle}
                  onChange={(e) => handleSettingChange('ai', 'responseStyle', e.target.value)}
                  className="input"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-generate responses
                </label>
                <input
                  type="checkbox"
                  checked={settings.ai.autoGenerate}
                  onChange={(e) => handleSettingChange('ai', 'autoGenerate', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                System Preferences
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Theme
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose your preferred color scheme
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {theme}
                  </span>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    Switch to {theme === 'light' ? 'Dark' : 'Light'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Real-time Updates
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enable live data streaming
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sound Notifications
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Play sound for new alerts
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Management
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-cleanup Old Data
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Remove mentions older than 90 days
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data Export
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Allow CSV/JSON data exports
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;