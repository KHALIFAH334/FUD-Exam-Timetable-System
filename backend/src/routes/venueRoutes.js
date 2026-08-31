const express =
    require('express');


const {
    getVenues,
    getVenueById,
    createVenue,
    updateVenue,
    setVenueStatus,
    deleteVenue
} = require(
    '../controllers/venueController'
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
// VIEW VENUES
// EXAM OFFICER + DEPARTMENTAL COORDINATOR
// ==========================================================

router.get(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getVenues
);


router.get(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getVenueById
);


// ==========================================================
// CREATE VENUE
// EXAM OFFICER ONLY
// ==========================================================

router.post(
    '/',
    authorizeRoles(
        'exam_officer'
    ),
    createVenue
);


// ==========================================================
// UPDATE VENUE
// EXAM OFFICER ONLY
// ==========================================================

router.put(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    updateVenue
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
    setVenueStatus
);


// ==========================================================
// DELETE VENUE
// EXAM OFFICER ONLY
// ==========================================================

router.delete(
    '/:id',
    authorizeRoles(
        'exam_officer'
    ),
    deleteVenue
);


module.exports =
    router;