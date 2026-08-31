import {
    useEffect,
    useMemo,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/timeSlots.css';


const SLOT_LABELS = [

    {
        value: 'Morning',
        label: 'Morning'
    },

    {
        value: 'Afternoon',
        label: 'Afternoon'
    },

    {
        value: 'Evening',
        label: 'Evening'
    }

];


const TimeSlotsPage = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [timeSlots, setTimeSlots] =
        useState([]);

    const [sessions, setSessions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [sessionsLoading, setSessionsLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(null);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [modalMode, setModalMode] =
        useState(null);

    const [selectedSlot, setSelectedSlot] =
        useState(null);


    const [formData, setFormData] =
        useState({

            session_id: '',

            slot_label: 'Morning',

            start_time: '',

            end_time: ''

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
    // LOAD TIME SLOTS
    // ======================================================

    const loadTimeSlots = async () => {

        try {

            setLoading(true);

            setError('');


            const response =
                await api.get(
                    '/time-slots'
                );


            setTimeSlots(
                Array.isArray(
                    response.data?.time_slots
                )
                    ? response.data.time_slots
                    : []
            );


        } catch (error) {

            console.error(
                'Load time slots error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load time slots.'
                )
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD SESSIONS
    // ======================================================

    const loadSessions = async () => {

        try {

            setSessionsLoading(true);


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

            setSessionsLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadTimeSlots();

        loadSessions();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const morningCount =
        useMemo(
            () =>
                timeSlots.filter(
                    slot =>
                        slot.slot_label ===
                        'Morning'
                ).length,
            [timeSlots]
        );


    const afternoonCount =
        useMemo(
            () =>
                timeSlots.filter(
                    slot =>
                        slot.slot_label ===
                        'Afternoon'
                ).length,
            [timeSlots]
        );


    const eveningCount =
        useMemo(
            () =>
                timeSlots.filter(
                    slot =>
                        slot.slot_label ===
                        'Evening'
                ).length,
            [timeSlots]
        );


    // ======================================================
    // FORMAT TIME
    // ======================================================

    const formatTime = (
        value
    ) => {

        if (!value) {

            return '';
        }


        const parts =
            String(value)
                .split(':');


        if (
            parts.length < 2
        ) {

            return String(
                value
            );
        }


        let hour =
            Number(
                parts[0]
            );


        const minute =
            parts[1];


        const suffix =
            hour >= 12
                ? 'PM'
                : 'AM';


        hour =
            hour % 12 ||
            12;


        return `${hour}:${minute} ${suffix}`;
    };


    // ======================================================
    // CALCULATE DURATION
    // ======================================================

    const getDuration =
        (
            start,
            end
        ) => {

            if (
                !start ||
                !end
            ) {

                return 0;
            }


            const startDate =
                new Date(
                    `1970-01-01T${String(
                        start
                    ).slice(
                        0,
                        8
                    )}`
                );


            const endDate =
                new Date(
                    `1970-01-01T${String(
                        end
                    ).slice(
                        0,
                        8
                    )}`
                );


            return Math.round(
                (
                    endDate -
                    startDate
                ) / 60000
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
            value
        } = event.target;


        setFormData(
            previous => ({

                ...previous,

                [name]:
                    value

            })
        );


        setError('');
    };


    // ======================================================
    // RESET FORM
    // ======================================================

    const resetForm = () => {

        setFormData({

            session_id: '',

            slot_label: 'Morning',

            start_time: '',

            end_time: ''

        });
    };


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        resetForm();

        setSelectedSlot(null);

        setError('');

        setSuccess('');

        setModalMode(
            'create'
        );
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEdit = (
        slot
    ) => {

        setSelectedSlot(
            slot
        );


        setFormData({

            session_id:
                slot.session_id ||
                '',

            slot_label:
                slot.slot_label ||
                'Morning',

            start_time:
                String(
                    slot.start_time ||
                    ''
                ).slice(
                    0,
                    5
                ),

            end_time:
                String(
                    slot.end_time ||
                    ''
                ).slice(
                    0,
                    5
                )

        });


        setError('');

        setSuccess('');

        setModalMode(
            'edit'
        );
    };


    // ======================================================
    // OPEN VIEW
    // ======================================================

    const openView = (
        slot
    ) => {

        setSelectedSlot(
            slot
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
            deleting !== null
        ) {

            return;
        }


        setModalMode(
            null
        );

        setSelectedSlot(
            null
        );

        setError('');
    };


    // ======================================================
    // VALIDATE FORM
    // ======================================================

    const validateForm = () => {

        if (
            !formData.session_id
        ) {

            setError(
                'Please select an academic session.'
            );

            return false;
        }


        if (
            !formData.slot_label
        ) {

            setError(
                'Please select a slot label.'
            );

            return false;
        }


        if (
            !formData.start_time ||
            !formData.end_time
        ) {

            setError(
                'Start time and end time are required.'
            );

            return false;
        }


        if (
            formData.end_time <=
            formData.start_time
        ) {

            setError(
                'End time must be later than start time.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE
    // ======================================================

    const createTimeSlot = async (
        event
    ) => {

        event.preventDefault();


        if (
            !validateForm()
        ) {

            return;
        }


        try {

            setSaving(true);

            setError('');

            setSuccess('');


            const response =
                await api.post(
                    '/time-slots',
                    {

                        session_id:
                            Number(
                                formData.session_id
                            ),

                        slot_label:
                            formData.slot_label,

                        start_time:
                            formData.start_time,

                        end_time:
                            formData.end_time

                    }
                );


            setSuccess(
                response.data?.message ||
                'Time slot created successfully.'
            );


            setModalMode(
                null
            );


            await loadTimeSlots();


        } catch (error) {

            console.error(
                'Create time slot error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to create time slot.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // UPDATE
    // ======================================================

    const updateTimeSlot = async (
        event
    ) => {

        event.preventDefault();


        if (
            !selectedSlot?.id
        ) {

            setError(
                'No time slot was selected.'
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

            setError('');

            setSuccess('');


            const response =
                await api.put(
                    `/time-slots/${selectedSlot.id}`,
                    {

                        slot_label:
                            formData.slot_label,

                        start_time:
                            formData.start_time,

                        end_time:
                            formData.end_time

                    }
                );


            setSuccess(
                response.data?.message ||
                'Time slot updated successfully.'
            );


            setModalMode(
                null
            );


            await loadTimeSlots();


        } catch (error) {

            console.error(
                'Update time slot error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update time slot.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // DELETE
    // ======================================================

    const deleteTimeSlot = async (
        slot
    ) => {

        if (
            !slot?.id
        ) {

            return;
        }


        const confirmed =
            window.confirm(
                `Delete ${slot.slot_label} time slot (${formatTime(slot.start_time)} - ${formatTime(slot.end_time)})?\n\nThis cannot be undone. A time slot already used by a timetable examination cannot be deleted.`
            );


        if (
            !confirmed
        ) {

            return;
        }


        try {

            setDeleting(
                slot.id
            );

            setError('');

            setSuccess('');


            const response =
                await api.delete(
                    `/time-slots/${slot.id}`
                );


            setSuccess(
                response.data?.message ||
                'Time slot deleted successfully.'
            );


            if (
                selectedSlot?.id ===
                slot.id
            ) {

                setModalMode(
                    null
                );

                setSelectedSlot(
                    null
                );
            }


            await loadTimeSlots();


        } catch (error) {

            console.error(
                'Delete time slot error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to delete time slot.'
                )
            );

        } finally {

            setDeleting(null);
        }
    };


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Time Slots"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="time-slots-header">

                <div>

                    <span className="time-slots-label">
                        SCHEDULING CONFIGURATION
                    </span>


                    <h2>
                        Time Slots
                    </h2>


                    <p>
                        Define the examination periods used
                        by the timetable scheduling system.
                    </p>

                </div>


                <button
                    type="button"
                    className="time-slot-create-button"
                    onClick={
                        openCreate
                    }
                >
                    + New Time Slot
                </button>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {
                success &&
                (

                    <div className="time-slot-success">

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


            {
                error &&
                !modalMode &&
                (

                    <div className="time-slot-error">

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

            <section className="time-slot-summary-grid">

                <div className="time-slot-summary-card">

                    <span>
                        Total Time Slots
                    </span>

                    <strong>
                        {timeSlots.length}
                    </strong>

                </div>


                <div className="time-slot-summary-card">

                    <span>
                        Morning
                    </span>

                    <strong>
                        {morningCount}
                    </strong>

                </div>


                <div className="time-slot-summary-card">

                    <span>
                        Afternoon
                    </span>

                    <strong>
                        {afternoonCount}
                    </strong>

                </div>


                <div className="time-slot-summary-card">

                    <span>
                        Evening
                    </span>

                    <strong>
                        {eveningCount}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                TABLE
                ================================================== */}

            <section className="time-slots-panel">

                <div className="time-slots-panel-heading">

                    <div>

                        <span className="time-slots-label">
                            SCHEDULING PERIODS
                        </span>


                        <h3>
                            Time Slot List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="time-slot-refresh-button"
                        onClick={() => {

                            loadTimeSlots();

                            loadSessions();

                        }}
                        disabled={
                            loading ||
                            sessionsLoading ||
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

                            <div className="time-slots-loading">
                                Loading time slots...
                            </div>

                        )

                        : timeSlots.length === 0

                            ? (

                                <div className="time-slots-empty">

                                    <strong>
                                        No time slots found
                                    </strong>


                                    <span>
                                        Create scheduling periods for
                                        the examination timetable.
                                    </span>

                                </div>

                            )

                            : (

                                <div className="time-slots-table-wrapper">

                                    <table className="time-slots-table">

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
                                                    Slot
                                                </th>

                                                <th>
                                                    Start Time
                                                </th>

                                                <th>
                                                    End Time
                                                </th>

                                                <th>
                                                    Duration
                                                </th>

                                                <th>
                                                    Action
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                timeSlots.map(
                                                    (
                                                        slot,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                slot.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    index + 1
                                                                }
                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        slot.session_name
                                                                    }
                                                                </strong>

                                                            </td>


                                                            <td>
                                                                {
                                                                    slot.semester
                                                                }
                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        `time-slot-label ${String(
                                                                            slot.slot_label
                                                                        ).toLowerCase()}`
                                                                    }
                                                                >
                                                                    {
                                                                        slot.slot_label
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>
                                                                {
                                                                    formatTime(
                                                                        slot.start_time
                                                                    )
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    formatTime(
                                                                        slot.end_time
                                                                    )
                                                                }
                                                            </td>


                                                            <td>

                                                                <span className="time-slot-duration">

                                                                    {
                                                                        getDuration(
                                                                            slot.start_time,
                                                                            slot.end_time
                                                                        )
                                                                    }

                                                                </span>

                                                                <small>
                                                                    min
                                                                </small>

                                                            </td>


                                                            <td>

                                                                <div className="time-slot-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="time-slot-view-button"
                                                                        onClick={() =>
                                                                            openView(
                                                                                slot
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
                                                                        className="time-slot-edit-button"
                                                                        onClick={() =>
                                                                            openEdit(
                                                                                slot
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
                                                                        className="time-slot-delete-button"
                                                                        onClick={() =>
                                                                            deleteTimeSlot(
                                                                                slot
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            deleting ===
                                                                            slot.id
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

                    <div className="time-slot-modal-overlay">

                        <div className="time-slot-modal">

                            <div className="time-slot-modal-header">

                                <div>

                                    <span className="time-slots-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW SCHEDULING PERIOD'
                                                : 'UPDATE SCHEDULING PERIOD'
                                        }

                                    </span>


                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Time Slot'
                                                : 'Edit Time Slot'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="time-slot-modal-close"
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

                                    <div className="time-slot-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createTimeSlot
                                        : updateTimeSlot
                                }
                            >

                                <div className="time-slot-form-group">

                                    <label>
                                        Academic Session
                                    </label>


                                    <select
                                        name="session_id"
                                        value={
                                            formData.session_id
                                        }
                                        onChange={
                                            handleChange
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


                                <div className="time-slot-form-grid">

                                    <div className="time-slot-form-group">

                                        <label>
                                            Slot Label
                                        </label>


                                        <select
                                            name="slot_label"
                                            value={
                                                formData.slot_label
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                            required
                                        >

                                            {
                                                SLOT_LABELS.map(
                                                    label => (

                                                        <option
                                                            key={
                                                                label.value
                                                            }
                                                            value={
                                                                label.value
                                                            }
                                                        >
                                                            {
                                                                label.label
                                                            }
                                                        </option>

                                                    )
                                                )
                                            }

                                        </select>

                                    </div>


                                    <div className="time-slot-form-group">

                                        <label>
                                            Start Time
                                        </label>


                                        <input
                                            type="time"
                                            name="start_time"
                                            value={
                                                formData.start_time
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    <div className="time-slot-form-group">

                                        <label>
                                            End Time
                                        </label>


                                        <input
                                            type="time"
                                            name="end_time"
                                            value={
                                                formData.end_time
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>

                                </div>


                                <div className="time-slot-info">

                                    <strong>
                                        Scheduling rule
                                    </strong>


                                    <span>
                                        A session cannot contain
                                        duplicate or overlapping
                                        time slots.
                                    </span>

                                </div>


                                <div className="time-slot-modal-actions">

                                    <button
                                        type="button"
                                        className="time-slot-cancel-button"
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
                                        className="time-slot-save-button"
                                        disabled={
                                            saving ||
                                            sessionsLoading
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Time Slot'
                                                    : 'Update Time Slot'
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
                selectedSlot &&
                (

                    <div className="time-slot-modal-overlay">

                        <div className="time-slot-modal">

                            <div className="time-slot-modal-header">

                                <div>

                                    <span className="time-slots-label">
                                        TIME SLOT INFORMATION
                                    </span>


                                    <h3>
                                        Time Slot Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="time-slot-modal-close"
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

                                    <div className="time-slot-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <div className="time-slot-detail-grid">

                                <div>

                                    <span>
                                        Academic Session
                                    </span>


                                    <strong>
                                        {
                                            selectedSlot.session_name
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Semester
                                    </span>


                                    <strong>
                                        {
                                            selectedSlot.semester
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Slot Label
                                    </span>


                                    <strong>
                                        {
                                            selectedSlot.slot_label
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Start Time
                                    </span>


                                    <strong>
                                        {
                                            formatTime(
                                                selectedSlot.start_time
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        End Time
                                    </span>


                                    <strong>
                                        {
                                            formatTime(
                                                selectedSlot.end_time
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Duration
                                    </span>


                                    <strong>
                                        {
                                            getDuration(
                                                selectedSlot.start_time,
                                                selectedSlot.end_time
                                            )
                                        }
                                        {' '}
                                        minutes
                                    </strong>

                                </div>

                            </div>


                            <div className="time-slot-modal-actions">

                                <button
                                    type="button"
                                    className="time-slot-cancel-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="time-slot-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedSlot
                                        )
                                    }
                                >
                                    Edit Time Slot
                                </button>


                                <button
                                    type="button"
                                    className="time-slot-delete-button"
                                    onClick={() =>
                                        deleteTimeSlot(
                                            selectedSlot
                                        )
                                    }
                                    disabled={
                                        deleting !== null
                                    }
                                >

                                    {
                                        deleting ===
                                        selectedSlot.id
                                            ? 'Deleting...'
                                            : 'Delete Time Slot'
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


export default TimeSlotsPage;