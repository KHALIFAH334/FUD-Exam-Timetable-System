const db =
    require('../config/db');


// ==========================================================
// GET ALL INVIGILATORS
// ==========================================================

const getInvigilators = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const userRole =
            String(
                req.user.role
            )
                .trim()
                .toLowerCase();


        const userDepartmentId =
            req.user.department_id
                ? Number(
                    req.user.department_id
                )
                : null;


        const {
            department_id,
            is_active
        } = req.query;


        let sql = `
            SELECT
                i.id,
                i.department_id,

                d.name AS department_name,
                d.short_code AS department_code,

                i.staff_id,
                i.full_name,
                i.max_duties_per_semester,
                i.is_active,
                i.created_at,
                i.updated_at

            FROM invigilators i

            INNER JOIN departments d
                ON i.department_id = d.id

            WHERE d.faculty_id = ?
        `;


        const params = [
            facultyId
        ];


        // --------------------------------------------------
        // COORDINATOR: OWN DEPARTMENT
        // --------------------------------------------------

        if (
            userRole ===
            'departmental_coordinator'
        ) {

            if (
                !userDepartmentId
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        'No department is assigned to this coordinator'

                });
            }


            sql += `
                AND i.department_id = ?
            `;


            params.push(
                userDepartmentId
            );


        } else if (
            department_id
        ) {

            sql += `
                AND i.department_id = ?
            `;


            params.push(
                Number(
                    department_id
                )
            );
        }


        if (
            is_active === 'true' ||
            is_active === 'false'
        ) {

            sql += `
                AND i.is_active = ?
            `;


            params.push(
                is_active === 'true'
            );
        }


        sql += `
            ORDER BY
                d.short_code ASC,
                i.staff_id ASC
        `;


        const [invigilators] =
            await db.query(
                sql,
                params
            );


        return res.status(200).json({

            success: true,

            count:
                invigilators.length,

            invigilators

        });


    } catch (error) {

        console.error(
            'Get invigilators error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve invigilators'

        });
    }
};


// ==========================================================
// GET ONE INVIGILATOR
// ==========================================================

const getInvigilatorById = async (
    req,
    res
) => {

    try {

        const invigilatorId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const userRole =
            String(
                req.user.role
            )
                .trim()
                .toLowerCase();


        const userDepartmentId =
            req.user.department_id
                ? Number(
                    req.user.department_id
                )
                : null;


        const [rows] =
            await db.query(
                `SELECT
                    i.id,
                    i.department_id,

                    d.name AS department_name,
                    d.short_code AS department_code,

                    i.staff_id,
                    i.full_name,
                    i.max_duties_per_semester,
                    i.is_active,
                    i.created_at,
                    i.updated_at

                 FROM invigilators i

                 INNER JOIN departments d
                    ON i.department_id = d.id

                 WHERE i.id = ?
                 AND d.faculty_id = ?

                 LIMIT 1`,
                [
                    invigilatorId,

                    facultyId
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invigilator not found'

            });
        }


        const invigilator =
            rows[0];


        if (
            userRole ===
            'departmental_coordinator' &&
            Number(
                invigilator.department_id
            ) !==
            Number(
                userDepartmentId
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'You can only access invigilators from your department'

            });
        }


        return res.status(200).json({

            success: true,

            invigilator

        });


    } catch (error) {

        console.error(
            'Get invigilator error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve invigilator'

        });
    }
};


// ==========================================================
// CREATE INVIGILATOR
// ==========================================================

