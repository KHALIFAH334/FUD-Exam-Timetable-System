const db = require('../config/db');


// ==========================================================
// GET ALL FACULTIES
//
// Used by the Exam Officer when selecting a faculty while
// creating or editing a department.
// ==========================================================

const getFaculties = async (req, res) => {

    try {

        const [faculties] = await db.query(
            `
            SELECT
                id,
                name,
                short_code,
                created_at
            FROM faculties
            ORDER BY name ASC
            `
        );


        return res.status(200).json({

            success: true,

            count:
                faculties.length,

            faculties

        });

    } catch (error) {

        console.error(
            'Get faculties error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve faculties'

        });
    }
};


// ==========================================================
// GET LOGGED-IN USER'S FACULTY
// ==========================================================

const getMyFaculty = async (req, res) => {

    try {

        const facultyId =
            req.user.faculty_id;


        if (!facultyId) {

            return res.status(404).json({

                success: false,

                message:
                    'Your account is not linked to a faculty'

            });
        }


        const [rows] =
            await db.query(
                `
                SELECT
                    id,
                    name,
                    short_code,
                    created_at
                FROM faculties
                WHERE id = ?
                LIMIT 1
                `,
                [facultyId]
            );


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    'Faculty not found'

            });
        }


        return res.status(200).json({

            success: true,

            faculty:
                rows[0]

        });

    } catch (error) {

        console.error(
            'Get faculty error:',
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to retrieve faculty'

        });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    getFaculties,

    getMyFaculty

};