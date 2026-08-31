const db = require('../config/db');


// ==========================================================
// HELPERS
// ==========================================================

const isExamOfficer = (req) => {
    return req.user?.role === 'exam_officer';
};


const isDepartmentalCoordinator = (req) => {
    return req.user?.role === 'departmental_coordinator';
};


const getUserFacultyId = (req) => {
    return req.user?.faculty_id;
};


const parseFacultyId = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return null;
    }

    const facultyId = Number(value);

    if (
        !Number.isInteger(facultyId) ||
        facultyId <= 0
    ) {
        return null;
    }

    return facultyId;
};


// ==========================================================
// GET ALL DEPARTMENTS
//
// Exam Officer:
//     Can see departments from all faculties.
//
// Departmental Coordinator:
//     Can only see departments belonging to their faculty.
// ==========================================================

const getDepartments = async (req, res) => {

    try {

        let query = `
            SELECT
                d.id,
                d.faculty_id,
                f.name AS faculty_name,
                f.short_code AS faculty_short_code,
                d.name,
                d.short_code
            FROM departments d
            INNER JOIN faculties f
                ON f.id = d.faculty_id
        `;

        const params = [];


        if (isDepartmentalCoordinator(req)) {

            const facultyId =
                getUserFacultyId(req);


            if (!facultyId) {

                return res.status(403).json({
                    success: false,
                    message:
                        'Your account is not linked to a faculty'
                });
            }


            query += `
                WHERE d.faculty_id = ?
            `;

            params.push(facultyId);
        }


        query += `
            ORDER BY
                f.name ASC,
                d.name ASC
        `;


        const [departments] =
            await db.query(
                query,
                params
            );


        return res.status(200).json({

            success: true,

            count:
                departments.length,

            departments

        });

    } catch (error) {

        console.error(
            'Get departments error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve departments'

        });
    }
};


// ==========================================================
// GET ONE DEPARTMENT
// ==========================================================

const getDepartmentById = async (req, res) => {

    try {

        const departmentId =
            req.params.id;


        const params = [
            departmentId
        ];


        let query = `
            SELECT
                d.id,
                d.faculty_id,
                f.name AS faculty_name,
                f.short_code AS faculty_short_code,
                d.name,
                d.short_code
            FROM departments d
            INNER JOIN faculties f
                ON f.id = d.faculty_id
            WHERE d.id = ?
        `;


        if (isDepartmentalCoordinator(req)) {

            const facultyId =
                getUserFacultyId(req);


            if (!facultyId) {

                return res.status(403).json({
                    success: false,
                    message:
                        'Your account is not linked to a faculty'
                });
            }


            query += `
                AND d.faculty_id = ?
            `;

            params.push(facultyId);
        }


        query += `
            LIMIT 1
        `;


        const [rows] =
            await db.query(
                query,
                params
            );


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Department not found'

            });
        }


        return res.status(200).json({

            success: true,

            department:
                rows[0]

        });

    } catch (error) {

        console.error(
            'Get department error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve department'

        });
    }
};


// ==========================================================
// CREATE DEPARTMENT
//
// Exam Officer:
//     faculty_id MUST be supplied by frontend.
//
// Departmental Coordinator:
//     faculty_id is automatically taken from their account.
// ==========================================================

