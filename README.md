# Customer Sentiment Alert System

A comprehensive real-time sentiment monitoring system with AI-powered alerts and responses. This system monitors social media platforms, analyzes sentiment using Google Gemini 2.5 API, and provides instant alerts with AI-generated response suggestions.

## 🚀 Features

### Core Features (MVP)
- **Real-Time Data Collection**: Fetch mentions from Twitter, Reddit, and Google Reviews
- **AI Sentiment Analysis**: Google Gemini 2.5 API integration for sentiment classification
- **Real-Time Alerts**: Instant Slack/email notifications for negative sentiment
- **AI Response Generation**: Automated suggested responses to negative mentions
- **Interactive Dashboard**: Modern UI with dark/light mode and smooth animations
- **Real-Time Updates**: WebSocket-based live data streaming
- **Analytics & Trends**: Comprehensive sentiment analytics and reporting

### Technical Features
- **Frontend**: React with Tailwind CSS, Framer Motion animations
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with optimized schemas
- **AI Integration**: Google Gemini 2.5 API
- **Real-Time**: Socket.IO for live updates
- **Alerts**: Slack webhooks and email notifications
- **Automation**: Cron jobs for scheduled data collection

## 📋 Prerequisites

- Node.js 16+ and npm
- MongoDB (local or cloud)
- Google Gemini API key
- Slack webhook URL (optional)
- Email SMTP credentials (optional)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd customer-sentiment-alert-system
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, client)
npm run install-all
```

### 3. Environment Setup

#### Backend Environment (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sentiment-alerts
GEMINI_API_KEY=AIzaSyAytXuvW9T6qF5D6qejIsAHXYfHbMe5J1Y
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
SLACK_WEBHOOK_URL=your_slack_webhook_url
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

#### Frontend Environment
```bash
cd client
```

Create `client/.env`:
```env
REACT_APP_SERVER_URL=http://localhost:5000
```

### 4. Database Setup
```bash
# Start MongoDB (if running locally)
mongod

# The application will automatically create the database and collections
```

## 🚀 Running the Application

### Development Mode
```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📱 Usage

### 1. Access the Dashboard
- Open your browser to `http://localhost:3000`
- The dashboard will show real-time sentiment data

### 2. Configure Data Sources
- Go to Settings → Monitoring
- Enable/configure Twitter, Reddit, and Google Reviews
- Set up keywords and subreddits to monitor

### 3. Set Up Alerts
- Go to Settings → Alerts
- Configure email and Slack notifications
- Test alert channels

### 4. Monitor Mentions
- View all mentions in the Mentions page
- Filter by sentiment, source, or date range
- See AI-generated response suggestions

### 5. Analyze Trends
- Check the Analytics page for detailed insights
- View sentiment trends over time
- Analyze keyword performance

## 🔧 API Endpoints

### Sentiment Analysis
- `GET /api/sentiment` - Get all mentions with filtering
- `POST /api/sentiment/analyze` - Analyze text sentiment
- `POST /api/sentiment/collect` - Collect mentions from sources
- `GET /api/sentiment/stats` - Get sentiment statistics

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts/send` - Send manual alert
- `POST /api/alerts/test` - Test alert channels
- `POST /api/alerts/digest` - Send digest email

### Data & Analytics
- `GET /api/data/dashboard` - Dashboard data
- `GET /api/data/charts` - Chart data
- `GET /api/data/keywords` - Keyword analysis
- `GET /api/data/sources` - Source performance

### AI Services
- `POST /api/ai/analyze` - Analyze sentiment
- `POST /api/ai/response` - Generate response
- `POST /api/ai/keywords` - Extract keywords
- `GET /api/ai/health` - AI service health check

## 🔌 WebSocket Events

### Client → Server
- Connection established automatically

### Server → Client
- `newMention` - New mention received
- `newNegativeMention` - Negative sentiment alert
- `collectionSummary` - Data collection summary
- `digestSent` - Digest email sent
- `cleanupCompleted` - Data cleanup completed

## 🎨 Customization

### Themes
The application supports dark/light mode with smooth transitions. Toggle available in the header.

### Sentiment Colors
- **Positive**: Green (#10B981)
- **Negative**: Red (#EF4444)  
- **Neutral**: Yellow (#F59E0B)

### Animations
Built with Framer Motion for smooth, professional animations throughout the interface.

## 🚨 Alert Configuration

### Slack Integration
1. Create a Slack app in your workspace
2. Add incoming webhook
3. Copy webhook URL to `SLACK_WEBHOOK_URL`

### Email Integration
1. Use Gmail SMTP or your preferred email service
2. For Gmail, use App Passwords (not regular password)
3. Configure SMTP settings in `.env`

## 📊 Monitoring & Analytics

### Real-Time Metrics
- Total mentions count
- Sentiment distribution
- Source performance
- Alert statistics

### Historical Analysis
- Daily/weekly/monthly trends
- Keyword analysis
- Sentiment score evolution
- Response effectiveness

## 🔒 Security Features

- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Environment variable protection

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t sentiment-alerts .

# Run with Docker Compose
docker-compose up -d
```

### Cloud Deployment (Heroku)
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key
heroku config:set MONGODB_URI=your_mongodb_uri
# ... other variables

# Deploy
git push heroku main
```

### VPS Deployment
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start server/index.js --name "sentiment-alerts"

# Setup nginx reverse proxy
# Configure SSL certificates
# Set up monitoring
```

## 🧪 Testing

### Manual Testing
1. **Data Collection**: Test mention collection from different sources
2. **Sentiment Analysis**: Verify AI analysis accuracy
3. **Alerts**: Test Slack and email notifications
4. **Real-Time Updates**: Verify WebSocket functionality
5. **UI/UX**: Test dark/light mode, animations, responsiveness

### Test Scenarios
```bash
# Test API endpoints
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is amazing!"}'

# Test alert channels
curl -X POST http://localhost:5000/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"channels": ["slack", "email"]}'
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

#### API Key Issues
- Verify Google Gemini API key is valid
- Check API quota and billing
- Ensure key has proper permissions

#### WebSocket Connection Issues
- Check firewall settings
- Verify CORS configuration
- Test with different browsers

#### Email/Slack Notifications Not Working
- Verify credentials and URLs
- Check spam folders
- Test with curl commands

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development DEBUG=* npm run server
```

## 📈 Performance Optimization

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling
- Query optimization

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

### Backend Optimization
- Response compression
- Rate limiting
- Caching
- Background job processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔮 Future Enhancements

- [ ] Additional social media platforms (Facebook, Instagram, LinkedIn)
- [ ] Advanced AI models and custom training
- [ ] Mobile app development
- [ ] Advanced analytics and ML insights
- [ ] Multi-tenant support
- [ ] API rate limiting and usage analytics
- [ ] Custom alert rules and workflows
- [ ] Integration with CRM systems
- [ ] Advanced reporting and exports
- [ ] Team collaboration features

---

**Built with ❤️ using React, Node.js, MongoDB, and Google Gemini AI**