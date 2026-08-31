const express =
    require('express');


const {
    trackComplaint
} = require(
    '../controllers/feedbackTrackingController'
);


const router =
    express.Router();


// ==========================================================
// PUBLIC COMPLAINT TRACKING
// NO LOGIN REQUIRED
// ==========================================================
router.post(
    '/',
    trackComplaint
);


module.exports =
    router;