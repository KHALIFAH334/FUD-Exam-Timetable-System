const db = require('../config/db');


// ==========================================================
// BUILD COURSE CONFLICT GRAPH
// ==========================================================
const buildCourseConflictGraph = async (
    sessionId,
    facultyId
) => {

    // Confirm session/semester belongs to faculty
    const [sessionRows] = await db.query(
        `SELECT
            id,
            session_name,
            semester

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
            new Error('Academic session not found');

        error.statusCode = 404;

        throw error;
    }


    // Find pairs of courses sharing students (heuristic: same department and same level)
    const [conflicts] = await db.query(
        `SELECT
            c1.id AS course_a_id,
            c1.course_code AS course_a_code,
            c1.course_title AS course_a_title,

            c2.id AS course_b_id,
            c2.course_code AS course_b_code,
            c2.course_title AS course_b_title,

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
         AND d2.faculty_id = ?

         ORDER BY
            c1.course_code ASC,
            c2.course_code ASC`,
        [
            Number(sessionId),
            Number(sessionId),
            Number(facultyId),
            Number(facultyId)
        ]
    );


    // Build adjacency-list graph for future CSP
    const graph = {};


    for (const conflict of conflicts) {

        const courseA =
            String(conflict.course_a_id);

        const courseB =
            String(conflict.course_b_id);


        if (!graph[courseA]) {
            graph[courseA] = [];
        }

        if (!graph[courseB]) {
            graph[courseB] = [];
        }


        graph[courseA].push({
            course_id:
                conflict.course_b_id,

            course_code:
                conflict.course_b_code,

            shared_students:
                Number(conflict.shared_students)
        });


        graph[courseB].push({
            course_id:
                conflict.course_a_id,

            course_code:
                conflict.course_a_code,

            shared_students:
                Number(conflict.shared_students)
        });
    }


    return {
        session: sessionRows[0],

        conflict_count:
            conflicts.length,

        conflicts:
            conflicts.map((item) => ({
                ...item,
                shared_students:
                    Number(item.shared_students)
            })),

        graph
    };
};


module.exports = {
    buildCourseConflictGraph
};