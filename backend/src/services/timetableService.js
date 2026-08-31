const db = require('../config/db');


// ==========================================================
// GET TIMETABLE VERSIONS
// ==========================================================
const getTimetableVersions = async (
    facultyId,
    sessionId = null,
    status = null
) => {

    let sql = `
        SELECT
            t.id,
            t.session_id,

            a.session_name,
            a.semester,

            f.name AS faculty_name,
            f.short_code AS faculty_code,

            t.title,
            t.version_number,
            t.status,
            t.created_by,
            t.notes

        FROM timetables t

        INNER JOIN academic_sessions a
            ON t.session_id = a.id

        INNER JOIN faculties f
            ON a.faculty_id = f.id

        WHERE a.faculty_id = ?
    `;


    const params = [
        Number(facultyId)
    ];


    // ------------------------------------------------------
    // FILTER BY ACADEMIC SESSION
    // ------------------------------------------------------

    if (sessionId) {

        sql += `
            AND t.session_id = ?
        `;

        params.push(
            Number(sessionId)
        );
    }


    // ------------------------------------------------------
    // FILTER BY STATUS
    // ------------------------------------------------------

    if (status) {

        sql += `
            AND t.status = ?
        `;

        params.push(
            String(status)
                .trim()
                .toLowerCase()
        );
    }


    sql += `
        ORDER BY
            t.version_number DESC,
            t.id DESC
    `;


    const [rows] =
        await db.query(
            sql,
            params
        );


    return rows;
};


