// Force IPv4 first for Node.js 17+ (fixes MongoDB Atlas DNS resolution)
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using defaults');
}

// Import services and models for scheduled tasks
const smsService = require('./services/smsService');
const Patient = require('./models/Patient');

const app = express();

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room based on role (doctor or assistant)
  socket.on('join', (role) => {
    socket.join(role);
    console.log(`Socket ${socket.id} joined room: ${role}`);
  });

  // Handle new appointment notification from assistant
  socket.on('new_appointment', (data) => {
    console.log('New appointment event:', data);
    // Broadcast to all doctors
    io.to('doctor').emit('appointment_alert', data);
  });

  // Handle appointment update (check-in with S/O)
  socket.on('appointment_updated', (data) => {
    console.log('Appointment updated:', data);
    // Broadcast to all doctors
    io.to('doctor').emit('appointment_alert', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for sync payloads

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

async function connectMongoDB() {
  if (!MONGODB_URI) {
    console.log('⚠ No MONGODB_URI found - using in-memory fake data');
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      // Connection options for Atlas
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ Connected to MongoDB Atlas');
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    console.log('⚠ Falling back to in-memory fake data');
    return false;
  }
}

// Make connection status available to routes
app.use((req, res, next) => {
  req.isMongoConnected = isMongoConnected;
  next();
});

// Serve uploaded files (for local storage mode)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/patients', require('./routes/patients'));
app.use('/api/import', require('./routes/import'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/queue', require('./routes/queue'));

// Health check with DB status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: isMongoConnected ? 'MongoDB Atlas' : 'In-Memory',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React build (production)
app.use(express.static(path.join(__dirname, '../dist')));

// Handle client-side routing - serve index.html for non-API routes
// Express 5 requires named parameter syntax for wildcards
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Start server after MongoDB connection attempt
const PORT = process.env.PORT || 3001;

connectMongoDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ WebSocket server ready`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);

    // Set up scheduled SMS reminders (only if MongoDB is connected)
    if (isMongoConnected) {
      // Both reminders run at 7:00 AM Manila time
      // Cron format: minute hour day month weekday
      cron.schedule('0 7 * * *', async () => {
        console.log('Running scheduled SMS reminder jobs at 7:00 AM Manila...');
        try {
          // Send 3-day advance reminders
          const result3day = await smsService.sendScheduledReminders(Patient, '3day');
          console.log('3-day reminder results:', result3day);

          // Send same-day reminders
          const resultSameday = await smsService.sendScheduledReminders(Patient, 'sameday');
          console.log('Same-day reminder results:', resultSameday);
        } catch (error) {
          console.error('SMS reminder job failed:', error);
        }
      }, {
        timezone: 'Asia/Manila'
      });

      console.log('✓ SMS reminder cron job scheduled (7:00 AM Manila time daily)');
      console.log('  - 3-day advance reminder');
      console.log('  - Same-day reminder');
    }
  });
});
