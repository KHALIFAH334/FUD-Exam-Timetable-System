const {
    getDepartmentPublishedTimetable
} = require('../services/publishedTimetableService');


// ==========================================================
// GET PUBLISHED TIMETABLE FOR DEPARTMENT
// ==========================================================
const getDepartmentTimetable = async (
    req,
    res
) => {

    try {

        // --------------------------------------------------
        // AUTHENTICATED USER CONTEXT
        // --------------------------------------------------

        const workspaceId =
            Number(
                req.user.workspace_id
            );

        const facultyId =
            Number(
                req.user.faculty_id
            );

        const departmentId =
            Number(
                req.user.department_id
            );


        // --------------------------------------------------
        // VALIDATE WORKSPACE
        // --------------------------------------------------

        if (
            !Number.isInteger(workspaceId) ||
            workspaceId <= 0
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Your account is not assigned to a valid workspace.'
            });

        }


        // --------------------------------------------------
        // VALIDATE FACULTY
        // --------------------------------------------------

        if (
            !Number.isInteger(facultyId) ||
            facultyId <= 0
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Your account is not assigned to a valid faculty.'
            });

        }


        // --------------------------------------------------
        // VALIDATE DEPARTMENT
        // --------------------------------------------------

        if (
            !Number.isInteger(departmentId) ||
            departmentId <= 0
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Your account is not assigned to a department.'
            });

        }


        // --------------------------------------------------
        // GET SESSION ID
        // --------------------------------------------------

        const sessionId =
            Number(
                req.query.session_id
            );


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


        // --------------------------------------------------
        // GET PUBLISHED TIMETABLE
        // --------------------------------------------------

        const result =
            await getDepartmentPublishedTimetable(
                sessionId,
                workspaceId,
                facultyId,
                departmentId
            );


        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.status(200).json({

            success: true,

            ...result

        });

    } catch (error) {

        console.error(
            'Get department timetable error:',
            error.message
        );


        return res
            .status(
                error.statusCode || 500
            )
            .json({

                success: false,

                message:
                    error.message ||
                    'Unable to retrieve published timetable'

            });

    }
};


module.exports = {
    getDepartmentTimetable
};