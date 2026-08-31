import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';
import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/generateTimetable.css';


const EMPTY_PREVIEW = {
    session: null,
    statistics: null,
    schedule: []
};


const GenerateTimetablePage = () => {

    const [sessions, setSessions] = useState([]);

    const [selectedSessionId, setSelectedSessionId] =
        useState('');

    const [loadingSessions, setLoadingSessions] =
        useState(true);

    const [preflightLoading, setPreflightLoading] =
        useState(false);

    const [previewLoading, setPreviewLoading] =
        useState(false);

    const [draftLoading, setDraftLoading] =
        useState(false);

    const [preflight, setPreflight] =
        useState(null);

    const [preview, setPreview] =
        useState({
            ...EMPTY_PREVIEW
        });

    const [draftResult, setDraftResult] =
        useState(null);

    const [showPreview, setShowPreview] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [title, setTitle] =
        useState('');

    const [notes, setNotes] =
        useState('');


    // ======================================================
    // LOAD SESSIONS
    // ======================================================

    const loadSessions = async () => {

        try {

            setLoadingSessions(true);

            const response =
                await api.get('/sessions');

            setSessions(
                response.data?.sessions || []
            );

        } catch (error) {

            console.error(
                'Load sessions error:',
                error
            );

            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Unable to load academic sessions.'
            );

        } finally {

            setLoadingSessions(false);
        }
    };


    useEffect(() => {

        loadSessions();

    }, []);


    // ======================================================
    // SELECTED SESSION
    // ======================================================

    const selectedSession = useMemo(() => {

        if (!selectedSessionId) {
            return null;
        }

        return sessions.find(
            session =>
                Number(session.id) ===
                Number(selectedSessionId)
        ) || null;

    }, [
        sessions,
        selectedSessionId
    ]);


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (date) => {

        if (!date) {
            return '—';
        }

        const cleanDate =
            String(date).slice(0, 10);

        const parsed =
            new Date(
                `${cleanDate}T00:00:00`
            );

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return String(date);
        }

        return parsed.toLocaleDateString(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        );
    };


    // ======================================================
    // FORMAT TIME
    // ======================================================

    const formatTime = (time) => {

        if (!time) {
            return '—';
        }

        const parts =
            String(time).split(':');

        if (parts.length < 2) {
            return String(time);
        }

        let hour =
            Number(parts[0]);

        const minute =
            parts[1];

        const suffix =
            hour >= 12
                ? 'PM'
                : 'AM';

        hour =
            hour % 12 || 12;

        return `${hour}:${minute} ${suffix}`;
    };


    // ======================================================
    // BACKEND ERROR
    // ======================================================

    const getErrorMessage = (
        error,
        fallback
    ) => {

        return (
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            fallback
        );
    };


    // ======================================================
    // RESET RESULTS
    // ======================================================

    const resetGeneratedData = () => {

        setPreflight(null);

        setPreview({
            ...EMPTY_PREVIEW
        });

        setDraftResult(null);

        setShowPreview(false);

        setSuccess('');
    };


    // ======================================================
    // SESSION CHANGE
    // ======================================================

    const handleSessionChange = (
        event
    ) => {

        setSelectedSessionId(
            event.target.value
        );

        resetGeneratedData();

        setTitle('');
        setNotes('');

        setError('');
    };


    // ======================================================
    // PREFLIGHT
    // ======================================================

    const runPreflight = async () => {

        if (!selectedSessionId) {

            setError(
                'Please select an academic session first.'
            );

            return;
        }


        try {

            setError('');
            setSuccess('');

            setPreflightLoading(true);

            setPreflight(null);


            /*
             * IMPORTANT:
             * Backend route is GET /scheduler/preflight
             */
            const response =
                await api.get(
                    '/scheduler/preflight',
                    {
                        params: {
                            session_id:
                                Number(
                                    selectedSessionId
                                )
                        }
                    }
                );


            setPreflight(
                response.data || null
            );


            setSuccess(
                response.data?.message ||
                'Scheduler preflight completed successfully.'
            );

        } catch (error) {

            console.error(
                'Scheduler preflight error:',
                error
            );


            setPreflight(
                error.response?.data ||
                null
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to complete scheduler preflight.'
                )
            );

        } finally {

            setPreflightLoading(false);
        }
    };


    // ======================================================
    // GENERATE PREVIEW
    // ======================================================

    const generatePreview = async () => {

        if (!selectedSessionId) {

            setError(
                'Please select an academic session first.'
            );

            return;
        }


        try {

            setError('');
            setSuccess('');

            setPreviewLoading(true);

            setDraftResult(null);


            const response =
                await api.post(
                    '/scheduler/generate-preview',
                    {
                        session_id:
                            Number(
                                selectedSessionId
                            )
                    }
                );


            const data =
                response.data || {};


            const generatedSchedule =
                Array.isArray(
                    data.schedule
                )
                    ? data.schedule
                    : Array.isArray(
                        data.entries
                    )
                        ? data.entries
                        : [];


            setPreview({

                session:
                    data.session ||
                    data.academic_session ||
                    selectedSession ||
                    null,

                statistics:
                    data.statistics ||
                    data.stats ||
                    null,

                schedule:
                    generatedSchedule

            });


            setShowPreview(true);


            setSuccess(
                data.message ||
                'Timetable preview generated successfully.'
            );

        } catch (error) {

            console.error(
                'Generate preview error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to generate timetable preview.'
                )
            );

        } finally {

            setPreviewLoading(false);
        }
    };


    // ======================================================
    // GENERATE + SAVE DRAFT
    // ======================================================

    const generateDraft = async () => {

        if (!selectedSessionId) {

            setError(
                'Please select an academic session first.'
            );

            return;
        }


        try {

            setError('');
            setSuccess('');

            setDraftLoading(true);


            const payload = {
                session_id:
                    Number(
                        selectedSessionId
                    )
            };


            if (title.trim()) {

                payload.title =
                    title.trim();
            }


            if (notes.trim()) {

                payload.notes =
                    notes.trim();
            }


            const response =
                await api.post(
                    '/scheduler/generate-draft',
                    payload
                );


            const data =
                response.data || {};


            setDraftResult(
                data
            );


            setSuccess(
                data.message ||
                'Timetable draft generated successfully.'
            );


            const generatedSchedule =
                Array.isArray(
                    data.schedule
                )
                    ? data.schedule
                    : Array.isArray(
                        data.entries
                    )
                        ? data.entries
                        : [];


            if (
                generatedSchedule.length > 0
            ) {

                setPreview({

                    session:
                        data.session ||
                        data.academic_session ||
                        selectedSession ||
                        null,

                    statistics:
                        data.statistics ||
                        data.stats ||
                        null,

                    schedule:
                        generatedSchedule

                });

                setShowPreview(true);
            }

        } catch (error) {

            console.error(
                'Generate draft error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to generate timetable draft.'
                )
            );

        } finally {

            setDraftLoading(false);
        }
    };


    // ======================================================
    // PREVIEW DATA
    // ======================================================

    const statistics =
        preview.statistics || {};


    const schedule =
        Array.isArray(
            preview.schedule
        )
            ? preview.schedule
            : [];


    // ======================================================
    // SAFE STATISTICS
    // ======================================================

    const getStat = (
        ...keys
    ) => {

        for (
            const key of keys
        ) {

            if (
                statistics[key] !== undefined &&
                statistics[key] !== null
            ) {

                return statistics[key];
            }
        }

        return 0;
    };


    // ======================================================
    // PREFLIGHT RESOURCE HELPERS
    // ======================================================

    const getPreflightCollectionCount = (
        collectionNames,
        directNames = []
    ) => {

        for (
            const name of collectionNames
        ) {

            const value =
                preflight?.[name];

            if (
                Array.isArray(value)
            ) {

                return value.length;
            }
        }


        for (
            const name of directNames
        ) {

            const value =
                preflight?.[name];

            if (
                typeof value === 'number'
            ) {

                return value;
            }
        }


        return 0;
    };


    const preflightCourses =
        getPreflightCollectionCount(
            [
                'courses',
                'active_courses'
            ],
            [
                'course_count',
                'courses_count',
                'active_course_count'
            ]
        );


    const preflightTimeSlots =
        getPreflightCollectionCount(
            [
                'time_slots',
                'timeSlots'
            ],
            [
                'time_slot_count',
                'time_slots_count'
            ]
        );


    const preflightBlackouts =
        getPreflightCollectionCount(
            [
                'blackouts',
                'blackout_dates'
            ],
            [
                'blackout_count',
                'blackout_dates_count'
            ]
        );


    const preflightVenues =
        getPreflightCollectionCount(
            [
                'venues',
                'available_venues'
            ],
            [
                'venue_count',
                'venues_count'
            ]
        );


    const preflightInvigilators =
        getPreflightCollectionCount(
            [
                'invigilators',
                'active_invigilators'
            ],
            [
                'invigilator_count',
                'invigilators_count'
            ]
        );


    const preflightStudents =
        preflight?.registered_students ??
        preflight?.student_count ??
        preflight?.students_count ??
        0;


    const preflightReady =
        preflight?.ready === true;


    // ======================================================
    // GROUP SCHEDULE BY DATE
    // ======================================================

    const scheduleByDate =
        useMemo(() => {

            const grouped = {};


            schedule.forEach(
                exam => {

                    const date =
                        exam.exam_date ||
                        exam.date ||
                        'Unknown Date';


                    if (!grouped[date]) {

                        grouped[date] = [];
                    }


                    grouped[date].push(
                        exam
                    );

                }
            );


            return Object.entries(
                grouped
            );

        }, [schedule]);


    return (

        <ExamOfficerLayout
            activePage="Generate Timetable"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="generate-header">

                <div>

                    <span className="generate-label">
                        AUTOMATED SCHEDULING ENGINE
                    </span>

                    <h2>
                        Generate Timetable
                    </h2>

                    <p>
                        Run the examination scheduling engine,
                        review the generated timetable and save
                        a draft for publication.
                    </p>

                </div>

            </section>


            {/* ==================================================
                SUCCESS
                ================================================== */}

            {success && (

                <div className="generate-success">

                    <strong>
                        Success
                    </strong>

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess('')
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* ==================================================
                ERROR
                ================================================== */}

            {error && (

                <div className="generate-error">

                    <strong>
                        Error
                    </strong>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError('')
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* ==================================================
                SESSION SELECTION
                ================================================== */}

            <section className="generate-config-panel">

                <div className="generate-section-heading">

                    <div>

                        <span className="generate-label">
                            SCHEDULING INPUT
                        </span>

                        <h3>
                            Select Examination Session
                        </h3>

                    </div>

                </div>


                <div className="generate-config-grid">

                    <div className="generate-form-group">

                        <label>
                            Academic Session
                        </label>

                        <select
                            value={
                                selectedSessionId
                            }
                            onChange={
                                handleSessionChange
                            }
                            disabled={
                                loadingSessions ||
                                preflightLoading ||
                                previewLoading ||
                                draftLoading
                            }
                        >

                            <option value="">
                                {
                                    loadingSessions
                                        ? 'Loading sessions...'
                                        : 'Select Academic Session'
                                }
                            </option>


                            {
                                sessions.map(
                                    session => (

                                        <option
                                            key={
                                                session.id
                                            }
                                            value={
                                                session.id
                                            }
                                        >

                                            {
                                                session.session_name
                                            }

                                            {' — '}

                                            {
                                                session.semester
                                            }

                                        </option>

                                    )
                                )
                            }

                        </select>

                    </div>


                    <div className="generate-session-info">

                        {
                            selectedSession
                                ? (

                                    <>
                                        <div>

                                            <span>
                                                Examination Period
                                            </span>

                                            <strong>

                                                {
                                                    formatDate(
                                                        selectedSession.exam_start_date
                                                    )
                                                }

                                                {' — '}

                                                {
                                                    formatDate(
                                                        selectedSession.exam_end_date
                                                    )
                                                }

                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Status
                                            </span>

                                            <strong>
                                                {
                                                    selectedSession.is_active
                                                        ? 'Active'
                                                        : 'Inactive'
                                                }
                                            </strong>

                                        </div>
                                    </>

                                )
                                : (

                                    <span>
                                        Select a session to view
                                        its examination period.
                                    </span>

                                )
                        }

                    </div>

                </div>


                <div className="generate-main-actions">

                    <button
                        type="button"
                        className="generate-preflight-button"
                        onClick={
                            runPreflight
                        }
                        disabled={
                            !selectedSessionId ||
                            preflightLoading ||
                            previewLoading ||
                            draftLoading
                        }
                    >

                        {
                            preflightLoading
                                ? 'Checking...'
                                : 'Run Preflight Check'
                        }

                    </button>


                    <button
                        type="button"
                        className="generate-preview-button"
                        onClick={
                            generatePreview
                        }
                        disabled={
                            !selectedSessionId ||
                            previewLoading ||
                            draftLoading
                        }
                    >

                        {
                            previewLoading
                                ? 'Generating...'
                                : 'Generate Preview'
                        }

                    </button>

                </div>

            </section>


            {/* ==================================================
                PREFLIGHT DASHBOARD
                ================================================== */}

            {
                preflight &&
                (

                    <section className="preflight-panel">

                        <div className="generate-section-heading">

                            <div>

                                <span className="generate-label">
                                    READINESS CHECK
                                </span>

                                <h3>
                                    Scheduler Preflight
                                </h3>

                            </div>

                        </div>


                        {/* STATUS */}

                        <div
                            className={
                                preflightReady
                                    ? 'preflight-status ready'
                                    : 'preflight-status warning'
                            }
                        >

                            <div className="preflight-status-icon">

                                {
                                    preflightReady
                                        ? '✓'
                                        : '!'
                                }

                            </div>


                            <div>

                                <strong>

                                    {
                                        preflightReady
                                            ? 'Ready for Timetable Generation'
                                            : 'Scheduling Requirements Need Attention'
                                    }

                                </strong>

                                <span>

                                    {
                                        preflightReady
                                            ? 'The selected examination session is ready for the scheduling engine.'
                                            : 'Review the scheduling resources and requirements before generating the timetable.'
                                    }

                                </span>

                            </div>

                        </div>


                        {/* SESSION DETAILS */}

                        <div className="preflight-session">

                            <div>

                                <span>
                                    Academic Session
                                </span>

                                <strong>

                                    {
                                        preflight.session?.session_name ||
                                        selectedSession?.session_name ||
                                        '—'
                                    }

                                </strong>

                                <small>

                                    {
                                        preflight.session?.semester ||
                                        selectedSession?.semester ||
                                        ''
                                    }

                                </small>

                            </div>


                            <div>

                                <span>
                                    Examination Period
                                </span>

                                <strong>

                                    {
                                        formatDate(
                                            preflight.session?.exam_start_date ||
                                            selectedSession?.exam_start_date
                                        )
                                    }

                                    {' — '}

                                    {
                                        formatDate(
                                            preflight.session?.exam_end_date ||
                                            selectedSession?.exam_end_date
                                        )
                                    }

                                </strong>

                            </div>

                        </div>


                        {/* RESOURCE CARDS */}

                        <div className="preflight-grid">

                            <div className="preflight-card">

                                <span>
                                    Active Courses
                                </span>

                                <strong>
                                    {preflightCourses}
                                </strong>

                            </div>


                            <div className="preflight-card">

                                <span>
                                    Time Slots
                                </span>

                                <strong>
                                    {preflightTimeSlots}
                                </strong>

                            </div>


                            <div className="preflight-card">

                                <span>
                                    Blackout Dates
                                </span>

                                <strong>
                                    {preflightBlackouts}
                                </strong>

                            </div>


                            <div className="preflight-card">

                                <span>
                                    Available Venues
                                </span>

                                <strong>
                                    {preflightVenues}
                                </strong>

                            </div>


                            <div className="preflight-card">

                                <span>
                                    Active Invigilators
                                </span>

                                <strong>
                                    {preflightInvigilators}
                                </strong>

                            </div>


                            <div className="preflight-card">

                                <span>
                                    Registered Students
                                </span>

                                <strong>
                                    {preflightStudents}
                                </strong>

                            </div>

                        </div>


                    </section>

                )
            }


            {/* ==================================================
                PREVIEW STATISTICS
                ================================================== */}

            {
                showPreview &&
                (

                    <section className="generate-statistics-grid">

                        <div className="generate-stat-card">

                            <span>
                                Courses Scheduled
                            </span>

                            <strong>

                                {
                                    getStat(
                                        'courses_scheduled',
                                        'coursesScheduled',
                                        'courses'
                                    )
                                }

                            </strong>

                        </div>


                        <div className="generate-stat-card">

                            <span>
                                Dates Used
                            </span>

                            <strong>

                                {
                                    getStat(
                                        'dates_used',
                                        'datesUsed'
                                    )
                                }

                            </strong>

                        </div>


                        <div className="generate-stat-card">

                            <span>
                                Slot Instances Used
                            </span>

                            <strong>

                                {
                                    getStat(
                                        'slot_instances_used',
                                        'slotInstancesUsed'
                                    )
                                }

                            </strong>

                        </div>


                        <div className="generate-stat-card">

                            <span>
                                Invigilators Used
                            </span>

                            <strong>

                                {
                                    getStat(
                                        'invigilators_used',
                                        'invigilatorsUsed'
                                    )
                                }

                            </strong>

                        </div>


                        <div className="generate-stat-card">

                            <span>
                                Venue Allocations
                            </span>

                            <strong>

                                {
                                    getStat(
                                        'venue_allocations',
                                        'venueAllocations'
                                    )
                                }

                            </strong>

                        </div>


                        <div className="generate-stat-card">

                            <span>
                                Invigilator Assignments
                            </span>

                            <strong>

                                {
                                    getStat(
                                        'total_invigilator_assignments',
                                        'invigilator_assignments',
                                        'invigilatorAssignments'
                                    )
                                }

                            </strong>

                        </div>

                    </section>

                )
            }


            {/* ==================================================
                TIMETABLE PREVIEW
                ================================================== */}

            {
                showPreview &&
                (

                    <section className="preview-panel">

                        <div className="generate-section-heading">

                            <div>

                                <span className="generate-label">
                                    GENERATED RESULT
                                </span>

                                <h3>
                                    Timetable Preview
                                </h3>

                            </div>


                            <button
                                type="button"
                                className="close-preview-button"
                                onClick={() =>
                                    setShowPreview(false)
                                }
                            >
                                Hide Preview
                            </button>

                        </div>


                        <div className="preview-session-banner">

                            <strong>

                                {
                                    preview.session?.session_name ||
                                    selectedSession?.session_name ||
                                    'Academic Session'
                                }

                            </strong>

                            <span>

                                {
                                    preview.session?.semester ||
                                    selectedSession?.semester ||
                                    ''
                                }

                            </span>

                        </div>


                        {
                            scheduleByDate.length === 0
                                ? (

                                    <div className="preview-empty">

                                        <strong>
                                            No generated schedule found
                                        </strong>

                                        <span>
                                            The scheduling engine returned
                                            no timetable entries.
                                        </span>

                                    </div>

                                )
                                : (

                                    <div className="generated-schedule-list">

                                        {
                                            scheduleByDate.map(
                                                (
                                                    [
                                                        date,
                                                        exams
                                                    ]
                                                ) => (

                                                    <div
                                                        className="schedule-date-group"
                                                        key={date}
                                                    >

                                                        <div className="schedule-date-heading">

                                                            <span>
                                                                EXAMINATION DATE
                                                            </span>

                                                            <strong>
                                                                {
                                                                    formatDate(
                                                                        date
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="schedule-exams">

                                                            {
                                                                exams.map(
                                                                    (
                                                                        exam,
                                                                        index
                                                                    ) => (

                                                                        <article
                                                                            className="schedule-exam-card"
                                                                            key={
                                                                                exam.id ||
                                                                                `${exam.course_id || exam.course_code}-${date}-${exam.time_slot_id || index}`
                                                                            }
                                                                        >

                                                                            <div className="schedule-exam-main">

                                                                                <span className="schedule-course-code">

                                                                                    {
                                                                                        exam.course_code ||
                                                                                        'Course'
                                                                                    }

                                                                                </span>

                                                                                <h4>

                                                                                    {
                                                                                        exam.course_title ||
                                                                                        exam.title ||
                                                                                        'Examination'
                                                                                    }

                                                                                </h4>

                                                                                <span>

                                                                                    {
                                                                                        exam.department_code ||
                                                                                        exam.department_name ||
                                                                                        '—'
                                                                                    }

                                                                                    {' • Level '}

                                                                                    {
                                                                                        exam.level ||
                                                                                        '—'
                                                                                    }

                                                                                </span>

                                                                            </div>


                                                                            <div className="schedule-exam-time">

                                                                                <span>
                                                                                    Time Slot
                                                                                </span>

                                                                                <strong>

                                                                                    {
                                                                                        exam.slot_label ||
                                                                                        '—'
                                                                                    }

                                                                                </strong>

                                                                                <small>

                                                                                    {
                                                                                        formatTime(
                                                                                            exam.start_time
                                                                                        )
                                                                                    }

                                                                                    {' — '}

                                                                                    {
                                                                                        formatTime(
                                                                                            exam.end_time
                                                                                        )
                                                                                    }

                                                                                </small>

                                                                            </div>


                                                                            <div className="schedule-exam-candidates">

                                                                                <span>
                                                                                    Candidates
                                                                                </span>

                                                                                <strong>

                                                                                    {
                                                                                        exam.candidate_count ??
                                                                                        0
                                                                                    }

                                                                                </strong>

                                                                            </div>


                                                                            <div className="schedule-exam-venue">

                                                                                <span>
                                                                                    Venues
                                                                                </span>

                                                                                <strong>

                                                                                    {
                                                                                        exam.venue_allocation?.venue_count ??
                                                                                        exam.venue_count ??
                                                                                        0
                                                                                    }

                                                                                </strong>

                                                                            </div>


                                                                            <div className="schedule-exam-invigilator">

                                                                                <span>
                                                                                    Invigilators
                                                                                </span>

                                                                                <strong>

                                                                                    {
                                                                                        exam.invigilator_allocation?.assigned_count ??
                                                                                        exam.invigilator_count ??
                                                                                        0
                                                                                    }

                                                                                </strong>

                                                                            </div>

                                                                        </article>

                                                                    )
                                                                )
                                                            }

                                                        </div>

                                                    </div>

                                                )
                                            )
                                        }

                                    </div>

                                )
                        }

                    </section>

                )
            }


            {/* ==================================================
                SAVE DRAFT
                ================================================== */}

            {
                showPreview &&
                schedule.length > 0 &&
                (

                    <section className="draft-panel">

                        <div className="generate-section-heading">

                            <div>

                                <span className="generate-label">
                                    TIMETABLE VERSION
                                </span>

                                <h3>
                                    Save Generated Timetable
                                </h3>

                            </div>

                        </div>


                        <p className="draft-description">

                            Save the generated timetable as a draft.
                            The server performs the scheduling again
                            before saving the official draft version.

                        </p>


                        <div className="draft-form-grid">

                            <div className="generate-form-group">

                                <label>
                                    Timetable Title
                                </label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={
                                        event =>
                                            setTitle(
                                                event.target.value
                                            )
                                    }
                                    placeholder={
                                        selectedSession
                                            ? `${selectedSession.session_name} ${selectedSession.semester} Semester Examination Timetable`
                                            : 'Examination Timetable'
                                    }
                                    maxLength="200"
                                    disabled={
                                        draftLoading
                                    }
                                />

                            </div>


                            <div className="generate-form-group">

                                <label>
                                    Notes
                                </label>

                                <textarea
                                    value={notes}
                                    onChange={
                                        event =>
                                            setNotes(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Optional notes for this timetable version"
                                    rows="4"
                                    disabled={
                                        draftLoading
                                    }
                                />

                            </div>

                        </div>


                        <div className="draft-actions">

                            <button
                                type="button"
                                className="generate-draft-button"
                                onClick={
                                    generateDraft
                                }
                                disabled={
                                    draftLoading ||
                                    previewLoading ||
                                    !selectedSessionId
                                }
                            >

                                {
                                    draftLoading
                                        ? 'Generating Draft...'
                                        : 'Generate & Save Draft'
                                }

                            </button>

                        </div>


                        {
                            draftResult?.timetable &&
                            (

                                <div className="draft-result">

                                    <span>
                                        Draft Created
                                    </span>

                                    <strong>

                                        {
                                            draftResult.timetable.title
                                        }

                                    </strong>

                                    <small>

                                        Version {
                                            draftResult.timetable.version_number
                                        }

                                        {' • Status: '}

                                        {
                                            draftResult.timetable.status
                                        }

                                    </small>

                                </div>

                            )
                        }

                    </section>

                )
            }

        </ExamOfficerLayout>
    );
};


export default GenerateTimetablePage;