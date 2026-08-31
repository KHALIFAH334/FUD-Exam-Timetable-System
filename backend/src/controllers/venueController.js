const db =
    require('../config/db');


// ==========================================================
// ALLOWED VENUE TYPES
// ==========================================================

const allowedVenueTypes = [

    'lecture_room',

    'laboratory',

    'theatre',

    'cbt_center',

    'elearning_hall',

    'other'

];


// ==========================================================
// GET ALL VENUES
// ==========================================================

const getVenues = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            venue_type,
            is_active
        } = req.query;


        let sql = `
            SELECT
                id,
                faculty_id,
                venue_name,
                venue_code,
                venue_type,
                capacity,
                is_combinable,
                is_active,
                created_at,
                updated_at

            FROM venues

            WHERE faculty_id = ?
        `;


        const params = [
            facultyId
        ];


        if (
            venue_type
        ) {

            if (
                !allowedVenueTypes.includes(
                    venue_type
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Invalid venue type'

                });
            }


            sql += `
                AND venue_type = ?
            `;


            params.push(
                venue_type
            );
        }


        if (
            is_active === 'true' ||
            is_active === 'false'
        ) {

            sql += `
                AND is_active = ?
            `;


            params.push(
                is_active === 'true'
            );
        }


        sql += `
            ORDER BY
                venue_name ASC
        `;


        const [venues] =
            await db.query(
                sql,
                params
            );


        return res.status(200).json({

            success: true,

            count:
                venues.length,

            venues

        });


    } catch (error) {

        console.error(
            'Get venues error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve venues'

        });
    }
};


// ==========================================================
// GET ONE VENUE
// ==========================================================

const getVenueById = async (
    req,
    res
) => {

    try {

        const venueId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        if (
            !Number.isInteger(
                venueId
            ) ||
            venueId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid venue ID'

            });
        }


        const [rows] =
            await db.query(
                `SELECT
                    id,
                    faculty_id,
                    venue_name,
                    venue_code,
                    venue_type,
                    capacity,
                    is_combinable,
                    is_active,
                    created_at,
                    updated_at

                 FROM venues

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    venueId,
                    facultyId
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Venue not found'

            });
        }


        return res.status(200).json({

            success: true,

            venue:
                rows[0]

        });


    } catch (error) {

        console.error(
            'Get venue error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve venue'

        });
    }
};


// ==========================================================
// CREATE VENUE
// EXAM OFFICER ONLY
// ==========================================================

const createVenue = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            venue_name,
            venue_code,
            venue_type = 'lecture_room',
            capacity,
            is_combinable = false
        } = req.body;


        if (
            !venue_name ||
            !venue_code ||
            !capacity
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Venue name, venue code and capacity are required'

            });
        }


        if (
            !allowedVenueTypes.includes(
                venue_type
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid venue type'

            });
        }


        if (
            !Number.isInteger(
                Number(capacity)
            ) ||
            Number(capacity) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Venue capacity must be a whole number greater than zero'

            });
        }


        const normalizedCode =
            String(
                venue_code
            )
                .trim()
                .toUpperCase();


        const [duplicate] =
            await db.query(
                `SELECT
                    id

                 FROM venues

                 WHERE faculty_id = ?
                 AND venue_code = ?

                 LIMIT 1`,
                [
                    facultyId,
                    normalizedCode
                ]
            );


        if (
            duplicate.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Venue code already exists'

            });
        }


        const [result] =
            await db.query(
                `INSERT INTO venues
                (
                    faculty_id,
                    venue_name,
                    venue_code,
                    venue_type,
                    capacity,
                    is_combinable,
                    is_active
                )

                VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    facultyId,

                    String(
                        venue_name
                    ).trim(),

                    normalizedCode,

                    venue_type,

                    Number(
                        capacity
                    ),

                    Boolean(
                        is_combinable
                    )
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                'Venue created successfully',

            venue: {

                id:
                    result.insertId,

                faculty_id:
                    facultyId,

                venue_name:
                    String(
                        venue_name
                    ).trim(),

                venue_code:
                    normalizedCode,

                venue_type,

                capacity:
                    Number(
                        capacity
                    ),

                is_combinable:
                    Boolean(
                        is_combinable
                    ),

                is_active:
                    true

            }

        });


    } catch (error) {

        console.error(
            'Create venue error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to create venue'

        });
    }
};


