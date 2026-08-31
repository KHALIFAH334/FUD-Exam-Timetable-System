const db = require('../config/db');


// ==========================================================
// GET ALL BLACKOUT DATES
// ==========================================================
const getBlackoutDates = async (req, res) => {
    try {
        const facultyId =
            Number(req.user.faculty_id);

        const { session_id } =
            req.query;


        let sql = `
            SELECT
                b.id,
                b.session_id,

                a.session_name,
                a.semester,
                a.exam_start_date,
                a.exam_end_date,

                b.blackout_date,
                b.reason,
                b.created_at

            FROM blackout_dates b

            INNER JOIN academic_sessions a
                ON b.session_id = a.id

            WHERE a.faculty_id = ?
        `;


        const params = [facultyId];


        if (session_id) {
            sql += `
                AND b.session_id = ?
            `;

            params.push(
                Number(session_id)
            );
        }


        sql += `
            ORDER BY
                a.session_name DESC,
                a.semester ASC,
                b.blackout_date ASC
        `;


        const [blackoutDates] =
            await db.query(
                sql,
                params
            );


        return res.status(200).json({
            success: true,
            count: blackoutDates.length,
            blackout_dates: blackoutDates
        });

    } catch (error) {

        console.error(
            'Get blackout dates error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to retrieve blackout dates'
        });
    }
};


// ==========================================================
// GET ONE BLACKOUT DATE
// ==========================================================
const getBlackoutDateById = async (req, res) => {
    try {
        const blackoutId =
            Number(req.params.id);

        const facultyId =
            Number(req.user.faculty_id);


        const [rows] =
            await db.query(
                `SELECT
                    b.id,
                    b.session_id,

                    a.session_name,
                    a.semester,
                    a.exam_start_date,
                    a.exam_end_date,

                    b.blackout_date,
                    b.reason,
                    b.created_at

                 FROM blackout_dates b

                 INNER JOIN academic_sessions a
                    ON b.session_id = a.id

                 WHERE b.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    blackoutId,
                    facultyId
                ]
            );


        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Blackout date not found'
            });
        }


        return res.status(200).json({
            success: true,
            blackout_date: rows[0]
        });

    } catch (error) {

        console.error(
            'Get blackout date error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to retrieve blackout date'
        });
    }
};


// ==========================================================
// CREATE BLACKOUT DATE
// EXAM OFFICER ONLY
// ==========================================================
const createBlackoutDate = async (req, res) => {
    try {
        const facultyId =
            Number(req.user.faculty_id);


        const {
            session_id,
            blackout_date,
            reason
        } = req.body;


        if (
            !session_id ||
            !blackout_date ||
            !reason
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Session, blackout date and reason are required'
            });
        }


        // Validate session and ensure date
        // falls inside exam period.
        const [sessionRows] =
            await db.query(
                `SELECT
                    id,
                    session_name,
                    semester,
                    exam_start_date,
                    exam_end_date

                 FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?

                 LIMIT 1`,
                [
                    Number(session_id),
                    facultyId
                ]
            );


        if (sessionRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Academic session not found'
            });
        }


        const [dateCheck] =
            await db.query(
                `SELECT id
                 FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?
                 AND ? BETWEEN
                    exam_start_date
                    AND exam_end_date

                 LIMIT 1`,
                [
                    Number(session_id),
                    facultyId,
                    blackout_date
                ]
            );


        if (dateCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Blackout date must fall within the examination period'
            });
        }


        // Duplicate protection
        const [duplicate] =
            await db.query(
                `SELECT id

                 FROM blackout_dates

                 WHERE session_id = ?
                 AND blackout_date = ?

                 LIMIT 1`,
                [
                    Number(session_id),
                    blackout_date
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'This blackout date already exists for the selected semester'
            });
        }


        const [result] =
            await db.query(
                `INSERT INTO blackout_dates
                (
                    session_id,
                    blackout_date,
                    reason
                )

                VALUES (?, ?, ?)`,
                [
                    Number(session_id),
                    blackout_date,
                    reason.trim()
                ]
            );


        return res.status(201).json({
            success: true,
            message:
                'Blackout date created successfully',

            blackout_date: {
                id: result.insertId,

                session_id:
                    Number(session_id),

                session_name:
                    sessionRows[0].session_name,

                semester:
                    sessionRows[0].semester,

                blackout_date,

                reason:
                    reason.trim()
            }
        });

    } catch (error) {

        console.error(
            'Create blackout date error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to create blackout date'
        });
    }
};


// ==========================================================
// UPDATE BLACKOUT DATE
// EXAM OFFICER ONLY
// ==========================================================
const updateBlackoutDate = async (req, res) => {
    try {
        const blackoutId =
            Number(req.params.id);

        const facultyId =
            Number(req.user.faculty_id);


        const {
            blackout_date,
            reason
        } = req.body;


        if (
            !blackout_date ||
            !reason
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Blackout date and reason are required'
            });
        }


        // Find existing record + session
        const [existingRows] =
            await db.query(
                `SELECT
                    b.id,
                    b.session_id

                 FROM blackout_dates b

                 INNER JOIN academic_sessions a
                    ON b.session_id = a.id

                 WHERE b.id = ?
                 AND a.faculty_id = ?

                 LIMIT 1`,
                [
                    blackoutId,
                    facultyId
                ]
            );


        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Blackout date not found'
            });
        }


        const sessionId =
            existingRows[0].session_id;


        // Validate new date against exam period
        const [dateCheck] =
            await db.query(
                `SELECT id

                 FROM academic_sessions

                 WHERE id = ?
                 AND faculty_id = ?
                 AND ? BETWEEN
                    exam_start_date
                    AND exam_end_date

                 LIMIT 1`,
                [
                    sessionId,
                    facultyId,
                    blackout_date
                ]
            );


        if (dateCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Blackout date must fall within the examination period'
            });
        }


        // Duplicate protection
        const [duplicate] =
            await db.query(
                `SELECT id

                 FROM blackout_dates

                 WHERE session_id = ?
                 AND blackout_date = ?
                 AND id <> ?

                 LIMIT 1`,
                [
                    sessionId,
                    blackout_date,
                    blackoutId
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    'This blackout date already exists for the selected semester'
            });
        }


        await db.query(
            `UPDATE blackout_dates

             SET
                blackout_date = ?,
                reason = ?

             WHERE id = ?`,
            [
                blackout_date,
                reason.trim(),
                blackoutId
            ]
        );


        return res.status(200).json({
            success: true,
            message:
                'Blackout date updated successfully'
        });

    } catch (error) {

        console.error(
            'Update blackout date error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update blackout date'
        });
    }
};


// ==========================================================
// DELETE BLACKOUT DATE
// EXAM OFFICER ONLY
// ==========================================================
const deleteBlackoutDate = async (req, res) => {
    try {
        const blackoutId =
            Number(req.params.id);

        const facultyId =
            Number(req.user.faculty_id);


        const [result] =
            await db.query(
                `DELETE b

                 FROM blackout_dates b

                 INNER JOIN academic_sessions a
                    ON b.session_id = a.id

                 WHERE b.id = ?
                 AND a.faculty_id = ?`,
                [
                    blackoutId,
                    facultyId
                ]
            );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    'Blackout date not found'
            });
        }


        return res.status(200).json({
            success: true,
            message:
                'Blackout date removed successfully'
        });

    } catch (error) {

        console.error(
            'Delete blackout date error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to remove blackout date'
        });
    }
};


module.exports = {
    getBlackoutDates,
    getBlackoutDateById,
    createBlackoutDate,
    updateBlackoutDate,
    deleteBlackoutDate
};