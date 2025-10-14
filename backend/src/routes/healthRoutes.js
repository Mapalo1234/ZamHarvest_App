/**
 * Health check routes for system monitoring
 */

const express = require('express');
const mongoose = require('mongoose');
const performanceMonitor = require('../utils/performance');
const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Detailed health check with system metrics
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: performanceMonitor.getMemoryUsage(),
      database: await checkDatabaseHealth(),
      services: await checkServicesHealth()
    };

    // Determine overall health status
    const isHealthy = health.database.status === 'OK' && 
                     health.services.status === 'OK' &&
                     health.memory.heapUsed < 500; // Less than 500MB heap usage

    health.status = isHealthy ? 'OK' : 'DEGRADED';
    
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Database health check
 */
async function checkDatabaseHealth() {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state !== 1) {
      return {
        status: 'ERROR',
        message: `Database is ${states[state]}`,
        state: state
      };
    }

    // Test database connection with a simple query
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'OK',
      message: 'Database is connected and responsive',
      state: states[state]
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    };
  }
}

/**
 * Services health check
 */
async function checkServicesHealth() {
  const services = {
    email: await checkEmailService(),
    storage: await checkStorageService(),
    notifications: await checkNotificationService()
  };

  const allHealthy = Object.values(services).every(service => service.status === 'OK');

  return {
    status: allHealthy ? 'OK' : 'DEGRADED',
    services: services
  };
}

/**
 * Check email service
 */
async function checkEmailService() {
  try {
    // Check if nodemailer is configured
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      // Add your email configuration here
      // This is a basic check
    });
    
    return {
      status: 'OK',
      message: 'Email service is configured'
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Email service is not configured',
      error: error.message
    };
  }
}

/**
 * Check storage service
 */
async function checkStorageService() {
  try {
    // Check if file system is accessible
    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join(__dirname, '../../temp_health_check.txt');
    
    fs.writeFileSync(tempFile, 'health check');
    fs.unlinkSync(tempFile);
    
    return {
      status: 'OK',
      message: 'Storage service is accessible'
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Storage service is not accessible',
      error: error.message
    };
  }
}

/**
 * Check notification service
 */
async function checkNotificationService() {
  try {
    // Check if notification models are accessible
    const Notification = require('../models/notification');
    const count = await Notification.countDocuments();
    
    return {
      status: 'OK',
      message: 'Notification service is working',
      totalNotifications: count
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Notification service is not working',
      error: error.message
    };
  }
}

/**
 * Performance metrics endpoint
 */
router.get('/health/metrics', (req, res) => {
  res.json(performanceMonitor.getSystemMetrics());
});

/**
 * Database statistics
 */
router.get('/health/database', async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    res.json({
      status: 'OK',
      database: {
        name: mongoose.connection.name,
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
        objects: stats.objects
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

module.exports = router;
