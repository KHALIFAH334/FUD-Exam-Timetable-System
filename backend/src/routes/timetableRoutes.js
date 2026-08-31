const express =
    require('express');


const {
    listTimetables,
    getTimetable,
    publish,
    archive,
    update,
    remove
} = require(
    '../controllers/timetableController'
);


const {
    getDepartmentTimetable
} = require(
    '../controllers/publishedTimetableController'
);


const {
    downloadTimetable,
    downloadPublishedTimetable
} = require(
    '../controllers/timetableExportController'
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


// ==========================================================
// AUTHENTICATION
// ==========================================================

router.use(
    authenticate
);


// ==========================================================
// DEPARTMENTAL COORDINATOR
// ==========================================================

router.get(
    '/published/department',
    authorizeRoles(
        'departmental_coordinator'
    ),
    getDepartmentTimetable
);


// ==========================================================
// PUBLISHED TIMETABLE DOWNLOAD
// ==========================================================

router.get(
    '/published/download/:format',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    downloadPublishedTimetable
);


// ==========================================================
// EXAM OFFICER
// LIST
// ==========================================================

router.get(
    '/',
    authorizeRoles(
        'exam_officer'
    ),
    listTimetables
);


// ==========================================================
// EXAM OFFICER
// PUBLISH
// ==========================================================

router.patch(
    '/:id/publish',
    authorizeRoles(
        'exam_officer'
    ),
    publish
);


// ==========================================================
// EXAM OFFICER
// ARCHIVE
// ==========================================================

router.patch(
    '/:id/archive',
    authorizeRoles(
        'exam_officer'
    ),
    archive
);


// ==========================================================
// EXAM OFFICER
// EDIT METADATA
// ==========================================================

router.put(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    update
);


// ==========================================================
// EXAM OFFICER
// DELETE
// ==========================================================

router.delete(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    remove
);


// ==========================================================
// EXAM OFFICER
// DOWNLOAD ANY VERSION
// ==========================================================

router.get(
    '/:id/download/:format',
    authorizeRoles(
        'exam_officer'
    ),
    downloadTimetable
);


// ==========================================================
// EXAM OFFICER
// GET ONE
// ==========================================================

router.get(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    getTimetable
);


module.exports =
    router;