const createDepartment = async (req, res) => {

    try {

        const {
            name,
            short_code,
            faculty_id
        } = req.body;


        const departmentName =
            typeof name === 'string'
                ? name.trim()
                : '';


        const departmentCode =
            typeof short_code === 'string'
                ? short_code.trim().toUpperCase()
                : '';


        // --------------------------------------------------
        // Validate name and code
        // --------------------------------------------------

        if (
            !departmentName ||
            !departmentCode
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Department name and short code are required'

            });
        }


        // --------------------------------------------------
        // Determine faculty
        // --------------------------------------------------

        let facultyId;


        if (isExamOfficer(req)) {

            facultyId =
                parseFacultyId(
                    faculty_id
                );


            if (!facultyId) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Please select a valid faculty'

                });
            }

        } else {

            facultyId =
                getUserFacultyId(req);


            if (!facultyId) {

                return res.status(403).json({

                    success: false,

                    message:
                        'Your account is not linked to a faculty'

                });
            }
        }


        // --------------------------------------------------
        // Confirm faculty exists
        // --------------------------------------------------

        const [facultyRows] =
            await db.query(
                `
                SELECT
                    id,
                    name,
                    short_code
                FROM faculties
                WHERE id = ?
                LIMIT 1
                `,
                [facultyId]
            );


        if (facultyRows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Selected faculty was not found'

            });
        }


        // --------------------------------------------------
        // Check duplicate short code
        // --------------------------------------------------

        const [existing] =
            await db.query(
                `
                SELECT
                    id
                FROM departments
                WHERE faculty_id = ?
                AND short_code = ?
                LIMIT 1
                `,
                [
                    facultyId,
                    departmentCode
                ]
            );


        if (existing.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    'Department short code already exists in this faculty'

            });
        }


        // --------------------------------------------------
        // Create department
        // --------------------------------------------------

        const [result] =
            await db.query(
                `
                INSERT INTO departments
                    (
                        faculty_id,
                        name,
                        short_code
                    )
                VALUES
                    (
                        ?,
                        ?,
                        ?
                    )
                `,
                [
                    facultyId,
                    departmentName,
                    departmentCode
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                'Department created successfully',

            department: {

                id:
                    result.insertId,

                faculty_id:
                    facultyId,

                faculty_name:
                    facultyRows[0].name,

                faculty_short_code:
                    facultyRows[0].short_code,

                name:
                    departmentName,

                short_code:
                    departmentCode

            }

        });

    } catch (error) {

        console.error(
            'Create department error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to create department'

        });
    }
};


// ==========================================================
// UPDATE DEPARTMENT
//
// Exam Officer:
//     Can change the faculty, name and short code.
//
// Departmental Coordinator:
//     Can update only within their own faculty.
// ==========================================================

const updateDepartment = async (req, res) => {

    try {

        const departmentId =
            req.params.id;


        const {
            name,
            short_code,
            faculty_id
        } = req.body;


        const departmentName =
            typeof name === 'string'
                ? name.trim()
                : '';


        const departmentCode =
            typeof short_code === 'string'
                ? short_code.trim().toUpperCase()
                : '';


        if (
            !departmentName ||
            !departmentCode
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Department name and short code are required'

            });
        }


        // --------------------------------------------------
        // Find existing department
        // --------------------------------------------------

        let findQuery = `
            SELECT
                id,
                faculty_id,
                name,
                short_code
            FROM departments
            WHERE id = ?
        `;

        const findParams = [
            departmentId
        ];


        if (isDepartmentalCoordinator(req)) {

            const userFacultyId =
                getUserFacultyId(req);


            if (!userFacultyId) {

                return res.status(403).json({

                    success: false,

                    message:
                        'Your account is not linked to a faculty'

                });
            }


            findQuery += `
                AND faculty_id = ?
            `;

            findParams.push(
                userFacultyId
            );
        }


        findQuery += `
            LIMIT 1
        `;


        const [departmentRows] =
            await db.query(
                findQuery,
                findParams
            );


        if (departmentRows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Department not found'

            });
        }


        const existingDepartment =
            departmentRows[0];


        // --------------------------------------------------
        // Determine target faculty
        // --------------------------------------------------

        let targetFacultyId;


        if (isExamOfficer(req)) {

            if (
                faculty_id === undefined ||
                faculty_id === null ||
                faculty_id === ''
            ) {

                targetFacultyId =
                    existingDepartment.faculty_id;

            } else {

                targetFacultyId =
                    parseFacultyId(
                        faculty_id
                    );
            }


            if (!targetFacultyId) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Please select a valid faculty'

                });
            }

        } else {

            targetFacultyId =
                getUserFacultyId(req);


            if (!targetFacultyId) {

                return res.status(403).json({

                    success: false,

                    message:
                        'Your account is not linked to a faculty'

                });
            }
        }


        // --------------------------------------------------
        // Confirm faculty exists
        // --------------------------------------------------

        const [facultyRows] =
            await db.query(
                `
                SELECT
                    id,
                    name,
                    short_code
                FROM faculties
                WHERE id = ?
                LIMIT 1
                `,
                [targetFacultyId]
            );


        if (facultyRows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Selected faculty was not found'

            });
        }


        // --------------------------------------------------
        // Duplicate short code check
        // --------------------------------------------------

        const [existingCode] =
            await db.query(
                `
                SELECT
                    id
                FROM departments
                WHERE faculty_id = ?
                AND short_code = ?
                AND id <> ?
                LIMIT 1
                `,
                [
                    targetFacultyId,
                    departmentCode,
                    departmentId
                ]
            );


        if (existingCode.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    'Department short code already exists in this faculty'

            });
        }


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        const [result] =
            await db.query(
                `
                UPDATE departments

                SET
                    faculty_id = ?,
                    name = ?,
                    short_code = ?

                WHERE id = ?
                `,
                [
                    targetFacultyId,
                    departmentName,
                    departmentCode,
                    departmentId
                ]
            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Department not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                'Department updated successfully',

            department: {

                id:
                    Number(departmentId),

                faculty_id:
                    targetFacultyId,

                faculty_name:
                    facultyRows[0].name,

                faculty_short_code:
                    facultyRows[0].short_code,

                name:
                    departmentName,

                short_code:
                    departmentCode

            }

        });

    } catch (error) {

        console.error(
            'Update department error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update department'

        });
    }
};


