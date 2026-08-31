const crypto = require('crypto');

const db =
    require('../config/db');


// ==========================================================
// CONSTANTS
// ==========================================================

const VALID_SUBMITTER_ROLES = [
    'class_rep',
    'level_coordinator'
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


const COURSE_REQUIRED_CATEGORIES = [
    'exam_clash',
    'exam_date',
    'exam_time',
    'venue',
    'wrong_course',
    'student_conflict'
];


const VALID_LEVELS = [
    100,
    200,
    300,
    400,
    500
];


// ==========================================================
// PUBLIC API URL
// ==========================================================

const PUBLIC_API_URL =
    String(
        process.env.PUBLIC_API_URL ||
        process.env.API_URL ||
        'http://localhost:5000'
    ).replace(
        /\/$/,
        ''
    );


// ==========================================================
// HASH TOKEN
// ==========================================================

const hashToken = (
    token
) => {

    return crypto
        .createHash('sha256')
        .update(
            String(token)
        )
        .digest('hex');
};


// ==========================================================
// GET + VALIDATE PUBLIC LINK
// ==========================================================

const getValidPublicLink = async (
    token
) => {

    if (
        !token ||
        typeof token !== 'string'
    ) {

        const error =
            new Error(
                'Invalid feedback link'
            );

        error.statusCode = 404;

        throw error;
    }


    const tokenHash =
        hashToken(
            token
        );


    const [rows] =
        await db.query(
            `SELECT
                fl.id,
                fl.timetable_id,
                fl.created_by,
                fl.expires_at,
                fl.is_active,

                t.title,
                t.version_number,
                t.status AS timetable_status,
                t.session_id,

                a.faculty_id,
                a.session_name,
                a.semester

             FROM timetable_feedback_links fl

             INNER JOIN timetables t
                ON fl.timetable_id = t.id

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             WHERE fl.token_hash = ?

             LIMIT 1`,
            [
                tokenHash
            ]
        );


    if (
        rows.length === 0
    ) {

        const error =
            new Error(
                'Feedback link not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const link =
        rows[0];


    // ------------------------------------------------------
    // ACTIVE
    // ------------------------------------------------------

    if (
        !Boolean(
            link.is_active
        )
    ) {

        const error =
            new Error(
                'This feedback form has been disabled'
            );

        error.statusCode = 410;

        throw error;
    }


    // ------------------------------------------------------
    // EXPIRY
    // ------------------------------------------------------

    if (
        link.expires_at &&
        new Date(
            link.expires_at
        ).getTime() < Date.now()
    ) {

        const error =
            new Error(
                'This feedback form has expired'
            );

        error.statusCode = 410;

        throw error;
    }


    // ------------------------------------------------------
    // PUBLISHED TIMETABLE ONLY
    // ------------------------------------------------------

    if (
        link.timetable_status !==
        'published'
    ) {

        const error =
            new Error(
                'This timetable is no longer accepting feedback'
            );

        error.statusCode = 410;

        throw error;
    }


    return link;
};


// ==========================================================
// CREATE FEEDBACK LINK
// ==========================================================

const createFeedbackLink = async (
    timetableId,
    facultyId,
    createdBy,
    expiresInDays = 7
) => {

    const expiryDays =
        Number(
            expiresInDays
        );


    if (
        !Number.isInteger(
            expiryDays
        ) ||
        expiryDays < 1 ||
        expiryDays > 30
    ) {

        const error =
            new Error(
                'Feedback link expiry must be between 1 and 30 days'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // VERIFY TIMETABLE + FACULTY
    // ------------------------------------------------------

    const [rows] =
        await db.query(
            `SELECT
                t.id,
                t.session_id,
                t.title,
                t.version_number,
                t.status,

                a.session_name,
                a.semester

             FROM timetables t

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             WHERE t.id = ?
             AND a.faculty_id = ?

             LIMIT 1`,
            [
                Number(
                    timetableId
                ),

                Number(
                    facultyId
                )
            ]
        );


    if (
        rows.length === 0
    ) {

        const error =
            new Error(
                'Timetable not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const timetable =
        rows[0];


    // ------------------------------------------------------
    // ONLY PUBLISHED TIMETABLE
    // ------------------------------------------------------

    if (
        timetable.status !==
        'published'
    ) {

        const error =
            new Error(
                'Feedback links can only be created for a published timetable'
            );

        error.statusCode = 409;

        throw error;
    }


    // ------------------------------------------------------
    // SECURE TOKEN
    // ------------------------------------------------------

    const token =
        crypto
            .randomBytes(32)
            .toString('hex');


    const tokenHash =
        hashToken(
            token
        );


    // ------------------------------------------------------
    // EXPIRY
    // ------------------------------------------------------

    const expiresAt =
        new Date(
            Date.now() +
            (
                expiryDays *
                24 *
                60 *
                60 *
                1000
            )
        );


    // ------------------------------------------------------
    // INSERT LINK
    // ------------------------------------------------------

    const [result] =
        await db.query(
            `INSERT INTO timetable_feedback_links
            (
                timetable_id,
                token_hash,
                public_token,
                created_by,
                expires_at,
                is_active
            )

            VALUES (?, ?, ?, ?, ?, TRUE)`,
            [
                Number(
                    timetableId
                ),

                tokenHash,

                token,

                Number(
                    createdBy
                ),

                expiresAt
            ]
        );


    // ------------------------------------------------------
    // RETURN
    // ------------------------------------------------------

    return {

        id:
            Number(
                result.insertId
            ),

        timetable: {

            id:
                Number(
                    timetable.id
                ),

            session_id:
                Number(
                    timetable.session_id
                ),

            session_name:
                timetable.session_name,

            semester:
                timetable.semester,

            title:
                timetable.title,

            version_number:
                Number(
                    timetable.version_number
                ),

            status:
                timetable.status
        },

        token,

        public_token:
            token,

        expires_at:
            expiresAt,

        is_active:
            true
    };
};


// ==========================================================
// GET FEEDBACK LINKS
// ==========================================================

const getFeedbackLinks = async (
    facultyId,
    timetableId = null
) => {

    let sql = `
        SELECT
            fl.id,
            fl.timetable_id,
            fl.public_token,

            t.title,
            t.version_number,
            t.status AS timetable_status,

            a.session_name,
            a.semester,

            fl.created_by,

            DATE_FORMAT(
                fl.expires_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS expires_at,

            fl.is_active,

            CASE
                WHEN fl.expires_at IS NOT NULL
                AND fl.expires_at < NOW()
                THEN TRUE
                ELSE FALSE
            END AS is_expired,

            DATE_FORMAT(
                fl.created_at,
                '%Y-%m-%d %H:%i:%s'
            ) AS created_at,

            (
                SELECT COUNT(*)
                FROM timetable_feedback f
                WHERE f.feedback_link_id = fl.id
            ) AS submission_count

        FROM timetable_feedback_links fl

        INNER JOIN timetables t
            ON fl.timetable_id = t.id

        INNER JOIN academic_sessions a
            ON t.session_id = a.id

        WHERE a.faculty_id = ?
    `;


    const params = [
        Number(
            facultyId
        )
    ];


    if (
        timetableId
    ) {

        sql += `
            AND fl.timetable_id = ?
        `;

        params.push(
            Number(
                timetableId
            )
        );
    }


    sql += `
        ORDER BY
            fl.created_at DESC,
            fl.id DESC
    `;


    const [rows] =
        await db.query(
            sql,
            params
        );


    return rows.map(
        row => {

            const publicToken =
                row.public_token
                    ? String(
                        row.public_token
                    )
                    : null;


            const url =
                publicToken
                    ? `${PUBLIC_API_URL}/api/timetable-feedback/form/${publicToken}`
                    : null;


            return {

                ...row,

                id:
                    Number(
                        row.id
                    ),

                timetable_id:
                    Number(
                        row.timetable_id
                    ),

                version_number:
                    Number(
                        row.version_number
                    ),

                created_by:
                    Number(
                        row.created_by
                    ),

                is_active:
                    Boolean(
                        row.is_active
                    ),

                is_expired:
                    Boolean(
                        row.is_expired
                    ),

                submission_count:
                    Number(
                        row.submission_count
                    ),

                public_token:
                    publicToken,

                url
            };
        }
    );
};


// ==========================================================
// ENABLE / DISABLE FEEDBACK LINK
// ==========================================================

const setFeedbackLinkStatus = async (
    linkId,
    facultyId,
    isActive
) => {

    const [rows] =
        await db.query(
            `SELECT
                fl.id,
                fl.timetable_id

             FROM timetable_feedback_links fl

             INNER JOIN timetables t
                ON fl.timetable_id = t.id

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             WHERE fl.id = ?
             AND a.faculty_id = ?

             LIMIT 1`,
            [
                Number(
                    linkId
                ),

                Number(
                    facultyId
                )
            ]
        );


    if (
        rows.length === 0
    ) {

        const error =
            new Error(
                'Feedback link not found'
            );

        error.statusCode = 404;

        throw error;
    }


    await db.query(
        `UPDATE timetable_feedback_links

         SET is_active = ?

         WHERE id = ?`,
        [
            Boolean(
                isActive
            ),

            Number(
                linkId
            )
        ]
    );


    return {

        id:
            Number(
                linkId
            ),

        timetable_id:
            Number(
                rows[0].timetable_id
            ),

        is_active:
            Boolean(
                isActive
            )
    };
};


// ==========================================================
// DELETE FEEDBACK LINK
// ==========================================================

const deleteFeedbackLink = async (
    linkId,
    facultyId
) => {

    const connection =
        await db.getConnection();


    let transactionStarted =
        false;


    try {

        await connection.beginTransaction();

        transactionStarted =
            true;


        // --------------------------------------------------
        // VERIFY FACULTY OWNERSHIP
        // --------------------------------------------------

        const [rows] =
            await connection.query(
                `SELECT
                    fl.id,
                    fl.timetable_id,

                    t.title,
                    t.version_number

                 FROM timetable_feedback_links fl

                 INNER JOIN timetables t
                    ON fl.timetable_id = t.id

                 INNER JOIN academic_sessions a
                    ON t.session_id = a.id

                 WHERE fl.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1
                 FOR UPDATE`,
                [
                    Number(
                        linkId
                    ),

                    Number(
                        facultyId
                    )
                ]
            );


        if (
            rows.length === 0
        ) {

            const error =
                new Error(
                    'Feedback link not found'
                );

            error.statusCode = 404;

            throw error;
        }


        const link =
            rows[0];


        // --------------------------------------------------
        // DELETE FEEDBACK SUBMISSIONS FIRST
        // --------------------------------------------------

        await connection.query(
            `DELETE FROM timetable_feedback
             WHERE feedback_link_id = ?`,
            [
                Number(
                    linkId
                )
            ]
        );


        // --------------------------------------------------
        // DELETE LINK
        // --------------------------------------------------

        await connection.query(
            `DELETE FROM timetable_feedback_links
             WHERE id = ?`,
            [
                Number(
                    linkId
                )
            ]
        );


        await connection.commit();

        transactionStarted =
            false;


        return {

            id:
                Number(
                    link.id
                ),

            timetable_id:
                Number(
                    link.timetable_id
                ),

            title:
                link.title,

            version_number:
                Number(
                    link.version_number
                )
        };


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
                    'Delete feedback rollback error:',
                    rollbackError.message
                );
            }
        }


        throw error;

    } finally {

        connection.release();
    }
};


// ==========================================================
// GET PUBLIC FEEDBACK FORM
// ==========================================================

const getPublicFeedbackForm = async (
    token
) => {

    const link =
        await getValidPublicLink(
            token
        );


    // ------------------------------------------------------
    // GET DEPARTMENTS + COURSES
    //
    // IMPORTANT:
    // No c.is_active filter.
    // Courses connected to the session remain available
    // for feedback purposes.
    // ------------------------------------------------------

    const [courseRows] =
        await db.query(
            `SELECT
                d.id AS department_id,
                d.name AS department_name,
                d.short_code AS department_code,

                c.id AS course_id,
                c.course_code,
                c.course_title,
                c.level,

                CASE
                    WHEN te.id IS NULL
                    THEN FALSE
                    ELSE TRUE
                END AS is_in_timetable

             FROM departments d

             INNER JOIN courses c
                ON c.department_id = d.id

             LEFT JOIN timetable_entries te
                ON te.course_id = c.id
                AND te.timetable_id = ?

             WHERE d.faculty_id = ?
             AND c.session_id = ?

             ORDER BY
                d.short_code ASC,
                c.level ASC,
                c.course_code ASC`,
            [
                Number(
                    link.timetable_id
                ),

                Number(
                    link.faculty_id
                ),

                Number(
                    link.session_id
                )
            ]
        );


    // ------------------------------------------------------
    // GROUP BY DEPARTMENT
    // ------------------------------------------------------

    const departmentMap =
        new Map();


    for (
        const row
        of courseRows
    ) {

        const departmentId =
            Number(
                row.department_id
            );


        if (
            !departmentMap.has(
                departmentId
            )
        ) {

            departmentMap.set(
                departmentId,
                {

                    id:
                        departmentId,

                    name:
                        row.department_name,

                    code:
                        row.department_code,

                    levels:
                        new Set(),

                    courses:
                        []
                }
            );
        }


        const department =
            departmentMap.get(
                departmentId
            );


        department.levels.add(
            Number(
                row.level
            )
        );


        department.courses.push({

            id:
                Number(
                    row.course_id
                ),

            course_code:
                row.course_code,

            course_title:
                row.course_title,

            level:
                Number(
                    row.level
                ),

            is_in_timetable:
                Boolean(
                    row.is_in_timetable
                )
        });
    }


    // ------------------------------------------------------
    // FORMAT DEPARTMENT RESULT
    // ------------------------------------------------------

    const departments =
        [
            ...departmentMap.values()
        ].map(
            department => ({

                ...department,

                levels:
                    [
                        ...department.levels
                    ].sort(
                        (a, b) =>
                            a - b
                    )
            })
        );


    // ------------------------------------------------------
    // RETURN FORM DATA
    // ------------------------------------------------------

    return {

        feedback_link: {

            id:
                Number(
                    link.id
                ),

            expires_at:
                link.expires_at,

            is_active:
                Boolean(
                    link.is_active
                )
        },


        timetable: {

            id:
                Number(
                    link.timetable_id
                ),

            session_id:
                Number(
                    link.session_id
                ),

            session_name:
                link.session_name,

            semester:
                link.semester,

            title:
                link.title,

            version_number:
                Number(
                    link.version_number
                ),

            status:
                link.timetable_status
        },


        options: {

            submitter_roles:
                VALID_SUBMITTER_ROLES,

            categories:
                VALID_CATEGORIES,

            departments
        }
    };
};


// ==========================================================
// SUBMIT PUBLIC FEEDBACK
// ==========================================================

const submitPublicFeedback = async (
    token,
    payload
) => {

    const link =
        await getValidPublicLink(
            token
        );


    const submitterName =
        String(
            payload.submitter_name ||
            ''
        ).trim();


    const submitterRole =
        String(
            payload.submitter_role ||
            ''
        ).trim();


    const category =
        String(
            payload.category ||
            ''
        ).trim();


    const comment =
        String(
            payload.comment ||
            ''
        ).trim();


    const departmentId =
        Number(
            payload.department_id
        );


    const level =
        Number(
            payload.level
        );


    const courseId =
        payload.course_id === null ||
        payload.course_id === undefined ||
        payload.course_id === ''
            ? null
            : Number(
                payload.course_id
            );


    // ------------------------------------------------------
    // SUBMITTER NAME
    // ------------------------------------------------------

    if (
        submitterName.length < 2 ||
        submitterName.length > 120
    ) {

        const error =
            new Error(
                'Submitter name must be between 2 and 120 characters'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // SUBMITTER ROLE
    // ------------------------------------------------------

    if (
        !VALID_SUBMITTER_ROLES.includes(
            submitterRole
        )
    ) {

        const error =
            new Error(
                'Invalid submitter role'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // CATEGORY
    // ------------------------------------------------------

    if (
        !VALID_CATEGORIES.includes(
            category
        )
    ) {

        const error =
            new Error(
                'Invalid feedback category'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // DEPARTMENT
    // ------------------------------------------------------

    if (
        !Number.isInteger(
            departmentId
        ) ||
        departmentId <= 0
    ) {

        const error =
            new Error(
                'Valid department_id is required'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // LEVEL
    //
    // Accept all standard university levels.
    // ------------------------------------------------------

    if (
        !Number.isInteger(
            level
        ) ||
        !VALID_LEVELS.includes(
            level
        )
    ) {

        const error =
            new Error(
                'Selected level must be 100, 200, 300, 400, or 500'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // COMMENT
    // ------------------------------------------------------

    if (
        comment.length < 5 ||
        comment.length > 5000
    ) {

        const error =
            new Error(
                'Comment must be between 5 and 5000 characters'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // COURSE REQUIRED FOR COURSE-SPECIFIC CATEGORIES
    // ------------------------------------------------------

    if (
        COURSE_REQUIRED_CATEGORIES.includes(
            category
        ) &&
        (
            !Number.isInteger(
                courseId
            ) ||
            courseId <= 0
        )
    ) {

        const error =
            new Error(
                'A course is required for this feedback category'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // VERIFY DEPARTMENT BELONGS TO FACULTY
    // ------------------------------------------------------

    const [departmentRows] =
        await db.query(
            `SELECT
                id

             FROM departments

             WHERE id = ?
             AND faculty_id = ?

             LIMIT 1`,
            [
                departmentId,

                Number(
                    link.faculty_id
                )
            ]
        );


    if (
        departmentRows.length === 0
    ) {

        const error =
            new Error(
                'Invalid department'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // VALIDATE COURSE WHEN PROVIDED
    //
    // No is_active condition.
    // ------------------------------------------------------

    if (
        courseId !== null
    ) {

        const [courseRows] =
            await db.query(
                `SELECT
                    c.id,
                    c.department_id,
                    c.level,

                    CASE
                        WHEN te.id IS NULL
                        THEN FALSE
                        ELSE TRUE
                    END AS is_in_timetable

                 FROM courses c

                 LEFT JOIN timetable_entries te
                    ON te.course_id = c.id
                    AND te.timetable_id = ?

                 WHERE c.id = ?
                 AND c.department_id = ?
                 AND c.session_id = ?

                 LIMIT 1`,
                [
                    Number(
                        link.timetable_id
                    ),

                    courseId,

                    departmentId,

                    Number(
                        link.session_id
                    )
                ]
            );


        if (
            courseRows.length === 0
        ) {

            const error =
                new Error(
                    'Selected course is invalid'
                );

            error.statusCode = 400;

            throw error;
        }


        const selectedCourse =
            courseRows[0];


        // --------------------------------------------------
        // COURSE LEVEL
        // --------------------------------------------------

        if (
            Number(
                selectedCourse.level
            ) !== level
        ) {

            const error =
                new Error(
                    'Selected course does not belong to the selected level'
                );

            error.statusCode = 400;

            throw error;
        }


        // --------------------------------------------------
        // COURSE MUST BE IN TIMETABLE
        //
        // EXCEPT FOR MISSING COURSE.
        // --------------------------------------------------

        if (
            category !==
            'missing_course' &&
            !Boolean(
                selectedCourse.is_in_timetable
            )
        ) {

            const error =
                new Error(
                    'Selected course is not part of this published timetable'
                );

            error.statusCode = 400;

            throw error;
        }
    }


    // ------------------------------------------------------
    // INSERT FEEDBACK
    // ------------------------------------------------------

    const [result] =
        await db.query(
            `INSERT INTO timetable_feedback
            (
                feedback_link_id,
                timetable_id,
                department_id,
                course_id,
                level,
                submitter_name,
                submitter_role,
                category,
                comment,
                status
            )

            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
            [
                Number(
                    link.id
                ),

                Number(
                    link.timetable_id
                ),

                departmentId,

                courseId,

                level,

                submitterName,

                submitterRole,

                category,

                comment
            ]
        );


    // ------------------------------------------------------
    // REFERENCE
    // ------------------------------------------------------

    const feedbackId =
        Number(
            result.insertId
        );


    const reference =
        `FB-${String(
            feedbackId
        ).padStart(
            6,
            '0'
        )}`;


    // ------------------------------------------------------
    // RETURN
    // ------------------------------------------------------

    return {

        id:
            feedbackId,

        reference,

        timetable_id:
            Number(
                link.timetable_id
            ),

        department_id:
            departmentId,

        course_id:
            courseId,

        level,

        submitter_name:
            submitterName,

        submitter_role:
            submitterRole,

        category,

        status:
            'open'
    };
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    createFeedbackLink,

    getFeedbackLinks,

    setFeedbackLinkStatus,

    deleteFeedbackLink,

    getPublicFeedbackForm,

    submitPublicFeedback,

    hashToken,

    VALID_SUBMITTER_ROLES,

    VALID_CATEGORIES
};