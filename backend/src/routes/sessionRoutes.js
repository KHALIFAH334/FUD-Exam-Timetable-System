const express =
    require('express');


const {
    getSessions,
    getSessionById,
    createSession,
    updateSession,
    deleteSession
} = require(
    '../controllers/sessionController'
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
// VIEW SESSIONS
// ==========================================================

router.get(
    '/',
    getSessions
);


router.get(
    '/:id',
    getSessionById
);


// ==========================================================
// EXAM OFFICER MANAGEMENT
// ==========================================================

router.post(
    '/',
    authorizeRoles(
        'exam_officer'
    ),
    createSession
);


router.put(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    updateSession
);


router.delete(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    deleteSession
);


module.exports =
    router;