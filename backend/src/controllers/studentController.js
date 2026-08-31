const db = require('../config/db');


// ==========================================================
// GET ALL STUDENTS
// ==========================================================
const getStudents = async (req, res) => {
    try {
        const facultyId = Number(req.user.faculty_id);

        const userRole = String(req.user.role)
            .trim()
            .toLowerCase();

        const userDepartmentId = req.user.department_id
            ? Number(req.user.department_id)
            : null;

        const {
            department_id,
            level,
            is_active
        } = req.query;


        let sql = `
            SELECT
                s.id,
                s.department_id,

                d.name AS department_name,
                d.short_code AS department_code,

                s.matric_number,
                s.full_name,
                s.level,
                s.is_active,
                s.created_at

            FROM students s

            INNER JOIN departments d
                ON s.department_id = d.id

            WHERE d.faculty_id = ?
        `;

        const params = [facultyId];


        // Coordinator: own department only
        if (userRole === 'departmental_coordinator') {

            if (!userDepartmentId) {
                return res.status(403).json({
                    success: false,
                    message:
                        'No department is assigned to this coordinator'
                });
            }

            sql += `
                AND s.department_id = ?
            `;

            params.push(userDepartmentId);
        }

        else if (department_id) {

            sql += `
                AND s.department_id = ?
            `;

            params.push(Number(department_id));
        }


        if (level) {
            sql += `
                AND s.level = ?
            `;

            params.push(Number(level));
        }


        if (
            is_active === 'true' ||
            is_active === 'false'
        ) {
            sql += `
                AND s.is_active = ?
            `;

            params.push(is_active === 'true');
        }


        sql += `
            ORDER BY
                d.short_code ASC,
                s.level ASC,
                s.matric_number ASC
        `;


        const [students] =
            await db.query(sql, params);


        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {

        console.error(
            'Get students error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to retrieve students'
        });
    }
};


// ==========================================================
// GET ONE STUDENT
// ==========================================================
const getStudentById = async (req, res) => {
    try {
        const studentId = Number(req.params.id);
        const facultyId = Number(req.user.faculty_id);

        const userRole = req.user.role;
        const userDepartmentId = req.user.department_id;


        const [rows] = await db.query(
            `SELECT
                s.id,
                s.department_id,
                d.name AS department_name,
                d.short_code AS department_code,
                s.matric_number,
                s.full_name,
                s.level,
                s.is_active,
                s.created_at

             FROM students s

             INNER JOIN departments d
                ON s.department_id = d.id

             WHERE s.id = ?
             AND d.faculty_id = ?

             LIMIT 1`,
            [
                studentId,
                facultyId
            ]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }


        const student = rows[0];


        if (
            userRole === 'departmental_coordinator' &&
            Number(student.department_id) !==
                Number(userDepartmentId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You can only access students from your department'
            });
        }


        return res.status(200).json({
            success: true,
            student
        });

    } catch (error) {

        console.error(
            'Get student error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to retrieve student'
        });
    }
};


// ==========================================================
// UPLOAD / CREATE STUDENT
// ==========================================================
const createStudent = async (req, res) => {
    try {
        const facultyId = Number(req.user.faculty_id);
        const userRole = req.user.role;
        const userDepartmentId = req.user.department_id;


        let {
            department_id,
            matric_number,
            full_name,
            level
        } = req.body;


        if (
            !matric_number ||
            !full_name ||
            !level
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Matric number, full name and level are required'
            });
        }


        // Coordinator always uploads to own department
        if (userRole === 'departmental_coordinator') {

            if (!userDepartmentId) {
                return res.status(403).json({
                    success: false,
                    message:
                        'No department is assigned to this coordinator'
                });
            }

            department_id = userDepartmentId;
        }


        if (
            userRole === 'exam_officer' &&
            !department_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Department is required'
            });
        }


        if (Number(level) <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Student level must be greater than zero'
            });
        }


        const [departmentRows] =
            await db.query(
                `SELECT
                    id,
                    name,
                    short_code
                 FROM departments
                 WHERE id = ?
                 AND faculty_id = ?
                 LIMIT 1`,
                [
                    department_id,
                    facultyId
                ]
            );


        if (departmentRows.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid department'
            });
        }


        const normalizedMatric =
            matric_number.trim().toUpperCase();


        const [existing] =
            await db.query(
                `SELECT id
                 FROM students
                 WHERE matric_number = ?
                 LIMIT 1`,
                [normalizedMatric]
            );


        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'Matric number already exists'
            });
        }


        const [result] =
            await db.query(
                `INSERT INTO students
                (
                    department_id,
                    matric_number,
                    full_name,
                    level,
                    is_active
                )
                VALUES (?, ?, ?, ?, TRUE)`,
                [
                    department_id,
                    normalizedMatric,
                    full_name.trim(),
                    Number(level)
                ]
            );


        return res.status(201).json({
            success: true,
            message:
                'Student uploaded successfully',

            student: {
                id: result.insertId,
                department_id,

                department_name:
                    departmentRows[0].name,

                department_code:
                    departmentRows[0].short_code,

                matric_number:
                    normalizedMatric,

                full_name:
                    full_name.trim(),

                level:
                    Number(level),

                is_active: true
            }
        });

    } catch (error) {

        console.error(
            'Create student error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to upload student'
        });
    }
};


