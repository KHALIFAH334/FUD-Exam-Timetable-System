import {
    useEffect,
    useMemo,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/invigilators.css';


const EMPTY_FORM = {

    department_id: '',

    staff_id: '',

    full_name: '',

    max_duties_per_semester: 3

};


const InvigilatorsPage = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [invigilators, setInvigilators] =
        useState([]);

    const [departments, setDepartments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [departmentsLoading, setDepartmentsLoading] =
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

    const [selectedInvigilator, setSelectedInvigilator] =
        useState(null);

    const [formData, setFormData] =
        useState({
            ...EMPTY_FORM
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
    // LOAD INVIGILATORS
    // ======================================================

    const loadInvigilators = async () => {

        try {

            setLoading(true);

            setError('');


            const response =
                await api.get(
                    '/invigilators'
                );


            setInvigilators(
                Array.isArray(
                    response.data?.invigilators
                )
                    ? response.data.invigilators
                    : []
            );


        } catch (error) {

            console.error(
                'Load invigilators error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load invigilators.'
                )
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD DEPARTMENTS
    // ======================================================

    const loadDepartments = async () => {

        try {

            setDepartmentsLoading(true);


            const response =
                await api.get(
                    '/departments'
                );


            setDepartments(
                Array.isArray(
                    response.data?.departments
                )
                    ? response.data.departments
                    : []
            );


        } catch (error) {

            console.error(
                'Load departments error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load departments.'
                )
            );

        } finally {

            setDepartmentsLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadInvigilators();

        loadDepartments();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const activeCount =
        useMemo(
            () =>
                invigilators.filter(
                    invigilator =>
                        Boolean(
                            invigilator.is_active
                        )
                ).length,
            [invigilators]
        );


    const inactiveCount =
        useMemo(
            () =>
                invigilators.filter(
                    invigilator =>
                        !Boolean(
                            invigilator.is_active
                        )
                ).length,
            [invigilators]
        );


    const departmentsCovered =
        useMemo(
            () =>
                new Set(
                    invigilators.map(
                        invigilator =>
                            invigilator.department_id
                    )
                ).size,
            [invigilators]
        );


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
            ...EMPTY_FORM
        });
    };


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        resetForm();

        setSelectedInvigilator(
            null
        );

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
        invigilator
    ) => {

        setSelectedInvigilator(
            invigilator
        );


        setFormData({

            department_id:
                invigilator.department_id ||
                '',

            staff_id:
                invigilator.staff_id ||
                '',

            full_name:
                invigilator.full_name ||
                '',

            max_duties_per_semester:
                invigilator.max_duties_per_semester ||
                3

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
        invigilator
    ) => {

        setSelectedInvigilator(
            invigilator
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

        setSelectedInvigilator(
            null
        );

        setError('');
    };


    // ======================================================
    // VALIDATE FORM
    // ======================================================

    const validateForm = () => {

        if (
            !formData.department_id
        ) {

            setError(
                'Please select a department.'
            );

            return false;
        }


        if (
            !formData.staff_id.trim()
        ) {

            setError(
                'Staff ID is required.'
            );

            return false;
        }


        if (
            !formData.full_name.trim()
        ) {

            setError(
                'Full name is required.'
            );

            return false;
        }


        if (
            !formData.max_duties_per_semester ||
            Number(
                formData.max_duties_per_semester
            ) <= 0
        ) {

            setError(
                'Maximum duties must be greater than zero.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE
    // ======================================================

    const createInvigilator =
        async (
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


                const response =
                    await api.post(
                        '/invigilators',
                        {

                            department_id:
                                Number(
                                    formData.department_id
                                ),

                            staff_id:
                                formData.staff_id
                                    .trim()
                                    .toUpperCase(),

                            full_name:
                                formData.full_name
                                    .trim(),

                            max_duties_per_semester:
                                Number(
                                    formData.max_duties_per_semester
                                )

                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'Invigilator created successfully.'
                );


                setModalMode(
                    null
                );


                setSelectedInvigilator(
                    null
                );


                resetForm();


                await loadInvigilators();


            } catch (error) {

                console.error(
                    'Create invigilator error:',
                    error
                );


                setError(
                    getErrorMessage(
                        error,
                        'Unable to create invigilator.'
                    )
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // UPDATE
    // ======================================================

    const updateInvigilator =
        async (
            event
        ) => {

            event.preventDefault();


            setError('');

            setSuccess('');


            if (
                !selectedInvigilator?.id
            ) {

                setError(
                    'No invigilator was selected.'
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


                const response =
                    await api.put(
                        `/invigilators/${selectedInvigilator.id}`,
                        {

                            department_id:
                                Number(
                                    formData.department_id
                                ),

                            staff_id:
                                formData.staff_id
                                    .trim()
                                    .toUpperCase(),

                            full_name:
                                formData.full_name
                                    .trim(),

                            max_duties_per_semester:
                                Number(
                                    formData.max_duties_per_semester
                                )

                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'Invigilator updated successfully.'
                );


                setModalMode(
                    null
                );


                setSelectedInvigilator(
                    null
                );


                resetForm();


                await loadInvigilators();


            } catch (error) {

                console.error(
                    'Update invigilator error:',
                    error
                );


                setError(
                    getErrorMessage(
                        error,
                        'Unable to update invigilator.'
                    )
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // TOGGLE STATUS
    // ======================================================

    const toggleStatus =
        async (
            invigilator
        ) => {

            try {

                setError('');

                setSuccess('');


                const response =
                    await api.patch(
                        `/invigilators/${invigilator.id}/status`,
                        {

                            is_active:
                                !Boolean(
                                    invigilator.is_active
                                )

                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'Invigilator status updated successfully.'
                );


                await loadInvigilators();


            } catch (error) {

                console.error(
                    'Invigilator status error:',
                    error
                );


                setError(
                    getErrorMessage(
                        error,
                        'Unable to update invigilator status.'
                    )
                );
            }
        };


    // ======================================================
    // DELETE
    // ======================================================

    const deleteInvigilator =
        async (
            invigilator
        ) => {

            if (
                !invigilator?.id
            ) {

                return;
            }


            const confirmed =
                window.confirm(
                    `Delete invigilator "${invigilator.full_name} (${invigilator.staff_id})"?\n\nThis action cannot be undone. An invigilator already assigned to a timetable examination cannot be deleted.`
                );


            if (
                !confirmed
            ) {

                return;
            }


            try {

                setDeleting(
                    invigilator.id
                );

                setError('');

                setSuccess('');


                const response =
                    await api.delete(
                        `/invigilators/${invigilator.id}`
                    );


                setSuccess(
                    response.data?.message ||
                    'Invigilator deleted successfully.'
                );


                if (
                    selectedInvigilator?.id ===
                    invigilator.id
                ) {

                    setModalMode(
                        null
                    );

                    setSelectedInvigilator(
                        null
                    );
                }


                await loadInvigilators();


            } catch (error) {

                console.error(
                    'Delete invigilator error:',
                    error
                );


                setError(
                    getErrorMessage(
                        error,
                        'Unable to delete invigilator.'
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
            activePage="Invigilators"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="invigilators-header">

                <div>

                    <span className="invigilators-label">
                        EXAMINATION STAFF
                    </span>


                    <h2>
                        Invigilators
                    </h2>


                    <p>
                        Manage examination invigilators,
                        departmental assignments and duty limits.
                    </p>

                </div>


                <button
                    type="button"
                    className="invigilator-create-button"
                    onClick={
                        openCreate
                    }
                >
                    + New Invigilator
                </button>

            </section>


            {/* ==================================================
                SUCCESS
                ================================================== */}

            {
                success &&
                (

                    <div className="invigilator-success">

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

                    <div className="invigilator-error">

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

            <section className="invigilator-summary-grid">

                <div className="invigilator-summary-card">

                    <span>
                        Total Invigilators
                    </span>

                    <strong>
                        {invigilators.length}
                    </strong>

                </div>


                <div className="invigilator-summary-card">

                    <span>
                        Active Invigilators
                    </span>

                    <strong>
                        {activeCount}
                    </strong>

                </div>


                <div className="invigilator-summary-card">

                    <span>
                        Inactive Invigilators
                    </span>

                    <strong>
                        {inactiveCount}
                    </strong>

                </div>


                <div className="invigilator-summary-card">

                    <span>
                        Departments Covered
                    </span>

                    <strong>
                        {departmentsCovered}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                RECORDS
                ================================================== */}

            <section className="invigilators-panel">

                <div className="invigilators-panel-heading">

                    <div>

                        <span className="invigilators-label">
                            INVIGILATOR RECORDS
                        </span>


                        <h3>
                            Invigilator List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="invigilator-refresh-button"
                        onClick={() => {

                            loadInvigilators();

                            loadDepartments();

                        }}
                        disabled={
                            loading ||
                            departmentsLoading ||
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

                            <div className="invigilators-loading">
                                Loading invigilators...
                            </div>

                        )

                        : invigilators.length === 0

                            ? (

                                <div className="invigilators-empty">

                                    <strong>
                                        No invigilators found
                                    </strong>


                                    <span>
                                        Add examination staff to begin
                                        invigilator management.
                                    </span>

                                </div>

                            )

                            : (

                                <div className="invigilators-table-wrapper">

                                    <table className="invigilators-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    Staff ID
                                                </th>

                                                <th>
                                                    Full Name
                                                </th>

                                                <th>
                                                    Department
                                                </th>

                                                <th>
                                                    Max Duties
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
                                                invigilators.map(
                                                    (
                                                        invigilator,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                invigilator.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    index + 1
                                                                }
                                                            </td>


                                                            <td>

                                                                <span className="invigilator-staff-id">

                                                                    {
                                                                        invigilator.staff_id
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <strong className="invigilator-name">

                                                                    {
                                                                        invigilator.full_name
                                                                    }

                                                                </strong>

                                                            </td>


                                                            <td>

                                                                <strong>

                                                                    {
                                                                        invigilator.department_name
                                                                    }

                                                                </strong>


                                                                <small>

                                                                    {
                                                                        invigilator.department_code
                                                                    }

                                                                </small>

                                                            </td>


                                                            <td>

                                                                <span className="duty-limit">

                                                                    {
                                                                        invigilator.max_duties_per_semester
                                                                    }

                                                                    {' / semester'}

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        Boolean(
                                                                            invigilator.is_active
                                                                        )
                                                                            ? 'invigilator-status active'
                                                                            : 'invigilator-status inactive'
                                                                    }
                                                                >

                                                                    {
                                                                        invigilator.is_active
                                                                            ? 'Active'
                                                                            : 'Inactive'
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <div className="invigilator-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="invigilator-view-button"
                                                                        onClick={() =>
                                                                            openView(
                                                                                invigilator
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
                                                                        className="invigilator-edit-button"
                                                                        onClick={() =>
                                                                            openEdit(
                                                                                invigilator
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
                                                                            invigilator.is_active
                                                                                ? 'invigilator-disable-button'
                                                                                : 'invigilator-enable-button'
                                                                        }
                                                                        onClick={() =>
                                                                            toggleStatus(
                                                                                invigilator
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            invigilator.is_active
                                                                                ? 'Disable'
                                                                                : 'Activate'
                                                                        }

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="invigilator-delete-button"
                                                                        onClick={() =>
                                                                            deleteInvigilator(
                                                                                invigilator
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            deleting ===
                                                                            invigilator.id
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

                    <div className="invigilator-modal-overlay">

                        <div className="invigilator-modal">

                            <div className="invigilator-modal-header">

                                <div>

                                    <span className="invigilators-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW EXAMINATION STAFF'
                                                : 'UPDATE EXAMINATION STAFF'
                                        }

                                    </span>


                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Invigilator'
                                                : 'Edit Invigilator'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="invigilator-modal-close"
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

                                    <div className="invigilator-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createInvigilator
                                        : updateInvigilator
                                }
                            >

                                <div className="invigilator-form-group">

                                    <label>
                                        Department
                                    </label>


                                    <select
                                        name="department_id"
                                        value={
                                            formData.department_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            departmentsLoading ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">

                                            {
                                                departmentsLoading
                                                    ? 'Loading departments...'
                                                    : 'Select Department'
                                            }

                                        </option>


                                        {
                                            departments.map(
                                                department => (

                                                    <option
                                                        key={
                                                            department.id
                                                        }
                                                        value={
                                                            department.id
                                                        }
                                                    >

                                                        {
                                                            department.name
                                                        }

                                                        {' — '}

                                                        {
                                                            department.short_code
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                <div className="invigilator-form-grid">

                                    <div className="invigilator-form-group">

                                        <label>
                                            Staff ID
                                        </label>


                                        <input
                                            type="text"
                                            name="staff_id"
                                            value={
                                                formData.staff_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Example: FUD/STAFF/001"
                                            maxLength="50"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    <div className="invigilator-form-group">

                                        <label>
                                            Maximum Duties per Semester
                                        </label>


                                        <input
                                            type="number"
                                            name="max_duties_per_semester"
                                            value={
                                                formData.max_duties_per_semester
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="1"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>

                                </div>


                                <div className="invigilator-form-group">

                                    <label>
                                        Full Name
                                    </label>


                                    <input
                                        type="text"
                                        name="full_name"
                                        value={
                                            formData.full_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: Dr. Ahmad Ibrahim"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="invigilator-info">

                                    <strong>
                                        Duty allocation
                                    </strong>


                                    <span>
                                        Maximum duties determine how many
                                        examination assignments an
                                        invigilator may receive per semester.
                                    </span>

                                </div>


                                <div className="invigilator-modal-actions">

                                    <button
                                        type="button"
                                        className="invigilator-cancel-button"
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
                                        className="invigilator-save-button"
                                        disabled={
                                            saving ||
                                            departmentsLoading
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Invigilator'
                                                    : 'Update Invigilator'
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
                selectedInvigilator &&
                (

                    <div className="invigilator-modal-overlay">

                        <div className="invigilator-modal">

                            <div className="invigilator-modal-header">

                                <div>

                                    <span className="invigilators-label">
                                        INVIGILATOR INFORMATION
                                    </span>


                                    <h3>
                                        Invigilator Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="invigilator-modal-close"
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

                                    <div className="invigilator-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <div className="invigilator-detail-grid">

                                <div>

                                    <span>
                                        Staff ID
                                    </span>


                                    <strong>
                                        {
                                            selectedInvigilator.staff_id
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Full Name
                                    </span>


                                    <strong>
                                        {
                                            selectedInvigilator.full_name
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Department
                                    </span>


                                    <strong>
                                        {
                                            selectedInvigilator.department_name
                                        }
                                    </strong>


                                    <small>
                                        {
                                            selectedInvigilator.department_code
                                        }
                                    </small>

                                </div>


                                <div>

                                    <span>
                                        Maximum Duties
                                    </span>


                                    <strong>
                                        {
                                            selectedInvigilator.max_duties_per_semester
                                        }
                                        {' per semester'}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Status
                                    </span>


                                    <strong>
                                        {
                                            selectedInvigilator.is_active
                                                ? 'Active'
                                                : 'Inactive'
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="invigilator-modal-actions">

                                <button
                                    type="button"
                                    className="invigilator-cancel-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="invigilator-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedInvigilator
                                        )
                                    }
                                >
                                    Edit Invigilator
                                </button>


                                <button
                                    type="button"
                                    className="invigilator-delete-button"
                                    onClick={() =>
                                        deleteInvigilator(
                                            selectedInvigilator
                                        )
                                    }
                                    disabled={
                                        deleting !== null
                                    }
                                >

                                    {
                                        deleting ===
                                        selectedInvigilator.id
                                            ? 'Deleting...'
                                            : 'Delete Invigilator'
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


export default InvigilatorsPage;