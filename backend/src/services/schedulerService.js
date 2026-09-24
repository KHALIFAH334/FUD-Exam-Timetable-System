const db = require('../config/db');


// ==========================================================
// GENERATE DATE RANGE
// ==========================================================
const generateDateRange = (
    startDate,
    endDate,
    blackoutDates
) => {

    const dates = [];

    const blocked =
        new Set(blackoutDates);

    const current =
        new Date(`${startDate}T00:00:00`);

    const end =
        new Date(`${endDate}T00:00:00`);


    while (current <= end) {

        const year =
            current.getFullYear();

        const month =
            String(
                current.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                current.getDate()
            ).padStart(2, '0');


        const dateString =
            `${year}-${month}-${day}`;


        if (!blocked.has(dateString)) {
            dates.push(dateString);
        }


        current.setDate(
            current.getDate() + 1
        );
    }


    return dates;
};


// ==========================================================
// BUILD SCHEDULER PREFLIGHT CONTEXT
// ==========================================================
const buildSchedulerPreflight = async (
    sessionId,
    facultyId
) => {

    // ------------------------------------------------------
    // SESSION
    // ------------------------------------------------------

    const [sessionRows] =
        await db.query(
            `SELECT
                id,
                faculty_id,
                session_name,
                semester,

                DATE_FORMAT(
                    exam_start_date,
                    '%Y-%m-%d'
                ) AS exam_start_date,

                DATE_FORMAT(
                    exam_end_date,
                    '%Y-%m-%d'
                ) AS exam_end_date,

                is_active

             FROM academic_sessions

             WHERE id = ?
             AND faculty_id = ?

             LIMIT 1`,
            [
                Number(sessionId),
                Number(facultyId)
            ]
        );


    if (sessionRows.length === 0) {

        const error =
            new Error(
                'Academic session not found'
            );

        error.statusCode = 404;

        throw error;
    }


    const session =
        sessionRows[0];


    // ------------------------------------------------------
    // ACTIVE COURSES
    // ------------------------------------------------------

    const [courses] =
        await db.query(
            `SELECT
                c.id,
                c.department_id,

                d.short_code
                    AS department_code,

                c.course_code,
                c.course_title,
                c.level,

                c.registered_students,

                c.is_general_studies,
                c.combined_group_id

             FROM courses c

             INNER JOIN departments d
                ON c.department_id = d.id

             WHERE c.session_id = ?
             AND d.faculty_id = ?
             AND c.is_active = TRUE

             ORDER BY
                c.course_code ASC`,
            [
                Number(sessionId),
                Number(facultyId)
            ]
        );


    // ------------------------------------------------------
    // TIME SLOTS
    // ------------------------------------------------------

    const [timeSlots] =
        await db.query(
            `SELECT
                ts.id,
                ts.slot_label,
                ts.start_time,
                ts.end_time

             FROM time_slots ts

             INNER JOIN academic_sessions a
                ON ts.session_id = a.id

             WHERE ts.session_id = ?
             AND a.faculty_id = ?

             ORDER BY
                FIELD(
                    ts.slot_label,
                    'Morning',
                    'Afternoon',
                    'Evening'
                )`,
            [
                Number(sessionId),
                Number(facultyId)
            ]
        );


    // ------------------------------------------------------
    // BLACKOUT DATES
    // ------------------------------------------------------

    const [blackouts] =
        await db.query(
            `SELECT
                id,

                DATE_FORMAT(
                    blackout_date,
                    '%Y-%m-%d'
                ) AS blackout_date,

                reason

             FROM blackout_dates

             WHERE session_id = ?

             ORDER BY
                blackout_date ASC`,
            [
                Number(sessionId)
            ]
        );


    const blackoutDateStrings =
        blackouts.map(
            item =>
                item.blackout_date
        );


    // ------------------------------------------------------
    // AVAILABLE EXAM DATES
    // ------------------------------------------------------

    const availableDates =
        generateDateRange(
            session.exam_start_date,
            session.exam_end_date,
            blackoutDateStrings
        );


    // ------------------------------------------------------
    // ACTIVE VENUES
    // ------------------------------------------------------

    const [venues] =
        await db.query(
            `SELECT
                id,
                venue_name,
                venue_code,
                venue_type,
                capacity,
                is_combinable

             FROM venues

             WHERE faculty_id = ?
             AND is_active = TRUE

             ORDER BY
                capacity DESC`,
            [
                Number(facultyId)
            ]
        );


    const totalVenueCapacity =
        venues.reduce(
            (total, venue) =>
                total +
                Number(
                    venue.capacity
                ),
            0
        );


    const largestVenueCapacity =
        venues.length > 0
            ? Math.max(
                ...venues.map(
                    venue =>
                        Number(
                            venue.capacity
                        )
                )
            )
            : 0;


    // ------------------------------------------------------
    // ACTIVE INVIGILATORS
    // ------------------------------------------------------

    const [invigilators] =
        await db.query(
            `SELECT
                i.id,
                i.department_id,

                d.short_code
                    AS department_code,

                i.staff_id,
                i.full_name,

                i.max_duties_per_semester

             FROM invigilators i

             INNER JOIN departments d
                ON i.department_id = d.id

             WHERE d.faculty_id = ?
             AND i.is_active = TRUE

             ORDER BY
                d.short_code ASC,
                i.staff_id ASC`,
            [
                Number(facultyId)
            ]
        );


    // ------------------------------------------------------
    // COURSE CONFLICT PAIRS
    // ------------------------------------------------------

    const [conflicts] =
        await db.query(
            `SELECT
                c1.id
                    AS course_a_id,

                c1.course_code
                    AS course_a_code,

                c2.id
                    AS course_b_id,

                c2.course_code
                    AS course_b_code,

                100 AS shared_students

             FROM courses c1

             INNER JOIN courses c2
                ON c1.department_id = c2.department_id
                AND c1.level = c2.level
                AND c1.id < c2.id

             INNER JOIN departments d1
                ON c1.department_id = d1.id

             INNER JOIN departments d2
                ON c2.department_id = d2.id

             WHERE c1.session_id = ?
             AND c2.session_id = ?

             AND d1.faculty_id = ?
             AND d2.faculty_id = ?`,
            [
                Number(sessionId),
                Number(sessionId),
                Number(facultyId),
                Number(facultyId)
            ]
        );


    // ------------------------------------------------------
    // PREFLIGHT VALIDATION
    // ------------------------------------------------------

    const errors = [];
    const warnings = [];


    if (!session.is_active) {

        errors.push(
            'Academic session is inactive'
        );
    }


    if (courses.length === 0) {

        errors.push(
            'No active courses are available'
        );
    }


    if (availableDates.length === 0) {

        errors.push(
            'No examination dates are available'
        );
    }


    if (timeSlots.length === 0) {

        errors.push(
            'No time slots are configured'
        );
    }


    if (venues.length === 0) {

        errors.push(
            'No active venues are available'
        );
    }


    if (invigilators.length === 0) {

        errors.push(
            'No active invigilators are available'
        );
    }


    const impossibleCourses =
        courses.filter(
            course =>
                Number(
                    course.registered_students
                ) >
                totalVenueCapacity
        );


    if (impossibleCourses.length > 0) {

        errors.push(
            `${impossibleCourses.length} course(s) exceed total active venue capacity`
        );
    }


    const multiVenueCourses =
        courses.filter(
            course =>
                Number(
                    course.registered_students
                ) >
                largestVenueCapacity
        );


    if (multiVenueCourses.length > 0) {

        warnings.push(
            `${multiVenueCourses.length} course(s) may require multiple venues`
        );
    }


    if (blackouts.length > 0) {

        warnings.push(
            `${blackouts.length} blackout date(s) will be excluded`
        );
    }


    const slotInstances =
        availableDates.length *
        timeSlots.length;


    return {

        ready:
            errors.length === 0,

        session,

        summary: {

            courses:
                courses.length,

            available_exam_dates:
                availableDates.length,

            time_slots:
                timeSlots.length,

            slot_instances:
                slotInstances,

            blackout_dates:
                blackouts.length,

            active_venues:
                venues.length,

            total_venue_capacity:
                totalVenueCapacity,

            largest_venue_capacity:
                largestVenueCapacity,

            active_invigilators:
                invigilators.length,

            conflict_pairs:
                conflicts.length
        },

        errors,

        warnings,

        available_dates:
            availableDates,

        time_slots:
            timeSlots,

        blackout_dates:
            blackouts,

        courses,

        venues,

        invigilators,

        conflicts:
            conflicts.map(
                conflict => ({
                    ...conflict,

                    shared_students:
                        Number(
                            conflict.shared_students
                        )
                })
            )
    };
};


