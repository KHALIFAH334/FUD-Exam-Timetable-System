import {
    useEffect,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/sessions.css';


const AcademicSessionsPage = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [sessions, setSessions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(null);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [selectedSession, setSelectedSession] =
        useState(null);

    const [modalMode, setModalMode] =
        useState(null);

    const [formData, setFormData] =
        useState({

            session_name:
                '',

            semester:
                'First',

            exam_start_date:
                '',

            exam_end_date:
                '',

            is_active:
                true

        });


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
    // LOAD SESSIONS
    // ======================================================

    const loadSessions = async () => {

        try {

            setLoading(true);

            setError('');


            const response =
                await api.get(
                    '/sessions'
                );


            setSessions(
                Array.isArray(
                    response.data?.sessions
                )
                    ? response.data.sessions
                    : []
            );


        } catch (error) {

            console.error(
                'Load sessions error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load academic sessions.'
                )
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadSessions();

    }, []);


    // ======================================================
    // HELPERS
    // ======================================================

    const isActive = (
        session
    ) => {

        return (
            session?.is_active === true ||
            session?.is_active === 1 ||
            session?.is_active === '1'
        );
    };


    const formatDate = (
        value
    ) => {

        if (!value) {

            return '—';
        }


        const parsed =
            new Date(
                value
            );


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return String(
                value
            );
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
    // FORM HANDLER
    // ======================================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setFormData(
            previous => ({

                ...previous,

                [name]:
                    type === 'checkbox'
                        ? checked
                        : value

            })
        );


        setError('');
    };


    // ======================================================
    // VALIDATE FORM
    // ======================================================

    const validateForm = () => {

        if (
            !formData.session_name.trim()
        ) {

            setError(
                'Academic session is required.'
            );

            return false;
        }


        if (
            !formData.exam_start_date
        ) {

            setError(
                'Examination start date is required.'
            );

            return false;
        }


        if (
            !formData.exam_end_date
        ) {

            setError(
                'Examination end date is required.'
            );

            return false;
        }


        if (
            new Date(
                formData.exam_end_date
            ) <
            new Date(
                formData.exam_start_date
            )
        ) {

            setError(
                'Examination end date cannot be earlier than start date.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // OPEN CREATE MODAL
    // ======================================================

    const openCreateModal = () => {

        setSelectedSession(
            null
        );


        setFormData({

            session_name:
                '',

            semester:
                'First',

            exam_start_date:
                '',

            exam_end_date:
                '',

            is_active:
                true

        });


        setError('');

        setSuccess('');

        setModalMode(
            'create'
        );
    };


    // ======================================================
    // OPEN EDIT MODAL
    // ======================================================

    const openEditModal = (
        session
    ) => {

        setSelectedSession(
            session
        );


        setFormData({

            session_name:
                session.session_name ||
                '',

            semester:
                session.semester ||
                'First',

            exam_start_date:
                String(
                    session.exam_start_date ||
                    ''
                ).slice(
                    0,
                    10
                ),

            exam_end_date:
                String(
                    session.exam_end_date ||
                    ''
                ).slice(
                    0,
                    10
                ),

            is_active:
                isActive(
                    session
                )

        });


        setError('');

        setSuccess('');

        setModalMode(
            'edit'
        );
    };


    // ======================================================
    // OPEN VIEW MODAL
    // ======================================================

    const openViewModal = (
        session
    ) => {

        setSelectedSession(
            session
        );


        setError('');

        setSuccess('');

        setModalMode(
            'view'
        );
    };


    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (
            saving ||
            deleting
        ) {

            return;
        }


        setModalMode(
            null
        );

        setSelectedSession(
            null
        );

        setError('');
    };


    // ======================================================
    // CREATE SESSION
    // ======================================================

    const createSession = async (
        event
    ) => {

        event.preventDefault();


        setError('');

        setSuccess('');


        if (
            !validateForm()
        ) {

            return;
        }


        try {

            setSaving(true);


            const body = {

                session_name:
                    formData
                        .session_name
                        .trim(),

                semester:
                    formData.semester,

                exam_start_date:
                    formData.exam_start_date,

                exam_end_date:
                    formData.exam_end_date
            };


            const response =
                await api.post(
                    '/sessions',
                    body
                );


            setSuccess(
                response.data?.message ||
                'Academic session created successfully.'
            );


            setModalMode(
                null
            );


            await loadSessions();


        } catch (error) {

            console.error(
                'Create session error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to create academic session.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // UPDATE SESSION
    // ======================================================

    const updateSession = async (
        event
    ) => {

        event.preventDefault();


        setError('');

        setSuccess('');


        if (
            !selectedSession?.id
        ) {

            setError(
                'No academic session was selected.'
            );

            return;
        }


        if (
            !validateForm()
        ) {

            return;
        }


        try {

            setSaving(true);


            const body = {

                session_name:
                    formData
                        .session_name
                        .trim(),

                semester:
                    formData.semester,

                exam_start_date:
                    formData.exam_start_date,

                exam_end_date:
                    formData.exam_end_date,

                is_active:
                    formData.is_active
                        ? 1
                        : 0

            };


            const response =
                await api.put(
                    `/sessions/${selectedSession.id}`,
                    body
                );


            setSuccess(
                response.data?.message ||
                'Academic session updated successfully.'
            );


            setModalMode(
                null
            );


            await loadSessions();


        } catch (error) {

            console.error(
                'Update session error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update academic session.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // DELETE SESSION
    // ======================================================

    const deleteSession = async (
        session
    ) => {

        if (
            !session?.id
        ) {

            return;
        }


        const confirmed =
            window.confirm(
                `Delete academic session "${session.session_name} — ${session.semester}"?\n\nThis action cannot be undone. If courses, registrations, or timetable records are linked to this session, the system will prevent deletion.`
            );


        if (!confirmed) {

            return;
        }


        try {

            setDeleting(
                session.id
            );


            setError('');

            setSuccess('');


            const response =
                await api.delete(
                    `/sessions/${session.id}`
                );


            setSuccess(
                response.data?.message ||
                'Academic session deleted successfully.'
            );


            if (
                selectedSession?.id ===
                session.id
            ) {

                setModalMode(
                    null
                );

                setSelectedSession(
                    null
                );
            }


            await loadSessions();


        } catch (error) {

            console.error(
                'Delete session error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to delete academic session.'
                )
            );

        } finally {

            setDeleting(null);
        }
    };


    // ======================================================
    // PAGE
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Academic Sessions"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="sessions-header">

                <div>

                    <span className="sessions-label">
                        SYSTEM CONFIGURATION
                    </span>


                    <h2>
                        Academic Sessions
                    </h2>


                    <p>
                        Manage academic sessions,
                        semesters and examination periods
                        used by the timetable scheduling
                        system.
                    </p>

                </div>


                <button
                    type="button"
                    className="session-create-button"
                    onClick={
                        openCreateModal
                    }
                >
                    + New Session
                </button>

            </section>


            {/* ==================================================
                SUCCESS
                ================================================== */}

            {
                success &&
                (

                    <div className="session-success">

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

                )
            }


            {/* ==================================================
                ERROR
                ================================================== */}

            {
                error &&
                !modalMode &&
                (

                    <div className="session-error">

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

                )
            }


            {/* ==================================================
                SUMMARY
                ================================================== */}

            <section className="session-summary-grid">

                <div className="session-summary-card">

                    <span>
                        Total Sessions
                    </span>

                    <strong>
                        {sessions.length}
                    </strong>

                </div>


                <div className="session-summary-card">

                    <span>
                        Active Sessions
                    </span>

                    <strong>
                        {
                            sessions.filter(
                                isActive
                            ).length
                        }
                    </strong>

                </div>


                <div className="session-summary-card">

                    <span>
                        Current Records
                    </span>

                    <strong>

                        {
                            loading
                                ? '...'
                                : sessions.length
                        }

                    </strong>

                </div>

            </section>


            {/* ==================================================
                SESSION PANEL
                ================================================== */}

            <section className="sessions-panel">

                <div className="sessions-panel-heading">

                    <div>

                        <span className="sessions-label">
                            ACADEMIC RECORDS
                        </span>


                        <h3>
                            Session List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="refresh-session-button"
                        onClick={
                            loadSessions
                        }
                        disabled={
                            loading ||
                            saving ||
                            deleting !== null
                        }
                    >
                        {
                            loading
                                ? 'Loading...'
                                : 'Refresh'
                        }
                    </button>

                </div>


                {
                    loading
                        ? (

                            <div className="sessions-loading">
                                Loading academic sessions...
                            </div>

                        )
                        : sessions.length === 0
                            ? (

                                <div className="sessions-empty">

                                    <strong>
                                        No academic sessions found
                                    </strong>

                                    <span>
                                        Create an academic session
                                        before generating examination
                                        timetables.
                                    </span>

                                </div>

                            )
                            : (

                                <div className="sessions-table-wrapper">

                                    <table className="sessions-table">

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
                                                    Examination Start
                                                </th>

                                                <th>
                                                    Examination End
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Action
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                sessions.map(
                                                    (
                                                        session,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                session.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    index + 1
                                                                }
                                                            </td>


                                                            <td>

                                                                <strong
                                                                    className="session-name"
                                                                >
                                                                    {
                                                                        session.session_name ||
                                                                        '—'
                                                                    }
                                                                </strong>

                                                            </td>


                                                            <td>
                                                                {
                                                                    session.semester ||
                                                                    '—'
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        session.exam_start_date
                                                                    )
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        session.exam_end_date
                                                                    )
                                                                }
                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        isActive(
                                                                            session
                                                                        )
                                                                            ? 'session-status active'
                                                                            : 'session-status inactive'
                                                                    }
                                                                >

                                                                    {
                                                                        isActive(
                                                                            session
                                                                        )
                                                                            ? 'Active'
                                                                            : 'Inactive'
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <div className="session-table-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="session-view-button"
                                                                        onClick={() =>
                                                                            openViewModal(
                                                                                session
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >
                                                                        View
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="session-edit-button"
                                                                        onClick={() =>
                                                                            openEditModal(
                                                                                session
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="session-delete-button"
                                                                        onClick={() =>
                                                                            deleteSession(
                                                                                session
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            deleting ===
                                                                            session.id
                                                                                ? 'Deleting...'
                                                                                : 'Delete'
                                                                        }

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

                            )
                }

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

                    <div className="session-modal-overlay">

                        <div className="session-modal">

                            <div className="session-modal-header">

                                <div>

                                    <span className="sessions-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW ACADEMIC RECORD'
                                                : 'UPDATE ACADEMIC RECORD'
                                        }

                                    </span>


                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Academic Session'
                                                : 'Edit Academic Session'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            {
                                error &&
                                (

                                    <div className="modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createSession
                                        : updateSession
                                }
                            >

                                <div className="session-form-grid">

                                    <div className="session-form-group">

                                        <label>
                                            Academic Session
                                        </label>


                                        <input
                                            type="text"
                                            name="session_name"
                                            value={
                                                formData.session_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Example: 2027/2028"
                                            required
                                        />

                                    </div>


                                    <div className="session-form-group">

                                        <label>
                                            Semester
                                        </label>


                                        <select
                                            name="semester"
                                            value={
                                                formData.semester
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="First">
                                                First Semester
                                            </option>

                                            <option value="Second">
                                                Second Semester
                                            </option>

                                        </select>

                                    </div>


                                    <div className="session-form-group">

                                        <label>
                                            Examination Start Date
                                        </label>


                                        <input
                                            type="date"
                                            name="exam_start_date"
                                            value={
                                                formData.exam_start_date
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="session-form-group">

                                        <label>
                                            Examination End Date
                                        </label>


                                        <input
                                            type="date"
                                            name="exam_end_date"
                                            value={
                                                formData.exam_end_date
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                {
                                    modalMode === 'edit' &&
                                    (

                                        <label className="session-active-control">

                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={
                                                    formData.is_active
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />


                                            <span>

                                                <strong>
                                                    Active Session
                                                </strong>

                                                <small>
                                                    Allow this academic session
                                                    to remain active in the
                                                    timetable system.
                                                </small>

                                            </span>

                                        </label>

                                    )
                                }


                                <div className="session-modal-actions">

                                    <button
                                        type="button"
                                        className="modal-cancel-button"
                                        onClick={
                                            closeModal
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="modal-save-button"
                                        disabled={
                                            saving
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Session'
                                                    : 'Update Session'
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
                selectedSession &&
                (

                    <div className="session-modal-overlay">

                        <div className="session-modal session-view-modal">

                            <div className="session-modal-header">

                                <div>

                                    <span className="sessions-label">
                                        SESSION INFORMATION
                                    </span>


                                    <h3>
                                        Academic Session Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            {
                                error &&
                                (

                                    <div className="modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <div className="session-detail-grid">

                                <div>

                                    <span>
                                        Academic Session
                                    </span>


                                    <strong>
                                        {
                                            selectedSession.session_name
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Semester
                                    </span>


                                    <strong>
                                        {
                                            selectedSession.semester
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Examination Start
                                    </span>


                                    <strong>
                                        {
                                            formatDate(
                                                selectedSession.exam_start_date
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Examination End
                                    </span>


                                    <strong>
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


                                    <strong
                                        className={
                                            isActive(
                                                selectedSession
                                            )
                                                ? 'detail-active'
                                                : 'detail-inactive'
                                        }
                                    >

                                        {
                                            isActive(
                                                selectedSession
                                            )
                                                ? 'Active'
                                                : 'Inactive'
                                        }

                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Record ID
                                    </span>


                                    <strong>
                                        {
                                            selectedSession.id
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="session-modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="modal-save-button"
                                    onClick={() =>
                                        openEditModal(
                                            selectedSession
                                        )
                                    }
                                >
                                    Edit Session
                                </button>


                                <button
                                    type="button"
                                    className="session-delete-button"
                                    onClick={() =>
                                        deleteSession(
                                            selectedSession
                                        )
                                    }
                                    disabled={
                                        deleting !== null
                                    }
                                >

                                    {
                                        deleting ===
                                        selectedSession.id
                                            ? 'Deleting...'
                                            : 'Delete Session'
                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </ExamOfficerLayout>
    );
};


export default AcademicSessionsPage;