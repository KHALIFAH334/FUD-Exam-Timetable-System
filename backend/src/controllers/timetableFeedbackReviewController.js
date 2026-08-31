const {
    VALID_STATUSES,
    VALID_CATEGORIES,
    getFeedbackSubmissions,
    getFeedbackSubmissionById,
    updateFeedbackSubmission
} = require(
    '../services/timetableFeedbackReviewService'
);


// ==========================================================
// LIST COMPLAINTS
// ==========================================================
const listSubmissions = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            timetable_id,
            department_id,
            course_id,
            level,
            status,
            category
        } = req.query;


        if (
            status &&
            !VALID_STATUSES.includes(
                String(status)
                    .trim()
                    .toLowerCase()
            )
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        'Invalid feedback status'
                });
        }


        if (
            category &&
            !VALID_CATEGORIES.includes(
                String(category)
                    .trim()
                    .toLowerCase()
            )
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        'Invalid feedback category'
                });
        }


        const result =
            await getFeedbackSubmissions(
                facultyId,
                {
                    timetable_id,
                    department_id,
                    course_id,
                    level,
                    status,
                    category
                }
            );


        return res.status(200).json({

            success: true,

            summary:
                result.summary,

            count:
                result.submissions.length,

            submissions:
                result.submissions
        });


    } catch (error) {

        console.error(
            'List feedback submissions error:',
            error.message
        );


        return res
            .status(
                error.statusCode ||
                500
            )
            .json({

                success: false,

                message:
                    error.message ||
                    'Unable to retrieve feedback submissions'
            });
    }
};


// ==========================================================
// GET ONE COMPLAINT
// ==========================================================
const getSubmission = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const feedbackId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                feedbackId
            ) ||
            feedbackId <= 0
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        'Invalid feedback ID'
                });
        }


        const feedback =
            await getFeedbackSubmissionById(
                feedbackId,
                facultyId
            );


        return res.status(200).json({

            success: true,

            feedback
        });


    } catch (error) {

        console.error(
            'Get feedback submission error:',
            error.message
        );


        return res
            .status(
                error.statusCode ||
                500
            )
            .json({

                success: false,

                message:
                    error.message ||
                    'Unable to retrieve feedback submission'
            });
    }
};


// ==========================================================
// REVIEW / UPDATE COMPLAINT
// ==========================================================
const reviewSubmission = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const reviewerId =
            Number(
                req.user.id
            );


        const feedbackId =
            Number(
                req.params.id
            );


        const {
            status,
            officer_response
        } = req.body;


        if (
            !Number.isInteger(
                feedbackId
            ) ||
            feedbackId <= 0
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        'Invalid feedback ID'
                });
        }


        if (!status) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        'status is required'
                });
        }


        const feedback =
            await updateFeedbackSubmission(
                feedbackId,
                facultyId,
                reviewerId,
                status,
                officer_response
            );


        return res.status(200).json({

            success: true,

            message:
                'Feedback updated successfully',

            feedback
        });


    } catch (error) {

        console.error(
            'Review feedback error:',
            error.message
        );


        return res
            .status(
                error.statusCode ||
                500
            )
            .json({

                success: false,

                message:
                    error.message ||
                    'Unable to update feedback'
            });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================
module.exports = {
    listSubmissions,
    getSubmission,
    reviewSubmission
};