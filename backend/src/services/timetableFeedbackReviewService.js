const db = require('../config/db');


// ==========================================================
// VALID STATUSES
// ==========================================================
const VALID_STATUSES = [
    'open',
    'under_review',
    'resolved',
    'rejected'
];


const VALID_CATEGORIES = [
    'exam_clash',
    'exam_date',
    'exam_time',
    'venue',
    'missing_course',
    'wrong_course',
    'student_conflict',
    'other'
];


// ==========================================================
// GET FEEDBACK SUBMISSIONS
// ==========================================================
const getFeedbackSubmissions = async (
    facultyId,
    filters = {}
) => {

    let sql = `
        SELECT
            f.id,

            CONCAT(
                'FB-',
                LPAD(f.id, 6, '0')
            ) AS reference,

            f.feedback_link_id,
            f.timetable_id,

            t.title AS timetable_title,
            t.version_number,

            a.session_name,
            a.semester,

            f.department_id,
            d.name AS department_name,
            d.short_code AS department_code,

            f.course_id,
            c.course_code,
            c.course_title,

            f.level,

            f.submitter_name,
            f.submitter_role,
            f.category,
            f.comment,

            f.status,
            f.officer_response,

            f.reviewed_by,

            reviewer.full_name
                AS reviewed_by_name,

            DATE_FORMAT(
                f.reviewed_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS reviewed_at,

            DATE_FORMAT(
                f.created_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS created_at,

            DATE_FORMAT(
                f.updated_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS updated_at

        FROM timetable_feedback f

        INNER JOIN timetables t
            ON f.timetable_id = t.id

        INNER JOIN academic_sessions a
            ON t.session_id = a.id

        INNER JOIN departments d
            ON f.department_id = d.id

        LEFT JOIN courses c
            ON f.course_id = c.id

        LEFT JOIN users reviewer
            ON f.reviewed_by = reviewer.id

        WHERE a.faculty_id = ?
    `;


    const params = [
        Number(facultyId)
    ];


    // ------------------------------------------------------
    // OPTIONAL FILTERS
    // ------------------------------------------------------

    if (filters.timetable_id) {

        sql += `
            AND f.timetable_id = ?
        `;

        params.push(
            Number(filters.timetable_id)
        );
    }


    if (filters.department_id) {

        sql += `
            AND f.department_id = ?
        `;

        params.push(
            Number(filters.department_id)
        );
    }


    if (filters.course_id) {

        sql += `
            AND f.course_id = ?
        `;

        params.push(
            Number(filters.course_id)
        );
    }


    if (filters.level) {

        sql += `
            AND f.level = ?
        `;

        params.push(
            Number(filters.level)
        );
    }


    if (filters.status) {

        sql += `
            AND f.status = ?
        `;

        params.push(
            String(filters.status)
                .trim()
                .toLowerCase()
        );
    }


    if (filters.category) {

        sql += `
            AND f.category = ?
        `;

        params.push(
            String(filters.category)
                .trim()
                .toLowerCase()
        );
    }


    sql += `
        ORDER BY
            CASE f.status
                WHEN 'open' THEN 1
                WHEN 'under_review' THEN 2
                WHEN 'resolved' THEN 3
                WHEN 'rejected' THEN 4
                ELSE 5
            END,

            f.created_at DESC,
            f.id DESC
    `;


    const [rows] =
        await db.query(
            sql,
            params
        );


    // ------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------

    const summary = {

        total:
            rows.length,

        open:
            rows.filter(
                row =>
                    row.status === 'open'
            ).length,

        under_review:
            rows.filter(
                row =>
                    row.status ===
                    'under_review'
            ).length,

        resolved:
            rows.filter(
                row =>
                    row.status ===
                    'resolved'
            ).length,

        rejected:
            rows.filter(
                row =>
                    row.status ===
                    'rejected'
            ).length
    };


    return {

        summary,

        submissions:
            rows.map(
                row => ({

                    ...row,

                    id:
                        Number(row.id),

                    feedback_link_id:
                        Number(
                            row.feedback_link_id
                        ),

                    timetable_id:
                        Number(
                            row.timetable_id
                        ),

                    version_number:
                        Number(
                            row.version_number
                        ),

                    department_id:
                        Number(
                            row.department_id
                        ),

                    course_id:
                        row.course_id === null
                            ? null
                            : Number(
                                row.course_id
                            ),

                    level:
                        Number(
                            row.level
                        ),

                    reviewed_by:
                        row.reviewed_by === null
                            ? null
                            : Number(
                                row.reviewed_by
                            )
                })
            )
    };
};


