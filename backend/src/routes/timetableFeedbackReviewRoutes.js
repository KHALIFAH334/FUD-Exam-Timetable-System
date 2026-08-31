const express =
    require('express');


const {
    listSubmissions,
    getSubmission,
    reviewSubmission
} = require(
    '../controllers/timetableFeedbackReviewController'
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
// EXAM OFFICER ONLY
// ==========================================================

router.use(
    authenticate
);


router.use(
    authorizeRoles(
        'exam_officer'
    )
);


// ==========================================================
// LIST SUBMISSIONS
// ==========================================================
router.get(
    '/',
    listSubmissions
);


// ==========================================================
// GET ONE
// ==========================================================
router.get(
    '/:id',
    getSubmission
);


// ==========================================================
// REVIEW / UPDATE
// ==========================================================
router.patch(
    '/:id',
    reviewSubmission
);


module.exports =
    router;