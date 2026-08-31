const express = require('express');

const {
    getRegistrations,
    createRegistration,
    updateRegistration
} = require('../controllers/registrationController');

const authenticate =
    require('../middleware/authMiddleware');

const authorizeRoles =
    require('../middleware/roleMiddleware');

const router = express.Router();


router.use(authenticate);


// View registrations
router.get(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    getRegistrations
);


// Upload registration
router.post(
    '/',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    createRegistration
);


// Update registration
router.put(
    '/:id',
    authorizeRoles(
        'exam_officer',
        'departmental_coordinator'
    ),
    updateRegistration
);


module.exports = router;