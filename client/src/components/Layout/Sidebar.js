import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  X,
  TrendingUp,
  Users,
  Bell
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { theme } = useTheme();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: Home,
      description: 'Overview and metrics'
    },
    {
      name: 'Mentions',
      path: '/mentions',
      icon: MessageSquare,
      description: 'All mentions and sentiment'
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      description: 'Alert management'
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      description: 'Detailed analytics'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  const quickStats = [
    { label: 'Total Mentions', value: '1,247', icon: MessageSquare, color: 'text-blue-600' },
    { label: 'Active Alerts', value: '12', icon: Bell, color: 'text-red-600' },
    { label: 'Sentiment Score', value: '+0.23', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Sources', value: '3', icon: Users, color: 'text-purple-600' }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className="hidden lg:flex lg:flex-shrink-0"
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
      >
        <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sentiment Alerts
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <Icon className={`w-3 h-3 mr-2 ${stat.color}`} />
                      <span className="text-gray-600 dark:text-gray-400">{stat.label}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <motion.div
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
        initial={{ x: '-100%' }}
        animate={isOpen ? { x: 0 } : { x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sentiment Alerts
                </h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;