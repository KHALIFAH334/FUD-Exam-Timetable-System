import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';
import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/blackoutDates.css';


const EMPTY_FORM = {
    session_id: '',
    blackout_date: '',
    reason: ''
};


const BlackoutDatesPage = () => {

    const [blackoutDates, setBlackoutDates] = useState([]);
    const [sessions, setSessions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [modalMode, setModalMode] = useState(null);
    const [selectedBlackout, setSelectedBlackout] = useState(null);

    const [formData, setFormData] = useState({
        ...EMPTY_FORM
    });


    // ======================================================
    // LOAD BLACKOUT DATES
    // ======================================================

    const loadBlackoutDates = async () => {

        try {

            setLoading(true);
            setError('');

            const response =
                await api.get('/blackout-dates');

            setBlackoutDates(
                response.data?.blackout_dates || []
            );

        } catch (error) {

            console.error(
                'Load blackout dates error:',
                error
            );

            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Unable to load blackout dates.'
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD ACADEMIC SESSIONS
    // ======================================================

    const loadSessions = async () => {

        try {

            setSessionsLoading(true);

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

            setSessionsLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadBlackoutDates();
        loadSessions();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const uniqueSessions = useMemo(() => {

        return new Set(
            blackoutDates.map(
                item => item.session_id
            )
        ).size;

    }, [blackoutDates]);


    const upcomingDates = useMemo(() => {

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        return blackoutDates.filter(item => {

            if (!item.blackout_date) {
                return false;
            }

            const date = new Date(
                `${String(item.blackout_date).slice(0, 10)}T00:00:00`
            );

            return (
                !Number.isNaN(date.getTime()) &&
                date >= today
            );

        }).length;

    }, [blackoutDates]);


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (date) => {

        if (!date) {
            return '—';
        }

        const cleanDate =
            String(date).slice(
                0,
                10
            );

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
    // FIND SELECTED SESSION
    // ======================================================

    const selectedSession = useMemo(() => {

        if (!formData.session_id) {
            return null;
        }

        return sessions.find(
            session =>
                Number(session.id) ===
                Number(formData.session_id)
        ) || null;

    }, [
        sessions,
        formData.session_id
    ]);


    // ======================================================
    // SESSION EXAMINATION START
    // ======================================================

    const selectedExamStart =
        selectedSession?.exam_start_date
            ? String(
                selectedSession.exam_start_date
            ).slice(0, 10)
            : '';


    // ======================================================
    // SESSION EXAMINATION END
    // ======================================================

    const selectedExamEnd =
        selectedSession?.exam_end_date
            ? String(
                selectedSession.exam_end_date
            ).slice(0, 10)
            : '';


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        setError('');
        setSuccess('');

        setSelectedBlackout(null);

        setFormData({
            ...EMPTY_FORM
        });

        setModalMode('create');
    };


    // ======================================================
    // OPEN VIEW
    // ======================================================

    const openView = (blackout) => {

        setError('');

        setSelectedBlackout(
            blackout
        );

        setModalMode('view');
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEdit = (blackout) => {

        setError('');
        setSuccess('');

        setSelectedBlackout(
            blackout
        );

        setFormData({

            session_id:
                blackout.session_id
                    ? String(
                        blackout.session_id
                    )
                    : '',

            blackout_date:
                blackout.blackout_date
                    ? String(
                        blackout.blackout_date
                    ).slice(0, 10)
                    : '',

            reason:
                blackout.reason || ''

        });

        setModalMode('edit');
    };


    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (saving) {
            return;
        }

        setModalMode(null);

        setSelectedBlackout(null);

        setFormData({
            ...EMPTY_FORM
        });

        setError('');
    };


    // ======================================================
    // HANDLE NORMAL CHANGE
    // ======================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));

        if (error) {
            setError('');
        }
    };


    // ======================================================
    // HANDLE SESSION CHANGE
    // ======================================================

    const handleSessionChange = (event) => {

        const sessionId =
            event.target.value;

        const session =
            sessions.find(
                item =>
                    Number(item.id) ===
                    Number(sessionId)
            );

        const examStart =
            session?.exam_start_date
                ? String(
                    session.exam_start_date
                ).slice(0, 10)
                : '';

        const examEnd =
            session?.exam_end_date
                ? String(
                    session.exam_end_date
                ).slice(0, 10)
                : '';

        let blackoutDate =
            formData.blackout_date;

        if (
            blackoutDate &&
            (
                (
                    examStart &&
                    blackoutDate < examStart
                ) ||
                (
                    examEnd &&
                    blackoutDate > examEnd
                )
            )
        ) {
            blackoutDate = '';
        }

        setFormData(previous => ({
            ...previous,
            session_id: sessionId,
            blackout_date: blackoutDate
        }));

        setError('');
    };


    // ======================================================
    // VALIDATE FORM
    // ======================================================

    const validateForm = () => {

        if (!formData.session_id) {

            setError(
                'Please select an academic session.'
            );

            return false;
        }


        if (!formData.blackout_date) {

            setError(
                'Please select a blackout date.'
            );

            return false;
        }


        if (!formData.reason.trim()) {

            setError(
                'Please enter a reason for the blackout date.'
            );

            return false;
        }


        const session =
            sessions.find(
                item =>
                    Number(item.id) ===
                    Number(formData.session_id)
            );


        if (!session) {

            setError(
                'The selected academic session could not be found.'
            );

            return false;
        }


        const examStart =
            session.exam_start_date
                ? String(
                    session.exam_start_date
                ).slice(0, 10)
                : '';


        const examEnd =
            session.exam_end_date
                ? String(
                    session.exam_end_date
                ).slice(0, 10)
                : '';


        if (
            examStart &&
            formData.blackout_date <
            examStart
        ) {

            setError(
                `Blackout date must be on or after ${formatDate(examStart)}.`
            );

            return false;
        }


        if (
            examEnd &&
            formData.blackout_date >
            examEnd
        ) {

            setError(
                `Blackout date must be on or before ${formatDate(examEnd)}.`
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE BLACKOUT DATE
    // ======================================================

    const createBlackoutDate =
        async (event) => {

            event.preventDefault();

            setError('');
            setSuccess('');


            if (!validateForm()) {
                return;
            }


            try {

                setSaving(true);

                const response =
                    await api.post(
                        '/blackout-dates',
                        {
                            session_id:
                                Number(
                                    formData.session_id
                                ),

                            blackout_date:
                                formData.blackout_date,

                            reason:
                                formData.reason.trim()
                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'Blackout date created successfully.'
                );


                setModalMode(null);

                setSelectedBlackout(null);

                setFormData({
                    ...EMPTY_FORM
                });


                await loadBlackoutDates();

            } catch (error) {

                console.error(
                    'Create blackout date error:',
                    error
                );


                setError(
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.response?.data?.errors?.join?.(', ') ||
                    error.message ||
                    'Unable to create blackout date.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // UPDATE BLACKOUT DATE
    // ======================================================

    const updateBlackoutDate =
        async (event) => {

            event.preventDefault();

            setError('');
            setSuccess('');


            if (!selectedBlackout?.id) {

                setError(
                    'No blackout date was selected.'
                );

                return;
            }


            if (!validateForm()) {
                return;
            }


            try {

                setSaving(true);

                const response =
                    await api.put(
                        `/blackout-dates/${selectedBlackout.id}`,
                        {
                            blackout_date:
                                formData.blackout_date,

                            reason:
                                formData.reason.trim()
                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'Blackout date updated successfully.'
                );


                setModalMode(null);

                setSelectedBlackout(null);

                setFormData({
                    ...EMPTY_FORM
                });


                await loadBlackoutDates();

            } catch (error) {

                console.error(
                    'Update blackout date error:',
                    error
                );


                setError(
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.response?.data?.errors?.join?.(', ') ||
                    error.message ||
                    'Unable to update blackout date.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // DELETE BLACKOUT DATE
    // ======================================================

    const deleteBlackoutDate =
        async (blackout) => {

            const confirmed =
                window.confirm(
                    `Are you sure you want to remove the blackout date ${formatDate(
                        blackout.blackout_date
                    )}?`
                );


            if (!confirmed) {
                return;
            }


            try {

                setError('');
                setSuccess('');


                const response =
                    await api.delete(
                        `/blackout-dates/${blackout.id}`
                    );


                setSuccess(
                    response.data?.message ||
                    'Blackout date removed successfully.'
                );


                await loadBlackoutDates();

            } catch (error) {

                console.error(
                    'Delete blackout date error:',
                    error
                );


                setError(
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Unable to remove blackout date.'
                );
            }
        };


    // ======================================================
    // REFRESH
    // ======================================================

    const refreshAll = async () => {

        await Promise.all([
            loadBlackoutDates(),
            loadSessions()
        ]);
    };


    return (

        <ExamOfficerLayout
            activePage="Blackout Dates"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="blackout-header">

                <div>

                    <span className="blackout-label">
                        SCHEDULING CONFIGURATION
                    </span>

                    <h2>
                        Blackout Dates
                    </h2>

                    <p>
                        Define dates within examination periods
                        when examinations must not be scheduled.
                    </p>

                </div>


                <button
                    type="button"
                    className="blackout-create-button"
                    onClick={openCreate}
                >
                    + New Blackout Date
                </button>

            </section>


            {/* ==================================================
                SUCCESS ALERT
                ================================================== */}

            {success && (

                <div className="blackout-success">

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
                ERROR ALERT
                ================================================== */}

            {error && !modalMode && (

                <div className="blackout-error">

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
                SUMMARY
                ================================================== */}

            <section className="blackout-summary-grid">

                <div className="blackout-summary-card">

                    <span>
                        Total Blackout Dates
                    </span>

                    <strong>
                        {blackoutDates.length}
                    </strong>

                </div>


                <div className="blackout-summary-card">

                    <span>
                        Sessions Affected
                    </span>

                    <strong>
                        {uniqueSessions}
                    </strong>

                </div>


                <div className="blackout-summary-card">

                    <span>
                        Upcoming Dates
                    </span>

                    <strong>
                        {upcomingDates}
                    </strong>

                </div>


                <div className="blackout-summary-card">

                    <span>
                        Current Records
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : blackoutDates.length
                        }
                    </strong>

                </div>

            </section>


            {/* ==================================================
                RECORDS
                ================================================== */}

            <section className="blackout-panel">

                <div className="blackout-panel-heading">

                    <div>

                        <span className="blackout-label">
                            EXAMINATION RESTRICTIONS
                        </span>

                        <h3>
                            Blackout Date List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="blackout-refresh-button"
                        onClick={refreshAll}
                        disabled={
                            loading ||
                            sessionsLoading
                        }
                    >
                        {
                            loading
                                ? 'Loading...'
                                : 'Refresh'
                        }
                    </button>

                </div>


                {loading ? (

                    <div className="blackout-loading">
                        Loading blackout dates...
                    </div>

                ) : blackoutDates.length === 0 ? (

                    <div className="blackout-empty">

                        <strong>
                            No blackout dates found
                        </strong>

                        <span>
                            Add dates that should remain
                            unavailable for examinations.
                        </span>

                    </div>

                ) : (

                    <div className="blackout-table-wrapper">

                        <table className="blackout-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Academic Session
                                    </th>

                                    <th>
                                        Semester
                                    </th>

                                    <th>
                                        Blackout Date
                                    </th>

                                    <th>
                                        Examination Period
                                    </th>

                                    <th>
                                        Reason
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    blackoutDates.map(
                                        (
                                            blackout,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    blackout.id
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            blackout.session_name ||
                                                            '—'
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        blackout.semester ||
                                                        '—'
                                                    }
                                                </td>


                                                <td>

                                                    <span className="blackout-date">

                                                        {
                                                            formatDate(
                                                                blackout.blackout_date
                                                            )
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <small className="exam-period">

                                                        {
                                                            formatDate(
                                                                blackout.exam_start_date
                                                            )
                                                        }

                                                        {' — '}

                                                        {
                                                            formatDate(
                                                                blackout.exam_end_date
                                                            )
                                                        }

                                                    </small>

                                                </td>


                                                <td>

                                                    <span className="blackout-reason">

                                                        {
                                                            blackout.reason
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="blackout-actions">

                                                        <button
                                                            type="button"
                                                            className="blackout-view-button"
                                                            onClick={() =>
                                                                openView(
                                                                    blackout
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="blackout-edit-button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    blackout
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="blackout-delete-button"
                                                            onClick={() =>
                                                                deleteBlackoutDate(
                                                                    blackout
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )
                                }

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* ==================================================
                CREATE / EDIT MODAL
                ================================================== */}

            {
                (
                    modalMode === 'create' ||
                    modalMode === 'edit'
                ) &&
                (

                    <div className="blackout-modal-overlay">

                        <div className="blackout-modal">

                            <div className="blackout-modal-header">

                                <div>

                                    <span className="blackout-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW EXAMINATION RESTRICTION'
                                                : 'UPDATE EXAMINATION RESTRICTION'
                                        }

                                    </span>

                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Blackout Date'
                                                : 'Edit Blackout Date'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="blackout-modal-close"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    ×
                                </button>

                            </div>


                            {error && (

                                <div className="blackout-modal-error">
                                    {error}
                                </div>

                            )}


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createBlackoutDate
                                        : updateBlackoutDate
                                }
                            >

                                {/* SESSION */}

                                <div className="blackout-form-group">

                                    <label>
                                        Academic Session
                                    </label>


                                    <select
                                        name="session_id"
                                        value={
                                            formData.session_id
                                        }
                                        onChange={
                                            handleSessionChange
                                        }
                                        disabled={
                                            sessionsLoading ||
                                            saving ||
                                            modalMode === 'edit'
                                        }
                                        required
                                    >

                                        <option value="">
                                            {
                                                sessionsLoading
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


                                {/* EXAM PERIOD */}

                                {
                                    selectedSession &&
                                    (

                                        <div className="blackout-info">

                                            <strong>
                                                Examination Period
                                            </strong>

                                            <span>

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

                                            </span>

                                        </div>

                                    )
                                }


                                {/* BLACKOUT DATE */}

                                <div className="blackout-form-group">

                                    <label>
                                        Blackout Date
                                    </label>

                                    <input
                                        type="date"
                                        name="blackout_date"
                                        value={
                                            formData.blackout_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min={
                                            selectedExamStart
                                        }
                                        max={
                                            selectedExamEnd
                                        }
                                        required
                                        disabled={
                                            saving ||
                                            !formData.session_id
                                        }
                                    />

                                </div>


                                {/* REASON */}

                                <div className="blackout-form-group">

                                    <label>
                                        Reason
                                    </label>

                                    <textarea
                                        name="reason"
                                        value={
                                            formData.reason
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: Public holiday, university event, public examination, etc."
                                        rows="4"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="blackout-info">

                                    <strong>
                                        Important
                                    </strong>

                                    <span>
                                        Only dates inside the selected
                                        examination period can be used
                                        as blackout dates.
                                    </span>

                                </div>


                                {/* ACTIONS */}

                                <div className="blackout-modal-actions">

                                    <button
                                        type="button"
                                        className="blackout-cancel-button"
                                        onClick={closeModal}
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="blackout-save-button"
                                        disabled={
                                            saving ||
                                            sessionsLoading ||
                                            !selectedSession
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Blackout Date'
                                                    : 'Update Blackout Date'
                                        }

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )
            }


            {/* ==================================================
                VIEW MODAL
                ================================================== */}

            {
                modalMode === 'view' &&
                selectedBlackout &&
                (

                    <div className="blackout-modal-overlay">

                        <div className="blackout-modal">

                            <div className="blackout-modal-header">

                                <div>

                                    <span className="blackout-label">
                                        BLACKOUT DATE INFORMATION
                                    </span>

                                    <h3>
                                        Blackout Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="blackout-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            <div className="blackout-detail-grid">

                                <div>

                                    <span>
                                        Academic Session
                                    </span>

                                    <strong>
                                        {
                                            selectedBlackout.session_name ||
                                            '—'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Semester
                                    </span>

                                    <strong>
                                        {
                                            selectedBlackout.semester ||
                                            '—'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Blackout Date
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                selectedBlackout.blackout_date
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Examination Period
                                    </span>

                                    <strong>

                                        {
                                            formatDate(
                                                selectedBlackout.exam_start_date
                                            )
                                        }

                                        {' — '}

                                        {
                                            formatDate(
                                                selectedBlackout.exam_end_date
                                            )
                                        }

                                    </strong>

                                </div>


                                <div className="blackout-detail-wide">

                                    <span>
                                        Reason
                                    </span>

                                    <strong>
                                        {
                                            selectedBlackout.reason
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="blackout-modal-actions">

                                <button
                                    type="button"
                                    className="blackout-cancel-button"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="blackout-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedBlackout
                                        )
                                    }
                                >
                                    Edit Blackout Date
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </ExamOfficerLayout>
    );
};


export default BlackoutDatesPage;