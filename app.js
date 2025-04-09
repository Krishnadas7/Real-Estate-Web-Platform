import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'

const app = express()

// Enable express parser for parsing JSON request bodies
app.use(express.json({ 
    limit: "50mb",
    verify: (req, res, buf) => { req.rawBody = buf } // Store raw body for webhooks
  }));

  // Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    crossOriginOpenerPolicy: process.env.NODE_ENV === 'production'
  }));

  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));  

  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      skip: function (req, res) {
        return res.statusCode === 304 || req.path === '/health'; // Skip logging for 304 responses and health checks
      },
    })
  );

 // Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

// 404 handler for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ 
      status: 'error',
      message: 'Route not found'
    });
  });  

export {app} 
  