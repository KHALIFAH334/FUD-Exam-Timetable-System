const express =
    require('express');


const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    setCourseStatus,
    deleteCourse
} = require(
    '../controllers/courseController'
);


const authenticate =
    require(
        '../middleware/authMiddleware'
    );


const authorizeRoles =
    require(
        '../middleware/roleMiddleware'
    );


const router =
    express.Router();


router.use(
    authenticate
);


// ==========================================================
// VIEW COURSES
// ==========================================================

router.get(
    '/',
    getCourses
);


router.get(
    '/:id',
    getCourseById
);


// ==========================================================
// CREATE
// ==========================================================

router.post(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    createCourse
);


// ==========================================================
// UPDATE
// ==========================================================

router.put(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    updateCourse
);


// ==========================================================
// ACTIVATE / DEACTIVATE
// EXAM OFFICER ONLY
// ==========================================================

router.patch(
    '/:id/status',
    authorizeRoles(
        'exam_officer'
    ),
    setCourseStatus
);


// ==========================================================
// DELETE
// EXAM OFFICER ONLY
// ==========================================================

router.delete(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    deleteCourse
);


module.exports =
    router;