// ==========================================================
// UPDATE VENUE
// EXAM OFFICER ONLY
// ==========================================================

const updateVenue = async (
    req,
    res
) => {

    try {

        const venueId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            venue_name,
            venue_code,
            venue_type,
            capacity,
            is_combinable
        } = req.body;


        if (
            !Number.isInteger(
                venueId
            ) ||
            venueId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid venue ID'

            });
        }


        if (
            !venue_name ||
            !venue_code ||
            !venue_type ||
            !capacity
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Required venue fields are missing'

            });
        }


        if (
            !allowedVenueTypes.includes(
                venue_type
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid venue type'

            });
        }


        if (
            !Number.isInteger(
                Number(capacity)
            ) ||
            Number(capacity) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Venue capacity must be a whole number greater than zero'

            });
        }


        const normalizedCode =
            String(
                venue_code
            )
                .trim()
                .toUpperCase();


        const [duplicate] =
            await db.query(
                `SELECT
                    id

                 FROM venues

                 WHERE faculty_id = ?
                 AND venue_code = ?
                 AND id <> ?

                 LIMIT 1`,
                [
                    facultyId,
                    normalizedCode,
                    venueId
                ]
            );


        if (
            duplicate.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Venue code already exists'

            });
        }


        const [result] =
            await db.query(
                `UPDATE venues

                 SET
                    venue_name = ?,
                    venue_code = ?,
                    venue_type = ?,
                    capacity = ?,
                    is_combinable = ?

                 WHERE id = ?
                 AND faculty_id = ?`,
                [
                    String(
                        venue_name
                    ).trim(),

                    normalizedCode,

                    venue_type,

                    Number(
                        capacity
                    ),

                    Boolean(
                        is_combinable
                    ),

                    venueId,

                    facultyId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Venue not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                'Venue updated successfully'

        });


    } catch (error) {

        console.error(
            'Update venue error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update venue'

        });
    }
};


// ==========================================================
// ACTIVATE / DEACTIVATE VENUE
// EXAM OFFICER ONLY
// ==========================================================

const setVenueStatus = async (
    req,
    res
) => {

    try {

        const venueId =
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
            !Number.isInteger(
                venueId
            ) ||
            venueId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid venue ID'

            });
        }


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
                `UPDATE venues

                 SET
                    is_active = ?

                 WHERE id = ?
                 AND faculty_id = ?`,
                [
                    is_active,

                    venueId,

                    facultyId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Venue not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                is_active
                    ? 'Venue activated successfully'
                    : 'Venue deactivated successfully'

        });


    } catch (error) {

        console.error(
            'Venue status error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update venue status'

        });
    }
};


// ==========================================================
// DELETE VENUE
// EXAM OFFICER ONLY
// ==========================================================

const deleteVenue = async (
    req,
    res
) => {

    try {

        const venueId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        if (
            !Number.isInteger(
                venueId
            ) ||
            venueId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid venue ID'

            });
        }


        // --------------------------------------------------
        // VERIFY VENUE OWNERSHIP
        // --------------------------------------------------

        const [venueRows] =
            await db.query(
                `SELECT
                    id,
                    venue_name,
                    venue_code

                 FROM venues

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    venueId,
                    facultyId
                ]
            );


        if (
            venueRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Venue not found'

            });
        }


        const venue =
            venueRows[0];


        // --------------------------------------------------
        // CHECK TIMETABLE VENUE ASSIGNMENTS
        // --------------------------------------------------

        const [assignmentRows] =
            await db.query(
                `SELECT
                    COUNT(*) AS total

                 FROM timetable_entry_venues

                 WHERE venue_id = ?`,
                [
                    venueId
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
                    `Cannot delete ${venue.venue_code} because it is assigned to ${assignmentCount} timetable examination record(s). Remove the timetable assignment first.`

            });
        }


        // --------------------------------------------------
        // DELETE
        // --------------------------------------------------

        const [result] =
            await db.query(
                `DELETE FROM venues

                 WHERE id = ?
                 AND faculty_id = ?`,
                [
                    venueId,

                    facultyId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Venue not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                `Venue ${venue.venue_code} deleted successfully`,

            venue_id:
                venueId

        });


    } catch (error) {

        console.error(
            'Delete venue error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to delete venue'

        });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getVenues,

    getVenueById,

    createVenue,

    updateVenue,

    setVenueStatus,

    deleteVenue

};