# 🚀 CampusBite Deployment Guide

## 📋 **Deployment Overview**

This guide covers deploying the CampusBite application to various platforms including web, mobile app stores, and production servers.

---

## 🌐 **Web Deployment**

### **Build for Production**
```bash
# Install dependencies
npm install

# Build for web production
npm run build:web

# The build will be in the 'web-build' directory
```

### **Static Hosting Options**

#### **Netlify (Recommended)**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=web-build
```

**Configuration (`netlify.toml`):**
```toml
[build]
  publish = "web-build"
  command = "npm run build:web"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### **Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "web-build",
  "framework": "create-react-app",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### **GitHub Pages**
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json
"scripts": {
  "deploy:github": "npm run build:web && gh-pages -d web-build"
}

# Deploy
npm run deploy:github
```

### **Environment Variables**
```bash
# Create .env.production
REACT_APP_API_URL=https://api.campusbite.com
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

---

## 📱 **Mobile App Deployment**

### **Android Deployment**

#### **Prerequisites**
- **Android Studio** installed
- **Java Development Kit (JDK)** 8 or higher
- **Android SDK** with API level 34+
- **Physical device** or emulator for testing

#### **Build Process**
```bash
# Install Expo CLI
npm install -g @expo/cli

# Login to Expo
expo login

# Build for Android
expo build:android

# Choose build type:
# 1. APK (for testing/distribution)
# 2. AAB (for Google Play Store)
```

#### **Google Play Store Deployment**
```bash
# Generate AAB file
expo build:android --type appbundle

# Upload to Google Play Console
# 1. Go to https://play.google.com/console
# 2. Create new app
# 3. Upload AAB file
# 4. Complete store listing
# 5. Submit for review
```

**Store Listing Requirements:**
- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: 2-8 screenshots (320-3840px)
- **App Description**: 80-4000 characters
- **Privacy Policy**: Required for app submission

#### **APK Distribution**
```bash
# Generate APK for direct distribution
expo build:android --type apk

# Distribute via:
# 1. Email
# 2. Website download
# 3. Third-party stores
# 4. Firebase App Distribution
```

### **iOS Deployment**

#### **Prerequisites**
- **Mac computer** with macOS
- **Xcode** 14.0 or higher
- **Apple Developer Account** ($99/year)
- **Physical iOS device** for testing

#### **Build Process**
```bash
# Install Expo CLI
npm install -g @expo/cli

# Login to Expo
expo login

# Build for iOS
expo build:ios

# Choose build type:
# 1. Simulator (for testing)
# 2. Ad Hoc (for testing on devices)
# 3. App Store (for App Store distribution)
```

#### **App Store Deployment**
```bash
# Generate IPA file
expo build:ios --type app-store

# Upload to App Store Connect
# 1. Go to https://appstoreconnect.apple.com
# 2. Create new app
# 3. Upload IPA file
# 4. Complete app information
# 5. Submit for review
```

**App Store Requirements:**
- **App Icon**: 1024x1024 PNG
- **Screenshots**: 3-10 screenshots for each device
- **App Description**: Marketing text and full description
- **Privacy Policy**: Required for app submission
- **App Review Guidelines**: Must comply with Apple guidelines

---

## 🗄️ **Backend Deployment**

### **Node.js Backend (if applicable)**

#### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=campusbite
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### **Cloud Deployment Options**

**Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create campusbite-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your_database_url

# Deploy
git push heroku main
```

**AWS Elastic Beanstalk**
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init campusbite-api

# Create environment
eb create production

# Deploy
eb deploy
```

**DigitalOcean**
```bash
# Create droplet with Docker
# Use docker-compose.yml
# Deploy with:
docker-compose up -d
```

---

## 🔧 **Environment Configuration**

### **Development Environment**
```bash
# .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### **Staging Environment**
```bash
# .env.staging
EXPO_PUBLIC_API_URL=https://staging-api.campusbite.com
EXPO_PUBLIC_ENVIRONMENT=staging
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_SENTRY_DSN=your_staging_sentry_dsn
```

### **Production Environment**
```bash
# .env.production
EXPO_PUBLIC_API_URL=https://api.campusbite.com
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_SENTRY_DSN=your_production_sentry_dsn
EXPO_PUBLIC_ANALYTICS_ID=your_analytics_id
```

---

## 📊 **Monitoring and Analytics**

### **Error Tracking (Sentry)**
```javascript
// Install Sentry
npm install @sentry/react-native @sentry/expo

// Configure in app.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your_sentry_dsn',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
});
```

### **Analytics (Firebase Analytics)**
```javascript
// Install Firebase Analytics
npm install @react-native-firebase/analytics

