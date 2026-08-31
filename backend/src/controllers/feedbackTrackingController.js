const {
    getPublicFeedbackStatus
} = require(
    '../services/feedbackTrackingService'
);


// ==========================================================
// PUBLIC — TRACK COMPLAINT
// NO LOGIN REQUIRED
// ==========================================================
const trackComplaint = async (
    req,
    res
) => {

    try {

        const {
            reference,
            tracking_code
        } = req.body || {};


        if (
            !reference ||
            !tracking_code
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'reference and tracking_code are required'
            });
        }


        const result =
            await getPublicFeedbackStatus(
                reference,
                tracking_code
            );


        return res.status(200).json({

            success: true,

            complaint:
                result
        });


    } catch (error) {

        console.error(
            'Track complaint error:',
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
                    'Unable to retrieve complaint status'
            });
    }
};


module.exports = {
    trackComplaint
};