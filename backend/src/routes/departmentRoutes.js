const express = require('express');

const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');

const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// All department routes require login
router.use(authenticate);

// View departments
router.get('/', getDepartments);

router.get('/:id', getDepartmentById);

// Exam Officer management
router.post(
    '/',
    authorizeRoles('exam_officer'),
    createDepartment
);

router.put(
    '/:id',
    authorizeRoles('exam_officer'),
    updateDepartment
);

router.delete(
    '/:id',
    authorizeRoles('exam_officer'),
    deleteDepartment
);

module.exports = router;