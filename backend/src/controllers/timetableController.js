const {
    getTimetableVersions,
    getTimetableById,
    publishTimetable,
    archiveTimetable,
    updateTimetable,
    deleteTimetable
} = require(
    '../services/timetableService'
);


// ==========================================================
// LIST TIMETABLES
// ==========================================================

const listTimetables = async (
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
            status
        } = req.query;


        const validStatuses = [

            'draft',

            'published',

            'archived'

        ];


        if (
            status &&
            !validStatuses.includes(
                String(status)
                    .toLowerCase()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid timetable status'

            });
        }


        const timetables =
            await getTimetableVersions(
                facultyId,
                session_id || null,
                status || null
            );


        return res.status(200).json({

            success: true,

            count:
                timetables.length,

            timetables

        });


    } catch (error) {

        console.error(
            'List timetables error:',
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
                    'Unable to retrieve timetables'

            });
    }
};


// ==========================================================
// GET ONE TIMETABLE
// ==========================================================

const getTimetable = async (
    req,
    res
) => {

    try {

        const timetableId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
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
                    'Invalid timetable ID'

            });
        }


        const result =
            await getTimetableById(
                timetableId,
                facultyId
            );


        return res.status(200).json({

            success: true,

            ...result

        });


    } catch (error) {

        console.error(
            'Get timetable error:',
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
                    'Unable to retrieve timetable'

            });
    }
};


// ==========================================================
// UPDATE TIMETABLE METADATA
// ==========================================================

const update = async (
    req,
    res
) => {

    try {

        const timetableId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const {
            title,
            notes
        } = req.body;


        if (
            !Number.isInteger(
                timetableId
            ) ||
            timetableId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid timetable ID'

            });
        }


        if (
            typeof title !== 'string' ||
            !title.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Timetable title is required'

            });
        }


        if (
            title.trim().length >
            200
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Timetable title cannot exceed 200 characters'

            });
        }


        if (
            notes !== undefined &&
            notes !== null &&
            typeof notes !== 'string'
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Notes must be text'

            });
        }


        const result =
            await updateTimetable(
                timetableId,
                facultyId,
                title.trim(),
                notes === null
                    ? null
                    : String(
                        notes || ''
                    ).trim()
            );


        return res.status(200).json({

            success: true,

            message:
                'Timetable updated successfully',

            timetable:
                result

        });


    } catch (error) {

        console.error(
            'Update timetable error:',
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
                    'Unable to update timetable'

            });
    }
};


// ==========================================================
// PUBLISH
// ==========================================================

const publish = async (
    req,
    res
) => {

    try {

        const timetableId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const result =
            await publishTimetable(
                timetableId,
                facultyId
            );


        return res.status(200).json({

            success: true,

            message:
                'Timetable published successfully',

            timetable:
                result

        });


    } catch (error) {

        console.error(
            'Publish timetable error:',
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
                    'Unable to publish timetable'

            });
    }
};


// ==========================================================
// ARCHIVE
// ==========================================================

const archive = async (
    req,
    res
) => {

    try {

        const timetableId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
            );


        const result =
            await archiveTimetable(
                timetableId,
                facultyId
            );


        return res.status(200).json({

            success: true,

            message:
                'Timetable archived successfully',

            timetable:
                result

        });


    } catch (error) {

        console.error(
            'Archive timetable error:',
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
                    'Unable to archive timetable'

            });
    }
};


// ==========================================================
// DELETE
// ==========================================================

const remove = async (
    req,
    res
) => {

    try {

        const timetableId =
            Number(
                req.params.id
            );


        const facultyId =
            Number(
                req.user.faculty_id
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
                    'Invalid timetable ID'

            });
        }


        const result =
            await deleteTimetable(
                timetableId,
                facultyId
            );


        return res.status(200).json({

            success: true,

            message:
                'Timetable deleted successfully',

            timetable:
                result

        });


    } catch (error) {

        console.error(
            'Delete timetable error:',
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
                    'Unable to delete timetable'

            });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    listTimetables,

    getTimetable,

    update,

    publish,

    archive,

    remove

};