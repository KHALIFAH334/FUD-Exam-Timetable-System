const bcrypt = require('bcryptjs');
const db = require('../config/db');

// ==========================================================
// HELPERS
// ==========================================================

const getFacultyId = (req) => {
    const facultyId = Number(req.user?.faculty_id);

    return Number.isInteger(facultyId) && facultyId > 0
        ? facultyId
        : null;
};

const getUserId = (req) => {
    const userId = Number(req.params.id);

    return Number.isInteger(userId) && userId > 0
        ? userId
        : null;
};

const allowedRoles = [
    'departmental_coordinator',
    'lecturer',
    'class_representative'
];

// ==========================================================
// GET USERS IN EXAM OFFICER'S FACULTY
// ==========================================================

const getFacultyUsers = async (req, res) => {
    try {
        const facultyId = getFacultyId(req);

        if (!facultyId) {
            return res.status(403).json({
                success: false,
                message: 'Your account is not linked to a faculty'
            });
        }

        const [users] = await db.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.role,
                u.is_active,
                u.faculty_id,
                u.department_id,
                d.name AS department_name,
                d.short_code AS department_code,
                u.created_at
            FROM users u
            LEFT JOIN departments d
                ON d.id = u.department_id
                AND d.faculty_id = u.faculty_id
            WHERE u.faculty_id = ?
              AND u.role <> 'super_admin'
            ORDER BY
                u.full_name ASC
            `,
            [facultyId]
        );

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error(
            'Exam Officer get faculty users error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve faculty users'
        });
    }
};

// ==========================================================
// GET DEPARTMENTS IN OWN FACULTY
// ==========================================================

const getFacultyDepartments = async (req, res) => {
    try {
        const facultyId = getFacultyId(req);

        if (!facultyId) {
            return res.status(403).json({
                success: false,
                message: 'Your account is not linked to a faculty'
            });
        }

        const [departments] = await db.query(
            `
            SELECT
                id,
                name,
                short_code
            FROM departments
            WHERE faculty_id = ?
            ORDER BY name ASC
            `,
            [facultyId]
        );

        return res.status(200).json({
            success: true,
            count: departments.length,
            departments
        });

    } catch (error) {
        console.error(
            'Exam Officer get departments error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve faculty departments'
        });
    }
};

// ==========================================================
// CREATE USER INSIDE OWN FACULTY
// ==========================================================

const createFacultyUser = async (req, res) => {
    try {
        const facultyId = getFacultyId(req);

        if (!facultyId) {
            return res.status(403).json({
                success: false,
                message: 'Your account is not linked to a faculty'
            });
        }

        const {
            full_name,
            email,
            password,
            role,
            department_id = null
        } = req.body || {};

        const fullName =
            typeof full_name === 'string'
                ? full_name.trim()
                : '';

        const normalizedEmail =
            typeof email === 'string'
                ? email.trim().toLowerCase()
                : '';

        if (
            !fullName ||
            !normalizedEmail ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Full name, email, password and role are required'
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user role'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    'Password must contain at least 8 characters'
            });
        }

        let validDepartmentId = null;

        // ------------------------------------------------------
        // Departmental Coordinator MUST have department
        // ------------------------------------------------------

        if (role === 'departmental_coordinator') {
            if (!department_id) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Department is required for a Department Exam Officer'
                });
            }
        }

        // ------------------------------------------------------
        // Validate department belongs to own faculty
        // ------------------------------------------------------

        if (department_id) {
            const [departmentRows] = await db.query(
                `
                SELECT id
                FROM departments
                WHERE id = ?
                  AND faculty_id = ?
                LIMIT 1
                `,
                [
                    Number(department_id),
                    facultyId
                ]
            );

            if (departmentRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Selected department does not belong to your faculty'
                });
            }

            validDepartmentId =
                Number(department_id);
        }

        // ------------------------------------------------------
        // Email uniqueness
        // ------------------------------------------------------

        const [existingUsers] = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'A user with this email already exists'
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 12);

        const [result] = await db.query(
            `
            INSERT INTO users
            (
                faculty_id,
                department_id,
                full_name,
                email,
                password_hash,
                role,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, TRUE)
            `,
            [
                facultyId,
                validDepartmentId,
                fullName,
                normalizedEmail,
                passwordHash,
                role
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                'Faculty user created successfully',
            user_id: result.insertId
        });

    } catch (error) {
        console.error(
            'Exam Officer create faculty user error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to create faculty user'
        });
    }
};

// ==========================================================
// UPDATE USER IN OWN FACULTY
// ==========================================================

const updateFacultyUser = async (req, res) => {
    try {
        const facultyId = getFacultyId(req);
        const userId = getUserId(req);

        if (!facultyId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid faculty or user ID'
            });
        }

        const {
            full_name,
            email,
            role,
            department_id = null
        } = req.body || {};

        const fullName =
            typeof full_name === 'string'
                ? full_name.trim()
                : '';

        const normalizedEmail =
            typeof email === 'string'
                ? email.trim().toLowerCase()
                : '';

        if (
            !fullName ||
            !normalizedEmail ||
            !role
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Full name, email and role are required'
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user role'
            });
        }

        // ------------------------------------------------------
        // Verify target user belongs to own faculty
        // ------------------------------------------------------

        const [targetRows] = await db.query(
            `
            SELECT
                id,
                role
            FROM users
            WHERE id = ?
              AND faculty_id = ?
            LIMIT 1
            `,
            [
                userId,
                facultyId
            ]
        );

        if (targetRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'User not found in your faculty'
            });
        }

        if (
            targetRows[0].role === 'exam_officer'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Exam Officer accounts cannot be edited here'
            });
        }

        // ------------------------------------------------------
        // Validate department
        // ------------------------------------------------------

        let validDepartmentId = null;

        if (role === 'departmental_coordinator') {
            if (!department_id) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Department is required for a Department Exam Officer'
                });
            }
        }

        if (department_id) {
            const [departmentRows] =
                await db.query(
                    `
                    SELECT id
                    FROM departments
                    WHERE id = ?
                      AND faculty_id = ?
                    LIMIT 1
                    `,
                    [
                        Number(department_id),
                        facultyId
                    ]
                );

            if (departmentRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Selected department does not belong to your faculty'
                });
            }

            validDepartmentId =
                Number(department_id);
        }

        // ------------------------------------------------------
        // Email uniqueness
        // ------------------------------------------------------

        const [duplicateEmail] =
            await db.query(
                `
                SELECT id
                FROM users
                WHERE email = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    normalizedEmail,
                    userId
                ]
            );

        if (duplicateEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'Another user already uses this email'
            });
        }

        await db.query(
            `
            UPDATE users
            SET
                full_name = ?,
                email = ?,
                role = ?,
                department_id = ?
            WHERE id = ?
              AND faculty_id = ?
              AND role <> 'exam_officer'
              AND role <> 'super_admin'
            `,
            [
                fullName,
                normalizedEmail,
                role,
                validDepartmentId,
                userId,
                facultyId
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                'Faculty user updated successfully'
        });

    } catch (error) {
        console.error(
            'Exam Officer update faculty user error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update faculty user'
        });
    }
};

