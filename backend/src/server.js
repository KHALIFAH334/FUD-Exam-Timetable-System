const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const courseRoutes = require('./routes/courseRoutes');
const studentRoutes = require('./routes/studentRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const conflictRoutes = require('./routes/conflictRoutes');
const venueRoutes = require('./routes/venueRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const blackoutRoutes = require('./routes/blackoutRoutes');
const invigilatorRoutes = require('./routes/invigilatorRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const timetableFeedbackRoutes = require('./routes/timetableFeedbackRoutes');
const timetableFeedbackReviewRoutes = require('./routes/timetableFeedbackReviewRoutes');
const feedbackTrackingRoutes = require('./routes/feedbackTrackingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/blackout-dates', blackoutRoutes);
app.use('/api/invigilators', invigilatorRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/timetable-feedback/track', feedbackTrackingRoutes);
app.use('/api/timetable-feedback', timetableFeedbackRoutes);
app.use('/api/timetable-feedback/submissions', timetableFeedbackReviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'FUD Examination Timetable API is running'
    });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS database_name'
        );

        res.status(200).json({
            success: true,
            message: 'Database connection successful',
            database: rows[0].database_name
        });
    } catch (error) {
        console.error('Database connection error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});


// Server port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
