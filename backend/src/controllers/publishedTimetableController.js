const {
    getDepartmentPublishedTimetable
} = require(
    '../services/publishedTimetableService'
);


// ==========================================================
// GET COORDINATOR'S PUBLISHED TIMETABLE
// ==========================================================
const getDepartmentTimetable = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const departmentId =
            Number(
                req.user.department_id
            );


        const {
            session_id
        } = req.query;


        // --------------------------------------------------
        // SESSION REQUIRED
        // --------------------------------------------------

        if (!session_id) {

            return res.status(400).json({

                success: false,

                message:
                    'session_id is required'
            });
        }


        // --------------------------------------------------
        // COORDINATOR MUST HAVE DEPARTMENT
        // --------------------------------------------------

        if (
            !departmentId ||
            departmentId <= 0
        ) {

            return res.status(403).json({

                success: false,

                message:
                    'Department access is required'
            });
        }


        // IMPORTANT:
        //
        // Department ID comes ONLY from req.user.
        // We intentionally ignore any department_id
        // supplied in query/body.
        const result =
            await getDepartmentPublishedTimetable(
                session_id,
                facultyId,
                departmentId
            );


        return res.status(200).json({

            success: true,

            ...result
        });


    } catch (error) {

        console.error(
            'Published department timetable error:',
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