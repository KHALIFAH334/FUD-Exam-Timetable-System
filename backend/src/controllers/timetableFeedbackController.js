const {
    createFeedbackLink,
    getFeedbackLinks,
    setFeedbackLinkStatus,
    deleteFeedbackLink,
    getPublicFeedbackForm,
    submitPublicFeedback
} = require(
    '../services/timetableFeedbackService'
);


const {
    generateTrackingCode
} = require(
    '../services/feedbackTrackingService'
);


// ==========================================================
// FRONTEND PUBLIC FEEDBACK URL
// ==========================================================

const FRONTEND_URL =
    String(
        process.env.FRONTEND_URL ||
        'http://localhost:3000'
    ).replace(
        /\/$/,
        ''
    );


// ==========================================================
// PUBLIC — GET FEEDBACK FORM
// ==========================================================

const getForm = async (
    req,
    res
) => {

    try {

        const {
            token
        } = req.params;


        const result =
            await getPublicFeedbackForm(
                token
            );


        return res.status(200).json({

            success: true,

            ...result
        });


    } catch (error) {

        console.error(
            'Get public feedback form error:',
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
                    'Unable to load feedback form'
            });
    }
};


// ==========================================================
// PUBLIC — SUBMIT FEEDBACK FORM
// ==========================================================

const submitForm = async (
    req,
    res
) => {

    try {

        const {
            token
        } = req.params;


        const result =
            await submitPublicFeedback(
                token,
                req.body || {}
            );


        const trackingCode =
            generateTrackingCode(
                result.id
            );


        return res.status(201).json({

            success: true,

            message:
                'Feedback submitted successfully',

            feedback: {

                ...result,

                tracking_code:
                    trackingCode
            },

            tracking: {

                reference:
                    result.reference,

                tracking_code:
                    trackingCode,

                message:
                    'Keep both the reference and tracking code safe. They are required to check the complaint status.'
            }
        });


    } catch (error) {

        console.error(
            'Submit public feedback error:',
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
                    'Unable to submit feedback'
            });
    }
};


// ==========================================================
// EXAM OFFICER — CREATE FEEDBACK LINK
// ==========================================================

const createLink = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const createdBy =
            Number(
                req.user.id
            );


        const {
            timetable_id,
            expires_in_days = 7
        } = req.body;


        const timetableId =
            Number(
                timetable_id
            );


        const expiryDays =
            Number(
                expires_in_days
            );


        if (
            !Number.isInteger(
                timetableId
            ) ||
            timetableId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Valid timetable_id is required'
            });
        }


        if (
            !Number.isInteger(
                expiryDays
            ) ||
            expiryDays < 1 ||
            expiryDays > 30
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'expires_in_days must be between 1 and 30'
            });
        }


        const result =
            await createFeedbackLink(
                timetableId,
                facultyId,
                createdBy,
                expiryDays
            );


        const publicUrl =
            `${FRONTEND_URL}/feedback/${result.token}`;


        return res.status(201).json({

            success: true,

            message:
                'Feedback link generated successfully',

            feedback_link: {

                id:
                    result.id,

                timetable:
                    result.timetable,

                expires_at:
                    result.expires_at,

                is_active:
                    result.is_active,

                public_token:
                    result.public_token,

                url:
                    publicUrl
            }
        });


    } catch (error) {

        console.error(
            'Create feedback link error:',
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
                    'Unable to generate feedback link'
            });
    }
};


// ==========================================================
// EXAM OFFICER — LIST FEEDBACK LINKS
// ==========================================================

const listLinks = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            timetable_id
        } = req.query;


        const links =
            await getFeedbackLinks(
                facultyId,
                timetable_id || null
            );


        const linksWithUrls =
            links.map(
                link => ({

                    ...link,

                    url:
                        link.public_token
                            ? `${FRONTEND_URL}/feedback/${link.public_token}`
                            : null
                })
            );


        return res.status(200).json({

            success: true,

            count:
                linksWithUrls.length,

            links:
                linksWithUrls
        });


    } catch (error) {

        console.error(
            'List feedback links error:',
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
                    'Unable to retrieve feedback links'
            });
    }
};


// ==========================================================
// EXAM OFFICER — ENABLE / DISABLE
// ==========================================================

const updateLinkStatus = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const linkId =
            Number(
                req.params.id
            );


        const {
            is_active
        } = req.body;


        if (
            !Number.isInteger(
                linkId
            ) ||
            linkId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid feedback link ID'
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


        const result =
            await setFeedbackLinkStatus(
                linkId,
                facultyId,
                is_active
            );


        return res.status(200).json({

            success: true,

            message:
                is_active
                    ? 'Feedback link activated successfully'
                    : 'Feedback link disabled successfully',

            feedback_link:
                result
        });


    } catch (error) {

        console.error(
            'Update feedback link error:',
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
                    'Unable to update feedback link'
            });
    }
};


// ==========================================================
// EXAM OFFICER — DELETE LINK
// ==========================================================

const deleteLink = async (
    req,
    res
) => {

    try {

        const facultyId =
            Number(
                req.user.faculty_id
            );


        const linkId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                linkId
            ) ||
            linkId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid feedback link ID'
            });
        }


        const result =
            await deleteFeedbackLink(
                linkId,
                facultyId
            );


        return res.status(200).json({

            success: true,

            message:
                'Feedback link deleted successfully',

            feedback_link:
                result
        });


    } catch (error) {

        console.error(
            'Delete feedback link error:',
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
                    'Unable to delete feedback link'
            });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getForm,

    submitForm,

    createLink,

    listLinks,

    updateLinkStatus,

    deleteLink
};