import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';

import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/publishedTimetable.css';


const PublishedTimetablePage = () => {

    const [sessions, setSessions] = useState([]);

    const [selectedSessionId, setSelectedSessionId] =
        useState('');

    const [timetableData, setTimetableData] =
        useState(null);

    const [loadingSessions, setLoadingSessions] =
        useState(true);

    const [loadingTimetable, setLoadingTimetable] =
        useState(false);

    const [downloadLoading, setDownloadLoading] =
        useState('');

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');


    // ======================================================
    // LOAD ACADEMIC SESSIONS
    // ======================================================

    const loadSessions = async () => {

        try {

            setLoadingSessions(true);
            setError('');

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

    const selectedSession =
        useMemo(() => {

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

    const formatDate = (value) => {

        if (!value) {
            return '—';
        }

        const clean =
            String(value).slice(0, 10);

        const parsed =
            new Date(
                `${clean}T00:00:00`
            );

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return String(value);
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

    const formatTime = (value) => {

        if (!value) {
            return '—';
        }

        const parts =
            String(value).split(':');

        if (parts.length < 2) {
            return String(value);
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
    // ERROR MESSAGE
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
    // VIEW PUBLISHED TIMETABLE
    // ======================================================

    const loadPublishedTimetable = async () => {

        if (!selectedSessionId) {

            setError(
                'Please select an academic session first.'
            );

            return;
        }


        try {

            setError('');
            setSuccess('');

            setLoadingTimetable(true);

            setTimetableData(null);


            // ------------------------------------------------
            // STEP 1:
            // FIND PUBLISHED VERSION
            // ------------------------------------------------

            const listResponse =
                await api.get(
                    '/timetables',
                    {
                        params: {
                            session_id:
                                Number(
                                    selectedSessionId
                                ),

                            status:
                                'published'
                        }
                    }
                );


            const publishedTimetables =
                listResponse.data?.timetables || [];


            if (
                publishedTimetables.length === 0
            ) {

                setError(
                    'No published timetable exists for the selected academic session.'
                );

                setTimetableData(null);

                return;
            }


            // ------------------------------------------------
            // GET LATEST PUBLISHED VERSION
            // ------------------------------------------------

            const publishedTimetable =
                [...publishedTimetables].sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            b.version_number || 0
                        ) -
                        Number(
                            a.version_number || 0
                        )
                )[0];


            // ------------------------------------------------
            // STEP 2:
            // GET COMPLETE TIMETABLE
            // ------------------------------------------------

            const detailResponse =
                await api.get(
                    `/timetables/${publishedTimetable.id}`
                );


            const data =
                detailResponse.data || {};


            setTimetableData(
                data
            );


            setSuccess(
                'Published timetable loaded successfully.'
            );

        } catch (error) {

            console.error(
                'Load published timetable error:',
                error
            );

            setTimetableData(null);

            setError(
                getErrorMessage(
                    error,
                    'Unable to retrieve published timetable.'
                )
            );

        } finally {

            setLoadingTimetable(false);
        }
    };


    // ======================================================
    // DOWNLOAD PUBLISHED TIMETABLE
    //
    // GENERAL TIMETABLE
    //
    // The backend only returns the file when the timetable
    // is already published.
    // ======================================================

    const downloadPublishedTimetable = async (
        format
    ) => {

        if (!selectedSessionId) {

            setError(
                'Please select an academic session first.'
            );

            return;
        }


        if (
            !timetable?.id ||
            String(
                timetable.status
            ).toLowerCase() !== 'published'
        ) {

            setError(
                'Only a published timetable can be downloaded.'
            );

            return;
        }


        const downloadKey =
            `published-${format}`;


        try {

            setError('');
            setSuccess('');

            setDownloadLoading(
                downloadKey
            );


            const response =
                await api.get(
                    `/timetables/published/download/${format}`,
                    {
                        params: {
                            session_id:
                                Number(
                                    selectedSessionId
                                )
                        },

                        responseType:
                            'blob'
                    }
                );


            const blob =
                response.data;


            const objectUrl =
                window.URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    'a'
                );


            link.href =
                objectUrl;


            const baseName =
                String(
                    timetable.title ||
                    'Published_Examination_Timetable'
                )
                    .replace(
                        /[^a-z0-9]+/gi,
                        '_'
                    )
                    .replace(
                        /^_+|_+$/g,
                        ''
                    );


            link.download =
                `${baseName}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            window.URL.revokeObjectURL(
                objectUrl
            );


            setSuccess(
                format === 'pdf'
                    ? 'Published timetable PDF downloaded successfully.'
                    : 'Published timetable Excel file downloaded successfully.'
            );

        } catch (error) {

            console.error(
                'Published timetable download error:',
                error
            );


            let message =
                'Unable to download published timetable.';


            /*
             * When the backend sends an error while the
             * frontend requested a blob, the error body
             * is also received as a Blob.
             */

            if (
                error.response?.data instanceof Blob
            ) {

                try {

                    const text =
                        await error.response.data.text();


                    const parsed =
                        JSON.parse(
                            text
                        );


                    message =
                        parsed.message ||
                        message;

                } catch {
                    // Keep fallback message.
                }

            } else {

                message =
                    getErrorMessage(
                        error,
                        message
                    );
            }


            setError(
                message
            );

        } finally {

            setDownloadLoading(
                ''
            );
        }
    };


    // ======================================================
    // DATA
    // ======================================================

    const timetable =
        timetableData?.timetable ||
        null;


    const entries =
        Array.isArray(
            timetableData?.entries
        )
            ? timetableData.entries
            : [];


    const statistics =
        timetableData?.statistics ||
        {};


    // ======================================================
    // GROUP ENTRIES BY DATE
    // ======================================================

    const groupedEntries =
        useMemo(() => {

            const grouped = {};


            entries.forEach(
                entry => {

                    const date =
                        entry.exam_date ||
                        'Unknown Date';


                    if (!grouped[date]) {

                        grouped[date] = [];
                    }


                    grouped[date].push(
                        entry
                    );

                }
            );


            return Object.entries(
                grouped
            );

        }, [entries]);


    // ======================================================
    // TOTAL CANDIDATES
    // ======================================================

    const totalCandidates =
        useMemo(() => {

            return entries.reduce(
                (
                    total,
                    entry
                ) =>
                    total +
                    Number(
                        entry.candidate_count || 0
                    ),
                0
            );

        }, [entries]);


    // ======================================================
    // TOTAL VENUE ALLOCATIONS
    // ======================================================

    const totalVenueAllocations =
        useMemo(() => {

            if (
                statistics.venue_allocations !==
                undefined
            ) {

                return Number(
                    statistics.venue_allocations
                );
            }


            return entries.reduce(
                (
                    total,
                    entry
                ) => {

                    const venues =
                        entry.venue_allocation?.venues;


                    if (
                        Array.isArray(
                            venues
                        )
                    ) {

                        return total +
                            venues.length;
                    }


                    return total;

                },
                0
            );

        }, [
            statistics,
            entries
        ]);


    // ======================================================
    // TOTAL INVIGILATOR ASSIGNMENTS
    // ======================================================

    const totalInvigilatorAssignments =
        useMemo(() => {

            if (
                statistics.invigilator_assignments !==
                undefined
            ) {

                return Number(
                    statistics.invigilator_assignments
                );
            }


            return entries.reduce(
                (
                    total,
                    entry
                ) => {

                    const invigilators =
                        entry.invigilator_allocation
                            ?.invigilators;


                    if (
                        Array.isArray(
                            invigilators
                        )
                    ) {

                        return total +
                            invigilators.length;
                    }


                    return total;

                },
                0
            );

        }, [
            statistics,
            entries
        ]);


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Published Timetable"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="published-header">

                <div>

                    <span className="published-label">
                        OFFICIAL EXAMINATION SCHEDULE
                    </span>

                    <h2>
                        Published Timetable
                    </h2>

                    <p>
                        View the official published examination
                        timetable for the selected academic session.
                    </p>

                </div>

            </section>


            {/* ==================================================
                SUCCESS
                ================================================== */}

            {success && (

                <div className="published-success">

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

                <div className="published-error">

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
                SESSION SELECTOR
                ================================================== */}

            <section className="published-selector-panel">

                <div>

                    <span className="published-label">
                        EXAMINATION SESSION
                    </span>

                    <h3>
                        Select Academic Session
                    </h3>

                </div>


                <div className="published-selector-row">

                    <select
                        value={
                            selectedSessionId
                        }
                        onChange={
                            event => {

                                setSelectedSessionId(
                                    event.target.value
                                );

                                setTimetableData(
                                    null
                                );

                                setSuccess('');
                                setError('');
                            }
                        }
                        disabled={
                            loadingSessions ||
                            loadingTimetable
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


                    <button
                        type="button"
                        className="published-load-button"
                        onClick={
                            loadPublishedTimetable
                        }
                        disabled={
                            !selectedSessionId ||
                            loadingTimetable
                        }
                    >

                        {
                            loadingTimetable
                                ? 'Loading...'
                                : 'View Published Timetable'
                        }

                    </button>

                </div>


                {
                    selectedSession &&
                    (

                        <div className="published-session-info">

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

                    )
                }

            </section>


            {/* ==================================================
                EMPTY STATE
                ================================================== */}

            {
                !timetableData &&
                !loadingTimetable &&
                !error &&
                (

                    <section className="published-empty">

                        <div className="published-empty-icon">
                            📅
                        </div>

                        <strong>
                            No timetable selected
                        </strong>

                        <span>
                            Select an academic session and
                            click View Published Timetable.
                        </span>

                    </section>

                )
            }


            {/* ==================================================
                PUBLISHED TIMETABLE
                ================================================== */}

            {
                timetable &&
                (

                    <>

                        {/* ------------------------------------------------
                           TIMETABLE HEADER
                           ------------------------------------------------ */}

                        <section className="published-info-panel">

                            <div className="published-info-main">

                                <span className="published-label">
                                    OFFICIAL PUBLISHED VERSION
                                </span>

                                <h3>
                                    {
                                        timetable.title
                                    }
                                </h3>

                                <div className="published-meta">

                                    <span>
                                        {
                                            timetable.session_name
                                        }
                                    </span>

                                    <span>
                                        {
                                            timetable.semester
                                        }
                                    </span>

                                    <span>
                                        Version {
                                            timetable.version_number
                                        }
                                    </span>

                                </div>

                            </div>


                            <div className="published-header-actions">

                                <div className="published-status-badge">
                                    Published
                                </div>


                                <div className="published-download-actions">

                                    <button
                                        type="button"
                                        className="published-download-excel"
                                        onClick={() =>
                                            downloadPublishedTimetable(
                                                'excel'
                                            )
                                        }
                                        disabled={
                                            downloadLoading !== '' ||
                                            String(
                                                timetable.status
                                            ).toLowerCase() !==
                                            'published'
                                        }
                                    >

                                        {
                                            downloadLoading ===
                                            'published-excel'
                                                ? 'Downloading...'
                                                : 'Excel'
                                        }

                                    </button>


                                    <button
                                        type="button"
                                        className="published-download-pdf"
                                        onClick={() =>
                                            downloadPublishedTimetable(
                                                'pdf'
                                            )
                                        }
                                        disabled={
                                            downloadLoading !== '' ||
                                            String(
                                                timetable.status
                                            ).toLowerCase() !==
                                            'published'
                                        }
                                    >

                                        {
                                            downloadLoading ===
                                            'published-pdf'
                                                ? 'Downloading...'
                                                : 'PDF'
                                        }

                                    </button>

                                </div>

                            </div>

                        </section>


                        {/* ------------------------------------------------
                           STATISTICS
                           ------------------------------------------------ */}

                        <section className="published-stat-grid">

                            <div className="published-stat-card">

                                <span>
                                    Examinations
                                </span>

                                <strong>
                                    {
                                        statistics.entries ??
                                        entries.length
                                    }
                                </strong>

                            </div>


                            <div className="published-stat-card">

                                <span>
                                    Candidates
                                </span>

                                <strong>
                                    {totalCandidates}
                                </strong>

                            </div>


                            <div className="published-stat-card">

                                <span>
                                    Venue Allocations
                                </span>

                                <strong>
                                    {totalVenueAllocations}
                                </strong>

                            </div>


                            <div className="published-stat-card">

                                <span>
                                    Invigilator Assignments
                                </span>

                                <strong>
                                    {totalInvigilatorAssignments}
                                </strong>

                            </div>

                        </section>


                        {/* ------------------------------------------------
                           SCHEDULE
                           ------------------------------------------------ */}

                        <section className="published-schedule-panel">

                            <div className="published-section-heading">

                                <div>

                                    <span className="published-label">
                                        OFFICIAL EXAMINATION SCHEDULE
                                    </span>

                                    <h3>
                                        Examination Timetable
                                    </h3>

                                </div>

                            </div>


                            {
                                groupedEntries.length === 0
                                    ? (

                                        <div className="published-no-exams">

                                            <strong>
                                                No examinations found
                                            </strong>

                                            <span>
                                                The published timetable
                                                contains no entries.
                                            </span>

                                        </div>

                                    )
                                    : (

                                        <div className="published-days">

                                            {
                                                groupedEntries.map(
                                                    (
                                                        [
                                                            date,
                                                            dayEntries
                                                        ]
                                                    ) => (

                                                        <div
                                                            className="published-day"
                                                            key={date}
                                                        >

                                                            <div className="published-day-header">

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


                                                            <div className="published-exam-list">

                                                                {
                                                                    dayEntries.map(
                                                                        entry => (

                                                                            <article
                                                                                className="published-exam-card"
                                                                                key={
                                                                                    entry.id
                                                                                }
                                                                            >

                                                                                {/* COURSE */}

                                                                                <div className="published-exam-course">

                                                                                    <span>
                                                                                        {
                                                                                            entry.course_code
                                                                                        }
                                                                                    </span>

                                                                                    <strong>
                                                                                        {
                                                                                            entry.course_title
                                                                                        }
                                                                                    </strong>

                                                                                    <small>
                                                                                        Level {
                                                                                            entry.level
                                                                                        }
                                                                                    </small>

                                                                                </div>


                                                                                {/* TIME */}

                                                                                <div className="published-exam-time">

                                                                                    <span>
                                                                                        Time
                                                                                    </span>

                                                                                    <strong>
                                                                                        {
                                                                                            entry.slot_label
                                                                                        }
                                                                                    </strong>

                                                                                    <small>

                                                                                        {
                                                                                            formatTime(
                                                                                                entry.start_time
                                                                                            )
                                                                                        }

                                                                                        {' — '}

                                                                                        {
                                                                                            formatTime(
                                                                                                entry.end_time
                                                                                            )
                                                                                        }

                                                                                    </small>

                                                                                </div>


                                                                                {/* CANDIDATES */}

                                                                                <div className="published-exam-candidates">

                                                                                    <span>
                                                                                        Candidates
                                                                                    </span>

                                                                                    <strong>
                                                                                        {
                                                                                            entry.candidate_count ??
                                                                                            0
                                                                                        }
                                                                                    </strong>

                                                                                </div>


                                                                                {/* VENUES */}

                                                                                <div className="published-exam-venues">

                                                                                    <span>
                                                                                        Venues
                                                                                    </span>


                                                                                    {
                                                                                        Array.isArray(
                                                                                            entry.venue_allocation?.venues
                                                                                        ) &&
                                                                                        entry.venue_allocation.venues.length > 0
                                                                                            ? (

                                                                                                entry.venue_allocation.venues.map(
                                                                                                    venue => (

                                                                                                        <div
                                                                                                            className="published-resource-item"
                                                                                                            key={
                                                                                                                venue.venue_id
                                                                                                            }
                                                                                                        >

                                                                                                            <strong>
                                                                                                                {
                                                                                                                    venue.venue_name
                                                                                                                }
                                                                                                            </strong>

                                                                                                            <small>

                                                                                                                {
                                                                                                                    venue.venue_code
                                                                                                                }

                                                                                                                {' • Capacity '}

                                                                                                                {
                                                                                                                    venue.capacity
                                                                                                                }

                                                                                                            </small>

                                                                                                        </div>

                                                                                                    )
                                                                                                )

                                                                                            )
                                                                                            : (

                                                                                                <small>
                                                                                                    No venue assigned
                                                                                                </small>

                                                                                            )
                                                                                    }

                                                                                </div>


                                                                                {/* INVIGILATORS */}

                                                                                <div className="published-exam-invigilators">

                                                                                    <span>
                                                                                        Invigilators
                                                                                    </span>


                                                                                    {
                                                                                        Array.isArray(
                                                                                            entry.invigilator_allocation?.invigilators
                                                                                        ) &&
                                                                                        entry.invigilator_allocation.invigilators.length > 0
                                                                                            ? (

                                                                                                entry.invigilator_allocation.invigilators.map(
                                                                                                    invigilator => (

                                                                                                        <div
                                                                                                            className="published-resource-item"
                                                                                                            key={
                                                                                                                invigilator.invigilator_id
                                                                                                            }
                                                                                                        >

                                                                                                            <strong>
                                                                                                                {
                                                                                                                    invigilator.full_name
                                                                                                                }
                                                                                                            </strong>

                                                                                                            <small>
                                                                                                                {
                                                                                                                    invigilator.staff_id
                                                                                                                }
                                                                                                            </small>

                                                                                                        </div>

                                                                                                    )
                                                                                                )

                                                                                            )
                                                                                            : (

                                                                                                <small>
                                                                                                    No invigilator assigned
                                                                                                </small>

                                                                                            )
                                                                                    }

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

                    </>
                )
            }

        </ExamOfficerLayout>
    );
};


export default PublishedTimetablePage;