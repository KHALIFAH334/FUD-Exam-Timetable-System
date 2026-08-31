const db =
    require('../config/db');


// ==========================================================
// GET ALL ACADEMIC SESSIONS
// ==========================================================

const getSessions = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const [sessions] =
            await db.query(
                `SELECT
                    id,
                    faculty_id,
                    session_name,
                    semester,
                    exam_start_date,
                    exam_end_date,
                    is_active,
                    created_at

                 FROM academic_sessions

                 WHERE faculty_id = ?

                 ORDER BY
                    exam_start_date DESC`,
                [
                    facultyId
                ]
            );


        return res.status(200).json({

            success: true,

            count:
                sessions.length,

            sessions

        });


    } catch (error) {

        console.error(
            'Get sessions error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve academic sessions'

        });
    }
};


// ==========================================================
// GET ONE ACADEMIC SESSION
// ==========================================================

const getSessionById = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const sessionId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                sessionId
            ) ||
            sessionId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid academic session ID'

            });
        }


        const [rows] =
            await db.query(
                `SELECT
                    id,
                    faculty_id,
                    session_name,
                    semester,
                    exam_start_date,
                    exam_end_date,
                    is_active,
                    created_at

                 FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    sessionId,
                    facultyId
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Academic session not found'

            });
        }


        return res.status(200).json({

            success: true,

            session:
                rows[0]

        });


    } catch (error) {

        console.error(
            'Get session error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve academic session'

        });
    }
};


// ==========================================================
// CREATE ACADEMIC SESSION
// ==========================================================

const createSession = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            session_name,
            semester,
            exam_start_date,
            exam_end_date
        } = req.body;


        if (
            !session_name ||
            !semester ||
            !exam_start_date ||
            !exam_end_date
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'All academic session fields are required'

            });
        }


        if (
            ![
                'First',
                'Second'
            ].includes(
                semester
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Semester must be First or Second'

            });
        }


        if (
            new Date(
                exam_end_date
            ) <
            new Date(
                exam_start_date
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Examination end date cannot be earlier than start date'

            });
        }


        const [existing] =
            await db.query(
                `SELECT
                    id

                 FROM academic_sessions

                 WHERE faculty_id = ?
                 AND session_name = ?
                 AND semester = ?

                 LIMIT 1`,
                [
                    facultyId,

                    String(
                        session_name
                    ).trim(),

                    semester
                ]
            );


        if (
            existing.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'This academic session and semester already exists'

            });
        }


        const [result] =
            await db.query(
                `INSERT INTO academic_sessions
                (
                    faculty_id,
                    session_name,
                    semester,
                    exam_start_date,
                    exam_end_date,
                    is_active
                )

                VALUES (?, ?, ?, ?, ?, TRUE)`,
                [
                    facultyId,

                    String(
                        session_name
                    ).trim(),

                    semester,

                    exam_start_date,

                    exam_end_date
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                'Academic session created successfully',

            session: {

                id:
                    result.insertId,

                faculty_id:
                    facultyId,

                session_name:
                    String(
                        session_name
                    ).trim(),

                semester,

                exam_start_date,

                exam_end_date,

                is_active:
                    true

            }

        });


    } catch (error) {

        console.error(
            'Create session error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to create academic session'

        });
    }
};


// ==========================================================
// UPDATE ACADEMIC SESSION
// ==========================================================

const updateSession = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const sessionId =
            Number(
                req.params.id
            );


        const {
            session_name,
            semester,
            exam_start_date,
            exam_end_date,
            is_active
        } = req.body;


        if (
            !Number.isInteger(
                sessionId
            ) ||
            sessionId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid academic session ID'

            });
        }


        if (
            !session_name ||
            !semester ||
            !exam_start_date ||
            !exam_end_date
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Required session fields are missing'

            });
        }


        if (
            ![
                'First',
                'Second'
            ].includes(
                semester
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Semester must be First or Second'

            });
        }


        if (
            new Date(
                exam_end_date
            ) <
            new Date(
                exam_start_date
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Examination end date cannot be earlier than start date'

            });
        }


        const [existing] =
            await db.query(
                `SELECT
                    id

                 FROM academic_sessions

                 WHERE faculty_id = ?
                 AND session_name = ?
                 AND semester = ?
                 AND id <> ?

                 LIMIT 1`,
                [
                    facultyId,

                    String(
                        session_name
                    ).trim(),

                    semester,

                    sessionId
                ]
            );


        if (
            existing.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Another academic session with this name and semester already exists'

            });
        }


        const [result] =
            await db.query(
                `UPDATE academic_sessions

                 SET
                    session_name = ?,
                    semester = ?,
                    exam_start_date = ?,
                    exam_end_date = ?,
                    is_active = ?

                 WHERE id = ?
                 AND faculty_id = ?`,
                [
                    String(
                        session_name
                    ).trim(),

                    semester,

                    exam_start_date,

                    exam_end_date,

                    Boolean(
                        is_active
                    ),

                    sessionId,

                    facultyId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Academic session not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                'Academic session updated successfully'

        });


    } catch (error) {

        console.error(
            'Update session error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update academic session'

        });
    }
};


// ==========================================================
// DELETE ACADEMIC SESSION
// ==========================================================

const deleteSession = async (
    req,
    res
) => {

    const connection =
        await db.getConnection();


    let transactionStarted =
        false;


    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const sessionId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                sessionId
            ) ||
            sessionId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid academic session ID'

            });
        }


        await connection.beginTransaction();

        transactionStarted =
            true;


        // --------------------------------------------------
        // VERIFY OWNERSHIP
        // --------------------------------------------------

        const [sessionRows] =
            await connection.query(
                `SELECT
                    id,
                    session_name,
                    semester

                 FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1
                 FOR UPDATE`,
                [
                    sessionId,

                    facultyId
                ]
            );


        if (
            sessionRows.length === 0
        ) {

            const error =
                new Error(
                    'Academic session not found'
                );

            error.statusCode =
                404;

            throw error;
        }


        const session =
            sessionRows[0];


        // --------------------------------------------------
        // CHECK COURSES
        // --------------------------------------------------

        const [courseRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS total

                 FROM courses

                 WHERE session_id = ?`,
                [
                    sessionId
                ]
            );


        const courseCount =
            Number(
                courseRows[0].total
            );


        if (
            courseCount > 0
        ) {

            const error =
                new Error(
                    `Cannot delete this academic session because ${courseCount} course record(s) are linked to it. Remove or reassign the courses first.`
                );

            error.statusCode =
                409;

            throw error;
        }


        // --------------------------------------------------
        // CHECK TIMETABLES
        // --------------------------------------------------

        const [timetableRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS total

                 FROM timetables

                 WHERE session_id = ?`,
                [
                    sessionId
                ]
            );


        const timetableCount =
            Number(
                timetableRows[0].total
            );


        if (
            timetableCount > 0
        ) {

            const error =
                new Error(
                    `Cannot delete this academic session because ${timetableCount} timetable version(s) are linked to it. Archive or remove the timetable records first.`
                );

            error.statusCode =
                409;

            throw error;
        }


        // --------------------------------------------------
        // CHECK REGISTRATIONS THROUGH COURSES
        // --------------------------------------------------

        const [registrationRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS total

                 FROM registrations r

                 INNER JOIN courses c
                    ON r.course_id = c.id

                 WHERE c.session_id = ?`,
                [
                    sessionId
                ]
            );


        const registrationCount =
            Number(
                registrationRows[0].total
            );


        if (
            registrationCount > 0
        ) {

            const error =
                new Error(
                    `Cannot delete this academic session because ${registrationCount} student registration(s) are linked to it.`
                );

            error.statusCode =
                409;

            throw error;
        }


        // --------------------------------------------------
        // DELETE SESSION
        // --------------------------------------------------

        const [deleteResult] =
            await connection.query(
                `DELETE FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?`,
                [
                    sessionId,

                    facultyId
                ]
            );


        if (
            deleteResult.affectedRows === 0
        ) {

            const error =
                new Error(
                    'Academic session not found'
                );

            error.statusCode =
                404;

            throw error;
        }


        await connection.commit();

        transactionStarted =
            false;


        return res.status(200).json({

            success: true,

            message:
                `Academic session ${session.session_name} — ${session.semester} deleted successfully`,

            session_id:
                sessionId

        });


    } catch (error) {

        if (
            transactionStarted
        ) {

            try {

                await connection.rollback();

            } catch (
                rollbackError
            ) {

                console.error(
                    'Delete session rollback error:',
                    rollbackError.message
                );
            }
        }


        console.error(
            'Delete session error:',
            error.message
        );


        return res.status(
            error.statusCode ||
            500
        ).json({

            success: false,

            message:
                error.message ||
                'Unable to delete academic session'

        });


    } finally {

        connection.release();
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getSessions,

    getSessionById,

    createSession,

    updateSession,

    deleteSession

};