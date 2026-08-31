const db = require('../config/db');

const allowedTypes = [
    'regular',
    'carry_over',
    'spill_over'
];


// ==========================================================
// GET REGISTRATIONS
// ==========================================================
const getRegistrations = async (req, res) => {
    try {
        const facultyId = Number(req.user.faculty_id);

        const userRole = String(req.user.role)
            .trim()
            .toLowerCase();

        const userDepartmentId = req.user.department_id
            ? Number(req.user.department_id)
            : null;

        const {
            student_id,
            course_id,
            session_id,
            registration_type
        } = req.query;


        let sql = `
            SELECT
                r.id,

                r.student_id,
                st.matric_number,
                st.full_name AS student_name,

                st.department_id AS student_department_id,
                sd.short_code AS student_department_code,

                r.course_id,
                c.course_code,
                c.course_title,

                c.department_id AS course_department_id,
                cd.short_code AS course_department_code,

                c.session_id,
                a.session_name,
                a.semester,

                r.registration_type,
                r.created_at

            FROM student_course_registrations r

            INNER JOIN students st
                ON r.student_id = st.id

            INNER JOIN departments sd
                ON st.department_id = sd.id

            INNER JOIN courses c
                ON r.course_id = c.id

            INNER JOIN departments cd
                ON c.department_id = cd.id

            INNER JOIN academic_sessions a
                ON c.session_id = a.id

            WHERE sd.faculty_id = ?
              AND a.faculty_id = ?
        `;


        const params = [
            facultyId,
            facultyId
        ];


        // Department Coordinator:
        // registrations belonging to own students only
        if (userRole === 'departmental_coordinator') {

            if (!userDepartmentId) {
                return res.status(403).json({
                    success: false,
                    message:
                        'No department is assigned to this coordinator'
                });
            }

            sql += `
                AND st.department_id = ?
            `;

            params.push(userDepartmentId);
        }


        if (student_id) {
            sql += ` AND r.student_id = ?`;
            params.push(Number(student_id));
        }


        if (course_id) {
            sql += ` AND r.course_id = ?`;
            params.push(Number(course_id));
        }


        if (session_id) {
            sql += ` AND c.session_id = ?`;
            params.push(Number(session_id));
        }


        if (registration_type) {

            if (!allowedTypes.includes(registration_type)) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Invalid registration type'
                });
            }

            sql += `
                AND r.registration_type = ?
            `;

            params.push(registration_type);
        }


        sql += `
            ORDER BY
                a.session_name DESC,
                a.semester ASC,
                st.matric_number ASC,
                c.course_code ASC
        `;


        const [registrations] =
            await db.query(sql, params);


        return res.status(200).json({
            success: true,
            count: registrations.length,
            registrations
        });

    } catch (error) {

        console.error(
            'Get registrations error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to retrieve registrations'
        });
    }
};


