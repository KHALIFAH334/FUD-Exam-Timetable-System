const express = require('express');

const {
    getFacultyUsers,
    getFacultyDepartments,
    createFacultyUser,
    updateFacultyUser,
    setFacultyUserStatus,
    deleteFacultyUser
} = require('../controllers/examOfficerUserController');

const authenticate =
    require('../middleware/authMiddleware');

const authorizeRoles =
    require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.use(
    authorizeRoles('exam_officer')
);

// ==========================================================
// USERS
// ==========================================================

router.get(
    '/users',
    getFacultyUsers
);

router.get(
    '/departments',
    getFacultyDepartments
);

router.post(
    '/users',
    createFacultyUser
);

router.put(
    '/users/:id',
    updateFacultyUser
);

router.patch(
    '/users/:id/status',
    setFacultyUserStatus
);

router.delete(
    '/users/:id',
    deleteFacultyUser
);

module.exports = router;