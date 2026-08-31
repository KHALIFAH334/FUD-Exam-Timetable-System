const express =
    require('express');


const {
    schedulerPreflight,
    generatePreview,
    generateDraft
} = require(
    '../controllers/schedulerController'
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
// PREFLIGHT
// ==========================================================
router.get(
    '/preflight',
    authorizeRoles(
        'exam_officer'
    ),
    schedulerPreflight
);


// ==========================================================
// GENERATE PREVIEW
// DOES NOT SAVE
// ==========================================================
router.post(
    '/generate-preview',
    authorizeRoles(
        'exam_officer'
    ),
    generatePreview
);


// ==========================================================
// GENERATE + SAVE DRAFT
// ==========================================================
router.post(
    '/generate-draft',
    authorizeRoles(
        'exam_officer'
    ),
    generateDraft
);


module.exports =
    router;