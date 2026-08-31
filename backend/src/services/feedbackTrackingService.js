const crypto = require('crypto');
const db = require('../config/db');


// ==========================================================
// TRACKING SECRET
// ==========================================================
const getTrackingSecret = () => {

    const secret =
        process.env.JWT_SECRET;


    if (!secret) {

        const error =
            new Error(
                'Server tracking secret is not configured'
            );

        error.statusCode = 500;

        throw error;
    }


    return secret;
};


// ==========================================================
// GENERATE PRIVATE TRACKING CODE
// ==========================================================
const generateTrackingCode = (
    feedbackId
) => {

    const id =
        Number(feedbackId);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            'Invalid feedback ID'
        );
    }


    return crypto
        .createHmac(
            'sha256',
            getTrackingSecret()
        )
        .update(
            `feedback:${id}`
        )
        .digest('hex')
        .slice(0, 16)
        .toUpperCase();
};


// ==========================================================
// PARSE FB-000001 REFERENCE
// ==========================================================
const parseReference = (
    reference
) => {

    const value =
        String(
            reference || ''
        )
            .trim()
            .toUpperCase();


    const match =
        value.match(
            /^FB-(\d+)$/
        );


    if (!match) {

        const error =
            new Error(
                'Invalid complaint reference'
            );

        error.statusCode = 400;

        throw error;
    }


    const feedbackId =
        Number(
            match[1]
        );


    if (
        !Number.isInteger(
            feedbackId
        ) ||
        feedbackId <= 0
    ) {

        const error =
            new Error(
                'Invalid complaint reference'
            );

        error.statusCode = 400;

        throw error;
    }


    return feedbackId;
};


// ==========================================================
// VERIFY TRACKING CODE
// ==========================================================
const verifyTrackingCode = (
    feedbackId,
    suppliedCode
) => {

    const expected =
        generateTrackingCode(
            feedbackId
        );


    const supplied =
        String(
            suppliedCode || ''
        )
            .trim()
            .toUpperCase();


    if (
        supplied.length !==
        expected.length
    ) {

        return false;
    }


    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(supplied)
    );
};


// ==========================================================
// GET PUBLIC COMPLAINT STATUS
// ==========================================================
const getPublicFeedbackStatus = async (
    reference,
    trackingCode
) => {

    const feedbackId =
        parseReference(
            reference
        );


    if (
        !verifyTrackingCode(
            feedbackId,
            trackingCode
        )
    ) {

        const error =
            new Error(
                'Complaint status not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const [rows] =
        await db.query(
            `SELECT
                f.id,

                CONCAT(
                    'FB-',
                    LPAD(f.id, 6, '0')
                ) AS reference,

                f.status,
                f.category,
                f.level,

                f.officer_response,

                DATE_FORMAT(
                    f.created_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS submitted_at,

                DATE_FORMAT(
                    f.reviewed_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS reviewed_at,

                d.short_code
                    AS department_code,

                d.name
                    AS department_name,

                c.course_code,
                c.course_title,

                t.title
                    AS timetable_title,

                t.version_number,

                a.session_name,
                a.semester

             FROM timetable_feedback f

             INNER JOIN departments d
                ON f.department_id = d.id

             LEFT JOIN courses c
                ON f.course_id = c.id

             INNER JOIN timetables t
                ON f.timetable_id = t.id

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             WHERE f.id = ?

             LIMIT 1`,
            [
                feedbackId
            ]
        );


    if (rows.length === 0) {

        const error =
            new Error(
                'Complaint status not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const row =
        rows[0];


    return {

        reference:
            row.reference,

        status:
            row.status,

        category:
            row.category,

        department: {

            code:
                row.department_code,

            name:
                row.department_name
        },

        course:
            row.course_code
                ? {
                    course_code:
                        row.course_code,

                    course_title:
                        row.course_title,

                    level:
                        Number(
                            row.level
                        )
                }
                : null,

        timetable: {

            title:
                row.timetable_title,

            version_number:
                Number(
                    row.version_number
                ),

            session_name:
                row.session_name,

            semester:
                row.semester
        },

        officer_response:
            row.officer_response,

        submitted_at:
            row.submitted_at,

        reviewed_at:
            row.reviewed_at
    };
};


// ==========================================================
// EXPORTS
// ==========================================================
module.exports = {
    generateTrackingCode,
    parseReference,
    verifyTrackingCode,
    getPublicFeedbackStatus
};