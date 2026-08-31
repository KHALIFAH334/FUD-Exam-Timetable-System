const db =
    require('../config/db');


// ==========================================================
// ALLOWED SLOT LABELS
// ==========================================================

const allowedSlotLabels = [

    'Morning',

    'Afternoon',

    'Evening'

];


// ==========================================================
// GET TIME SLOTS
// ==========================================================

const getTimeSlots = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            session_id
        } = req.query;


        let sql = `
            SELECT
                ts.id,
                ts.session_id,

                a.session_name,
                a.semester,

                ts.slot_label,
                ts.start_time,
                ts.end_time

            FROM time_slots ts

            INNER JOIN academic_sessions a
                ON ts.session_id = a.id

            WHERE a.faculty_id = ?
        `;


        const params = [
            facultyId
        ];


        if (
            session_id
        ) {

            sql += `
                AND ts.session_id = ?
            `;


            params.push(
                Number(
                    session_id
                )
            );
        }


        sql += `
            ORDER BY
                a.session_name DESC,

                FIELD(
                    ts.slot_label,
                    'Morning',
                    'Afternoon',
                    'Evening'
                )
        `;


        const [timeSlots] =
            await db.query(
                sql,
                params
            );


        return res.status(200).json({

            success: true,

            count:
                timeSlots.length,

            time_slots:
                timeSlots

        });


    } catch (error) {

        console.error(
            'Get time slots error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve time slots'

        });
    }
};


// ==========================================================
// GET ONE TIME SLOT
// ==========================================================

const getTimeSlotById = async (
    req,
    res
) => {

    try {

        const slotId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        if (
            !Number.isInteger(
                slotId
            ) ||
            slotId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid time slot ID'

            });
        }


        const [rows] =
            await db.query(
                `SELECT
                    ts.id,
                    ts.session_id,

                    a.session_name,
                    a.semester,

                    ts.slot_label,
                    ts.start_time,
                    ts.end_time

                 FROM time_slots ts

                 INNER JOIN academic_sessions a
                    ON ts.session_id = a.id

                 WHERE ts.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    slotId,
                    facultyId
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Time slot not found'

            });
        }


        return res.status(200).json({

            success: true,

            time_slot:
                rows[0]

        });


    } catch (error) {

        console.error(
            'Get time slot error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve time slot'

        });
    }
};


// ==========================================================
// CREATE TIME SLOT
// ==========================================================

const createTimeSlot = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            session_id,
            slot_label,
            start_time,
            end_time
        } = req.body;


        if (
            !session_id ||
            !slot_label ||
            !start_time ||
            !end_time
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Session, slot label, start time and end time are required'

            });
        }


        if (
            !allowedSlotLabels.includes(
                slot_label
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Slot label must be Morning, Afternoon or Evening'

            });
        }


        if (
            end_time <= start_time
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'End time must be later than start time'

            });
        }


        const [sessionRows] =
            await db.query(
                `SELECT
                    id,
                    session_name,
                    semester

                 FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    Number(
                        session_id
                    ),

                    facultyId
                ]
            );


        if (
            sessionRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Academic session not found'

            });
        }


        const [duplicate] =
            await db.query(
                `SELECT
                    id

                 FROM time_slots

                 WHERE session_id = ?
                 AND slot_label = ?

                 LIMIT 1`,
                [
                    Number(
                        session_id
                    ),

                    slot_label
                ]
            );


        if (
            duplicate.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'This time slot already exists for the selected semester'

            });
        }


        const [overlaps] =
            await db.query(
                `SELECT
                    id,
                    slot_label,
                    start_time,
                    end_time

                 FROM time_slots

                 WHERE session_id = ?

                 AND NOT (
                    end_time <= ?
                    OR start_time >= ?
                 )

                 LIMIT 1`,
                [
                    Number(
                        session_id
                    ),

                    start_time,

                    end_time
                ]
            );


        if (
            overlaps.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Time slot overlaps an existing slot'

            });
        }


        const [result] =
            await db.query(
                `INSERT INTO time_slots
                (
                    session_id,
                    slot_label,
                    start_time,
                    end_time
                )

                VALUES (?, ?, ?, ?)`,
                [
                    Number(
                        session_id
                    ),

                    slot_label,

                    start_time,

                    end_time
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                'Time slot created successfully',

            time_slot: {

                id:
                    result.insertId,

                session_id:
                    Number(
                        session_id
                    ),

                session_name:
                    sessionRows[0].session_name,

                semester:
                    sessionRows[0].semester,

                slot_label,

                start_time,

                end_time

            }

        });


    } catch (error) {

        console.error(
            'Create time slot error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to create time slot'

        });
    }
};