// ==========================================================
// GET COMPLETE TIMETABLE BY ID
// ==========================================================
const getTimetableById = async (
    timetableId,
    facultyId
) => {

    // ------------------------------------------------------
    // TIMETABLE HEADER
    // ------------------------------------------------------

    const [headerRows] =
        await db.query(
            `SELECT
                t.id,
                t.session_id,

                a.session_name,
                a.semester,

                f.name AS faculty_name,
                f.short_code AS faculty_code,

                t.title,
                t.version_number,
                t.status,
                t.created_by,
                t.notes

             FROM timetables t

             INNER JOIN academic_sessions a
                ON t.session_id = a.id

             INNER JOIN faculties f
                ON a.faculty_id = f.id

             WHERE t.id = ?
             AND a.faculty_id = ?

             LIMIT 1`,
            [
                Number(timetableId),
                Number(facultyId)
            ]
        );


    if (headerRows.length === 0) {

        const error =
            new Error(
                'Timetable not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const timetable =
        headerRows[0];


    // ------------------------------------------------------
    // TIMETABLE ENTRIES
    // ------------------------------------------------------

    const [entries] =
        await db.query(
            `SELECT
                te.id,
                te.timetable_id,
                te.course_id,

                c.course_code,
                c.course_title,
                c.level,

                d.id AS department_id,
                d.short_code AS department_code,
                d.name AS department_name,

                DATE_FORMAT(
                    te.exam_date,
                    '%Y-%m-%d'
                ) AS exam_date,

                te.time_slot_id,

                ts.slot_label,
                ts.start_time,
                ts.end_time,

                te.cohort_type,
                te.candidate_count,
                te.generated_by,
                te.status

             FROM timetable_entries te

             INNER JOIN courses c
                ON te.course_id = c.id

             INNER JOIN departments d
                ON c.department_id = d.id

             INNER JOIN time_slots ts
                ON te.time_slot_id = ts.id

             WHERE te.timetable_id = ?

             ORDER BY
                te.exam_date ASC,
                ts.start_time ASC,
                c.course_code ASC`,
            [
                Number(timetableId)
            ]
        );


    // ------------------------------------------------------
    // VENUE ASSIGNMENTS
    // ------------------------------------------------------

    const [venueRows] =
        await db.query(
            `SELECT
                tev.timetable_entry_id,
                tev.venue_id,

                v.venue_code,
                v.venue_name,
                v.venue_type,
                v.capacity,

                tev.allocated_candidates

             FROM timetable_entry_venues tev

             INNER JOIN venues v
                ON tev.venue_id = v.id

             INNER JOIN timetable_entries te
                ON tev.timetable_entry_id = te.id

             WHERE te.timetable_id = ?

             ORDER BY
                tev.timetable_entry_id ASC,
                v.venue_code ASC`,
            [
                Number(timetableId)
            ]
        );


    // ------------------------------------------------------
    // INVIGILATOR ASSIGNMENTS
    // ------------------------------------------------------

    const [invigilatorRows] =
        await db.query(
            `SELECT
                tei.timetable_entry_id,
                tei.invigilator_id,

                i.staff_id,
                i.full_name,
                i.department_id,

                d.short_code AS department_code,
                d.name AS department_name,

                i.max_duties_per_semester

             FROM timetable_entry_invigilators tei

             INNER JOIN invigilators i
                ON tei.invigilator_id = i.id

             INNER JOIN departments d
                ON i.department_id = d.id

             INNER JOIN timetable_entries te
                ON tei.timetable_entry_id = te.id

             WHERE te.timetable_id = ?

             ORDER BY
                tei.timetable_entry_id ASC,
                i.staff_id ASC`,
            [
                Number(timetableId)
            ]
        );


    // ------------------------------------------------------
    // BUILD VENUE MAP
    // ------------------------------------------------------

    const venueMap =
        new Map();


    for (const venue of venueRows) {

        const entryId =
            Number(
                venue.timetable_entry_id
            );


        if (!venueMap.has(entryId)) {

            venueMap.set(
                entryId,
                []
            );
        }


        venueMap
            .get(entryId)
            .push({

                venue_id:
                    Number(
                        venue.venue_id
                    ),

                venue_code:
                    venue.venue_code,

                venue_name:
                    venue.venue_name,

                venue_type:
                    venue.venue_type,

                capacity:
                    Number(
                        venue.capacity
                    ),

                allocated_candidates:
                    Number(
                        venue.allocated_candidates
                    )
            });
    }


    // ------------------------------------------------------
    // BUILD INVIGILATOR MAP
    // ------------------------------------------------------

    const invigilatorMap =
        new Map();


    for (
        const invigilator
        of invigilatorRows
    ) {

        const entryId =
            Number(
                invigilator.timetable_entry_id
            );


        if (
            !invigilatorMap.has(entryId)
        ) {

            invigilatorMap.set(
                entryId,
                []
            );
        }


        invigilatorMap
            .get(entryId)
            .push({

                invigilator_id:
                    Number(
                        invigilator.invigilator_id
                    ),

                staff_id:
                    invigilator.staff_id,

                full_name:
                    invigilator.full_name,

                department_id:
                    Number(
                        invigilator.department_id
                    ),

                department_code:
                    invigilator.department_code,

                department_name:
                    invigilator.department_name,

                max_duties_per_semester:
                    Number(
                        invigilator.max_duties_per_semester
                    )
            });
    }


    // ------------------------------------------------------
    // BUILD COMPLETE TIMETABLE ENTRIES
    // ------------------------------------------------------

    const completeEntries =
        entries.map(
            entry => {

                const entryId =
                    Number(
                        entry.id
                    );


                const venues =
                    venueMap.get(
                        entryId
                    ) || [];


                const invigilators =
                    invigilatorMap.get(
                        entryId
                    ) || [];


                const allocatedCandidates =
                    venues.reduce(
                        (
                            total,
                            venue
                        ) =>
                            total +
                            Number(
                                venue.allocated_candidates
                            ),
                        0
                    );


                const totalVenueCapacity =
                    venues.reduce(
                        (
                            total,
                            venue
                        ) =>
                            total +
                            Number(
                                venue.capacity
                            ),
                        0
                    );


                return {

                    id:
                        entryId,

                    timetable_id:
                        Number(
                            entry.timetable_id
                        ),

                    course_id:
                        Number(
                            entry.course_id
                        ),

                    course_code:
                        entry.course_code,

                    course_title:
                        entry.course_title,

                    level:
                        Number(
                            entry.level
                        ),

                    department_id:
                        Number(
                            entry.department_id
                        ),

                    department_code:
                        entry.department_code,

                    department_name:
                        entry.department_name,

                    exam_date:
                        entry.exam_date,

                    time_slot_id:
                        Number(
                            entry.time_slot_id
                        ),

                    slot_label:
                        entry.slot_label,

                    start_time:
                        entry.start_time,

                    end_time:
                        entry.end_time,

                    cohort_type:
                        entry.cohort_type,

                    candidate_count:
                        Number(
                            entry.candidate_count
                        ),

                    generated_by:
                        entry.generated_by,

                    status:
                        entry.status,

                    venue_allocation: {

                        venue_count:
                            venues.length,

                        total_capacity:
                            totalVenueCapacity,

                        allocated_candidates:
                            allocatedCandidates,

                        venues
                    },

                    invigilator_allocation: {

                        assigned_count:
                            invigilators.length,

                        invigilators
                    }
                };
            }
        );


    // ------------------------------------------------------
    // RETURN COMPLETE TIMETABLE
    // ------------------------------------------------------

    return {

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

            faculty_name:
                timetable.faculty_name,

            faculty_code:
                timetable.faculty_code,

            title:
                timetable.title,

            version_number:
                Number(
                    timetable.version_number
                ),

            status:
                timetable.status,

            created_by:
                Number(
                    timetable.created_by
                ),

            notes:
                timetable.notes
        },

        statistics: {

            entries:
                completeEntries.length,

            venue_allocations:
                venueRows.length,

            invigilator_assignments:
                invigilatorRows.length
        },

        entries:
            completeEntries
    };
};


// ==========================================================
// PUBLISH TIMETABLE
// ==========================================================
const publishTimetable = async (
    timetableId,
    facultyId
) => {

    const connection =
        await db.getConnection();


    let transactionStarted =
        false;


    try {

        await connection.beginTransaction();

        transactionStarted = true;


        // --------------------------------------------------
        // GET TARGET TIMETABLE
        // --------------------------------------------------

        const [rows] =
            await connection.query(
                `SELECT
                    t.id,
                    t.session_id,
                    t.version_number,
                    t.status,

                    a.session_name,
                    a.semester

                 FROM timetables t

                 INNER JOIN academic_sessions a
                    ON t.session_id = a.id

                 WHERE t.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1
                 FOR UPDATE`,
                [
                    Number(timetableId),
                    Number(facultyId)
                ]
            );


        if (rows.length === 0) {

            const error =
                new Error(
                    'Timetable not found'
                );

            error.statusCode = 404;

            throw error;
        }


        const timetable =
            rows[0];


        // --------------------------------------------------
        // STATUS VALIDATION
        // --------------------------------------------------

        if (
            timetable.status === 'published'
        ) {

            const error =
                new Error(
                    'Timetable is already published'
                );

            error.statusCode = 409;

            throw error;
        }


        if (
            timetable.status === 'archived'
        ) {

            const error =
                new Error(
                    'Archived timetable cannot be published'
                );

            error.statusCode = 409;

            throw error;
        }


        if (
            timetable.status !== 'draft'
        ) {

            const error =
                new Error(
                    'Only a draft timetable can be published'
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // VERIFY TIMETABLE HAS ENTRIES
        // --------------------------------------------------

        const [entryRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS entry_count

                 FROM timetable_entries

                 WHERE timetable_id = ?`,
                [
                    Number(timetableId)
                ]
            );


        const entryCount =
            Number(
                entryRows[0].entry_count
            );


        if (entryCount === 0) {

            const error =
                new Error(
                    'Cannot publish an empty timetable'
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // VERIFY EVERY EXAM HAS A VENUE
        // --------------------------------------------------

        const [missingVenueRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS missing_count

                 FROM timetable_entries te

                 WHERE te.timetable_id = ?

                 AND NOT EXISTS
                 (
                    SELECT 1

                    FROM timetable_entry_venues tev

                    WHERE tev.timetable_entry_id = te.id
                 )`,
                [
                    Number(timetableId)
                ]
            );


        const missingVenues =
            Number(
                missingVenueRows[0].missing_count
            );


        if (missingVenues > 0) {

            const error =
                new Error(
                    'Cannot publish timetable because one or more examinations have no venue'
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // VERIFY EVERY EXAM HAS AN INVIGILATOR
        // --------------------------------------------------

        const [missingInvigilatorRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS missing_count

                 FROM timetable_entries te

                 WHERE te.timetable_id = ?

                 AND NOT EXISTS
                 (
                    SELECT 1

                    FROM timetable_entry_invigilators tei

                    WHERE tei.timetable_entry_id = te.id
                 )`,
                [
                    Number(timetableId)
                ]
            );


        const missingInvigilators =
            Number(
                missingInvigilatorRows[0].missing_count
            );


        if (missingInvigilators > 0) {

            const error =
                new Error(
                    'Cannot publish timetable because one or more examinations have no invigilator'
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // ARCHIVE CURRENT PUBLISHED VERSION
        // --------------------------------------------------

        const [archiveResult] =
            await connection.query(
                `UPDATE timetables

                 SET status = 'archived'

                 WHERE session_id = ?
                 AND status = 'published'
                 AND id <> ?`,
                [
                    Number(
                        timetable.session_id
                    ),
                    Number(timetableId)
                ]
            );


        // --------------------------------------------------
        // PUBLISH TARGET TIMETABLE
        // --------------------------------------------------

        await connection.query(
            `UPDATE timetables

             SET status = 'published'

             WHERE id = ?`,
            [
                Number(timetableId)
            ]
        );


        await connection.commit();

        transactionStarted = false;


        return {

            timetable_id:
                Number(timetableId),

            session_id:
                Number(timetable.session_id),

            session_name:
                timetable.session_name,

            semester:
                timetable.semester,

            version_number:
                Number(timetable.version_number),

            status:
                'published',

            previous_versions_archived:
                Number(
                    archiveResult.affectedRows
                )
        };


    } catch (error) {

        if (transactionStarted) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    'Publish rollback error:',
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
// ARCHIVE TIMETABLE
// ==========================================================
const archiveTimetable = async (
    timetableId,
    facultyId
) => {

    const connection =
        await db.getConnection();


    let transactionStarted =
        false;


    try {

        await connection.beginTransaction();

        transactionStarted = true;


        // --------------------------------------------------
        // GET TIMETABLE
        // --------------------------------------------------

        const [rows] =
            await connection.query(
                `SELECT
                    t.id,
                    t.session_id,
                    t.version_number,
                    t.status,

                    a.session_name,
                    a.semester

                 FROM timetables t

                 INNER JOIN academic_sessions a
                    ON t.session_id = a.id

                 WHERE t.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1
                 FOR UPDATE`,
                [
                    Number(timetableId),
                    Number(facultyId)
                ]
            );


        if (rows.length === 0) {

            const error =
                new Error(
                    'Timetable not found'
                );

            error.statusCode = 404;

            throw error;
        }


        const timetable =
            rows[0];


        // --------------------------------------------------
        // STATUS VALIDATION
        // --------------------------------------------------

        if (
            timetable.status === 'archived'
        ) {

            const error =
                new Error(
                    'Timetable is already archived'
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // ARCHIVE TIMETABLE
        // --------------------------------------------------

        await connection.query(
            `UPDATE timetables

             SET status = 'archived'

             WHERE id = ?`,
            [
                Number(timetableId)
            ]
        );


        await connection.commit();

        transactionStarted = false;


        return {

            timetable_id:
                Number(timetableId),

            session_id:
                Number(timetable.session_id),

            session_name:
                timetable.session_name,

            semester:
                timetable.semester,

            version_number:
                Number(timetable.version_number),

            previous_status:
                timetable.status,

            status:
                'archived'
        };


    } catch (error) {

        if (transactionStarted) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    'Archive rollback error:',
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
// UPDATE TIMETABLE
// TITLE + NOTES ONLY
// ==========================================================

const updateTimetable = async (
    timetableId,
    facultyId,
    title,
    notes
) => {

    const connection =
        await db.getConnection();


    try {

        await connection.beginTransaction();


        const [rows] =
            await connection.query(
                `SELECT
                    t.id,
                    t.title,
                    t.status

                 FROM timetables t

                 INNER JOIN academic_sessions a
                    ON t.session_id = a.id

                 WHERE t.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1

                 FOR UPDATE`,
                [
                    Number(timetableId),
                    Number(facultyId)
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


        if (
            timetable.status ===
            'published'
        ) {

            const error =
                new Error(
                    'Published timetable cannot be edited. Archive it first.'
                );

            error.statusCode = 409;

            throw error;
        }


        const [result] =
            await connection.query(
                `UPDATE timetables

                 SET
                    title = ?,
                    notes = ?

                 WHERE id = ?`,
                [
                    title,
                    notes || null,
                    Number(timetableId)
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            const error =
                new Error(
                    'Timetable could not be updated'
                );

            error.statusCode = 409;

            throw error;
        }


        await connection.commit();


        return {

            timetable_id:
                Number(
                    timetableId
                ),

            title,

            notes:
                notes || null,

            status:
                timetable.status

        };


    } catch (error) {

        try {

            await connection.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                'Update timetable rollback error:',
                rollbackError.message
            );
        }


        throw error;


    } finally {

        connection.release();
    }
};


// ==========================================================
// DELETE TIMETABLE
// ==========================================================

const deleteTimetable = async (
    timetableId,
    facultyId
) => {

    const connection =
        await db.getConnection();


    try {

        await connection.beginTransaction();


        // --------------------------------------------------
        // GET TIMETABLE
        // --------------------------------------------------

        const [rows] =
            await connection.query(
                `SELECT
                    t.id,
                    t.session_id,
                    t.title,
                    t.version_number,
                    t.status

                 FROM timetables t

                 INNER JOIN academic_sessions a
                    ON t.session_id = a.id

                 WHERE t.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1

                 FOR UPDATE`,
                [
                    Number(timetableId),
                    Number(facultyId)
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


        // --------------------------------------------------
        // PUBLISHED CANNOT BE DELETED
        // --------------------------------------------------

        if (
            timetable.status ===
            'published'
        ) {

            const error =
                new Error(
                    'Published timetable cannot be deleted. Archive it first.'
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // CHECK COMPLAINTS
        // --------------------------------------------------

        const [complaintRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS total

                 FROM complaints c

                 INNER JOIN timetable_entries te
                    ON c.timetable_entry_id =
                       te.id

                 WHERE te.timetable_id = ?`,
                [
                    Number(timetableId)
                ]
            );


        const complaintCount =
            Number(
                complaintRows[0]?.total ||
                0
            );


        if (
            complaintCount > 0
        ) {

            const error =
                new Error(
                    `Cannot delete this timetable because ${complaintCount} complaint record(s) are linked to it.`
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // CHECK AUDIT LOG
        // --------------------------------------------------

        const [auditRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS total

                 FROM timetable_audit_log

                 WHERE timetable_id = ?`,
                [
                    Number(timetableId)
                ]
            );


        const auditCount =
            Number(
                auditRows[0]?.total ||
                0
            );


        if (
            auditCount > 0
        ) {

            const error =
                new Error(
                    `Cannot delete this timetable because ${auditCount} audit record(s) are linked to it.`
                );

            error.statusCode = 409;

            throw error;
        }


        // --------------------------------------------------
        // CHECK FEEDBACK LINKS
        // --------------------------------------------------

        // This table exists in the current feedback module.
        // We deliberately require the officer to delete
        // associated feedback links first.

        try {

            const [feedbackRows] =
                await connection.query(
                    `SELECT
                        COUNT(*) AS total

                     FROM timetable_feedback_links

                     WHERE timetable_id = ?`,
                    [
                        Number(timetableId)
                    ]
                );


            const feedbackCount =
                Number(
                    feedbackRows[0]?.total ||
                    0
                );


            if (
                feedbackCount > 0
            ) {

                const error =
                    new Error(
                        `Cannot delete this timetable because ${feedbackCount} feedback link(s) are linked to it. Delete the feedback link(s) first.`
                    );

                error.statusCode = 409;

                throw error;
            }


        } catch (error) {

            // Ignore only a missing feedback table.
            // Do not hide actual database errors.

            if (
                !String(
                    error.message || ''
                ).toLowerCase().includes(
                    "doesn't exist"
                )
            ) {

                throw error;
            }
        }


        // --------------------------------------------------
        // DELETE VENUE ASSIGNMENTS
        // --------------------------------------------------

        await connection.query(
            `DELETE tev

             FROM timetable_entry_venues tev

             INNER JOIN timetable_entries te
                ON tev.timetable_entry_id =
                   te.id

             WHERE te.timetable_id = ?`,
            [
                Number(timetableId)
            ]
        );


        // --------------------------------------------------
        // DELETE INVIGILATOR ASSIGNMENTS
        // --------------------------------------------------

        await connection.query(
            `DELETE tei

             FROM timetable_entry_invigilators tei

             INNER JOIN timetable_entries te
                ON tei.timetable_entry_id =
                   te.id

             WHERE te.timetable_id = ?`,
            [
                Number(timetableId)
            ]
        );


        // --------------------------------------------------
        // DELETE TIMETABLE ENTRIES
        // --------------------------------------------------

        await connection.query(
            `DELETE FROM timetable_entries

             WHERE timetable_id = ?`,
            [
                Number(timetableId)
            ]
        );


        // --------------------------------------------------
        // DELETE TIMETABLE
        // --------------------------------------------------

        const [result] =
            await connection.query(
                `DELETE FROM timetables

                 WHERE id = ?
                 AND session_id = ?`,
                [
                    Number(timetableId),

                    Number(
                        timetable.session_id
                    )
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            const error =
                new Error(
                    'Timetable could not be deleted'
                );

            error.statusCode = 409;

            throw error;
        }


        await connection.commit();


        return {

            timetable_id:
                Number(
                    timetableId
                ),

            session_id:
                Number(
                    timetable.session_id
                ),

            version_number:
                Number(
                    timetable.version_number
                ),

            title:
                timetable.title,

            status:
                timetable.status

        };


    } catch (error) {

        try {

            await connection.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                'Delete timetable rollback error:',
                rollbackError.message
            );
        }


        throw error;


    } finally {

        connection.release();
    }
};

// ==========================================================
// EXPORTS
// ==========================================================
module.exports = {
    getTimetableVersions,
    getTimetableById,
    publishTimetable,
    archiveTimetable,
    updateTimetable,
    deleteTimetable
};