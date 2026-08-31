const express = require('express');

const {
    getCourseConflicts
} = require('../controllers/conflictController');

const authenticate =
    require('../middleware/authMiddleware');

const authorizeRoles =
    require('../middleware/roleMiddleware');

const router = express.Router();


router.use(authenticate);


// Exam Officer controls timetable conflict analysis
router.get(
    '/courses',
    authorizeRoles('exam_officer'),
    getCourseConflicts
);


module.exports = router;