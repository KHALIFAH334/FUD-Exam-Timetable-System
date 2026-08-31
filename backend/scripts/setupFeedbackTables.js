const db = require('../src/config/db');


const setupFeedbackTables = async () => {

    try {

        console.log(
            'Creating timetable feedback tables...'
        );


        // ==================================================
        // 1. FEEDBACK LINKS
        // ==================================================

        await db.query(`
            CREATE TABLE IF NOT EXISTS timetable_feedback_links
            (
                id INT AUTO_INCREMENT PRIMARY KEY,

                timetable_id INT NOT NULL,

                token_hash CHAR(64)
                    NOT NULL,

                created_by INT NOT NULL,

                expires_at DATETIME NULL,

                is_active BOOLEAN
                    NOT NULL
                    DEFAULT TRUE,

                created_at TIMESTAMP
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                UNIQUE KEY
                    uq_feedback_token_hash
                    (token_hash),

                INDEX
                    idx_feedback_link_timetable
                    (timetable_id),

                INDEX
                    idx_feedback_link_active
                    (is_active),

                CONSTRAINT
                    fk_feedback_link_timetable

                    FOREIGN KEY
                    (timetable_id)

                    REFERENCES timetables(id)

                    ON DELETE CASCADE,


                CONSTRAINT
                    fk_feedback_link_creator

                    FOREIGN KEY
                    (created_by)

                    REFERENCES users(id)

                    ON DELETE RESTRICT
            )
        `);


        console.log(
            '✓ timetable_feedback_links created'
        );


        // ==================================================
        // 2. FEEDBACK / COMPLAINT SUBMISSIONS
        // ==================================================

        await db.query(`
            CREATE TABLE IF NOT EXISTS timetable_feedback
            (
                id INT AUTO_INCREMENT PRIMARY KEY,

                feedback_link_id INT NOT NULL,

                timetable_id INT NOT NULL,

                department_id INT NOT NULL,

                course_id INT NULL,

                level INT NOT NULL,

                submitter_name VARCHAR(120)
                    NOT NULL,

                submitter_role ENUM(
                    'class_rep',
                    'level_coordinator'
                )
                    NOT NULL,

                category ENUM(
                    'exam_clash',
                    'exam_date',
                    'exam_time',
                    'venue',
                    'missing_course',
                    'wrong_course',
                    'student_conflict',
                    'other'
                )
                    NOT NULL,

                comment TEXT
                    NOT NULL,

                status ENUM(
                    'open',
                    'under_review',
                    'resolved',
                    'rejected'
                )
                    NOT NULL
                    DEFAULT 'open',

                officer_response TEXT
                    NULL,

                reviewed_by INT
                    NULL,

                reviewed_at DATETIME
                    NULL,

                created_at TIMESTAMP
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMP
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,


                INDEX
                    idx_feedback_link
                    (feedback_link_id),

                INDEX
                    idx_feedback_timetable
                    (timetable_id),

                INDEX
                    idx_feedback_department
                    (department_id),

                INDEX
                    idx_feedback_course
                    (course_id),

                INDEX
                    idx_feedback_status
                    (status),

                INDEX
                    idx_feedback_created
                    (created_at),


                CONSTRAINT
                    fk_feedback_submission_link

                    FOREIGN KEY
                    (feedback_link_id)

                    REFERENCES timetable_feedback_links(id)

                    ON DELETE CASCADE,


                CONSTRAINT
                    fk_feedback_submission_timetable

                    FOREIGN KEY
                    (timetable_id)

                    REFERENCES timetables(id)

                    ON DELETE CASCADE,


                CONSTRAINT
                    fk_feedback_submission_department

                    FOREIGN KEY
                    (department_id)

                    REFERENCES departments(id)

                    ON DELETE RESTRICT,


                CONSTRAINT
                    fk_feedback_submission_course

                    FOREIGN KEY
                    (course_id)

                    REFERENCES courses(id)

                    ON DELETE SET NULL,


                CONSTRAINT
                    fk_feedback_reviewer

                    FOREIGN KEY
                    (reviewed_by)

                    REFERENCES users(id)

                    ON DELETE SET NULL
            )
        `);


        console.log(
            '✓ timetable_feedback created'
        );


        // ==================================================
        // VERIFY TABLES
        // ==================================================

        const [tables] =
            await db.query(`
                SHOW TABLES
                LIKE 'timetable_feedback%'
            `);


        console.log('');
        console.log(
            'Feedback tables found:'
        );

        console.table(tables);


        console.log('');
        console.log(
            'Phase 5.10A database setup completed successfully.'
        );


        process.exit(0);


    } catch (error) {

        console.error('');
        console.error(
            'Feedback table setup failed:'
        );

        console.error(
            error
        );


        process.exit(1);
    }
};


setupFeedbackTables();