// ==========================================================
// CREATE REGISTRATION
// ==========================================================
const createRegistration = async (req, res) => {
    try {
        const facultyId = Number(req.user.faculty_id);

        const userRole = String(req.user.role)
            .trim()
            .toLowerCase();

        const userDepartmentId = req.user.department_id
            ? Number(req.user.department_id)
            : null;


        const {
            student_id,
            course_id,
            registration_type = 'regular'
        } = req.body;


        if (!student_id || !course_id) {
            return res.status(400).json({
                success: false,
                message:
                    'Student and course are required'
            });
        }


        if (!allowedTypes.includes(registration_type)) {
            return res.status(400).json({
                success: false,
                message:
                    'Registration type must be regular, carry_over or spill_over'
            });
        }


        // --------------------------------------------------
        // Validate student
        // --------------------------------------------------

        const [studentRows] =
            await db.query(
                `SELECT
                    st.id,
                    st.department_id,
                    st.matric_number,
                    st.full_name,
                    st.is_active

                 FROM students st

                 INNER JOIN departments d
                    ON st.department_id = d.id

                 WHERE st.id = ?
                 AND d.faculty_id = ?

                 LIMIT 1`,
                [
                    Number(student_id),
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


        const student =
            studentRows[0];


        if (!student.is_active) {
            return res.status(400).json({
                success: false,
                message:
                    'Inactive student cannot be registered'
            });
        }


        // Coordinator manages own students only
        if (
            userRole === 'departmental_coordinator' &&
            Number(student.department_id) !==
                userDepartmentId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You can only manage registrations for students in your department'
            });
        }


        // --------------------------------------------------
        // Validate course
        // --------------------------------------------------

        const [courseRows] =
            await db.query(
                `SELECT
                    c.id,
                    c.department_id,
                    c.course_code,
                    c.course_title,
                    c.session_id,
                    c.is_active,

                    a.session_name,
                    a.semester

                 FROM courses c

                 INNER JOIN departments d
                    ON c.department_id = d.id

                 INNER JOIN academic_sessions a
                    ON c.session_id = a.id

                 WHERE c.id = ?
                 AND d.faculty_id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    Number(course_id),
                    facultyId,
                    facultyId
                ]
            );


        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Course not found'
            });
        }


        const course =
            courseRows[0];


        if (!course.is_active) {
            return res.status(400).json({
                success: false,
                message:
                    'Inactive course cannot receive registrations'
            });
        }


        // --------------------------------------------------
        // Duplicate prevention
        // --------------------------------------------------

        const [duplicate] =
            await db.query(
                `SELECT id

                 FROM student_course_registrations

                 WHERE student_id = ?
                 AND course_id = ?

                 LIMIT 1`,
                [
                    Number(student_id),
                    Number(course_id)
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'Student is already registered for this course'
            });
        }


        // --------------------------------------------------
        // Create registration
        // --------------------------------------------------

        const [result] =
            await db.query(
                `INSERT INTO student_course_registrations
                (
                    student_id,
                    course_id,
                    registration_type
                )
                VALUES (?, ?, ?)`,
                [
                    Number(student_id),
                    Number(course_id),
                    registration_type
                ]
            );


        return res.status(201).json({
            success: true,
            message:
                'Course registration created successfully',

            registration: {
                id: result.insertId,

                student_id:
                    Number(student_id),

                matric_number:
                    student.matric_number,

                course_id:
                    Number(course_id),

                course_code:
                    course.course_code,

                session_id:
                    course.session_id,

                session_name:
                    course.session_name,

                semester:
                    course.semester,

                registration_type
            }
        });

    } catch (error) {

        console.error(
            'Create registration error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to create course registration'
        });
    }
};


// ==========================================================
// UPDATE REGISTRATION
// ==========================================================
const updateRegistration = async (req, res) => {
    try {
        const registrationId =
            Number(req.params.id);

        const facultyId =
            Number(req.user.faculty_id);

        const userRole =
            String(req.user.role)
                .trim()
                .toLowerCase();

        const userDepartmentId =
            req.user.department_id
                ? Number(req.user.department_id)
                : null;


        const {
            course_id,
            registration_type
        } = req.body;


        if (!course_id || !registration_type) {
            return res.status(400).json({
                success: false,
                message:
                    'Course and registration type are required'
            });
        }


        if (!allowedTypes.includes(registration_type)) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid registration type'
            });
        }


        // Get existing registration
        const [registrationRows] =
            await db.query(
                `SELECT
                    r.id,
                    r.student_id,
                    st.department_id

                 FROM student_course_registrations r

                 INNER JOIN students st
                    ON r.student_id = st.id

                 INNER JOIN departments d
                    ON st.department_id = d.id

                 WHERE r.id = ?
                 AND d.faculty_id = ?

                 LIMIT 1`,
                [
                    registrationId,
                    facultyId
                ]
            );


        if (registrationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Registration not found'
            });
        }


        const registration =
            registrationRows[0];


        // Coordinator: own students only
        if (
            userRole === 'departmental_coordinator' &&
            Number(registration.department_id) !==
                userDepartmentId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You can only update registrations for students in your department'
            });
        }


        // Validate new course
        const [courseRows] =
            await db.query(
                `SELECT
                    c.id,
                    c.is_active

                 FROM courses c

                 INNER JOIN departments d
                    ON c.department_id = d.id

                 INNER JOIN academic_sessions a
                    ON c.session_id = a.id

                 WHERE c.id = ?
                 AND d.faculty_id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    Number(course_id),
                    facultyId,
                    facultyId
                ]
            );


        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Course not found'
            });
        }


        if (!courseRows[0].is_active) {
            return res.status(400).json({
                success: false,
                message:
                    'Inactive course cannot receive registrations'
            });
        }


        // Duplicate protection
        const [duplicate] =
            await db.query(
                `SELECT id

                 FROM student_course_registrations

                 WHERE student_id = ?
                 AND course_id = ?
                 AND id <> ?

                 LIMIT 1`,
                [
                    registration.student_id,
                    Number(course_id),
                    registrationId
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'Student is already registered for this course'
            });
        }


        await db.query(
            `UPDATE student_course_registrations

             SET
                course_id = ?,
                registration_type = ?

             WHERE id = ?`,
            [
                Number(course_id),
                registration_type,
                registrationId
            ]
        );


        return res.status(200).json({
            success: true,
            message:
                'Course registration updated successfully'
        });

    } catch (error) {

        console.error(
            'Update registration error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update course registration'
        });
    }
};


module.exports = {
    getRegistrations,
    createRegistration,
    updateRegistration
};