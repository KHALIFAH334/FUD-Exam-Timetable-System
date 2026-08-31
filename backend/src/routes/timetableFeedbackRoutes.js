const express =
    require('express');


const {
    getForm,
    submitForm,
    createLink,
    listLinks,
    updateLinkStatus,
    deleteLink
} = require(
    '../controllers/timetableFeedbackController'
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
// PUBLIC FEEDBACK FORM
//
// NO LOGIN REQUIRED
// ==========================================================

router.get(
    '/form/:token',
    getForm
);


router.post(
    '/form/:token',
    submitForm
);


// ==========================================================
// EVERYTHING BELOW THIS POINT REQUIRES LOGIN
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
// GENERATE LINK
// ==========================================================

router.post(
    '/links',
    createLink
);


// ==========================================================
// LIST GENERATED LINKS
// ==========================================================

router.get(
    '/links',
    listLinks
);


// ==========================================================
// ENABLE / DISABLE LINK
// ==========================================================

router.patch(
    '/links/:id/status',
    updateLinkStatus
);


// ==========================================================
// DELETE LINK
// ==========================================================

router.delete(
    '/links/:id',
    deleteLink
);


module.exports =
    router;