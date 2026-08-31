import {
    useEffect,
    useMemo,
    useState
} from 'react';

import adminApi
    from '../services/adminApi';

import AdminLayout
    from '../layouts/AdminLayout';

import '../styles/admin.css';


// ==========================================================
// FACULTY NAMES
// ==========================================================

const FACULTY_NAMES = [

    'FACULTY OF COMPUTING',

    'FACULTY OF LIFE SCIENCE',

    'FACULTY OF PHYSICAL SCIENCE',

    'FACULTY OF ART AND SOCIAL SCIENCE',

    'FACULTY OF MANAGEMENT SCIENCE',

    'FACULTY OF AGRICULTURAL SCIENCE',

    'FACULTY OF EDUCATION',

    'FACULTY OF BASIC MEDICAL SCIENCE',

    'FACULTY OF CLINICAL SCIENCE'

];


// ==========================================================
// ROLE OPTIONS
// ==========================================================

const ROLE_OPTIONS = [

    {
        value: 'exam_officer',
        label: 'Exam Officer'
    },

    {
        value: 'departmental_coordinator',
        label: 'Level Coordinator'
    }

];

// ==========================================================
// EMPTY USER FORM
// ==========================================================

const EMPTY_USER_FORM = {

    full_name: '',

    email: '',

    password: '',

    role: 'exam_officer',

    faculty_id: '',

    department_id: ''

};


// ==========================================================
// ADMIN DASHBOARD
// ==========================================================

