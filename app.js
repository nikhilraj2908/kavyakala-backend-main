const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const poetRoutes = require('./routes/poetRoutes');
const writingRoutes = require('./routes/writingRoutes');
const noticeRoutes = require('./routes/noticeRoutes');

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: false // using Bearer tokens
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.use('/api', authRoutes);
 app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/poets', poetRoutes);
app.use('/api/writings', writingRoutes);
app.use('/api/notices', noticeRoutes);

module.exports = app;
