const {
    buildCourseConflictGraph
} = require('../services/conflictService');


// ==========================================================
// GET COURSE CONFLICTS
// ==========================================================
const getCourseConflicts = async (req, res) => {
    try {

        const facultyId =
            Number(req.user.faculty_id);

        const {
            session_id
        } = req.query;


        if (!session_id) {
            return res.status(400).json({
                success: false,
                message:
                    'session_id is required'
            });
        }


        const result =
            await buildCourseConflictGraph(
                session_id,
                facultyId
            );


        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        console.error(
            'Conflict detection error:',
            error.message
        );


        return res
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.message ||
                    'Unable to detect course conflicts'
            });
    }
};


module.exports = {
    getCourseConflicts
};