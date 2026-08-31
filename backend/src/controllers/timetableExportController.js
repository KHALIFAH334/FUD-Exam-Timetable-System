const db = require('../config/db');

const {
    getTimetableById
} = require('../services/timetableService');

const {
    generateTimetableExcel,
    generateTimetablePDF
} = require('../services/timetableExportService');


// ==========================================================
// HELPER
// ==========================================================

const cleanFilename = (value) => {

    return String(value || 'Examination_Timetable')
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');
};


// ==========================================================
// EXAM OFFICER
// DOWNLOAD ANY TIMETABLE VERSION
//
// Allowed formats:
// /excel
// /pdf
// ==========================================================

const downloadTimetable = async (
    req,
    res
) => {

    try {

        const timetableId =
            Number(req.params.id);

        const format =
            String(req.params.format)
                .trim()
                .toLowerCase();

        const facultyId =
            Number(req.user.faculty_id);


        if (
            !Number.isInteger(timetableId) ||
            timetableId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Invalid timetable ID'
            });
        }


        if (
            !['excel', 'xlsx', 'pdf'].includes(format)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Format must be excel or pdf'
            });
        }


        // Existing service already checks
        // faculty ownership.
        const timetableData =
            await getTimetableById(
                timetableId,
                facultyId
            );


        const baseName =
            cleanFilename(
                timetableData.timetable.title
            );


        // ------------------------------------------------------
        // EXCEL
        // ------------------------------------------------------

        if (
            format === 'excel' ||
            format === 'xlsx'
        ) {

            const buffer =
                await generateTimetableExcel(
                    timetableData
                );


            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );


            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${baseName}.xlsx"`
            );


            res.setHeader(
                'Content-Length',
                buffer.length
            );


            return res.send(buffer);
        }


        // ------------------------------------------------------
        // PDF
        // ------------------------------------------------------

        const buffer =
            await generateTimetablePDF(
                timetableData
            );


        res.setHeader(
            'Content-Type',
            'application/pdf'
        );


        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${baseName}.pdf"`
        );


        res.setHeader(
            'Content-Length',
            buffer.length
        );


        return res.send(buffer);

    } catch (error) {

        console.error(
            'Timetable download error:',
            error.message
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                'Unable to download timetable'
        });
    }
};


// ==========================================================
// GENERAL PUBLISHED TIMETABLE
//
// EXAM OFFICER + DEPARTMENTAL COORDINATOR
//
// IMPORTANT SECURITY RULE:
//
// Coordinator can ONLY download a timetable whose
// status is already "published".
//
// This endpoint downloads the GENERAL timetable,
// not a department-filtered timetable.
// ==========================================================

const downloadPublishedTimetable = async (
    req,
    res
) => {

    try {

        const sessionId =
            Number(req.query.session_id);

        const format =
            String(req.params.format)
                .trim()
                .toLowerCase();

        const facultyId =
            Number(req.user.faculty_id);


        if (
            !Number.isInteger(sessionId) ||
            sessionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'session_id is required'
            });
        }


        if (
            !['excel', 'xlsx', 'pdf'].includes(format)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Format must be excel or pdf'
            });
        }


        // ------------------------------------------------------
        // FIND CURRENT PUBLISHED VERSION
        //
        // Only published records are considered.
        // ------------------------------------------------------

        const [rows] =
            await db.query(
                `SELECT
                    t.id,
                    t.session_id,
                    t.title,
                    t.status,
                    t.version_number,
                    a.session_name,
                    a.semester

                 FROM timetables t

                 INNER JOIN academic_sessions a
                    ON t.session_id = a.id

                 WHERE t.session_id = ?
                 AND a.faculty_id = ?
                 AND t.status = 'published'

                 ORDER BY
                    t.version_number DESC,
                    t.id DESC

                 LIMIT 1`,
                [
                    sessionId,
                    facultyId
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({
                success: false,
                message:
                    'No published timetable exists for the selected academic session'
            });
        }


        const published =
            rows[0];


        // ------------------------------------------------------
        // GET COMPLETE TIMETABLE
        // ------------------------------------------------------

        const timetableData =
            await getTimetableById(
                Number(published.id),
                facultyId
            );


        // ------------------------------------------------------
        // EXTRA SECURITY CHECK
        //
        // Even though the SQL already searched for
        // published, verify the returned record too.
        // ------------------------------------------------------

        if (
            timetableData.timetable.status !==
            'published'
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Only published timetables can be downloaded'
            });
        }


        const baseName =
            cleanFilename(
                timetableData.timetable.title
            );


        // ------------------------------------------------------
        // EXCEL
        // ------------------------------------------------------

        if (
            format === 'excel' ||
            format === 'xlsx'
        ) {

            const buffer =
                await generateTimetableExcel(
                    timetableData
                );


            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );


            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${baseName}.xlsx"`
            );


            res.setHeader(
                'Content-Length',
                buffer.length
            );


            return res.send(buffer);
        }


        // ------------------------------------------------------
        // PDF
        // ------------------------------------------------------

        const buffer =
            await generateTimetablePDF(
                timetableData
            );


        res.setHeader(
            'Content-Type',
            'application/pdf'
        );


        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${baseName}.pdf"`
        );


        res.setHeader(
            'Content-Length',
            buffer.length
        );


        return res.send(buffer);

    } catch (error) {

        console.error(
            'Published timetable download error:',
            error.message
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                'Unable to download published timetable'
        });
    }
};


module.exports = {
    downloadTimetable,
    downloadPublishedTimetable
};