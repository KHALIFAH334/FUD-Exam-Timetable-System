const express =
    require('express');


const {
    getInvigilators,
    getInvigilatorById,
    createInvigilator,
    updateInvigilator,
    setInvigilatorStatus,
    deleteInvigilator
} = require(
    '../controllers/invigilatorController'
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
    getInvigilators
);


router.get(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getInvigilatorById
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
    createInvigilator
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
    updateInvigilator
);


// ==========================================================
// STATUS
// EXAM OFFICER ONLY
// ==========================================================

router.patch(
    '/:id/status',
    authorizeRoles(
        'exam_officer'
    ),
    setInvigilatorStatus
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
    deleteInvigilator
);


module.exports =
    router;