// ==========================================================
// UPDATE STUDENT
// ==========================================================
const updateStudent = async (req, res) => {
    try {
        const studentId = Number(req.params.id);
        const facultyId = Number(req.user.faculty_id);

        const userRole = req.user.role;
        const userDepartmentId = req.user.department_id;


        let {
            department_id,
            matric_number,
            full_name,
            level
        } = req.body;


        if (
            !matric_number ||
            !full_name ||
            !level
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Required student fields are missing'
            });
        }


        const [studentRows] =
            await db.query(
                `SELECT
                    s.id,
                    s.department_id

                 FROM students s

                 INNER JOIN departments d
                    ON s.department_id = d.id

                 WHERE s.id = ?
                 AND d.faculty_id = ?

                 LIMIT 1`,
                [
                    studentId,
                    facultyId
                ]
            );


        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Student not found'
            });
        }


        const existingStudent =
            studentRows[0];


        if (
            userRole === 'departmental_coordinator'
        ) {

            if (
                Number(existingStudent.department_id) !==
                Number(userDepartmentId)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        'You can only update students from your department'
                });
            }

            // Coordinator cannot move student
            department_id =
                userDepartmentId;
        }


        if (
            userRole === 'exam_officer' &&
            !department_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Department is required'
            });
        }


        const normalizedMatric =
            matric_number.trim().toUpperCase();


        const [duplicate] =
            await db.query(
                `SELECT id
                 FROM students
                 WHERE matric_number = ?
                 AND id <> ?
                 LIMIT 1`,
                [
                    normalizedMatric,
                    studentId
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'Matric number already exists'
            });
        }


        const [departmentRows] =
            await db.query(
                `SELECT id
                 FROM departments
                 WHERE id = ?
                 AND faculty_id = ?
                 LIMIT 1`,
                [
                    department_id,
                    facultyId
                ]
            );


        if (departmentRows.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid department'
            });
        }


        await db.query(
            `UPDATE students
             SET
                department_id = ?,
                matric_number = ?,
                full_name = ?,
                level = ?

             WHERE id = ?`,
            [
                department_id,
                normalizedMatric,
                full_name.trim(),
                Number(level),
                studentId
            ]
        );


        return res.status(200).json({
            success: true,
            message:
                'Student updated successfully'
        });

    } catch (error) {

        console.error(
            'Update student error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update student'
        });
    }
};


// ==========================================================
// ACTIVATE / DEACTIVATE STUDENT
// EXAM OFFICER ONLY
// ==========================================================
const setStudentStatus = async (req, res) => {
    try {
        const studentId = Number(req.params.id);
        const facultyId = Number(req.user.faculty_id);

        const { is_active } = req.body;


        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message:
                    'is_active must be true or false'
            });
        }


        const [result] =
            await db.query(
                `UPDATE students s

                 INNER JOIN departments d
                    ON s.department_id = d.id

                 SET s.is_active = ?

                 WHERE s.id = ?
                 AND d.faculty_id = ?`,
                [
                    is_active,
                    studentId,
                    facultyId
                ]
            );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Student not found'
            });
        }


        return res.status(200).json({
            success: true,

            message: is_active
                ? 'Student activated successfully'
                : 'Student deactivated successfully'
        });

    } catch (error) {

        console.error(
            'Student status error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update student status'
        });
    }
};


module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    setStudentStatus
};