// ==========================================================
// BUILD STUDENT CONFLICT MAP
// ==========================================================
const buildConflictMap = (
    courses,
    conflicts
) => {

    const map =
        new Map();


    for (const course of courses) {

        map.set(
            Number(course.id),
            new Set()
        );
    }


    for (const conflict of conflicts) {

        const courseA =
            Number(
                conflict.course_a_id
            );

        const courseB =
            Number(
                conflict.course_b_id
            );


        if (!map.has(courseA)) {

            map.set(
                courseA,
                new Set()
            );
        }


        if (!map.has(courseB)) {

            map.set(
                courseB,
                new Set()
            );
        }


        map
            .get(courseA)
            .add(courseB);


        map
            .get(courseB)
            .add(courseA);
    }


    return map;
};


// ==========================================================
// BUILD DATE × TIME-SLOT INSTANCES
// ==========================================================
const buildSlotInstances = (
    availableDates,
    timeSlots
) => {

    const instances = [];


    for (const examDate of availableDates) {

        for (const slot of timeSlots) {

            instances.push({

                key:
                    `${examDate}|${slot.id}`,

                exam_date:
                    examDate,

                time_slot_id:
                    Number(slot.id),

                slot_label:
                    slot.slot_label,

                start_time:
                    slot.start_time,

                end_time:
                    slot.end_time
            });
        }
    }


    return instances;
};


