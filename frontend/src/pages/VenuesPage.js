import {
    useEffect,
    useMemo,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/venues.css';


const VENUE_TYPES = [

    {
        value: 'lecture_room',
        label: 'Lecture Room'
    },

    {
        value: 'laboratory',
        label: 'Laboratory'
    },

    {
        value: 'theatre',
        label: 'Theatre'
    },

    {
        value: 'cbt_center',
        label: 'CBT Center'
    },

    {
        value: 'elearning_hall',
        label: 'E-Learning Hall'
    },

    {
        value: 'other',
        label: 'Other'
    }

];


const VenuesPage = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [venues, setVenues] =
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

    const [modalMode, setModalMode] =
        useState(null);

    const [selectedVenue, setSelectedVenue] =
        useState(null);


    const [formData, setFormData] =
        useState({

            venue_name:
                '',

            venue_code:
                '',

            venue_type:
                'lecture_room',

            capacity:
                '',

            is_combinable:
                false

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
    // LOAD VENUES
    // ======================================================

    const loadVenues = async () => {

        try {

            setLoading(true);

            setError('');


            const response =
                await api.get(
                    '/venues'
                );


            setVenues(
                Array.isArray(
                    response.data?.venues
                )
                    ? response.data.venues
                    : []
            );


        } catch (error) {

            console.error(
                'Load venues error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load venues.'
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

        loadVenues();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const activeVenues =
        useMemo(
            () =>
                venues.filter(
                    venue =>
                        Boolean(
                            venue.is_active
                        )
                ).length,
            [venues]
        );


    const totalCapacity =
        useMemo(
            () =>
                venues.reduce(
                    (
                        total,
                        venue
                    ) =>
                        total +
                        Number(
                            venue.capacity ||
                            0
                        ),
                    0
                ),
            [venues]
        );


    const combinableVenues =
        useMemo(
            () =>
                venues.filter(
                    venue =>
                        Boolean(
                            venue.is_combinable
                        )
                ).length,
            [venues]
        );


    // ======================================================
    // HELPERS
    // ======================================================

    const getVenueTypeLabel = (
        value
    ) => {

        const type =
            VENUE_TYPES.find(
                item =>
                    item.value ===
                    value
            );


        return (
            type?.label ||
            value ||
            'Other'
        );
    };


    // ======================================================
    // FORM CHANGE
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
    // RESET FORM
    // ======================================================

    const resetForm = () => {

        setFormData({

            venue_name:
                '',

            venue_code:
                '',

            venue_type:
                'lecture_room',

            capacity:
                '',

            is_combinable:
                false

        });
    };


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        resetForm();

        setSelectedVenue(null);

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
        venue
    ) => {

        setSelectedVenue(
            venue
        );


        setFormData({

            venue_name:
                venue.venue_name ||
                '',

            venue_code:
                venue.venue_code ||
                '',

            venue_type:
                venue.venue_type ||
                'lecture_room',

            capacity:
                venue.capacity ||
                '',

            is_combinable:
                Boolean(
                    venue.is_combinable
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
        venue
    ) => {

        setSelectedVenue(
            venue
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

        setSelectedVenue(
            null
        );

        setError('');
    };


    // ======================================================
    // VALIDATE
    // ======================================================

    const validateForm = () => {

        if (
            !formData.venue_name.trim()
        ) {

            setError(
                'Venue name is required.'
            );

            return false;
        }


        if (
            !formData.venue_code.trim()
        ) {

            setError(
                'Venue code is required.'
            );

            return false;
        }


        if (
            !formData.venue_type
        ) {

            setError(
                'Please select a venue type.'
            );

            return false;
        }


        if (
            !formData.capacity ||
            Number(
                formData.capacity
            ) <= 0
        ) {

            setError(
                'Venue capacity must be greater than zero.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE
    // ======================================================

    const createVenue = async (
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
                    '/venues',
                    {

                        venue_name:
                            formData
                                .venue_name
                                .trim(),

                        venue_code:
                            formData
                                .venue_code
                                .trim()
                                .toUpperCase(),

                        venue_type:
                            formData.venue_type,

                        capacity:
                            Number(
                                formData.capacity
                            ),

                        is_combinable:
                            Boolean(
                                formData.is_combinable
                            )

                    }
                );


            setSuccess(
                response.data?.message ||
                'Venue created successfully.'
            );


            setModalMode(
                null
            );


            await loadVenues();


        } catch (error) {

            console.error(
                'Create venue error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to create venue.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // UPDATE
    // ======================================================

    const updateVenue = async (
        event
    ) => {

        event.preventDefault();


        if (
            !selectedVenue?.id
        ) {

            setError(
                'No venue was selected.'
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
                    `/venues/${selectedVenue.id}`,
                    {

                        venue_name:
                            formData
                                .venue_name
                                .trim(),

                        venue_code:
                            formData
                                .venue_code
                                .trim()
                                .toUpperCase(),

                        venue_type:
                            formData.venue_type,

                        capacity:
                            Number(
                                formData.capacity
                            ),

                        is_combinable:
                            Boolean(
                                formData.is_combinable
                            )

                    }
                );


            setSuccess(
                response.data?.message ||
                'Venue updated successfully.'
            );


            setModalMode(
                null
            );


            await loadVenues();


        } catch (error) {

            console.error(
                'Update venue error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update venue.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // ACTIVATE / DEACTIVATE
    // ======================================================

    const toggleStatus = async (
        venue
    ) => {

        try {

            setError('');

            setSuccess('');


            const response =
                await api.patch(
                    `/venues/${venue.id}/status`,
                    {

                        is_active:
                            !Boolean(
                                venue.is_active
                            )

                    }
                );


            setSuccess(
                response.data?.message ||
                'Venue status updated successfully.'
            );


            await loadVenues();


        } catch (error) {

            console.error(
                'Venue status error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update venue status.'
                )
            );
        }
    };


    // ======================================================
    // DELETE VENUE
    // ======================================================

    const deleteVenue = async (
        venue
    ) => {

        if (
            !venue?.id
        ) {

            return;
        }


        const confirmed =
            window.confirm(
                `Delete venue "${venue.venue_name} (${venue.venue_code})"?\n\nThis cannot be undone. A venue already assigned to a timetable examination cannot be deleted.`
            );


        if (
            !confirmed
        ) {

            return;
        }


        try {

            setDeleting(
                venue.id
            );

            setError('');

            setSuccess('');


            const response =
                await api.delete(
                    `/venues/${venue.id}`
                );


            setSuccess(
                response.data?.message ||
                'Venue deleted successfully.'
            );


            if (
                selectedVenue?.id ===
                venue.id
            ) {

                setModalMode(
                    null
                );

                setSelectedVenue(
                    null
                );
            }


            await loadVenues();


        } catch (error) {

            console.error(
                'Delete venue error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to delete venue.'
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
            activePage="Venues"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="venues-header">

                <div>

                    <span className="venues-label">
                        EXAMINATION FACILITIES
                    </span>


                    <h2>
                        Venues
                    </h2>


                    <p>
                        Manage examination halls,
                        lecture rooms, laboratories,
                        theatres and CBT facilities.
                    </p>

                </div>


                <button
                    type="button"
                    className="venue-create-button"
                    onClick={
                        openCreate
                    }
                >
                    + New Venue
                </button>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {
                success &&
                (

                    <div className="venue-success">

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

                    <div className="venue-error">

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

            <section className="venue-summary-grid">

                <div className="venue-summary-card">

                    <span>
                        Total Venues
                    </span>

                    <strong>
                        {venues.length}
                    </strong>

                </div>


                <div className="venue-summary-card">

                    <span>
                        Active Venues
                    </span>

                    <strong>
                        {activeVenues}
                    </strong>

                </div>


                <div className="venue-summary-card">

                    <span>
                        Total Capacity
                    </span>

                    <strong>
                        {totalCapacity}
                    </strong>

                </div>


                <div className="venue-summary-card">

                    <span>
                        Combinable Venues
                    </span>

                    <strong>
                        {combinableVenues}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                PANEL
                ================================================== */}

            <section className="venues-panel">

                <div className="venues-panel-heading">

                    <div>

                        <span className="venues-label">
                            VENUE RECORDS
                        </span>


                        <h3>
                            Venue List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="venue-refresh-button"
                        onClick={
                            loadVenues
                        }
                        disabled={
                            loading ||
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

                            <div className="venues-loading">
                                Loading venues...
                            </div>

                        )
                        : venues.length === 0
                            ? (

                                <div className="venues-empty">

                                    <strong>
                                        No venues found
                                    </strong>


                                    <span>
                                        Add an examination venue to
                                        begin venue management.
                                    </span>

                                </div>

                            )
                            : (

                                <div className="venues-table-wrapper">

                                    <table className="venues-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    Venue
                                                </th>

                                                <th>
                                                    Code
                                                </th>

                                                <th>
                                                    Type
                                                </th>

                                                <th>
                                                    Capacity
                                                </th>

                                                <th>
                                                    Combinable
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
                                                venues.map(
                                                    (
                                                        venue,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                venue.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    index + 1
                                                                }
                                                            </td>


                                                            <td>

                                                                <strong
                                                                    className="venue-name"
                                                                >
                                                                    {
                                                                        venue.venue_name
                                                                    }
                                                                </strong>

                                                            </td>


                                                            <td>

                                                                <span className="venue-code">
                                                                    {
                                                                        venue.venue_code
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>
                                                                {
                                                                    getVenueTypeLabel(
                                                                        venue.venue_type
                                                                    )
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    venue.capacity
                                                                }
                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        Boolean(
                                                                            venue.is_combinable
                                                                        )
                                                                            ? 'venue-combinable yes'
                                                                            : 'venue-combinable no'
                                                                    }
                                                                >

                                                                    {
                                                                        venue.is_combinable
                                                                            ? 'Yes'
                                                                            : 'No'
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        Boolean(
                                                                            venue.is_active
                                                                        )
                                                                            ? 'venue-status active'
                                                                            : 'venue-status inactive'
                                                                    }
                                                                >

                                                                    {
                                                                        venue.is_active
                                                                            ? 'Active'
                                                                            : 'Inactive'
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <div className="venue-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="venue-view-button"
                                                                        onClick={() =>
                                                                            openView(
                                                                                venue
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
                                                                        className="venue-edit-button"
                                                                        onClick={() =>
                                                                            openEdit(
                                                                                venue
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
                                                                        className={
                                                                            venue.is_active
                                                                                ? 'venue-disable-button'
                                                                                : 'venue-enable-button'
                                                                        }
                                                                        onClick={() =>
                                                                            toggleStatus(
                                                                                venue
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            venue.is_active
                                                                                ? 'Disable'
                                                                                : 'Activate'
                                                                        }

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="venue-delete-button"
                                                                        onClick={() =>
                                                                            deleteVenue(
                                                                                venue
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            deleting ===
                                                                            venue.id
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

                    <div className="venue-modal-overlay">

                        <div className="venue-modal">

                            <div className="venue-modal-header">

                                <div>

                                    <span className="venues-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW EXAM FACILITY'
                                                : 'UPDATE EXAM FACILITY'
                                        }

                                    </span>


                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Venue'
                                                : 'Edit Venue'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="venue-modal-close"
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

                                    <div className="venue-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createVenue
                                        : updateVenue
                                }
                            >

                                <div className="venue-form-group">

                                    <label>
                                        Venue Name
                                    </label>


                                    <input
                                        type="text"
                                        name="venue_name"
                                        value={
                                            formData.venue_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: New Lecture Theatre"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="venue-form-grid">

                                    <div className="venue-form-group">

                                        <label>
                                            Venue Code
                                        </label>


                                        <input
                                            type="text"
                                            name="venue_code"
                                            value={
                                                formData.venue_code
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Example: LT01"
                                            maxLength="20"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    <div className="venue-form-group">

                                        <label>
                                            Venue Type
                                        </label>


                                        <select
                                            name="venue_type"
                                            value={
                                                formData.venue_type
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
                                                VENUE_TYPES.map(
                                                    type => (

                                                        <option
                                                            key={
                                                                type.value
                                                            }
                                                            value={
                                                                type.value
                                                            }
                                                        >
                                                            {
                                                                type.label
                                                            }
                                                        </option>

                                                    )
                                                )
                                            }

                                        </select>

                                    </div>


                                    <div className="venue-form-group">

                                        <label>
                                            Capacity
                                        </label>


                                        <input
                                            type="number"
                                            name="capacity"
                                            value={
                                                formData.capacity
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="1"
                                            placeholder="Example: 250"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>

                                </div>


                                <label className="venue-checkbox">

                                    <input
                                        type="checkbox"
                                        name="is_combinable"
                                        checked={
                                            formData.is_combinable
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    />


                                    <span>
                                        This venue can be combined
                                        with another venue
                                    </span>

                                </label>


                                <div className="venue-modal-actions">

                                    <button
                                        type="button"
                                        className="venue-cancel-button"
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
                                        className="venue-save-button"
                                        disabled={
                                            saving
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Venue'
                                                    : 'Update Venue'
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
                selectedVenue &&
                (

                    <div className="venue-modal-overlay">

                        <div className="venue-modal">

                            <div className="venue-modal-header">

                                <div>

                                    <span className="venues-label">
                                        VENUE INFORMATION
                                    </span>


                                    <h3>
                                        Venue Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="venue-modal-close"
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

                                    <div className="venue-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <div className="venue-detail-grid">

                                <div>

                                    <span>
                                        Venue Name
                                    </span>


                                    <strong>
                                        {
                                            selectedVenue.venue_name
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Venue Code
                                    </span>


                                    <strong>
                                        {
                                            selectedVenue.venue_code
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Venue Type
                                    </span>


                                    <strong>
                                        {
                                            getVenueTypeLabel(
                                                selectedVenue.venue_type
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Capacity
                                    </span>


                                    <strong>
                                        {
                                            selectedVenue.capacity
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Combinable
                                    </span>


                                    <strong>
                                        {
                                            selectedVenue.is_combinable
                                                ? 'Yes'
                                                : 'No'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Status
                                    </span>


                                    <strong>
                                        {
                                            selectedVenue.is_active
                                                ? 'Active'
                                                : 'Inactive'
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="venue-modal-actions">

                                <button
                                    type="button"
                                    className="venue-cancel-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="venue-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedVenue
                                        )
                                    }
                                >
                                    Edit Venue
                                </button>


                                <button
                                    type="button"
                                    className="venue-delete-button"
                                    onClick={() =>
                                        deleteVenue(
                                            selectedVenue
                                        )
                                    }
                                    disabled={
                                        deleting !== null
                                    }
                                >

                                    {
                                        deleting ===
                                        selectedVenue.id
                                            ? 'Deleting...'
                                            : 'Delete Venue'
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


export default VenuesPage;