// ==========================================================
// ACTIVATE / DEACTIVATE USER
// ==========================================================

const setFacultyUserStatus = async (req, res) => {
    try {
        const facultyId = getFacultyId(req);
        const userId = getUserId(req);

        if (!facultyId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid faculty or user ID'
            });
        }

        const {
            is_active
        } = req.body || {};

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message:
                    'is_active must be true or false'
            });
        }

        const [rows] = await db.query(
            `
            SELECT id, role
            FROM users
            WHERE id = ?
              AND faculty_id = ?
            LIMIT 1
            `,
            [
                userId,
                facultyId
            ]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'User not found in your faculty'
            });
        }

        if (
            rows[0].role === 'exam_officer' ||
            rows[0].role === 'super_admin'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'This account cannot be managed here'
            });
        }

        await db.query(
            `
            UPDATE users
            SET is_active = ?
            WHERE id = ?
              AND faculty_id = ?
              AND role NOT IN (
                  'exam_officer',
                  'super_admin'
              )
            `,
            [
                is_active,
                userId,
                facultyId
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                is_active
                    ? 'User account activated successfully'
                    : 'User account deactivated successfully'
        });

    } catch (error) {
        console.error(
            'Exam Officer user status error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update user status'
        });
    }
};

// ==========================================================
// DELETE USER
// ==========================================================

const deleteFacultyUser = async (req, res) => {
    try {
        const facultyId = getFacultyId(req);
        const userId = getUserId(req);

        if (!facultyId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid faculty or user ID'
            });
        }

        if (
            userId === Number(req.user.id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'You cannot delete your own account'
            });
        }

        const [rows] = await db.query(
            `
            SELECT id, role
            FROM users
            WHERE id = ?
              AND faculty_id = ?
            LIMIT 1
            `,
            [
                userId,
                facultyId
            ]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'User not found in your faculty'
            });
        }

        if (
            rows[0].role === 'exam_officer' ||
            rows[0].role === 'super_admin'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'This account cannot be deleted here'
            });
        }

        await db.query(
            `
            DELETE FROM users
            WHERE id = ?
              AND faculty_id = ?
              AND role NOT IN (
                  'exam_officer',
                  'super_admin'
              )
            `,
            [
                userId,
                facultyId
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                'Faculty user removed successfully'
        });

    } catch (error) {
        console.error(
            'Exam Officer delete faculty user error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to remove faculty user'
        });
    }
};

module.exports = {
    getFacultyUsers,
    getFacultyDepartments,
    createFacultyUser,
    updateFacultyUser,
    setFacultyUserStatus,
    deleteFacultyUser
};