const express =
    require('express');


const {
    getTimeSlots,
    getTimeSlotById,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot
} = require(
    '../controllers/timeSlotController'
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
// VIEW
// ==========================================================

router.get(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getTimeSlots
);


router.get(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getTimeSlotById
);


// ==========================================================
// EXAM OFFICER MANAGEMENT
// ==========================================================

router.post(
    '/',
    authorizeRoles(
        'exam_officer'
    ),
    createTimeSlot
);


router.put(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    updateTimeSlot
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
    deleteTimeSlot
);


module.exports =
    router;