// ==========================================================
// DELETE DEPARTMENT
//
// Keeps the existing protection against deleting a
// department that has related courses, students,
// invigilators or users.
// ==========================================================

const deleteDepartment = async (req, res) => {

    try {

        const departmentId =
            req.params.id;


        let findQuery = `
            SELECT
                id,
                faculty_id,
                name,
                short_code
            FROM departments
            WHERE id = ?
        `;

        const findParams = [
            departmentId
        ];


        if (isDepartmentalCoordinator(req)) {

            const facultyId =
                getUserFacultyId(req);


            if (!facultyId) {

                return res.status(403).json({

                    success: false,

                    message:
                        'Your account is not linked to a faculty'

                });
            }


            findQuery += `
                AND faculty_id = ?
            `;

            findParams.push(
                facultyId
            );
        }


        findQuery += `
            LIMIT 1
        `;


        const [departmentRows] =
            await db.query(
                findQuery,
                findParams
            );


        if (departmentRows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Department not found'

            });
        }


        // --------------------------------------------------
        // Check related courses
        // --------------------------------------------------

        const [courseRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS total
                FROM courses
                WHERE department_id = ?
                `,
                [departmentId]
            );


        // --------------------------------------------------
        // Check related students
        // --------------------------------------------------

        const [studentRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS total
                FROM students
                WHERE department_id = ?
                `,
                [departmentId]
            );


        // --------------------------------------------------
        // Check related invigilators
        // --------------------------------------------------

        const [invigilatorRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS total
                FROM invigilators
                WHERE department_id = ?
                `,
                [departmentId]
            );


        // --------------------------------------------------
        // Check related users
        // --------------------------------------------------

        const [userRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS total
                FROM users
                WHERE department_id = ?
                `,
                [departmentId]
            );


        const dependencies = {

            courses:
                Number(
                    courseRows[0].total
                ),

            students:
                Number(
                    studentRows[0].total
                ),

            invigilators:
                Number(
                    invigilatorRows[0].total
                ),

            users:
                Number(
                    userRows[0].total
                )
        };


        const hasDependencies =
            dependencies.courses > 0 ||
            dependencies.students > 0 ||
            dependencies.invigilators > 0 ||
            dependencies.users > 0;


        if (hasDependencies) {

            return res.status(409).json({

                success: false,

                message:
                    'Department cannot be deleted because it contains related records',

                dependencies

            });
        }


        // --------------------------------------------------
        // Delete
        // --------------------------------------------------

        await db.query(
            `
            DELETE FROM departments
            WHERE id = ?
            `,
            [departmentId]
        );


        return res.status(200).json({

            success: true,

            message:
                'Department deleted successfully'

        });

    } catch (error) {

        console.error(
            'Delete department error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to delete department'

        });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getDepartments,

    getDepartmentById,

    createDepartment,

    updateDepartment,

    deleteDepartment

};