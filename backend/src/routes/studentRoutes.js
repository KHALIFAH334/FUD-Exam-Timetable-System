const express = require('express');

const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    setStudentStatus
} = require('../controllers/studentController');

const authenticate =
    require('../middleware/authMiddleware');

const authorizeRoles =
    require('../middleware/roleMiddleware');

const router = express.Router();


router.use(authenticate);


// Exam Officer + Coordinator may view
router.get(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getStudents
);


router.get(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getStudentById
);


// Upload
router.post(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    createStudent
);


// Update
router.put(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    updateStudent
);


// Exam Officer only
router.patch(
    '/:id/status',
    authorizeRoles('exam_officer'),
    setStudentStatus
);


module.exports = router;