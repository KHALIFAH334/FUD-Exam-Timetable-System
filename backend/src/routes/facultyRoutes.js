const express = require('express');

const {
    getFaculties,
    getMyFaculty
} = require('../controllers/facultyController');

const authenticate =
    require('../middleware/authMiddleware');

const authorizeRoles =
    require('../middleware/roleMiddleware');


const router =
    express.Router();


router.use(
    authenticate
);


// ==========================================================
// ALL FACULTIES
//
// Exam Officer uses this list for the Department faculty
// selection dropdown.
// ==========================================================

router.get(
    '/',
    authorizeRoles('exam_officer'),
    getFaculties
);


// ==========================================================
// LOGGED-IN USER'S FACULTY
// ==========================================================

router.get(
    '/me',
    getMyFaculty
);


module.exports = router;