// ==========================================================
// ALLOCATE VENUES
// ==========================================================
const allocateVenues = (
    schedule,
    venues
) => {

    if (
        !Array.isArray(venues) ||
        venues.length === 0
    ) {

        const error =
            new Error(
                'No active venues are available'
            );

        error.statusCode = 409;

        throw error;
    }


    const occupiedVenues =
        new Map();


    const result = [];


    for (const exam of schedule) {

        const slotKey =
            `${exam.exam_date}|${exam.time_slot_id}`;


        if (!occupiedVenues.has(slotKey)) {

            occupiedVenues.set(
                slotKey,
                new Set()
            );
        }


        const occupied =
            occupiedVenues.get(
                slotKey
            );


        const candidates =
            Number(
                exam.candidate_count
            );


        const available =
            venues
                .filter(
                    venue =>
                        !occupied.has(
                            Number(
                                venue.id
                            )
                        )
                )
                .map(
                    venue => ({
                        ...venue,

                        capacity:
                            Number(
                                venue.capacity
                            )
                    })
                );


        // --------------------------------------------------
        // SINGLE VENUE FIRST
        // --------------------------------------------------

        const singleVenue =
            available
                .filter(
                    venue =>
                        venue.capacity >=
                        candidates
                )
                .sort(
                    (a, b) =>
                        a.capacity -
                        b.capacity
                )[0];


        let allocations = [];


        if (singleVenue) {

            allocations.push({

                venue_id:
                    Number(
                        singleVenue.id
                    ),

                venue_code:
                    singleVenue.venue_code,

                venue_name:
                    singleVenue.venue_name,

                capacity:
                    singleVenue.capacity,

                allocated_candidates:
                    candidates
            });


            occupied.add(
                Number(
                    singleVenue.id
                )
            );
        }

        else {

            // ----------------------------------------------
            // MULTIPLE COMBINABLE VENUES
            // ----------------------------------------------

            const combinable =
                available
                    .filter(
                        venue =>
                            Boolean(
                                venue.is_combinable
                            )
                    )
                    .sort(
                        (a, b) =>
                            b.capacity -
                            a.capacity
                    );


            let remaining =
                candidates;


            for (const venue of combinable) {

                if (remaining <= 0) {
                    break;
                }


                const allocated =
                    Math.min(
                        venue.capacity,
                        remaining
                    );


                allocations.push({

                    venue_id:
                        Number(
                            venue.id
                        ),

                    venue_code:
                        venue.venue_code,

                    venue_name:
                        venue.venue_name,

                    capacity:
                        venue.capacity,

                    allocated_candidates:
                        allocated
                });


                occupied.add(
                    Number(
                        venue.id
                    )
                );


                remaining -=
                    allocated;
            }


            if (remaining > 0) {

                const error =
                    new Error(
                        `Unable to allocate sufficient venue capacity for ${exam.course_code}`
                    );

                error.statusCode = 409;

                throw error;
            }
        }


        const allocatedCapacity =
            allocations.reduce(
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


        const allocatedCandidates =
            allocations.reduce(
                (
                    total,
                    venue
                ) =>
                    total +
                    Number(
                        venue
                            .allocated_candidates
                    ),
                0
            );


        result.push({

            ...exam,

            venue_allocation: {

                venue_count:
                    allocations.length,

                total_capacity:
                    allocatedCapacity,

                allocated_candidates:
                    allocatedCandidates,

                venues:
                    allocations
            }
        });
    }


    return result;
};


// ==========================================================
// ALLOCATE INVIGILATORS
// ==========================================================
const allocateInvigilators = (
    schedule,
    invigilators
) => {

    if (
        !Array.isArray(invigilators) ||
        invigilators.length === 0
    ) {

        const error =
            new Error(
                'No active invigilators are available'
            );

        error.statusCode = 409;

        throw error;
    }


    const dutyCounts =
        new Map();


    for (const invigilator of invigilators) {

        dutyCounts.set(
            Number(
                invigilator.id
            ),
            0
        );
    }


    const occupiedPerSlot =
        new Map();


    const result = [];


    for (const exam of schedule) {

        const slotKey =
            `${exam.exam_date}|${exam.time_slot_id}`;


        if (!occupiedPerSlot.has(slotKey)) {

            occupiedPerSlot.set(
                slotKey,
                new Set()
            );
        }


        const occupied =
            occupiedPerSlot.get(
                slotKey
            );


        // One invigilator for each venue.
        const requiredCount =
            Math.max(
                1,
                Number(
                    exam
                        .venue_allocation
                        .venue_count
                )
            );


        const eligible =
            invigilators
                .filter(
                    invigilator => {

                        const id =
                            Number(
                                invigilator.id
                            );


                        const currentDuties =
                            Number(
                                dutyCounts.get(id) || 0
                            );


                        const maxDuties =
                            Number(
                                invigilator
                                    .max_duties_per_semester
                            );


                        return (
                            !occupied.has(id) &&
                            currentDuties <
                                maxDuties
                        );
                    }
                )
                .sort(
                    (a, b) => {

                        const dutiesA =
                            Number(
                                dutyCounts.get(
                                    Number(a.id)
                                ) || 0
                            );


                        const dutiesB =
                            Number(
                                dutyCounts.get(
                                    Number(b.id)
                                ) || 0
                            );


                        if (
                            dutiesA !==
                            dutiesB
                        ) {

                            return (
                                dutiesA -
                                dutiesB
                            );
                        }


                        return String(
                            a.staff_id
                        ).localeCompare(
                            String(
                                b.staff_id
                            )
                        );
                    }
                );


        if (
            eligible.length <
            requiredCount
        ) {

            const error =
                new Error(
                    `Insufficient available invigilators for ${exam.course_code}`
                );

            error.statusCode = 409;

            throw error;
        }


        const selected =
            eligible.slice(
                0,
                requiredCount
            );


        const assignments = [];


        for (const invigilator of selected) {

            const id =
                Number(
                    invigilator.id
                );


            const previousDuties =
                Number(
                    dutyCounts.get(id) || 0
                );


            const newDutyCount =
                previousDuties + 1;


            dutyCounts.set(
                id,
                newDutyCount
            );


            occupied.add(id);


            assignments.push({

                invigilator_id:
                    id,

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

                duty_number:
                    newDutyCount,

                max_duties_per_semester:
                    Number(
                        invigilator
                            .max_duties_per_semester
                    )
            });
        }


        result.push({

            ...exam,

            invigilator_allocation: {

                required_count:
                    requiredCount,

                assigned_count:
                    assignments.length,

                invigilators:
                    assignments
            }
        });
    }


    return {

        schedule:
            result,

        duty_counts:
            dutyCounts
    };
};


// ==========================================================
// GENERATE CSP TIMETABLE PREVIEW
// ==========================================================
const generateSchedulePreview = async (
    sessionId,
    facultyId
) => {

    // ------------------------------------------------------
    // PREFLIGHT
    // ------------------------------------------------------

    const context =
        await buildSchedulerPreflight(
            sessionId,
            facultyId
        );


    if (!context.ready) {

        const error =
            new Error(
                'Scheduling preflight failed'
            );

        error.statusCode = 400;

        error.details =
            context.errors;

        throw error;
    }


    const courses =
        context.courses;


    const slotInstances =
        buildSlotInstances(
            context.available_dates,
            context.time_slots
        );


    if (slotInstances.length === 0) {

        const error =
            new Error(
                'No scheduling slots are available'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------
    // CONFLICT MAP
    // ------------------------------------------------------

    const conflictMap =
        buildConflictMap(
            courses,
            context.conflicts
        );


    // ------------------------------------------------------
    // ORDER COURSES
    // ------------------------------------------------------

    const orderedCourses =
        [...courses]
            .sort(
                (a, b) => {

                    const degreeA =
                        conflictMap
                            .get(
                                Number(a.id)
                            )
                            ?.size || 0;


                    const degreeB =
                        conflictMap
                            .get(
                                Number(b.id)
                            )
                            ?.size || 0;


                    if (
                        degreeB !==
                        degreeA
                    ) {

                        return (
                            degreeB -
                            degreeA
                        );
                    }


                    return (
                        Number(
                            b.registered_students
                        ) -
                        Number(
                            a.registered_students
                        )
                    );
                }
            );


    // ------------------------------------------------------
    // CSP STATE
    // ------------------------------------------------------

    const assignments =
        new Map();


    const slotState =
        new Map();


    for (const slot of slotInstances) {

        slotState.set(
            slot.key,
            {
                courses: [],
                candidate_count: 0
            }
        );
    }


    const totalVenueCapacity =
        Number(
            context
                .summary
                .total_venue_capacity
        );


    let attempts = 0;

    let backtracks = 0;


    // ------------------------------------------------------
    // CONSTRAINT CHECK
    // ------------------------------------------------------

    const canAssign = (
        course,
        slot
    ) => {

        const courseId =
            Number(
                course.id
            );


        const candidates =
            Number(
                course.registered_students
            );


        const currentSlot =
            slotState.get(
                slot.key
            );


        // Total venue capacity.
        if (
            currentSlot.candidate_count +
                candidates >
            totalVenueCapacity
        ) {

            return false;
        }


        // Student conflict.
        const conflicts =
            conflictMap.get(
                courseId
            ) ||
            new Set();


        for (
            const existingCourseId
            of currentSlot.courses
        ) {

            if (
                conflicts.has(
                    Number(
                        existingCourseId
                    )
                )
            ) {

                return false;
            }
        }


        // Same department + same level:
        // maximum one examination per day.
        for (
            const [
                assignedCourseId,
                assigned
            ]
            of assignments
        ) {

            if (
                assigned.exam_date !==
                slot.exam_date
            ) {

                continue;
            }


            const existingCourse =
                courses.find(
                    courseItem =>
                        Number(
                            courseItem.id
                        ) ===
                        Number(
                            assignedCourseId
                        )
                );


            if (!existingCourse) {

                continue;
            }


            const sameDepartment =
                Number(
                    existingCourse
                        .department_id
                ) ===
                Number(
                    course.department_id
                );


            const sameLevel =
                Number(
                    existingCourse.level
                ) ===
                Number(
                    course.level
                );


            if (
                sameDepartment &&
                sameLevel
            ) {

                return false;
            }
        }


        return true;
    };


    // ------------------------------------------------------
    // SLOT ORDER
    // ------------------------------------------------------

    const getOrderedSlots = () => {

        return [
            ...slotInstances
        ].sort(
            (a, b) => {

                const stateA =
                    slotState.get(
                        a.key
                    );


                const stateB =
                    slotState.get(
                        b.key
                    );


                if (
                    stateA.candidate_count !==
                    stateB.candidate_count
                ) {

                    return (
                        stateA.candidate_count -
                        stateB.candidate_count
                    );
                }


                if (
                    a.exam_date !==
                    b.exam_date
                ) {

                    return (
                        a.exam_date
                            .localeCompare(
                                b.exam_date
                            )
                    );
                }


                return (
                    Number(
                        a.time_slot_id
                    ) -
                    Number(
                        b.time_slot_id
                    )
                );
            }
        );
    };


    // ------------------------------------------------------
    // CSP BACKTRACKING
    // ------------------------------------------------------

    const backtrack = (
        courseIndex
    ) => {

        if (
            courseIndex >=
            orderedCourses.length
        ) {

            return true;
        }


        const course =
            orderedCourses[
                courseIndex
            ];


        const courseId =
            Number(
                course.id
            );


        const domain =
            getOrderedSlots();


        for (const slot of domain) {

            attempts++;


            if (
                !canAssign(
                    course,
                    slot
                )
            ) {

                continue;
            }


            // Assign.
            assignments.set(
                courseId,
                {

                    exam_date:
                        slot.exam_date,

                    time_slot_id:
                        slot.time_slot_id,

                    slot_label:
                        slot.slot_label,

                    start_time:
                        slot.start_time,

                    end_time:
                        slot.end_time
                }
            );


            const state =
                slotState.get(
                    slot.key
                );


            state.courses.push(
                courseId
            );


            state.candidate_count +=
                Number(
                    course.registered_students
                );


            if (
                backtrack(
                    courseIndex + 1
                )
            ) {

                return true;
            }


            // Undo.
            assignments.delete(
                courseId
            );


            state.courses =
                state.courses.filter(
                    id =>
                        Number(id) !==
                        courseId
                );


            state.candidate_count -=
                Number(
                    course.registered_students
                );


            backtracks++;
        }


        return false;
    };


    // ------------------------------------------------------
    // RUN CSP
    // ------------------------------------------------------

    const solved =
        backtrack(0);


    if (!solved) {

        const error =
            new Error(
                'No valid timetable assignment could be generated'
            );

        error.statusCode = 409;

        throw error;
    }


    // ------------------------------------------------------
    // BUILD BASIC SCHEDULE
    // ------------------------------------------------------

    const schedule =
        courses
            .map(
                course => {

                    const assignment =
                        assignments.get(
                            Number(
                                course.id
                            )
                        );


                    return {

                        course_id:
                            Number(
                                course.id
                            ),

                        course_code:
                            course.course_code,

                        course_title:
                            course.course_title,

                        department_code:
                            course.department_code,

                        level:
                            Number(
                                course.level
                            ),

                        candidate_count:
                            Number(
                                course.registered_students
                            ),

                        exam_date:
                            assignment.exam_date,

                        time_slot_id:
                            assignment.time_slot_id,

                        slot_label:
                            assignment.slot_label,

                        start_time:
                            assignment.start_time,

                        end_time:
                            assignment.end_time
                    };
                }
            )
            .sort(
                (a, b) => {

                    if (
                        a.exam_date !==
                        b.exam_date
                    ) {

                        return (
                            a.exam_date
                                .localeCompare(
                                    b.exam_date
                                )
                        );
                    }


                    return (
                        Number(
                            a.time_slot_id
                        ) -
                        Number(
                            b.time_slot_id
                        )
                    );
                }
            );


    // ------------------------------------------------------
    // VENUE ALLOCATION
    // ------------------------------------------------------

    const scheduleWithVenues =
        allocateVenues(
            schedule,
            context.venues
        );


    // ------------------------------------------------------
    // INVIGILATOR ALLOCATION
    // ------------------------------------------------------

    const invigilatorResult =
        allocateInvigilators(
            scheduleWithVenues,
            context.invigilators
        );


    const finalSchedule =
        invigilatorResult.schedule;


    // ------------------------------------------------------
    // STATISTICS
    // ------------------------------------------------------

    const usedDates =
        new Set(
            finalSchedule.map(
                item =>
                    item.exam_date
            )
        );


    const usedSlots =
        new Set(
            finalSchedule.map(
                item =>
                    `${item.exam_date}|${item.time_slot_id}`
            )
        );


    const totalInvigilatorAssignments =
        finalSchedule.reduce(
            (
                total,
                exam
            ) =>
                total +
                Number(
                    exam
                        .invigilator_allocation
                        .assigned_count
                ),
            0
        );


    const usedInvigilators =
        [
            ...invigilatorResult
                .duty_counts
                .entries()
        ].filter(
            ([, count]) =>
                Number(count) > 0
        );


    const maximumAssignedDuties =
        usedInvigilators.length > 0
            ? Math.max(
                ...usedInvigilators.map(
                    ([, count]) =>
                        Number(count)
                )
            )
            : 0;


    return {

        session:
            context.session,

        generated:
            true,

        persisted:
            false,

        statistics: {

            courses_scheduled:
                finalSchedule.length,

            available_slot_instances:
                slotInstances.length,

            dates_used:
                usedDates.size,

            slot_instances_used:
                usedSlots.size,

            explicit_conflict_pairs:
                context.conflicts.length,

            csp_attempts:
                attempts,

            csp_backtracks:
                backtracks,

            total_invigilator_assignments:
                totalInvigilatorAssignments,

            invigilators_used:
                usedInvigilators.length,

            maximum_assigned_duties:
                maximumAssignedDuties
        },

        schedule:
            finalSchedule
    };
};


// ==========================================================
// PERSIST GENERATED TIMETABLE AS DRAFT
// ==========================================================
const persistScheduleDraft = async (
    sessionId,
    facultyId,
    createdBy,
    title = null,
    notes = null
) => {

    // ------------------------------------------------------
    // IMPORTANT:
    //
    // We regenerate the timetable on the server.
    // We do NOT trust a preview sent back from the browser.
    // ------------------------------------------------------

    const preview =
        await generateSchedulePreview(
            sessionId,
            facultyId
        );


    if (
        !preview.generated ||
        !Array.isArray(
            preview.schedule
        ) ||
        preview.schedule.length === 0
    ) {

        const error =
            new Error(
                'No generated schedule is available to save'
            );

        error.statusCode = 409;

        throw error;
    }


    const connection =
        await db.getConnection();


    let transactionStarted =
        false;


    try {

        await connection
            .beginTransaction();


        transactionStarted =
            true;


        // --------------------------------------------------
        // VALIDATE USER
        // --------------------------------------------------

        const [userRows] =
            await connection.query(
                `SELECT
                    id,
                    role,
                    faculty_id,
                    is_active

                 FROM users

                 WHERE id = ?
                 AND faculty_id = ?
                 AND role = 'exam_officer'
                 AND is_active = TRUE

                 LIMIT 1`,
                [
                    Number(createdBy),
                    Number(facultyId)
                ]
            );


        if (
            userRows.length === 0
        ) {

            const error =
                new Error(
                    'Invalid Exam Officer account'
                );

            error.statusCode = 403;

            throw error;
        }


        // --------------------------------------------------
        // VALIDATE SESSION
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
                    Number(sessionId),
                    Number(facultyId)
                ]
            );


        if (
            sessionRows.length === 0
        ) {

            const error =
                new Error(
                    'Academic session not found'
                );

            error.statusCode = 404;

            throw error;
        }


        const session =
            sessionRows[0];


        // --------------------------------------------------
        // DETERMINE NEXT VERSION
        // --------------------------------------------------

        const [latestVersionRows] =
            await connection.query(
                `SELECT
                    version_number

                 FROM timetables

                 WHERE session_id = ?

                 ORDER BY
                    version_number DESC

                 LIMIT 1
                 FOR UPDATE`,
                [
                    Number(sessionId)
                ]
            );


        const nextVersion =
            latestVersionRows.length > 0
                ? Number(
                    latestVersionRows[0]
                        .version_number
                ) + 1
                : 1;


        // --------------------------------------------------
        // TITLE
        // --------------------------------------------------

        const defaultTitle =
            `${session.session_name} ${session.semester} Semester Examination Timetable`;


        const finalTitle =
            title &&
            String(title).trim()
                ? String(title)
                    .trim()
                : defaultTitle;


        if (
            finalTitle.length > 200
        ) {

            const error =
                new Error(
                    'Timetable title must not exceed 200 characters'
                );

            error.statusCode = 400;

            throw error;
        }


        const finalNotes =
            notes &&
            String(notes).trim()
                ? String(notes).trim()
                : null;


        // --------------------------------------------------
        // CREATE TIMETABLE HEADER
        // --------------------------------------------------

        const [timetableResult] =
            await connection.query(
                `INSERT INTO timetables
                (
                    session_id,
                    title,
                    version_number,
                    status,
                    created_by,
                    notes
                )

                VALUES
                (?, ?, ?, 'draft', ?, ?)`,
                [
                    Number(sessionId),
                    finalTitle,
                    nextVersion,
                    Number(createdBy),
                    finalNotes
                ]
            );


        const timetableId =
            Number(
                timetableResult.insertId
            );


        let entryCount = 0;

        let venueAllocationCount = 0;

        let invigilatorAssignmentCount = 0;


        const persistedSchedule =
            [];


        // --------------------------------------------------
        // SAVE EACH EXAMINATION
        // --------------------------------------------------

        for (
            const exam
            of preview.schedule
        ) {

            // ----------------------------------------------
            // TIMETABLE ENTRY
            // ----------------------------------------------

            const [entryResult] =
                await connection.query(
                    `INSERT INTO timetable_entries
                    (
                        timetable_id,
                        course_id,
                        exam_date,
                        time_slot_id,
                        cohort_type,
                        candidate_count,
                        generated_by,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        'main',
                        ?,
                        'system',
                        'scheduled'
                    )`,
                    [
                        timetableId,

                        Number(
                            exam.course_id
                        ),

                        exam.exam_date,

                        Number(
                            exam.time_slot_id
                        ),

                        Number(
                            exam.candidate_count
                        )
                    ]
                );


            const timetableEntryId =
                Number(
                    entryResult.insertId
                );


            entryCount++;


            // ----------------------------------------------
            // VENUE ALLOCATIONS
            // ----------------------------------------------

            for (
                const venue
                of exam
                    .venue_allocation
                    .venues
            ) {

                await connection.query(
                    `INSERT INTO
                        timetable_entry_venues
                    (
                        timetable_entry_id,
                        venue_id,
                        allocated_candidates
                    )

                    VALUES (?, ?, ?)`,
                    [
                        timetableEntryId,

                        Number(
                            venue.venue_id
                        ),

                        Number(
                            venue
                                .allocated_candidates
                        )
                    ]
                );


                venueAllocationCount++;
            }


            // ----------------------------------------------
            // INVIGILATOR ASSIGNMENTS
            // ----------------------------------------------

            for (
                const invigilator
                of exam
                    .invigilator_allocation
                    .invigilators
            ) {

                await connection.query(
                    `INSERT INTO
                        timetable_entry_invigilators
                    (
                        timetable_entry_id,
                        invigilator_id
                    )

                    VALUES (?, ?)`,
                    [
                        timetableEntryId,

                        Number(
                            invigilator
                                .invigilator_id
                        )
                    ]
                );


                invigilatorAssignmentCount++;
            }


            persistedSchedule.push({

                ...exam,

                timetable_entry_id:
                    timetableEntryId
            });
        }


        // --------------------------------------------------
        // COMMIT EVERYTHING
        // --------------------------------------------------

        await connection.commit();


        transactionStarted =
            false;


        return {

            generated:
                true,

            persisted:
                true,

            timetable: {

                id:
                    timetableId,

                session_id:
                    Number(sessionId),

                session_name:
                    session.session_name,

                semester:
                    session.semester,

                title:
                    finalTitle,

                version_number:
                    nextVersion,

                status:
                    'draft',

                created_by:
                    Number(createdBy),

                notes:
                    finalNotes
            },

            statistics: {

                ...preview.statistics,

                timetable_entries:
                    entryCount,

                venue_allocations:
                    venueAllocationCount,

                invigilator_assignments:
                    invigilatorAssignmentCount
            },

            schedule:
                persistedSchedule
        };


    } catch (error) {

        if (transactionStarted) {

            try {

                await connection
                    .rollback();

            } catch (
                rollbackError
            ) {

                console.error(
                    'Timetable rollback error:',
                    rollbackError.message
                );
            }
        }


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {

            const duplicateError =
                new Error(
                    'A timetable version conflict occurred. Please try again.'
                );

            duplicateError.statusCode =
                409;

            throw duplicateError;
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
    buildSchedulerPreflight,
    generateSchedulePreview,
    persistScheduleDraft
};