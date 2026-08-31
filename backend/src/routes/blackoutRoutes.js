const express = require('express');

const {
    getBlackoutDates,
    getBlackoutDateById,
    createBlackoutDate,
    updateBlackoutDate,
    deleteBlackoutDate
} = require('../controllers/blackoutController');

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
    getBlackoutDates
);


router.get(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getBlackoutDateById
);


// Exam Officer only
router.post(
    '/',
    authorizeRoles('exam_officer'),
    createBlackoutDate
);


router.put(
    '/:id',
    authorizeRoles('exam_officer'),
    updateBlackoutDate
);


router.delete(
    '/:id',
    authorizeRoles('exam_officer'),
    deleteBlackoutDate
);


module.exports = router;