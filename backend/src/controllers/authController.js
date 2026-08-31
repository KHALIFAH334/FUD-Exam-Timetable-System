const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// LOGIN USER
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const [users] = await db.query(
            `SELECT
                id,
                faculty_id,
                department_id,
                full_name,
                email,
                password_hash,
                role,
                is_active
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'This account is inactive'
            });
        }

        // Verify password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                faculty_id: user.faculty_id,
                department_id: user.department_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '8h'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                faculty_id: user.faculty_id,
                department_id: user.department_id
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

module.exports = {
    login
};