// Configure in app.js
import analytics from '@react-native-firebase/analytics';

// Track events
analytics().logEvent('screen_view', {
  screen_name: 'HomeScreen',
});

analytics().logEvent('add_to_cart', {
  item_id: 'item_id',
  item_name: 'item_name',
  value: 9.99,
});
```

### **Performance Monitoring**
```javascript
// Install performance monitoring
npm install @sentry/tracing

// Configure performance monitoring
Sentry.init({
  dsn: 'your_sentry_dsn',
  tracesSampleRate: 1.0,
});
```

---

## 🔒 **Security Considerations**

### **API Security**
```javascript
// API Key Management
const API_KEYS = {
  development: 'dev_api_key',
  staging: 'staging_api_key',
  production: 'prod_api_key',
};

// Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### **Environment Variable Security**
```bash
# Never commit secrets to git
# Use environment variables for sensitive data
# Rotate API keys regularly
# Use different keys for different environments
```

### **Data Protection**
```javascript
// Encrypt sensitive data
const crypto = require('crypto');

const encrypt = (text) => {
  const algorithm = 'aes-256-ctr';
  const key = process.env.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  
  return { iv: iv.toString('hex'), content: encrypted.toString('hex') };
};
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy CampusBite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  build-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:web
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./web-build

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          expo-username: ${{ secrets.EXPO_USERNAME }}
          expo-password: ${{ secrets.EXPO_PASSWORD }}
          token: ${{ secrets.EXPO_TOKEN }}
          build-profile: production
          platform: android
```

### **Deployment Scripts**
```bash
# scripts/deploy.sh
#!/bin/bash

set -e

echo "🚀 Starting CampusBite deployment..."

# Check if we're on main branch
if [ "$(git branch --show-current)" != "main" ]; then
  echo "❌ Not on main branch. Aborting deployment."
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Build for web
echo "🌐 Building for web..."
npm run build:web

# Deploy to staging
echo "📦 Deploying to staging..."
# Add staging deployment commands here

# Deploy to production
echo "🎯 Deploying to production..."
# Add production deployment commands here

echo "✅ Deployment completed successfully!"
```

---

## 📱 **App Store Optimization (ASO)**

### **App Store Optimization Tips**
```javascript
// App Metadata
const appMetadata = {
  name: 'CampusBite - Food Delivery',
  subtitle: 'Order food from campus vendors',
  description: 'CampusBite is the ultimate food delivery app for campus communities. Order from local restaurants, home-based kitchens, cafes, and more.',
  keywords: ['food delivery', 'campus', 'restaurant', 'order food', 'delivery'],
  category: 'Food & Drink',
  content_rating: 'Everyone',
};
```

### **App Store Assets**
- **Icon**: 1024x1024 PNG, no transparency
- **Screenshots**: 1080x1920 PNG for phones, 2048x2732 for tablets
- **Feature Graphic**: 1024x500 PNG for Google Play
- **Promo Video**: 15-30 seconds, YouTube link

---

## 🔄 **Version Management**

### **Semantic Versioning**
```json
// package.json
{
  "version": "1.0.0",
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

### **Release Process**
```bash
# 1. Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 2. Build and test
npm run build:web
npm test

# 3. Deploy
npm run deploy:production

# 4. Create release tag
git tag v1.0.1
git push origin v1.0.1
```

---

## 🆘 **Troubleshooting**

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check for outdated dependencies
npm outdated
npm update
```

#### **API Connection Issues**
```bash
# Check API endpoint
curl https://api.campusbite.com/health

# Check environment variables
echo $EXPO_PUBLIC_API_URL
```

#### **Mobile Build Issues**
```bash
# Clear Expo cache
expo start --clear

# Reset project
expo install --fix

# Check Expo CLI version
expo --version
```

### **Debugging Tools**
```javascript
// Add debug logging
if (process.env.EXPO_PUBLIC_DEBUG) {
  console.log('Debug info:', debugData);
}

// Add error boundaries
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<ErrorView />}
  onError={(error, errorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo);
  }}
>
  <App />
</ErrorBoundary>
```

---

## 📞 **Support and Maintenance**

### **Monitoring Dashboard**
- **Uptime monitoring**: UptimeRobot or Pingdom
- **Error tracking**: Sentry
- **Performance monitoring**: New Relic or DataDog
- **User analytics**: Firebase Analytics

### **Backup Strategy**
- **Database backups**: Daily automated backups
- **Code backups**: Git repository
- **Asset backups**: Cloud storage backup
- **Configuration backups**: Environment variables backup

---

This deployment guide provides comprehensive instructions for deploying the CampusBite application across all platforms, ensuring a smooth and secure deployment process.
