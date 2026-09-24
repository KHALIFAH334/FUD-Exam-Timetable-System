import api from './api';


// ==========================================================
// EXAM OFFICER DASHBOARD SERVICE
// ==========================================================

export const getExamOfficerDashboardData = async () => {

    try {

        // ==================================================
        // LOAD CORE SYSTEM DATA
        // ==================================================

        const [
            coursesResponse,
            venuesResponse,
            invigilatorsResponse,
            sessionsResponse
        ] = await Promise.all([

            api.get('/courses'),

            api.get('/venues'),

            api.get('/invigilators'),

            api.get('/sessions')

        ]);


        // ==================================================
        // NORMALIZE ARRAYS
        // ==================================================

        const courses =
            coursesResponse.data?.courses ||
            [];

        const venues =
            venuesResponse.data?.venues ||
            [];

        const invigilators =
            invigilatorsResponse.data?.invigilators ||
            [];

        const sessions =
            sessionsResponse.data?.sessions ||
            [];


        // ==================================================
        // ACTIVE INVIGILATORS
        // ==================================================

        const activeInvigilators =
            invigilators.filter(
                item =>
                    item.is_active === true ||
                    item.is_active === 1 ||
                    item.is_active === '1'
            );


        // ==================================================
        // DEFAULT VALUES
        // ==================================================

        let currentSession =
            null;


        let publishedTimetable =
            null;


        let complaintSummary = {

            total:
                0,

            open:
                0,

            under_review:
                0,

            resolved:
                0,

            rejected:
                0

        };


        // ==================================================
        // SORT SESSIONS
        // NEWEST FIRST
        // ==================================================

        const sortedSessions =
            [...sessions].sort(
                (a, b) =>
                    Number(b.id) -
                    Number(a.id)
            );


        // ==================================================
        // FIND MOST RECENT SESSION HAVING
        // A PUBLISHED TIMETABLE
        // ==================================================

        for (
            const session
            of sortedSessions
        ) {

            try {

                const timetableResponse =
                    await api.get(
                        `/timetables?session_id=${session.id}`
                    );


                const timetables =
                    timetableResponse
                        .data
                        ?.timetables ||
                    [];


                const publishedVersions =
                    timetables.filter(
                        item =>
                            String(
                                item.status
                            ).toLowerCase() ===
                            'published'
                    );


                if (
                    publishedVersions.length > 0
                ) {

                    publishedVersions.sort(
                        (a, b) =>
                            Number(
                                b.version_number
                            ) -
                            Number(
                                a.version_number
                            )
                    );


                    publishedTimetable =
                        publishedVersions[0];


                    currentSession =
                        session;


                    break;
                }


            } catch (error) {

                console.warn(
                    `Unable to check timetables for session ${session.id}`,
                    error
                );
            }
        }


        // ==================================================
        // IF THERE IS NO PUBLISHED TIMETABLE,
        // USE THE NEWEST SESSION
        // ==================================================

        if (
            !currentSession &&
            sortedSessions.length > 0
        ) {

            currentSession =
                sortedSessions[0];
        }


        // ==================================================
        // LOAD FACULTY-WIDE COMPLAINT SUMMARY
        //
        // IMPORTANT:
        // Do NOT filter by the dashboard's currently
        // displayed published timetable.
        //
        // The dashboard should show all complaints that
        // belong to the logged-in Exam Officer's faculty.
        //
        // The backend already applies faculty scoping
        // through req.user.faculty_id.
        // ==================================================

        try {

            const complaintResponse =
                await api.get(
                    '/timetable-feedback/submissions'
                );


            if (
                complaintResponse
                    .data
                    ?.summary
            ) {

                complaintSummary = {

                    ...complaintSummary,

                    ...complaintResponse
                        .data
                        .summary
                };
            }


        } catch (error) {

            console.warn(
                'Unable to load complaint summary.',
                error
            );
        }


        // ==================================================
        // RETURN DASHBOARD DATA
        // ==================================================

        return {

            counts: {

                courses:
                    coursesResponse
                        .data
                        ?.count ??
                    courses.length,


                venues:
                    venuesResponse
                        .data
                        ?.count ??
                    venues.length,


                invigilators:
                    activeInvigilators.length

            },


            currentSession,


            publishedTimetable,


            complaintSummary

        };


    } catch (error) {

        console.error(
            'Dashboard service error:',
            error
        );


        throw error;
    }
};