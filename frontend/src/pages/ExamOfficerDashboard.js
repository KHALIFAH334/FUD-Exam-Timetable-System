import {
    useEffect,
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import {
    useAuth
} from '../context/AuthContext';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import {
    getExamOfficerDashboardData
} from '../services/dashboardService';

import '../styles/dashboard.css';


const ExamOfficerDashboard = () => {

    const navigate =
        useNavigate();


    const {
        user
    } = useAuth();


    // ======================================================
    // STATE
    // ======================================================

    const [dashboardData, setDashboardData] =
        useState({

            counts: {

                students: 0,

                courses: 0,

                venues: 0,

                invigilators: 0

            },


            currentSession:
                null,


            publishedTimetable:
                null,


            complaintSummary: {

                total: 0,

                open: 0,

                under_review: 0,

                resolved: 0,

                rejected: 0

            }

        });


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState('');


    // ======================================================
    // LOAD DASHBOARD
    // ======================================================

    useEffect(() => {

        const loadDashboard =
            async () => {

                try {

                    setLoading(true);

                    setError('');


                    const data =
                        await getExamOfficerDashboardData();


                    setDashboardData(
                        data
                    );


                } catch (error) {

                    console.error(
                        'Dashboard loading error:',
                        error
                    );


                    setError(
                        error.response?.data?.message ||
                        error.message ||
                        'Unable to load dashboard data.'
                    );


                } finally {

                    setLoading(false);
                }
            };


        loadDashboard();

    }, []);


    // ======================================================
    // SHORT VARIABLES
    // ======================================================

    const {
        counts,
        currentSession,
        publishedTimetable,
        complaintSummary
    } = dashboardData;


    // ======================================================
    // NAVIGATION HELPERS
    // ======================================================

    const goTo =
        (path) => {

            navigate(
                path
            );
        };


    const viewCurrentTimetable =
        () => {

            goTo(
                '/exam-officer/published-timetable'
            );
        };


    const generateNewDraft =
        () => {

            goTo(
                '/exam-officer/generate-timetable'
            );
        };


    const manageComplaints =
        () => {

            goTo(
                '/exam-officer/complaints'
            );
        };


    // ======================================================
    // PAGE
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Dashboard"
        >

            {/* ==================================================
                WELCOME
                ================================================== */}

            <section className="dashboard-welcome">

                <div>

                    <span className="welcome-label">
                        EXAMINATION OFFICE
                    </span>


                    <h2>
                        Welcome back,
                        {' '}
                        {user?.full_name}
                    </h2>


                    <p>
                        Manage examination data,
                        generate conflict-free
                        timetables and review
                        timetable feedback.
                    </p>

                </div>


                <div className="welcome-logo">

                    <img
                        src="/fud-logo.png"
                        alt="Federal University Dutse"
                    />

                </div>

            </section>


            {/* ==================================================
                ERROR
                ================================================== */}

            {
                error &&
                (

                    <div
                        className="dashboard-panel"
                        style={{
                            marginBottom:
                                '20px',

                            borderLeft:
                                '4px solid #b42318'
                        }}
                    >

                        <strong>
                            Dashboard Error
                        </strong>


                        <p
                            style={{
                                marginTop:
                                    '6px',

                                fontSize:
                                    '13px'
                            }}
                        >
                            {error}
                        </p>

                    </div>

                )
            }


            {/* ==================================================
                STATISTICS
                ================================================== */}

            <section className="statistics-grid">

                {/* STUDENTS */}

                <button
                    type="button"
                    className="stat-card dashboard-click-card"
                    onClick={() =>
                        goTo(
                            '/exam-officer/students'
                        )
                    }
                >

                    <div className="stat-card-top">

                        <span className="stat-title">
                            Students
                        </span>

                        <span className="stat-icon">
                            ST
                        </span>

                    </div>


                    <strong className="stat-number">

                        {
                            loading
                                ? '...'
                                : counts.students
                        }

                    </strong>


                    <span className="stat-description">
                        Registered students
                    </span>

                </button>


                {/* COURSES */}

                <button
                    type="button"
                    className="stat-card dashboard-click-card"
                    onClick={() =>
                        goTo(
                            '/exam-officer/courses'
                        )
                    }
                >

                    <div className="stat-card-top">

                        <span className="stat-title">
                            Courses
                        </span>

                        <span className="stat-icon">
                            CR
                        </span>

                    </div>


                    <strong className="stat-number">

                        {
                            loading
                                ? '...'
                                : counts.courses
                        }

                    </strong>


                    <span className="stat-description">
                        Examination courses
                    </span>

                </button>


                {/* VENUES */}

                <button
                    type="button"
                    className="stat-card dashboard-click-card"
                    onClick={() =>
                        goTo(
                            '/exam-officer/venues'
                        )
                    }
                >

                    <div className="stat-card-top">

                        <span className="stat-title">
                            Venues
                        </span>

                        <span className="stat-icon">
                            VN
                        </span>

                    </div>


                    <strong className="stat-number">

                        {
                            loading
                                ? '...'
                                : counts.venues
                        }

                    </strong>


                    <span className="stat-description">
                        Available venues
                    </span>

                </button>


                {/* INVIGILATORS */}

                <button
                    type="button"
                    className="stat-card dashboard-click-card"
                    onClick={() =>
                        goTo(
                            '/exam-officer/invigilators'
                        )
                    }
                >

                    <div className="stat-card-top">

                        <span className="stat-title">
                            Invigilators
                        </span>

                        <span className="stat-icon">
                            IV
                        </span>

                    </div>


                    <strong className="stat-number">

                        {
                            loading
                                ? '...'
                                : counts.invigilators
                        }

                    </strong>


                    <span className="stat-description">
                        Active invigilators
                    </span>

                </button>

            </section>


            {/* ==================================================
                MAIN DASHBOARD
                ================================================== */}

            <section className="dashboard-grid">

                {/* ==================================================
                    CURRENT TIMETABLE
                    ================================================== */}

                <article className="dashboard-panel">

                    <div className="panel-heading">

                        <div>

                            <span className="panel-label">
                                CURRENT TIMETABLE
                            </span>


                            <h3>
                                Examination Timetable
                            </h3>

                        </div>


                        {
                            publishedTimetable
                                ? (

                                    <span
                                        className="status-badge published"
                                    >
                                        Published
                                    </span>

                                )
                                : (

                                    <span
                                        className="status-badge"
                                    >
                                        No Published Version
                                    </span>

                                )
                        }

                    </div>


                    <div className="timetable-summary">

                        {/* SESSION */}

                        <div>

                            <span>
                                Academic Session
                            </span>


                            <strong>

                                {
                                    currentSession
                                        ? currentSession.session_name
                                        : '—'
                                }

                            </strong>

                        </div>


                        {/* SEMESTER */}

                        <div>

                            <span>
                                Semester
                            </span>


                            <strong>

                                {
                                    currentSession
                                        ? currentSession.semester
                                        : '—'
                                }

                            </strong>

                        </div>


                        {/* VERSION */}

                        <div>

                            <span>
                                Version
                            </span>


                            <strong>

                                {
                                    publishedTimetable
                                        ? `Version ${publishedTimetable.version_number}`
                                        : '—'
                                }

                            </strong>

                        </div>

                    </div>


                    <div className="panel-actions">

                        <button
                            className="primary-action"
                            type="button"
                            onClick={
                                viewCurrentTimetable
                            }
                        >
                            View Timetable
                        </button>


                        <button
                            className="secondary-action"
                            type="button"
                            onClick={
                                generateNewDraft
                            }
                        >
                            Generate New Draft
                        </button>

                    </div>

                </article>


                {/* ==================================================
                    COMPLAINTS
                    ================================================== */}

                <article className="dashboard-panel">

                    <div className="panel-heading">

                        <div>

                            <span className="panel-label">
                                FEEDBACK
                            </span>


                            <h3>
                                Complaint Overview
                            </h3>

                        </div>

                    </div>


                    <div className="complaint-summary">

                        {/* OPEN */}

                        <div className="complaint-row">

                            <span>
                                Open
                            </span>


                            <strong>

                                {
                                    loading
                                        ? '...'
                                        : complaintSummary.open
                                }

                            </strong>

                        </div>


                        {/* UNDER REVIEW */}

                        <div className="complaint-row">

                            <span>
                                Under Review
                            </span>


                            <strong>

                                {
                                    loading
                                        ? '...'
                                        : complaintSummary.under_review
                                }

                            </strong>

                        </div>


                        {/* RESOLVED */}

                        <div className="complaint-row">

                            <span>
                                Resolved
                            </span>


                            <strong>

                                {
                                    loading
                                        ? '...'
                                        : complaintSummary.resolved
                                }

                            </strong>

                        </div>

                    </div>


                    <button
                        className="panel-full-button"
                        type="button"
                        onClick={
                            manageComplaints
                        }
                    >
                        Manage Complaints
                    </button>

                </article>

            </section>


            {/* ==================================================
                QUICK ACTIONS
                ================================================== */}

            <section className="quick-actions-section">

                <div className="section-heading">

                    <div>

                        <span className="panel-label">
                            SHORTCUTS
                        </span>


                        <h3>
                            Quick Actions
                        </h3>

                    </div>

                </div>


                <div className="quick-actions-grid">

                    {/* ==================================================
                        GENERATE TIMETABLE
                        ================================================== */}

                    <button
                        className="quick-action"
                        type="button"
                        onClick={() =>
                            goTo(
                                '/exam-officer/generate-timetable'
                            )
                        }
                    >

                        <span className="quick-action-code">
                            GT
                        </span>


                        <div>

                            <strong>
                                Generate Timetable
                            </strong>


                            <span>
                                Create a new CSP
                                timetable draft
                            </span>

                        </div>

                    </button>


                    {/* ==================================================
                        STUDENTS
                        ================================================== */}

                    <button
                        className="quick-action"
                        type="button"
                        onClick={() =>
                            goTo(
                                '/exam-officer/students'
                            )
                        }
                    >

                        <span className="quick-action-code">
                            ST
                        </span>


                        <div>

                            <strong>
                                Students
                            </strong>


                            <span>
                                Manage student records
                            </span>

                        </div>

                    </button>


                    {/* ==================================================
                        VENUES
                        ================================================== */}

                    <button
                        className="quick-action"
                        type="button"
                        onClick={() =>
                            goTo(
                                '/exam-officer/venues'
                            )
                        }
                    >

                        <span className="quick-action-code">
                            VN
                        </span>


                        <div>

                            <strong>
                                Venues
                            </strong>


                            <span>
                                Manage examination venues
                            </span>

                        </div>

                    </button>


                    {/* ==================================================
                        COMPLAINTS
                        ================================================== */}

                    <button
                        className="quick-action"
                        type="button"
                        onClick={
                            manageComplaints
                        }
                    >

                        <span className="quick-action-code">
                            CP
                        </span>


                        <div>

                            <strong>
                                Complaints
                            </strong>


                            <span>
                                Review timetable feedback
                            </span>

                        </div>

                    </button>

                </div>

            </section>

        </ExamOfficerLayout>
    );
};


export default ExamOfficerDashboard;