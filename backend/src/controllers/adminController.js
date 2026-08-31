const bcrypt =
    require('bcryptjs');

const db =
    require('../config/db');


// ==========================================================
// DASHBOARD SUMMARY
// ==========================================================

const getDashboard =
    async (
        req,
        res
    ) => {

        try {

            const [
                facultyRows
            ] =
                await db.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM faculties
                    `
                );


            const [
                officerRows
            ] =
                await db.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM users
                    WHERE role = 'exam_officer'
                    `
                );


            const [
                coordinatorRows
            ] =
                await db.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM users
                    WHERE role = 'departmental_coordinator'
                    `
                );


            const [
                activeUsersRows
            ] =
                await db.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM users
                    WHERE is_active = TRUE
                    `
                );


            const [
                inactiveUsersRows
            ] =
                await db.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM users
                    WHERE is_active = FALSE
                    `
                );


            return res.status(200).json({

                success: true,

                dashboard: {

                    faculties:
                        Number(
                            facultyRows[0].total
                        ),

                    exam_officers:
                        Number(
                            officerRows[0].total
                        ),

                    departmental_coordinators:
                        Number(
                            coordinatorRows[0].total
                        ),

                    active_users:
                        Number(
                            activeUsersRows[0].total
                        ),

                    inactive_users:
                        Number(
                            inactiveUsersRows[0].total
                        )

                }

            });


        } catch (error) {

            console.error(
                'Admin dashboard error:',
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to load administrator dashboard'

            });
        }
    };


// ==========================================================
// LIST FACULTIES
// ==========================================================

const getFaculties =
    async (
        req,
        res
    ) => {

        try {

            const [
                faculties
            ] =
                await db.query(
                    `
                    SELECT
                        f.id,
                        f.name,
                        f.short_code,
                        COUNT(
                            DISTINCT u.id
                        ) AS total_users

                    FROM faculties f

                    LEFT JOIN users u
                        ON u.faculty_id = f.id

                    GROUP BY
                        f.id,
                        f.name,
                        f.short_code

                    ORDER BY
                        f.name ASC
                    `
                );


            return res.status(200).json({

                success: true,

                faculties

            });


        } catch (error) {

            console.error(
                'Admin faculties error:',
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to retrieve faculties'

            });
        }
    };


// ==========================================================
// LIST EXAM OFFICERS
// ==========================================================

const getExamOfficers =
    async (
        req,
        res
    ) => {

        try {

            const [
                officers
            ] =
                await db.query(
                    `
                    SELECT
                        u.id,
                        u.full_name,
                        u.email,
                        u.is_active,

                        u.faculty_id,

                        f.name AS faculty_name,
                        f.short_code AS faculty_code,

                        u.created_at

                    FROM users u

                    LEFT JOIN faculties f
                        ON u.faculty_id = f.id

                    WHERE u.role =
                        'exam_officer'

                    ORDER BY
                        u.full_name ASC
                    `
                );


            return res.status(200).json({

                success: true,

                count:
                    officers.length,

                exam_officers:
                    officers

            });


        } catch (error) {

            console.error(
                'Admin exam officers error:',
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to retrieve exam officers'

            });
        }
    };


// ==========================================================
// LIST DEPARTMENTAL COORDINATORS
// ==========================================================

const getDepartmentalCoordinators =
    async (
        req,
        res
    ) => {

        try {

            const [
                coordinators
            ] =
                await db.query(
                    `
                    SELECT
                        u.id,
                        u.full_name,
                        u.email,
                        u.is_active,

                        u.faculty_id,
                        u.department_id,

                        f.name AS faculty_name,
                        f.short_code AS faculty_code,

                        d.name AS department_name,
                        d.short_code AS department_code,

                        u.created_at

                    FROM users u

                    LEFT JOIN faculties f
                        ON u.faculty_id = f.id

                    LEFT JOIN departments d
                        ON u.department_id = d.id

                    WHERE u.role =
                        'departmental_coordinator'

                    ORDER BY
                        u.full_name ASC
                    `
                );


            return res.status(200).json({

                success: true,

                count:
                    coordinators.length,

                coordinators

            });


        } catch (error) {

            console.error(
                'Admin coordinators error:',
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to retrieve departmental coordinators'

            });
        }
    };


// ==========================================================
// LIST USERS
// ==========================================================

const getUsers =
    async (
        req,
        res
    ) => {

        try {

            const [
                users
            ] =
                await db.query(
                    `
                    SELECT
                        u.id,
                        u.full_name,
                        u.email,
                        u.role,
                        u.is_active,

                        u.faculty_id,
                        u.department_id,

                        f.name AS faculty_name,
                        d.name AS department_name,

                        u.created_at

                    FROM users u

                    LEFT JOIN faculties f
                        ON u.faculty_id = f.id

                    LEFT JOIN departments d
                        ON u.department_id = d.id

                    ORDER BY
                        u.created_at DESC
                    `
                );


            return res.status(200).json({

                success: true,

                count:
                    users.length,

                users

            });


        } catch (error) {

            console.error(
                'Admin users error:',
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to retrieve users'

            });
        }
    };


// ==========================================================
// CREATE MANAGED USER
// ==========================================================

const createUser =
    async (
        req,
        res
    ) => {

        try {

            const {

                full_name,

                email,

                password,

                role,

                faculty_id,

                department_id

            } =
                req.body || {};


            const allowedRoles = [

                'exam_officer',

                'departmental_coordinator',

                'class_representative',

                'lecturer'

            ];


            if (
                !full_name ||
                !email ||
                !password ||
                !role
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Full name, email, password and role are required'

                });
            }


            if (
                !allowedRoles.includes(
                    role
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Invalid managed-user role'

                });
            }


            if (
                password.length < 8
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Password must contain at least 8 characters'

                });
            }


            if (
                !faculty_id
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Faculty is required'

                });
            }


            const [
                facultyRows
            ] =
                await db.query(
                    `
                    SELECT
                        id
                    FROM faculties
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        Number(
                            faculty_id
                        )
                    ]
                );


            if (
                facultyRows.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Invalid faculty'

                });
            }


            let validDepartmentId =
                null;


            if (
                role ===
                'departmental_coordinator'
            ) {

                if (
                    !department_id
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            'Department is required for a departmental coordinator'

                    });
                }


                const [
                    departmentRows
                ] =
                    await db.query(
                        `
                        SELECT
                            id
                        FROM departments
                        WHERE id = ?
                        AND faculty_id = ?
                        LIMIT 1
                        `,
                        [

                            Number(
                                department_id
                            ),

                            Number(
                                faculty_id
                            )

                        ]
                    );


                if (
                    departmentRows.length === 0
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            'Selected department does not belong to the selected faculty'

                    });
                }


                validDepartmentId =
                    Number(
                        department_id
                    );
            }


            const [
                existing
            ] =
                await db.query(
                    `
                    SELECT
                        id
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                    `,
                    [
                        email
                    ]
                );


            if (
                existing.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        'A user with this email already exists'

                });
            }


            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            const [
                result
            ] =
                await db.query(
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

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        TRUE
                    )
                    `,
                    [

                        Number(
                            faculty_id
                        ),

                        validDepartmentId,

                        full_name.trim(),

                        email.toLowerCase().trim(),

                        passwordHash,

                        role

                    ]
                );


            return res.status(201).json({

                success: true,

                message:
                    'User account created successfully',

                user_id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                'Admin create user error:',
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to create user account'

            });
        }
    };


// ==========================================================
// ACTIVATE / DEACTIVATE USER
// ==========================================================

const setUserStatus =
    async (
        req,
        res
    ) => {

        try {

            const userId =
                Number(
                    req.params.id
                );


            const {
                is_active
            } =
                req.body || {};


            if (
                typeof is_active !==
                'boolean'
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'is_active must be true or false'

                });
            }


            if (
                userId ===
                Number(
                    req.user.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'You cannot deactivate your own administrator account'

                });
            }


            const [
                result
            ] =
                await db.query(
                    `
                    UPDATE users

                    SET
                        is_active = ?

                    WHERE id = ?
                    AND role <> 'super_admin'
                    `,
                    [

                        is_active,

                        userId

                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Managed user not found'

                });
            }


            return res.status(200).json({

                success: true,

                message:
                    is_active
                        ? 'User account activated successfully'
                        : 'User account deactivated successfully'

            });


        } catch (error) {

            console.error(
                'Admin user status error:',
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
// EXPORTS
// ==========================================================

// ==========================================================
// UPDATE USER
// ==========================================================

const updateUser = async (
    req,
    res
) => {

    try {

        const userId =
            Number(req.params.id);

        const {
            full_name,
            email,
            role,
            faculty_id,
            department_id
        } = req.body || {};


        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }


        if (
            !full_name ||
            !email ||
            !role ||
            !faculty_id
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Full name, email, role and faculty are required'
            });
        }


        const allowedRoles = [
            'exam_officer',
            'departmental_coordinator',
            'lecturer',
            'class_representative'
        ];


        if (
            !allowedRoles.includes(role)
        ) {

            return res.status(400).json({
                success: false,
                message: 'Invalid user role'
            });
        }


        // --------------------------------------------------
        // CHECK USER
        // --------------------------------------------------

        const [
            userRows
        ] = await db.query(
            `
            SELECT
                id,
                role
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (
            userRows.length === 0
        ) {

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }


        if (
            userRows[0].role ===
            'super_admin'
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Super Admin accounts cannot be edited here'
            });
        }


        // --------------------------------------------------
        // CHECK EMAIL
        // --------------------------------------------------

        const [
            duplicateEmail
        ] = await db.query(
            `
            SELECT
                id
            FROM users
            WHERE email = ?
            AND id <> ?
            LIMIT 1
            `,
            [
                email.trim().toLowerCase(),
                userId
            ]
        );


        if (
            duplicateEmail.length > 0
        ) {

            return res.status(409).json({
                success: false,
                message:
                    'Another user already uses this email'
            });
        }


        // --------------------------------------------------
        // CHECK FACULTY
        // --------------------------------------------------

        const [
            facultyRows
        ] = await db.query(
            `
            SELECT
                id,
                name,
                short_code
            FROM faculties
            WHERE id = ?
            LIMIT 1
            `,
            [
                Number(faculty_id)
            ]
        );


        if (
            facultyRows.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: 'Invalid faculty'
            });
        }


        let validDepartmentId = null;


        // --------------------------------------------------
        // DEPARTMENTAL COORDINATOR
        // --------------------------------------------------

        if (
            role ===
            'departmental_coordinator'
        ) {

            if (
                !department_id
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Department is required for a departmental coordinator'
                });
            }


            const [
                departmentRows
            ] = await db.query(
                `
                SELECT
                    id,
                    name,
                    short_code
                FROM departments
                WHERE id = ?
                AND faculty_id = ?
                LIMIT 1
                `,
                [
                    Number(department_id),
                    Number(faculty_id)
                ]
            );


            if (
                departmentRows.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Selected department does not belong to the selected faculty'
                });
            }


            validDepartmentId =
                Number(
                    department_id
                );
        }


        // --------------------------------------------------
        // UPDATE
        // --------------------------------------------------

        const [
            result
        ] = await db.query(
            `
            UPDATE users

            SET
                full_name = ?,
                email = ?,
                role = ?,
                faculty_id = ?,
                department_id = ?

            WHERE id = ?
            AND role <> 'super_admin'
            `,
            [
                full_name.trim(),

                email
                    .trim()
                    .toLowerCase(),

                role,

                Number(
                    faculty_id
                ),

                validDepartmentId,

                userId
            ]
        );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({
                success: false,
                message:
                    'User could not be updated'
            });
        }


        return res.status(200).json({

            success: true,

            message:
                'User account updated successfully'

        });


    } catch (error) {

        console.error(
            'Admin update user error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update user account'

        });
    }
};


// ==========================================================
// DELETE USER
// ==========================================================

const deleteUser = async (
    req,
    res
) => {

    try {

        const userId =
            Number(req.params.id);


        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid user ID'

            });
        }


        if (
            userId ===
            Number(req.user.id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'You cannot remove your own administrator account'

            });
        }


        const [
            userRows
        ] = await db.query(
            `
            SELECT
                id,
                full_name,
                role
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [
                userId
            ]
        );


        if (
            userRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'User not found'

            });
        }


        if (
            userRows[0].role ===
            'super_admin'
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'Super Admin accounts cannot be removed'

            });
        }


        const [
            result
        ] = await db.query(
            `
            DELETE FROM users

            WHERE id = ?

            AND role <> 'super_admin'
            `,
            [
                userId
            ]
        );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'User could not be removed'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                'User account removed successfully'

        });


    } catch (error) {

        console.error(
            'Admin delete user error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to remove user account'

        });
    }
};

module.exports = {

    getDashboard,

    getFaculties,

    getExamOfficers,

    getDepartmentalCoordinators,

    getUsers,

    createUser,

    updateUser,

    setUserStatus,

    deleteUser

};