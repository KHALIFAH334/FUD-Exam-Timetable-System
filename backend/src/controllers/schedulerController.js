const {
    buildSchedulerPreflight,
    generateSchedulePreview,
    persistScheduleDraft
} = require('../services/schedulerService');


// ==========================================================
// SCHEDULER PREFLIGHT
// ==========================================================
const schedulerPreflight = async (req, res) => {
    try {

        const facultyId =
            Number(req.user.faculty_id);

        const { session_id } =
            req.query;


        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id is required'
            });
        }


        const result =
            await buildSchedulerPreflight(
                session_id,
                facultyId
            );


        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        console.error(
            'Scheduler preflight error:',
            error.message
        );


        return res
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.message ||
                    'Unable to perform scheduling preflight',
                details:
                    error.details || []
            });
    }
};


// ==========================================================
// GENERATE CSP PREVIEW
// ==========================================================
const generatePreview = async (req, res) => {
    try {

        const facultyId =
            Number(req.user.faculty_id);

        const { session_id } =
            req.body;


        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id is required'
            });
        }


        const result =
            await generateSchedulePreview(
                session_id,
                facultyId
            );


        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        console.error(
            'Schedule generation error:',
            error.message
        );


        return res
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.message ||
                    'Unable to generate timetable preview',
                details:
                    error.details || []
            });
    }
};


// ==========================================================
// GENERATE AND SAVE DRAFT TIMETABLE
// ==========================================================
const generateDraft = async (req, res) => {
    try {

        const facultyId =
            Number(req.user.faculty_id);

        const createdBy =
            Number(req.user.id);


        const {
            session_id,
            title,
            notes
        } = req.body;


        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id is required'
            });
        }


        const result =
            await persistScheduleDraft(
                session_id,
                facultyId,
                createdBy,
                title,
                notes
            );


        return res.status(201).json({
            success: true,
            message:
                'Draft timetable generated and saved successfully',
            ...result
        });

    } catch (error) {

        console.error(
            'Draft timetable persistence error:',
            error.message
        );


        return res
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.message ||
                    'Unable to save draft timetable',
                details:
                    error.details || []
            });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================
module.exports = {
    schedulerPreflight,
    generatePreview,
    generateDraft
};