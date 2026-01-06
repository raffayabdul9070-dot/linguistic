# Deployment Guide

## Quick Deployment Options

### 1. Netlify (Recommended for Beginners)

#### Standalone HTML Version
1. Go to [Netlify](https://www.netlify.com)
2. Drag and drop the `public` folder
3. Your site is live!

#### React Build Version
```bash
# Build the project
npm install
npm run build

# Drag the 'build' folder to Netlify
```

### 2. Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

### 3. GitHub Pages

1. Create a GitHub repository
2. Push your code
3. Enable GitHub Pages in Settings
4. Deploy from `gh-pages` branch:

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### 4. Traditional Web Hosting (cPanel/FTP)

#### For Standalone HTML:
1. Upload `public/standalone.html`
2. Access via: `yourdomain.com/standalone.html`

#### For React Build:
```bash
# Build the project
npm run build

# Upload contents of 'build' folder to public_html
```

### 5. Docker Container

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
EXPOSE 3000
```

Build and run:
```bash
docker build -t geo-linguistic-survey .
docker run -p 3000:3000 geo-linguistic-survey
```

### 6. AWS S3 + CloudFront

1. Build the project:
```bash
npm run build
```

2. Create S3 bucket with static website hosting
3. Upload build folder contents
4. Create CloudFront distribution
5. Point domain to CloudFront

### 7. Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize
firebase init hosting

# Deploy
npm run build
firebase deploy
```

## Environment Variables

Create `.env` file for production:
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

## Performance Optimization

### 1. Enable Compression
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Set Cache Headers
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 3. Use CDN
- CloudFlare (Free tier available)
- AWS CloudFront
- Fastly

## Security Considerations

### 1. Enable HTTPS
- Use Let's Encrypt for free SSL
- Redirect all HTTP to HTTPS

### 2. Set Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

### 3. Environment Variables
- Never commit `.env` files
- Use server environment variables
- Rotate credentials regularly

## Database Integration (Future)

### MongoDB Atlas
```javascript
// connection.js
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

### PostgreSQL
```javascript
// db.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## Monitoring

### 1. Google Analytics
Add to `public/index.html`:
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### 2. Error Tracking (Sentry)
```bash
npm install @sentry/react
```

```javascript
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
});
```

## Backup Strategy

1. **Code**: Use Git with GitHub/GitLab
2. **Data**: Regular database backups
3. **Assets**: CDN with backup origin

## Scaling Considerations

1. **Load Balancer**: For multiple server instances
2. **CDN**: For static assets
3. **Database Replication**: For high availability
4. **Caching**: Redis/Memcached for API responses

## Troubleshooting Deployment

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Memory Issues
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Port Conflicts
```bash
# Use different port
PORT=3001 npm start
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Build successful locally
- [ ] All tests passing
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Backup system in place
- [ ] Monitoring enabled
- [ ] Security headers set
- [ ] Error tracking configured
- [ ] Analytics installed

## Support

For deployment assistance:
- Email: tech.support@celts.edu.pk
- Documentation: docs/USER_GUIDE.md

---

*Last Updated: January 2025*