const createInvigilator = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const userRole =
            String(
                req.user.role
            )
                .trim()
                .toLowerCase();


        const userDepartmentId =
            req.user.department_id
                ? Number(
                    req.user.department_id
                )
                : null;


        let {
            department_id,
            staff_id,
            full_name,
            max_duties_per_semester = 3
        } = req.body;


        if (
            !staff_id ||
            !full_name
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Staff ID and full name are required'

            });
        }


        if (
            Number(
                max_duties_per_semester
            ) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Maximum duties must be greater than zero'

            });
        }


        if (
            userRole ===
            'departmental_coordinator'
        ) {

            department_id =
                userDepartmentId;
        }


        if (
            !department_id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Department is required'

            });
        }


        const [departmentRows] =
            await db.query(
                `SELECT
                    id,
                    name,
                    short_code

                 FROM departments

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    Number(
                        department_id
                    ),

                    facultyId
                ]
            );


        if (
            departmentRows.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid department'

            });
        }


        const normalizedStaffId =
            String(
                staff_id
            )
                .trim()
                .toUpperCase();


        const [duplicate] =
            await db.query(
                `SELECT
                    id

                 FROM invigilators

                 WHERE staff_id = ?

                 LIMIT 1`,
                [
                    normalizedStaffId
                ]
            );


        if (
            duplicate.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Staff ID already exists'

            });
        }


        const [result] =
            await db.query(
                `INSERT INTO invigilators
                (
                    department_id,
                    staff_id,
                    full_name,
                    max_duties_per_semester,
                    is_active
                )

                VALUES (?, ?, ?, ?, TRUE)`,
                [
                    Number(
                        department_id
                    ),

                    normalizedStaffId,

                    String(
                        full_name
                    ).trim(),

                    Number(
                        max_duties_per_semester
                    )
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                'Invigilator created successfully',

            invigilator: {

                id:
                    result.insertId,

                department_id:
                    Number(
                        department_id
                    ),

                department_name:
                    departmentRows[0].name,

                department_code:
                    departmentRows[0].short_code,

                staff_id:
                    normalizedStaffId,

                full_name:
                    String(
                        full_name
                    ).trim(),

                max_duties_per_semester:
                    Number(
                        max_duties_per_semester
                    ),

                is_active:
                    true

            }

        });


    } catch (error) {

        console.error(
            'Create invigilator error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to create invigilator'

        });
    }
};


// ==========================================================
// UPDATE INVIGILATOR
// ==========================================================

const updateInvigilator = async (
    req,
    res
) => {

    try {

        const invigilatorId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const userRole =
            String(
                req.user.role
            )
                .trim()
                .toLowerCase();


        const userDepartmentId =
            req.user.department_id
                ? Number(
                    req.user.department_id
                )
                : null;


        let {
            department_id,
            staff_id,
            full_name,
            max_duties_per_semester
        } = req.body;


        if (
            !staff_id ||
            !full_name ||
            !max_duties_per_semester
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Required invigilator fields are missing'

            });
        }


        if (
            Number(
                max_duties_per_semester
            ) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Maximum duties must be greater than zero'

            });
        }


        const [existingRows] =
            await db.query(
                `SELECT
                    i.id,
                    i.department_id

                 FROM invigilators i

                 INNER JOIN departments d
                    ON i.department_id = d.id

                 WHERE i.id = ?
                 AND d.faculty_id = ?

                 LIMIT 1`,
                [
                    invigilatorId,

                    facultyId
                ]
            );


        if (
            existingRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invigilator not found'

            });
        }


        if (
            userRole ===
            'departmental_coordinator'
        ) {

            if (
                Number(
                    existingRows[0].department_id
                ) !==
                Number(
                    userDepartmentId
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        'You can only update invigilators from your department'

                });
            }


            department_id =
                userDepartmentId;
        }


        if (
            !department_id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Department is required'

            });
        }


        const [departmentRows] =
            await db.query(
                `SELECT
                    id

                 FROM departments

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    Number(
                        department_id
                    ),

                    facultyId
                ]
            );


        if (
            departmentRows.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid department'

            });
        }


        const normalizedStaffId =
            String(
                staff_id
            )
                .trim()
                .toUpperCase();


        const [duplicate] =
            await db.query(
                `SELECT
                    id

                 FROM invigilators

                 WHERE staff_id = ?
                 AND id <> ?

                 LIMIT 1`,
                [
                    normalizedStaffId,

                    invigilatorId
                ]
            );


        if (
            duplicate.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Staff ID already exists'

            });
        }


        const [result] =
            await db.query(
                `UPDATE invigilators

                 SET
                    department_id = ?,
                    staff_id = ?,
                    full_name = ?,
                    max_duties_per_semester = ?

                 WHERE id = ?`,
                [
                    Number(
                        department_id
                    ),

                    normalizedStaffId,

                    String(
                        full_name
                    ).trim(),

                    Number(
                        max_duties_per_semester
                    ),

                    invigilatorId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invigilator not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                'Invigilator updated successfully'

        });


    } catch (error) {

        console.error(
            'Update invigilator error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update invigilator'

        });
    }
};