const AdminDashboard = () => {

    // ======================================================
    // GENERAL STATE
    // ======================================================

    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState('');


    const [
        success,
        setSuccess
    ] = useState('');


    // ======================================================
    // DASHBOARD DATA
    // ======================================================

    const [
        dashboard,
        setDashboard
    ] = useState({

        faculties: 0,

        exam_officers: 0,

        departmental_coordinators: 0,

        active_users: 0,

        inactive_users: 0

    });


    const [
        faculties,
        setFaculties
    ] = useState([]);


    const [
        examOfficers,
        setExamOfficers
    ] = useState([]);


    const [
        coordinators,
        setCoordinators
    ] = useState([]);


    const [
        users,
        setUsers
    ] = useState([]);


    // ======================================================
    // CREATE USER
    // ======================================================

    const [
        showCreate,
        setShowCreate
    ] = useState(false);


    const [
        saving,
        setSaving
    ] = useState(false);


    const [
        formData,
        setFormData
    ] = useState({
        ...EMPTY_USER_FORM
    });


    // ======================================================
    // EDIT USER
    // ======================================================

    const [
        editingUser,
        setEditingUser
    ] = useState(null);


    const [
        editForm,
        setEditForm
    ] = useState({

        full_name: '',

        email: '',

        role: 'exam_officer',

        faculty_id: '',

        department_id: ''

    });


    // ======================================================
    // DELETE LOADING
    // ======================================================

    const [
        deletingUser,
        setDeletingUser
    ] = useState(null);


    // ======================================================
    // STATUS LOADING
    // ======================================================

    const [
        statusLoadingUser,
        setStatusLoadingUser
    ] = useState(null);


    // ======================================================
    // LOAD ADMIN DATA
    // ======================================================

    const loadData = async () => {

        try {

            setLoading(true);

            setError('');


            const [

                dashboardResponse,

                facultiesResponse,

                officersResponse,

                coordinatorsResponse,

                usersResponse

            ] = await Promise.all([

                adminApi.get(
                    '/admin/dashboard'
                ),

                adminApi.get(
                    '/admin/faculties'
                ),

                adminApi.get(
                    '/admin/exam-officers'
                ),

                adminApi.get(
                    '/admin/departmental-coordinators'
                ),

                adminApi.get(
                    '/admin/users'
                )

            ]);


            setDashboard(
                dashboardResponse.data?.dashboard ||
                {}
            );


            setFaculties(
                Array.isArray(
                    facultiesResponse.data?.faculties
                )
                    ? facultiesResponse.data.faculties
                    : []
            );


            setExamOfficers(
                Array.isArray(
                    officersResponse.data?.exam_officers
                )
                    ? officersResponse.data.exam_officers
                    : []
            );


            setCoordinators(
                Array.isArray(
                    coordinatorsResponse.data?.coordinators
                )
                    ? coordinatorsResponse.data.coordinators
                    : []
            );


            setUsers(
                Array.isArray(
                    usersResponse.data?.users
                )
                    ? usersResponse.data.users
                    : []
            );


        } catch (requestError) {

            console.error(
                'Admin dashboard error:',
                requestError
            );


            setError(
                requestError.response?.data?.message ||
                requestError.response?.data?.error ||
                requestError.message ||
                'Unable to load administration data.'
            );


        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadData();

    }, []);


    // ======================================================
    // FACULTY NORMALIZER
    // ======================================================

    const normalizeFacultyName = (
        value
    ) => {

        return String(
            value || ''
        )
            .toLowerCase()
            .replace(
                /^faculty\s+of\s+/,
                ''
            )
            .replace(
                /[^a-z0-9]/g,
                ''
            );

    };


    // ======================================================
    // MATCH DATABASE FACULTY
    // ======================================================

    const getMatchingFaculty = (
        requestedName
    ) => {

        const target =
            normalizeFacultyName(
                requestedName
            );


        return faculties.find(
            faculty =>
                normalizeFacultyName(
                    faculty.name
                ) === target
        );

    };


    // ======================================================
    // FACULTY SELECT OPTIONS
    // ======================================================

    const facultyOptions = useMemo(() => {

        return FACULTY_NAMES.map(
            requestedName => {

                const faculty =
                    getMatchingFaculty(
                        requestedName
                    );


                return {

                    requestedName,

                    faculty

                };

            }
        );

    }, [faculties]);


    // ======================================================
    // FORM CHANGE
    // ======================================================

    const handleCreateChange = (
        event
    ) => {

        const {
            name,
            value
        } = event.target;


        setFormData(
            previous => {

                const next = {

                    ...previous,

                    [name]:
                        value

                };


                if (
                    name ===
                    'faculty_id'
                ) {

                    next.department_id =
                        '';

                }


                if (
                    name === 'role' &&
                    value !==
                    'departmental_coordinator'
                ) {

                    next.department_id =
                        '';

                }


                return next;

            }
        );


        setError('');
    };


    // ======================================================
    // EDIT FORM CHANGE
    // ======================================================

    const handleEditChange = (
        event
    ) => {

        const {
            name,
            value
        } = event.target;


        setEditForm(
            previous => {

                const next = {

                    ...previous,

                    [name]:
                        value

                };


                if (
                    name ===
                    'faculty_id'
                ) {

                    next.department_id =
                        '';

                }


                if (
                    name === 'role' &&
                    value !==
                    'departmental_coordinator'
                ) {

                    next.department_id =
                        '';

                }


                return next;

            }
        );


        setError('');
    };


    // ======================================================
    // RESET CREATE FORM
    // ======================================================

    const resetCreateForm = () => {

        setFormData({
            ...EMPTY_USER_FORM
        });

    };


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreateUser = () => {

        resetCreateForm();

        setError('');

        setSuccess('');

        setShowCreate(true);
    };


    // ======================================================
    // CLOSE CREATE
    // ======================================================

    const closeCreateUser = () => {

        if (
            saving
        ) {

            return;
        }


        setShowCreate(false);

        resetCreateForm();

        setError('');
    };


    // ======================================================
    // CREATE USER
    // ======================================================

    const createUser = async (
        event
    ) => {

        event.preventDefault();


        setError('');

        setSuccess('');


        if (
            !formData.full_name.trim()
        ) {

            setError(
                'Full name is required.'
            );

            return;
        }


        if (
            !formData.email.trim()
        ) {

            setError(
                'Email address is required.'
            );

            return;
        }


        if (
            !formData.password
        ) {

            setError(
                'Password is required.'
            );

            return;
        }


        if (
            formData.password.length <
            8
        ) {

            setError(
                'Password must contain at least 8 characters.'
            );

            return;
        }


        if (
            !formData.role
        ) {

            setError(
                'Please select a user role.'
            );

            return;
        }


        if (
            !formData.faculty_id
        ) {

            setError(
                'Please select a faculty.'
            );

            return;
        }


        if (
            formData.role ===
            'departmental_coordinator' &&
            !formData.department_id
        ) {

            setError(
                'Department is required for a Departmental Coordinator.'
            );

            return;
        }


        try {

            setSaving(true);


            const response =
                await adminApi.post(
                    '/admin/users',
                    {

                        full_name:
                            formData.full_name.trim(),

                        email:
                            formData.email
                                .trim()
                                .toLowerCase(),

                        password:
                            formData.password,

                        role:
                            formData.role,

                        faculty_id:
                            Number(
                                formData.faculty_id
                            ),

                        department_id:
                            formData.department_id
                                ? Number(
                                    formData.department_id
                                )
                                : null

                    }
                );


            setSuccess(
                response.data?.message ||
                'User account created successfully.'
            );


            setShowCreate(false);

            resetCreateForm();


            await loadData();


        } catch (requestError) {

            console.error(
                'Create user error:',
                requestError
            );


            setError(
                requestError.response?.data?.message ||
                requestError.response?.data?.error ||
                requestError.message ||
                'Unable to create user account.'
            );


        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEditUser = (
        managedUser
    ) => {

        if (
            !managedUser ||
            managedUser.role ===
            'super_admin'
        ) {

            return;
        }


        setEditingUser(
            managedUser
        );


        setEditForm({

            full_name:
                managedUser.full_name ||
                '',

            email:
                managedUser.email ||
                '',

            role:
                managedUser.role ||
                'exam_officer',

            faculty_id:
                managedUser.faculty_id ||
                '',

            department_id:
                managedUser.department_id ||
                ''

        });


        setError('');

        setSuccess('');
    };


    // ======================================================
    // CLOSE EDIT
    // ======================================================

    const closeEditUser = () => {

        if (
            saving
        ) {

            return;
        }


        setEditingUser(null);

        setError('');
    };


    // ======================================================
    // SAVE EDITED USER
    // ======================================================

    const saveEditedUser =
        async (
            event
        ) => {

            event.preventDefault();


            if (
                !editingUser?.id
            ) {

                return;
            }


            setError('');

            setSuccess('');


            if (
                !editForm.full_name.trim()
            ) {

                setError(
                    'Full name is required.'
                );

                return;
            }


            if (
                !editForm.email.trim()
            ) {

                setError(
                    'Email address is required.'
                );

                return;
            }


            if (
                !editForm.role
            ) {

                setError(
                    'Please select a role.'
                );

                return;
            }


            if (
                !editForm.faculty_id
            ) {

                setError(
                    'Please select a faculty.'
                );

                return;
            }


            if (
                editForm.role ===
                'departmental_coordinator' &&
                !editForm.department_id
            ) {

                setError(
                    'Department is required for a Departmental Coordinator.'
                );

                return;
            }


            try {

                setSaving(true);


                const response =
                    await adminApi.put(
                        `/admin/users/${editingUser.id}`,
                        {

                            full_name:
                                editForm.full_name
                                    .trim(),

                            email:
                                editForm.email
                                    .trim()
                                    .toLowerCase(),

                            role:
                                editForm.role,

                            faculty_id:
                                Number(
                                    editForm.faculty_id
                                ),

                            department_id:
                                editForm.department_id
                                    ? Number(
                                        editForm.department_id
                                    )
                                    : null

                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'User account updated successfully.'
                );


                setEditingUser(null);


                await loadData();


            } catch (requestError) {

                console.error(
                    'Update user error:',
                    requestError
                );


                setError(
                    requestError.response?.data?.message ||
                    requestError.response?.data?.error ||
                    requestError.message ||
                    'Unable to update user account.'
                );


            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // ACTIVATE / DISABLE USER
    // ======================================================

    const toggleUserStatus =
        async (
            managedUser
        ) => {

            if (
                !managedUser?.id
            ) {

                return;
            }


            if (
                managedUser.role ===
                'super_admin'
            ) {

                return;
            }


            const action =
                managedUser.is_active
                    ? 'disable'
                    : 'activate';


            const confirmed =
                window.confirm(
                    `Are you sure you want to ${action} "${managedUser.full_name}"?`
                );


            if (
                !confirmed
            ) {

                return;
            }


            try {

                setError('');

                setSuccess('');

                setStatusLoadingUser(
                    managedUser.id
                );


                const response =
                    await adminApi.patch(
                        `/admin/users/${managedUser.id}/status`,
                        {

                            is_active:
                                !Boolean(
                                    managedUser.is_active
                                )

                        }
                    );


                setSuccess(
                    response.data?.message ||
                    'User account status updated successfully.'
                );


                await loadData();


            } catch (requestError) {

                console.error(
                    'User status error:',
                    requestError
                );


                setError(
                    requestError.response?.data?.message ||
                    requestError.response?.data?.error ||
                    requestError.message ||
                    'Unable to update user status.'
                );


            } finally {

                setStatusLoadingUser(
                    null
                );
            }
        };


    // ======================================================
    // REMOVE USER
    // ======================================================

    const removeUser =
        async (
            managedUser
        ) => {

            if (
                !managedUser?.id
            ) {

                return;
            }


            if (
                managedUser.role ===
                'super_admin'
            ) {

                return;
            }


            const confirmed =
                window.confirm(
                    `Remove "${managedUser.full_name}" from the system?\n\nThis action cannot be undone.`
                );


            if (
                !confirmed
            ) {

                return;
            }


            try {

                setError('');

                setSuccess('');

                setDeletingUser(
                    managedUser.id
                );


                const response =
                    await adminApi.delete(
                        `/admin/users/${managedUser.id}`
                    );


                setSuccess(
                    response.data?.message ||
                    'User account removed successfully.'
                );


                await loadData();


            } catch (requestError) {

                console.error(
                    'Remove user error:',
                    requestError
                );


                setError(
                    requestError.response?.data?.message ||
                    requestError.response?.data?.error ||
                    requestError.message ||
                    'Unable to remove user account.'
                );


            } finally {

                setDeletingUser(
                    null
                );
            }
        };


    // ======================================================
    // ROLE LABEL
    // ======================================================

    const getRoleLabel = (
        role
    ) => {

        return (
            ROLE_OPTIONS.find(
                item =>
                    item.value === role
            )?.label ||
            role ||
            'Unknown'
        );

    };


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <AdminLayout
            activePage="Dashboard"
        >

            {/* ==================================================
                WELCOME
                ================================================== */}

            <section className="admin-welcome">

                <div>

                    <span>
                        SYSTEM ADMINISTRATION
                    </span>


                    <h2>
                        University-wide Control Center
                    </h2>


                    <p>
                        Monitor faculties, Exam Officers,
                        Departmental Coordinators and user
                        account access from one place.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-primary-button"
                    onClick={
                        openCreateUser
                    }
                >
                    + Register User
                </button>

            </section>


            {/* ==================================================
                ERROR
                ================================================== */}

            {
                error &&
                (

                    <div className="admin-alert error">

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
                SUCCESS
                ================================================== */}

            {
                success &&
                (

                    <div className="admin-alert success">

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
                STATISTICS
                ================================================== */}

            <section className="admin-stats-grid">

                <div className="admin-stat-card">

                    <span>
                        Faculties
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : dashboard.faculties ??
                                  0
                        }
                    </strong>

                </div>


                <div className="admin-stat-card">

                    <span>
                        Exam Officers
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : dashboard.exam_officers ??
                                  0
                        }
                    </strong>

                </div>


                <div className="admin-stat-card">

                    <span>
                        Department Coordinators
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : dashboard.departmental_coordinators ??
                                  0
                        }
                    </strong>

                </div>


                <div className="admin-stat-card">

                    <span>
                        Active Users
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : dashboard.active_users ??
                                  0
                        }
                    </strong>

                </div>


                <div className="admin-stat-card">

                    <span>
                        Inactive Users
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : dashboard.inactive_users ??
                                  0
                        }
                    </strong>

                </div>

            </section>


            {/* ==================================================
                FACULTIES
                ================================================== */}

            <section
                id="faculties"
                className="admin-panel"
            >

                <div className="admin-panel-header">

                    <div>

                        <span>
                            INSTITUTION
                        </span>

                        <h3>
                            Faculties
                        </h3>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                            <tr>

                                <th>
                                    #
                                </th>

                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Code
                                </th>

                                <th>
                                    Users
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                facultyOptions.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                item.requestedName
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
                                                        item.faculty?.name ||
                                                        item.requestedName
                                                    }
                                                </strong>

                                            </td>


                                            <td>

                                                {
                                                    item.faculty?.short_code ||
                                                    'Not configured'
                                                }

                                            </td>


                                            <td>

                                                {
                                                    item.faculty
                                                        ?.total_users ??
                                                    '—'
                                                }

                                            </td>

                                        </tr>

                                    )
                                )
                            }

                        </tbody>

                    </table>

                </div>

            </section>


            {/* ==================================================
                EXAM OFFICERS
                ================================================== */}

            <section
                id="exam-officers"
                className="admin-panel"
            >

                <div className="admin-panel-header">

                    <div>

                        <span>
                            EXAMINATION MANAGEMENT
                        </span>

                        <h3>
                            Exam Officers
                        </h3>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                            <tr>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Faculty
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
                                examOfficers.length === 0

                                    ? (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                style={{
                                                    textAlign:
                                                        'center'
                                                }}
                                            >
                                                No Exam Officers
                                                registered.
                                            </td>

                                        </tr>

                                    )

                                    : examOfficers.map(
                                        officer => (

                                            <tr
                                                key={
                                                    officer.id
                                                }
                                            >

                                                <td>

                                                    <strong>
                                                        {
                                                            officer.full_name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        officer.email
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        officer.faculty_name ||
                                                        'Not assigned'
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            Boolean(
                                                                officer.is_active
                                                            )
                                                                ? 'admin-status active'
                                                                : 'admin-status inactive'
                                                        }
                                                    >

                                                        {
                                                            officer.is_active
                                                                ? 'Active'
                                                                : 'Inactive'
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        className="admin-status-button"
                                                        onClick={() =>
                                                            toggleUserStatus(
                                                                officer
                                                            )
                                                        }
                                                        disabled={
                                                            statusLoadingUser ===
                                                            officer.id
                                                        }
                                                    >

                                                        {
                                                            statusLoadingUser ===
                                                            officer.id
                                                                ? 'Please wait...'
                                                                : officer.is_active
                                                                    ? 'Disable'
                                                                    : 'Activate'
                                                        }

                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )
                            }

                        </tbody>

                    </table>

                </div>

            </section>


            {/* ==================================================
                DEPARTMENTAL COORDINATORS
                ================================================== */}

            <section
                id="coordinators"
                className="admin-panel"
            >

                <div className="admin-panel-header">

                    <div>

                        <span>
                            DEPARTMENT MANAGEMENT
                        </span>

                        <h3>
                            Departmental Coordinators
                        </h3>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                            <tr>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Department
                                </th>

                                <th>
                                    Status
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                coordinators.length === 0

                                    ? (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                style={{
                                                    textAlign:
                                                        'center'
                                                }}
                                            >
                                                No Departmental
                                                Coordinators
                                                registered.
                                            </td>

                                        </tr>

                                    )

                                    : coordinators.map(
                                        coordinator => (

                                            <tr
                                                key={
                                                    coordinator.id
                                                }
                                            >

                                                <td>

                                                    <strong>
                                                        {
                                                            coordinator.full_name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        coordinator.email
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        coordinator.faculty_name ||
                                                        'Not assigned'
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        coordinator.department_name ||
                                                        'Not assigned'
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            Boolean(
                                                                coordinator.is_active
                                                            )
                                                                ? 'admin-status active'
                                                                : 'admin-status inactive'
                                                        }
                                                    >

                                                        {
                                                            coordinator.is_active
                                                                ? 'Active'
                                                                : 'Inactive'
                                                        }

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )
                            }

                        </tbody>

                    </table>

                </div>

            </section>


            {/* ==================================================
                ALL USERS
                ================================================== */}

            <section
                id="users"
                className="admin-panel"
            >

                <div className="admin-panel-header">

                    <div>

                        <span>
                            USER ACCESS
                        </span>

                        <h3>
                            All Managed Users
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={
                            loadData
                        }
                        disabled={
                            loading ||
                            saving ||
                            deletingUser !== null
                        }
                    >
                        Refresh
                    </button>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                            <tr>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Role
                                </th>

                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Department
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
                                users.length === 0

                                    ? (

                                        <tr>

                                            <td
                                                colSpan="7"
                                                style={{
                                                    textAlign:
                                                        'center'
                                                }}
                                            >
                                                No managed users found.
                                            </td>

                                        </tr>

                                    )

                                    : users.map(
                                        managedUser => (

                                            <tr
                                                key={
                                                    managedUser.id
                                                }
                                            >

                                                <td>

                                                    <strong>
                                                        {
                                                            managedUser.full_name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        managedUser.email
                                                    }
                                                </td>


                                                <td>

                                                    {
                                                        getRoleLabel(
                                                            managedUser.role
                                                        )
                                                    }

                                                </td>


                                                <td>
                                                    {
                                                        managedUser.faculty_name ||
                                                        '—'
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        managedUser.department_name ||
                                                        '—'
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            Boolean(
                                                                managedUser.is_active
                                                            )
                                                                ? 'admin-status active'
                                                                : 'admin-status inactive'
                                                        }
                                                    >

                                                        {
                                                            managedUser.is_active
                                                                ? 'Active'
                                                                : 'Inactive'
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    {
                                                        managedUser.role ===
                                                        'super_admin'

                                                            ? (

                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            '9px',
                                                                        color:
                                                                            '#777777',
                                                                        fontWeight:
                                                                            '700'
                                                                    }}
                                                                >
                                                                    Protected
                                                                </span>

                                                            )

                                                            : (

                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        gap:
                                                                            '5px',
                                                                        flexWrap:
                                                                            'wrap'
                                                                    }}
                                                                >

                                                                    <button
                                                                        type="button"
                                                                        className="admin-status-button"
                                                                        onClick={() =>
                                                                            openEditUser(
                                                                                managedUser
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving ||
                                                                            deletingUser !==
                                                                            null
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="admin-status-button"
                                                                        onClick={() =>
                                                                            toggleUserStatus(
                                                                                managedUser
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            statusLoadingUser ===
                                                                            managedUser.id ||
                                                                            deletingUser !==
                                                                            null
                                                                        }
                                                                    >

                                                                        {
                                                                            statusLoadingUser ===
                                                                            managedUser.id

                                                                                ? 'Please wait...'

                                                                                : managedUser.is_active
                                                                                    ? 'Disable'
                                                                                    : 'Activate'
                                                                        }

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="admin-status-button"
                                                                        style={{
                                                                            background:
                                                                                '#8c3d31'
                                                                        }}
                                                                        onClick={() =>
                                                                            removeUser(
                                                                                managedUser
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deletingUser ===
                                                                            managedUser.id ||
                                                                            saving ||
                                                                            statusLoadingUser !==
                                                                            null
                                                                        }
                                                                    >

                                                                        {
                                                                            deletingUser ===
                                                                            managedUser.id
                                                                                ? 'Removing...'
                                                                                : 'Remove'
                                                                        }

                                                                    </button>

                                                                </div>

                                                            )
                                                    }

                                                </td>

                                            </tr>

                                        )
                                    )
                            }

                        </tbody>

                    </table>

                </div>

            </section>


            {/* ==================================================
                CREATE USER MODAL
                ================================================== */}

            {
                showCreate &&
                (

                    <div className="admin-modal-overlay">

                        <div className="admin-modal">

                            <div className="admin-modal-header">

                                <div>

                                    <span>
                                        USER REGISTRATION
                                    </span>


                                    <h3>
                                        Register New User
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        closeCreateUser
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

                                    <div
                                        className="admin-alert error"
                                        style={{
                                            marginBottom:
                                                '14px'
                                        }}
                                    >

                                        <span>
                                            {error}
                                        </span>

                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    createUser
                                }
                            >

                                {/* FULL NAME */}

                                <div className="admin-form-group">

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
                                            handleCreateChange
                                        }
                                        placeholder="Enter full name"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                {/* EMAIL */}

                                <div className="admin-form-group">

                                    <label>
                                        Email Address
                                    </label>


                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        placeholder="Enter email address"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                {/* PASSWORD */}

                                <div className="admin-form-group">

                                    <label>
                                        Initial Password
                                    </label>


                                    <input
                                        type="password"
                                        name="password"
                                        value={
                                            formData.password
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        placeholder="Minimum 8 characters"
                                        minLength="8"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                {/* ROLE */}

                                <div className="admin-form-group">

                                    <label>
                                        User Role
                                    </label>


                                    <select
                                        name="role"
                                        value={
                                            formData.role
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        required
                                        disabled={
                                            saving
                                        }
                                    >

                                        <option value="">
                                            Select Role
                                        </option>


                                        {
                                            ROLE_OPTIONS.map(
                                                role => (

                                                    <option
                                                        key={
                                                            role.value
                                                        }
                                                        value={
                                                            role.value
                                                        }
                                                    >

                                                        {
                                                            role.label
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                {/* FACULTY */}

                                <div className="admin-form-group">

                                    <label>
                                        Faculty
                                    </label>


                                    <select
                                        name="faculty_id"
                                        value={
                                            formData.faculty_id
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        required
                                        disabled={
                                            saving
                                        }
                                    >

                                        <option value="">
                                            Select Faculty
                                        </option>


                                        {
                                            facultyOptions.map(
                                                item => (

                                                    <option
                                                        key={
                                                            item.requestedName
                                                        }
                                                        value={
                                                            item.faculty?.id ||
                                                            ''
                                                        }
                                                        disabled={
                                                            !item.faculty
                                                        }
                                                    >

                                                        {
                                                            item.faculty?.name ||
                                                            item.requestedName
                                                        }

                                                        {
                                                            item.faculty?.short_code
                                                                ? ` (${item.faculty.short_code})`
                                                                : !item.faculty
                                                                    ? ' — Not configured'
                                                                    : ''
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>


                                    <small>
                                        Select the faculty assigned to this account.
                                    </small>

                                </div>


                                {/* DEPARTMENT */}

                                {
                                    formData.role ===
                                    'departmental_coordinator'
                                    &&
                                    (

                                        <div className="admin-form-group">

                                            <label>
                                                Department ID
                                            </label>


                                            <input
                                                type="number"
                                                name="department_id"
                                                value={
                                                    formData.department_id
                                                }
                                                onChange={
                                                    handleCreateChange
                                                }
                                                min="1"
                                                placeholder="Enter department ID"
                                                required
                                                disabled={
                                                    saving
                                                }
                                            />


                                            <small>
                                                The department must belong
                                                to the selected faculty.
                                            </small>

                                        </div>

                                    )
                                }


                                <div className="admin-modal-actions">

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            closeCreateUser
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={
                                            saving
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Creating...'
                                                : 'Create Account'
                                        }

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )
            }


            {/* ==================================================
                EDIT USER MODAL
                ================================================== */}

            {
                editingUser &&
                (

                    <div className="admin-modal-overlay">

                        <div className="admin-modal">

                            <div className="admin-modal-header">

                                <div>

                                    <span>
                                        USER MANAGEMENT
                                    </span>


                                    <h3>
                                        Edit User Account
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        closeEditUser
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

                                    <div
                                        className="admin-alert error"
                                        style={{
                                            marginBottom:
                                                '14px'
                                        }}
                                    >

                                        <span>
                                            {error}
                                        </span>

                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    saveEditedUser
                                }
                            >

                                {/* NAME */}

                                <div className="admin-form-group">

                                    <label>
                                        Full Name
                                    </label>


                                    <input
                                        type="text"
                                        name="full_name"
                                        value={
                                            editForm.full_name
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                {/* EMAIL */}

                                <div className="admin-form-group">

                                    <label>
                                        Email Address
                                    </label>


                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            editForm.email
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                {/* ROLE */}

                                <div className="admin-form-group">

                                    <label>
                                        User Role
                                    </label>


                                    <select
                                        name="role"
                                        value={
                                            editForm.role
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        required
                                        disabled={
                                            saving
                                        }
                                    >

                                        {
                                            ROLE_OPTIONS.map(
                                                role => (

                                                    <option
                                                        key={
                                                            role.value
                                                        }
                                                        value={
                                                            role.value
                                                        }
                                                    >

                                                        {
                                                            role.label
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                {/* FACULTY */}

                                <div className="admin-form-group">

                                    <label>
                                        Faculty
                                    </label>


                                    <select
                                        name="faculty_id"
                                        value={
                                            editForm.faculty_id
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        required
                                        disabled={
                                            saving
                                        }
                                    >

                                        <option value="">
                                            Select Faculty
                                        </option>


                                        {
                                            facultyOptions.map(
                                                item => (

                                                    <option
                                                        key={
                                                            item.requestedName
                                                        }
                                                        value={
                                                            item.faculty?.id ||
                                                            ''
                                                        }
                                                        disabled={
                                                            !item.faculty
                                                        }
                                                    >

                                                        {
                                                            item.faculty?.name ||
                                                            item.requestedName
                                                        }

                                                        {
                                                            item.faculty?.short_code
                                                                ? ` (${item.faculty.short_code})`
                                                                : !item.faculty
                                                                    ? ' — Not configured'
                                                                    : ''
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                {/* DEPARTMENT */}

                                {
                                    editForm.role ===
                                    'departmental_coordinator'
                                    &&
                                    (

                                        <div className="admin-form-group">

                                            <label>
                                                Department ID
                                            </label>


                                            <input
                                                type="number"
                                                name="department_id"
                                                value={
                                                    editForm.department_id
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                min="1"
                                                required
                                                placeholder="Enter department ID"
                                                disabled={
                                                    saving
                                                }
                                            />


                                            <small>
                                                The department must belong
                                                to the selected faculty.
                                            </small>

                                        </div>

                                    )
                                }


                                <div className="admin-modal-actions">

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            closeEditUser
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={
                                            saving
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : 'Save Changes'
                                        }

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )
            }

        </AdminLayout>
    );
};


export default AdminDashboard;