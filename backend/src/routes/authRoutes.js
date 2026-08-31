const express = require('express');

const { login } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Login
router.post('/login', login);

// Get currently authenticated user
router.get('/me', authenticate, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});

module.exports = router;