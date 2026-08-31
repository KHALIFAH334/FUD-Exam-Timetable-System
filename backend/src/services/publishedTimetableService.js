const db = require('../config/db');


// ==========================================================
// GET PUBLISHED TIMETABLE FOR COORDINATOR DEPARTMENT
// ==========================================================
const getDepartmentPublishedTimetable = async (
    sessionId,
    facultyId,
    departmentId
) => {

    // ------------------------------------------------------
    // 1. VALIDATE DEPARTMENT
    // ------------------------------------------------------

    const [departmentRows] =
        await db.query(
            `SELECT
                id,
                faculty_id,
                name,
                short_code

             FROM departments

             WHERE id = ?
             AND faculty_id = ?

             LIMIT 1`,
            [
                Number(departmentId),
                Number(facultyId)
            ]
        );


    if (departmentRows.length === 0) {

        const error =
            new Error(
                'Department not found for this faculty'
            );

        error.statusCode = 404;

        throw error;
    }


    const department =
        departmentRows[0];


    // ------------------------------------------------------
    // 2. GET CURRENT PUBLISHED TIMETABLE
    // ------------------------------------------------------

    const [timetableRows] =
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

             WHERE t.session_id = ?
             AND a.faculty_id = ?
             AND t.status = 'published'

             ORDER BY
                t.version_number DESC

             LIMIT 1`,
            [
                Number(sessionId),
                Number(facultyId)
            ]
        );


    if (timetableRows.length === 0) {

        const error =
            new Error(
                'No published timetable is available for this session'
            );

        error.statusCode = 404;

        throw error;
    }


    const timetable =
        timetableRows[0];


    // ------------------------------------------------------
    // 3. GET ONLY THIS DEPARTMENT'S EXAMS
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

                c.department_id,

                d.short_code
                    AS department_code,

                d.name
                    AS department_name,

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
             AND c.department_id = ?

             ORDER BY
                te.exam_date ASC,
                ts.start_time ASC,
                c.course_code ASC`,
            [
                Number(timetable.id),
                Number(departmentId)
            ]
        );


    // ------------------------------------------------------
    // 4. GET VENUES FOR THIS DEPARTMENT'S ENTRIES
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

             INNER JOIN courses c
                ON te.course_id = c.id

             WHERE te.timetable_id = ?
             AND c.department_id = ?

             ORDER BY
                tev.timetable_entry_id ASC,
                v.venue_code ASC`,
            [
                Number(timetable.id),
                Number(departmentId)
            ]
        );


    // ------------------------------------------------------
    // 5. GET INVIGILATORS FOR THESE EXAMS
    // ------------------------------------------------------

    const [invigilatorRows] =
        await db.query(
            `SELECT
                tei.timetable_entry_id,
                tei.invigilator_id,

                i.staff_id,
                i.full_name,
                i.department_id,

                d.short_code
                    AS department_code,

                d.name
                    AS department_name

             FROM timetable_entry_invigilators tei

             INNER JOIN invigilators i
                ON tei.invigilator_id = i.id

             INNER JOIN departments d
                ON i.department_id = d.id

             INNER JOIN timetable_entries te
                ON tei.timetable_entry_id = te.id

             INNER JOIN courses c
                ON te.course_id = c.id

             WHERE te.timetable_id = ?
             AND c.department_id = ?

             ORDER BY
                tei.timetable_entry_id ASC,
                i.staff_id ASC`,
            [
                Number(timetable.id),
                Number(departmentId)
            ]
        );


    // ------------------------------------------------------
    // 6. BUILD VENUE MAP
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
    // 7. BUILD INVIGILATOR MAP
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


        if (!invigilatorMap.has(entryId)) {

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
                    invigilator.department_name
            });
    }


    // ------------------------------------------------------
    // 8. BUILD COMPLETE DEPARTMENT ENTRIES
    // ------------------------------------------------------

    const completeEntries =
        entries.map(
            entry => {

                const entryId =
                    Number(entry.id);


                const venues =
                    venueMap.get(entryId) || [];


                const invigilators =
                    invigilatorMap.get(entryId) || [];


                return {

                    id:
                        entryId,

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

                        allocated_candidates:
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
                            ),

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
    // 9. RETURN
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

            title:
                timetable.title,

            version_number:
                Number(
                    timetable.version_number
                ),

            status:
                timetable.status
        },

        department: {

            id:
                Number(
                    department.id
                ),

            name:
                department.name,

            code:
                department.short_code
        },

        statistics: {

            department_entries:
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
// EXPORTS
// ==========================================================
module.exports = {
    getDepartmentPublishedTimetable
};