// ==========================================================
// GET ONE FEEDBACK SUBMISSION
// ==========================================================
const getFeedbackSubmissionById = async (
    feedbackId,
    facultyId
) => {

    const [rows] =
        await db.query(
            `SELECT
                f.id,

                CONCAT(
                    'FB-',
                    LPAD(f.id, 6, '0')
                ) AS reference,

                f.feedback_link_id,
                f.timetable_id,

                t.title AS timetable_title,
                t.version_number,

                a.session_name,
                a.semester,

                f.department_id,
                d.name AS department_name,
                d.short_code AS department_code,

                f.course_id,
                c.course_code,
                c.course_title,

                f.level,

                f.submitter_name,
                f.submitter_role,

                f.category,
                f.comment,

                f.status,
                f.officer_response,

                f.reviewed_by,

                reviewer.full_name
                    AS reviewed_by_name,

                DATE_FORMAT(
                    f.reviewed_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS reviewed_at,

                DATE_FORMAT(
                    f.created_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS created_at,

                DATE_FORMAT(
                    f.updated_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS updated_at

             FROM timetable_feedback f

             INNER JOIN timetables t
                ON f.timetable_id = t.id

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             INNER JOIN departments d
                ON f.department_id = d.id

             LEFT JOIN courses c
                ON f.course_id = c.id

             LEFT JOIN users reviewer
                ON f.reviewed_by = reviewer.id

             WHERE f.id = ?
             AND a.faculty_id = ?

             LIMIT 1`,
            [
                Number(feedbackId),
                Number(facultyId)
            ]
        );


    if (rows.length === 0) {

        const error =
            new Error(
                'Feedback submission not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const row =
        rows[0];


    return {

        ...row,

        id:
            Number(row.id),

        feedback_link_id:
            Number(
                row.feedback_link_id
            ),

        timetable_id:
            Number(
                row.timetable_id
            ),

        version_number:
            Number(
                row.version_number
            ),

        department_id:
            Number(
                row.department_id
            ),

        course_id:
            row.course_id === null
                ? null
                : Number(
                    row.course_id
                ),

        level:
            Number(
                row.level
            ),

        reviewed_by:
            row.reviewed_by === null
                ? null
                : Number(
                    row.reviewed_by
                )
    };
};


// ==========================================================
// REVIEW / UPDATE FEEDBACK
// ==========================================================
const updateFeedbackSubmission = async (
    feedbackId,
    facultyId,
    reviewerId,
    status,
    officerResponse = null
) => {

    const normalizedStatus =
        String(status || '')
            .trim()
            .toLowerCase();


    if (
        !VALID_STATUSES.includes(
            normalizedStatus
        )
    ) {

        const error =
            new Error(
                'Invalid feedback status'
            );

        error.statusCode = 400;

        throw error;
    }


    let response =
        officerResponse === null ||
        officerResponse === undefined
            ? null
            : String(
                officerResponse
            ).trim();


    if (
        response !== null &&
        response.length > 5000
    ) {

        const error =
            new Error(
                'Officer response must not exceed 5000 characters'
            );

        error.statusCode = 400;

        throw error;
    }


    if (
        response === ''
    ) {

        response = null;
    }


    // ------------------------------------------------------
    // VERIFY FEEDBACK BELONGS TO OFFICER'S FACULTY
    // ------------------------------------------------------

    const [rows] =
        await db.query(
            `SELECT
                f.id,
                f.status,
                f.timetable_id

             FROM timetable_feedback f

             INNER JOIN timetables t
                ON f.timetable_id = t.id

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             WHERE f.id = ?
             AND a.faculty_id = ?

             LIMIT 1`,
            [
                Number(feedbackId),
                Number(facultyId)
            ]
        );


    if (rows.length === 0) {

        const error =
            new Error(
                'Feedback submission not found'
            );

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------------------------
    // RESOLVED / REJECTED SHOULD INCLUDE RESPONSE
    // ------------------------------------------------------

    if (
        (
            normalizedStatus ===
            'resolved' ||

            normalizedStatus ===
            'rejected'
        ) &&
        !response
    ) {

        const error =
            new Error(
                'Officer response is required when resolving or rejecting feedback'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------

    await db.query(
        `UPDATE timetable_feedback

         SET
            status = ?,
            officer_response = ?,
            reviewed_by = ?,
            reviewed_at = NOW()

         WHERE id = ?`,
        [
            normalizedStatus,
            response,
            Number(reviewerId),
            Number(feedbackId)
        ]
    );


    return await getFeedbackSubmissionById(
        feedbackId,
        facultyId
    );
};


// ==========================================================
// EXPORTS
// ==========================================================
module.exports = {
    VALID_STATUSES,
    VALID_CATEGORIES,
    getFeedbackSubmissions,
    getFeedbackSubmissionById,
    updateFeedbackSubmission
};