// ==========================================================
// UPDATE TIME SLOT
// ==========================================================

const updateTimeSlot = async (
    req,
    res
) => {

    try {

        const slotId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            slot_label,
            start_time,
            end_time
        } = req.body;


        if (
            !Number.isInteger(
                slotId
            ) ||
            slotId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid time slot ID'

            });
        }


        if (
            !slot_label ||
            !start_time ||
            !end_time
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Slot label, start time and end time are required'

            });
        }


        if (
            !allowedSlotLabels.includes(
                slot_label
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid slot label'

            });
        }


        if (
            end_time <= start_time
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'End time must be later than start time'

            });
        }


        const [slotRows] =
            await db.query(
                `SELECT
                    ts.id,
                    ts.session_id

                 FROM time_slots ts

                 INNER JOIN academic_sessions a
                    ON ts.session_id = a.id

                 WHERE ts.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    slotId,

                    facultyId
                ]
            );


        if (
            slotRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Time slot not found'

            });
        }


        const sessionId =
            Number(
                slotRows[0].session_id
            );


        const [duplicate] =
            await db.query(
                `SELECT
                    id

                 FROM time_slots

                 WHERE session_id = ?
                 AND slot_label = ?
                 AND id <> ?

                 LIMIT 1`,
                [
                    sessionId,

                    slot_label,

                    slotId
                ]
            );


        if (
            duplicate.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'This slot label already exists for the semester'

            });
        }


        const [overlaps] =
            await db.query(
                `SELECT
                    id

                 FROM time_slots

                 WHERE session_id = ?
                 AND id <> ?

                 AND NOT (
                    end_time <= ?
                    OR start_time >= ?
                 )

                 LIMIT 1`,
                [
                    sessionId,

                    slotId,

                    start_time,

                    end_time
                ]
            );


        if (
            overlaps.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    'Updated time overlaps another slot'

            });
        }


        const [result] =
            await db.query(
                `UPDATE time_slots

                 SET
                    slot_label = ?,
                    start_time = ?,
                    end_time = ?

                 WHERE id = ?`,
                [
                    slot_label,

                    start_time,

                    end_time,

                    slotId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Time slot not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                'Time slot updated successfully'

        });


    } catch (error) {

        console.error(
            'Update time slot error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to update time slot'

        });
    }
};


// ==========================================================
// DELETE TIME SLOT
// EXAM OFFICER ONLY
// ==========================================================

const deleteTimeSlot = async (
    req,
    res
) => {

    try {

        const slotId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        if (
            !Number.isInteger(
                slotId
            ) ||
            slotId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid time slot ID'

            });
        }


        // --------------------------------------------------
        // VERIFY OWNERSHIP
        // --------------------------------------------------

        const [slotRows] =
            await db.query(
                `SELECT
                    ts.id,
                    ts.session_id,
                    ts.slot_label,
                    ts.start_time,
                    ts.end_time,

                    a.session_name,
                    a.semester

                 FROM time_slots ts

                 INNER JOIN academic_sessions a
                    ON ts.session_id = a.id

                 WHERE ts.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    slotId,

                    facultyId
                ]
            );


        if (
            slotRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Time slot not found'

            });
        }


        const slot =
            slotRows[0];


        // --------------------------------------------------
        // CHECK TIMETABLE USAGE
        // --------------------------------------------------

        const [usageRows] =
            await db.query(
                `SELECT
                    COUNT(*) AS total

                 FROM timetable_entries te

                 WHERE te.time_slot_id = ?`,
                [
                    slotId
                ]
            );


        const usageCount =
            Number(
                usageRows[0].total
            );


        if (
            usageCount > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    `Cannot delete the ${slot.slot_label} time slot because it is used by ${usageCount} timetable examination record(s).`

            });
        }


        // --------------------------------------------------
        // DELETE
        // --------------------------------------------------

        const [result] =
            await db.query(
                `DELETE FROM time_slots

                 WHERE id = ?`,
                [
                    slotId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Time slot not found'

            });
        }


        return res.status(200).json({

            success: true,

            message:
                `${slot.slot_label} time slot deleted successfully`,

            time_slot_id:
                slotId

        });


    } catch (error) {

        console.error(
            'Delete time slot error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to delete time slot'

        });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getTimeSlots,

    getTimeSlotById,

    createTimeSlot,

    updateTimeSlot,

    deleteTimeSlot

};