// ==========================================================
// ACTIVATE / DEACTIVATE
// ==========================================================

const setInvigilatorStatus = async (
    req,
    res
) => {

    try {

        const invigilatorId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            is_active
        } = req.body;


        if (
            typeof is_active !==
            'boolean'
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'is_active must be true or false'

            });
        }


        const [result] =
            await db.query(
                `UPDATE invigilators i

                 INNER JOIN departments d
                    ON i.department_id = d.id

                 SET
                    i.is_active = ?

                 WHERE i.id = ?
                 AND d.faculty_id = ?`,
                [
                    is_active,

                    invigilatorId,

                    facultyId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invigilator not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                is_active
                    ? 'Invigilator activated successfully'
                    : 'Invigilator deactivated successfully'

        });


    } catch (error) {

        console.error(
            'Invigilator status error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update invigilator status'

        });
    }
};


// ==========================================================
// DELETE INVIGILATOR
// EXAM OFFICER ONLY
// ==========================================================

const deleteInvigilator = async (
    req,
    res
) => {

    try {

        const invigilatorId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        if (
            !Number.isInteger(
                invigilatorId
            ) ||
            invigilatorId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid invigilator ID'

            });
        }


        // --------------------------------------------------
        // VERIFY FACULTY OWNERSHIP
        // --------------------------------------------------

        const [invigilatorRows] =
            await db.query(
                `SELECT
                    i.id,
                    i.staff_id,
                    i.full_name

                 FROM invigilators i

                 INNER JOIN departments d
                    ON i.department_id = d.id

                 WHERE i.id = ?
                 AND d.faculty_id = ?

                 LIMIT 1`,
                [
                    invigilatorId,

                    facultyId
                ]
            );


        if (
            invigilatorRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invigilator not found'

            });
        }


        const invigilator =
            invigilatorRows[0];


        // --------------------------------------------------
        // CHECK TIMETABLE ASSIGNMENTS
        // --------------------------------------------------

        const [assignmentRows] =
            await db.query(
                `SELECT
                    COUNT(*) AS total

                 FROM timetable_entries

                 WHERE invigilator_id = ?`,
                [
                    invigilatorId
                ]
            );


        const assignmentCount =
            Number(
                assignmentRows[0].total
            );


        if (
            assignmentCount > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    `Cannot delete ${invigilator.staff_id} because the invigilator is assigned to ${assignmentCount} timetable examination record(s).`

            });
        }


        // --------------------------------------------------
        // DELETE
        // --------------------------------------------------

        const [result] =
            await db.query(
                `DELETE FROM invigilators

                 WHERE id = ?`,
                [
                    invigilatorId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invigilator not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                `Invigilator ${invigilator.staff_id} deleted successfully`,

            invigilator_id:
                invigilatorId

        });


    } catch (error) {

        console.error(
            'Delete invigilator error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to delete invigilator'

        });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getInvigilators,

    getInvigilatorById,

    createInvigilator,

    updateInvigilator,

    setInvigilatorStatus,

    deleteInvigilator

};