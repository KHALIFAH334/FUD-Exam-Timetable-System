const express = require('express');

const {
    getDashboard,
    getFaculties,
    getExamOfficers,
    getDepartmentalCoordinators,
    getUsers,
    createUser,
    updateUser,
    setUserStatus,
    deleteUser
} = require('../controllers/adminController');

const authenticate =
    require('../middleware/authMiddleware');

const authorizeRoles =
    require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router.use(
    authorizeRoles('super_admin')
);


// ==========================================================
// DASHBOARD
// ==========================================================

router.get(
    '/dashboard',
    getDashboard
);


// ==========================================================
// FACULTIES
// ==========================================================

router.get(
    '/faculties',
    getFaculties
);


// ==========================================================
// EXAM OFFICERS
// ==========================================================

router.get(
    '/exam-officers',
    getExamOfficers
);


// ==========================================================
// DEPARTMENTAL COORDINATORS
// ==========================================================

router.get(
    '/departmental-coordinators',
    getDepartmentalCoordinators
);


// ==========================================================
// ALL USERS
// ==========================================================

router.get(
    '/users',
    getUsers
);


// ==========================================================
// CREATE USER
// ==========================================================

router.post(
    '/users',
    createUser
);


// ==========================================================
// UPDATE USER
// ==========================================================

router.put(
    '/users/:id',
    updateUser
);


// ==========================================================
// ACTIVATE / DISABLE
// ==========================================================

router.patch(
    '/users/:id/status',
    setUserStatus
);


// ==========================================================
// REMOVE USER
// ==========================================================

router.delete(
    '/users/:id',
    deleteUser
);


module.exports = router;