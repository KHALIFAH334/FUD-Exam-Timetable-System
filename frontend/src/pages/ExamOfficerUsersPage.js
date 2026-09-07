import {
    useEffect,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/dashboard.css';

const ExamOfficerUsersPage = () => {

    const [users, setUsers] =
        useState([]);

    const [departments, setDepartments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [showModal, setShowModal] =
        useState(false);

    const [editingUser, setEditingUser] =
        useState(null);

    const emptyForm = {
        full_name: '',
        email: '',
        password: '',
        role: 'departmental_coordinator',
        department_id: ''
    };

    const [formData, setFormData] =
        useState({
            ...emptyForm
        });

    // ======================================================
    // LOAD DATA
    // ======================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const [
                usersResponse,
                departmentsResponse
            ] = await Promise.all([
                api.get(
                    '/exam-officer/users'
                ),
                api.get(
                    '/exam-officer/departments'
                )
            ]);

            setUsers(
                Array.isArray(
                    usersResponse.data?.users
                )
                    ? usersResponse.data.users
                    : []
            );

            setDepartments(
                Array.isArray(
                    departmentsResponse.data?.departments
                )
                    ? departmentsResponse.data.departments
                    : []
            );

        } catch (requestError) {
            console.error(
                'Load faculty users error:',
                requestError
            );

            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                'Unable to load faculty user data.'
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
    // FORM CHANGE
    // ======================================================

    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setFormData(
            previous => ({
                ...previous,
                [name]: value
            })
        );
    };

    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        setEditingUser(null);

        setFormData({
            ...emptyForm
        });

        setError('');
        setSuccess('');
        setShowModal(true);
    };

    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEdit = (user) => {

        setEditingUser(user);

        setFormData({
            full_name:
                user.full_name || '',

            email:
                user.email || '',

            password: '',

            role:
                user.role ||
                'departmental_coordinator',

            department_id:
                user.department_id || ''
        });

        setError('');
        setSuccess('');
        setShowModal(true);
    };

    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingUser(null);
        setFormData({
            ...emptyForm
        });

        setError('');
    };

    // ======================================================
    // SAVE USER
    // ======================================================

    const saveUser = async (event) => {

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
            !editingUser &&
            !formData.password
        ) {
            setError(
                'Password is required.'
            );
            return;
        }

        if (
            formData.password &&
            formData.password.length < 8
        ) {
            setError(
                'Password must contain at least 8 characters.'
            );
            return;
        }

        if (
            formData.role ===
                'departmental_coordinator' &&
            !formData.department_id
        ) {
            setError(
                'Department is required for a Department Exam Officer.'
            );
            return;
        }

        try {

            setSaving(true);

            if (editingUser) {

                const response =
                    await api.put(
                        `/exam-officer/users/${editingUser.id}`,
                        {
                            full_name:
                                formData.full_name.trim(),

                            email:
                                formData.email
                                    .trim()
                                    .toLowerCase(),

                            role:
                                formData.role,

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
                    'User updated successfully.'
                );

            } else {

                const response =
                    await api.post(
                        '/exam-officer/users',
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
                    'User created successfully.'
                );
            }

            setShowModal(false);
            setEditingUser(null);
            setFormData({
                ...emptyForm
            });

            await loadData();

        } catch (requestError) {

            console.error(
                'Save faculty user error:',
                requestError
            );

            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                'Unable to save user.'
            );

        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // TOGGLE STATUS
    // ======================================================

    const toggleStatus = async (user) => {

        if (!user?.id) {
            return;
        }

        const action =
            user.is_active
                ? 'deactivate'
                : 'activate';

        if (
            !window.confirm(
                `Are you sure you want to ${action} "${user.full_name}"?`
            )
        ) {
            return;
        }

        try {

            setError('');
            setSuccess('');

            const response =
                await api.patch(
                    `/exam-officer/users/${user.id}/status`,
                    {
                        is_active:
                            !Boolean(
                                user.is_active
                            )
                    }
                );

            setSuccess(
                response.data?.message ||
                'User status updated successfully.'
            );

            await loadData();

        } catch (requestError) {

            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                'Unable to update user status.'
            );
        }
    };

    // ======================================================
    // DELETE USER
    // ======================================================

    const deleteUser = async (user) => {

        if (!user?.id) {
            return;
        }

        if (
            !window.confirm(
                `Remove "${user.full_name}" from this faculty?\n\nThis action cannot be undone.`
            )
        ) {
            return;
        }

        try {

            setError('');
            setSuccess('');

            const response =
                await api.delete(
                    `/exam-officer/users/${user.id}`
                );

            setSuccess(
                response.data?.message ||
                'User removed successfully.'
            );

            await loadData();

        } catch (requestError) {

            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                'Unable to remove user.'
            );
        }
    };

    // ======================================================
    // ROLE LABEL
    // ======================================================

    const getRoleLabel = (role) => {

        const labels = {
            departmental_coordinator:
                'Department Exam Officer',

            lecturer:
                'Lecturer',

            class_representative:
                'Class Representative',

            exam_officer:
                'Exam Officer',

            super_admin:
                'Super Admin'
        };

        return (
            labels[role] ||
            role ||
            'Unknown'
        );
    };

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <ExamOfficerLayout
            activePage="User Management"
        >

            {/* HEADER */}

            <section className="dashboard-welcome">

                <div>

                    <span className="welcome-label">
                        FACULTY ADMINISTRATION
                    </span>

                    <h2>
                        User Management
                    </h2>

                    <p>
                        Create and manage users
                        belonging to your faculty only.
                    </p>

                </div>

                <button
                    type="button"
                    className="dashboard-primary-button"
                    onClick={openCreate}
                >
                    + Add Faculty User
                </button>

            </section>

            {/* ALERTS */}

            {error && (
                <div
                    className="dashboard-panel"
                    style={{
                        marginBottom: '16px',
                        borderLeft:
                            '4px solid #b42318'
                    }}
                >
                    <strong>
                        Error
                    </strong>

                    <p
                        style={{
                            marginTop: '6px'
                        }}
                    >
                        {error}
                    </p>

                </div>
            )}

            {success && (
                <div
                    className="dashboard-panel"
                    style={{
                        marginBottom: '16px',
                        borderLeft:
                            '4px solid #00752F'
                    }}
                >
                    <strong>
                        Success
                    </strong>

                    <p
                        style={{
                            marginTop: '6px'
                        }}
                    >
                        {success}
                    </p>

                </div>
            )}

            {/* USER TABLE */}

            <section className="dashboard-panel">

                <div
                    style={{
                        display: 'flex',
                        justifyContent:
                            'space-between',
                        alignItems: 'center',
                        marginBottom: '18px',
                        gap: '12px'
                    }}
                >

                    <div>

                        <span className="welcome-label">
                            USER ACCESS
                        </span>

                        <h3>
                            Faculty Users
                        </h3>

                    </div>

                    <button
                        type="button"
                        className="dashboard-secondary-button"
                        onClick={loadData}
                        disabled={loading}
                    >
                        {loading
                            ? 'Refreshing...'
                            : 'Refresh'}
                    </button>

                </div>

                <div
                    style={{
                        overflowX: 'auto'
                    }}
                >

                    <table
                        style={{
                            width: '100%',
                            borderCollapse:
                                'collapse'
                        }}
                    >

                        <thead>

                            <tr>

                                <th style={thStyle}>
                                    Name
                                </th>

                                <th style={thStyle}>
                                    Email
                                </th>

                                <th style={thStyle}>
                                    Role
                                </th>

                                <th style={thStyle}>
                                    Department
                                </th>

                                <th style={thStyle}>
                                    Status
                                </th>

                                <th style={thStyle}>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        style={emptyStyle}
                                    >
                                        Loading users...
                                    </td>
                                </tr>

                            ) : users.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        style={emptyStyle}
                                    >
                                        No users have been
                                        created in this faculty yet.
                                    </td>
                                </tr>

                            ) : (

                                users.map(user => (

                                    <tr key={user.id}>

                                        <td style={tdStyle}>
                                            <strong>
                                                {user.full_name}
                                            </strong>
                                        </td>

                                        <td style={tdStyle}>
                                            {user.email}
                                        </td>

                                        <td style={tdStyle}>
                                            {getRoleLabel(
                                                user.role
                                            )}
                                        </td>

                                        <td style={tdStyle}>
                                            {user.department_name ||
                                                '—'}
                                        </td>

                                        <td style={tdStyle}>

                                            <span
                                                style={{
                                                    fontWeight:
                                                        '700',
                                                    fontSize:
                                                        '12px'
                                                }}
                                            >
                                                {user.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>

                                        </td>

                                        <td style={tdStyle}>

                                            <div
                                                style={{
                                                    display:
                                                        'flex',
                                                    gap:
                                                        '6px',
                                                    flexWrap:
                                                        'wrap'
                                                }}
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(
                                                            user
                                                        )
                                                    }
                                                    className="dashboard-secondary-button"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleStatus(
                                                            user
                                                        )
                                                    }
                                                    className="dashboard-secondary-button"
                                                >
                                                    {user.is_active
                                                        ? 'Disable'
                                                        : 'Activate'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteUser(
                                                            user
                                                        )
                                                    }
                                                    className="dashboard-secondary-button"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* MODAL */}

            {showModal && (

                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background:
                            'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems:
                            'center',
                        justifyContent:
                            'center',
                        zIndex: 3000,
                        padding: '20px'
                    }}
                >

                    <div
                        style={{
                            width: '100%',
                            maxWidth: '520px',
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            maxHeight:
                                '90vh',
                            overflowY:
                                'auto'
                        }}
                    >

                        <div
                            style={{
                                display:
                                    'flex',
                                justifyContent:
                                    'space-between',
                                alignItems:
                                    'center',
                                marginBottom:
                                    '20px'
                            }}
                        >

                            <div>

                                <span className="welcome-label">
                                    USER MANAGEMENT
                                </span>

                                <h3>
                                    {editingUser
                                        ? 'Edit Faculty User'
                                        : 'Add Faculty User'}
                                </h3>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                style={{
                                    border: 'none',
                                    background:
                                        'transparent',
                                    fontSize:
                                        '24px',
                                    cursor:
                                        'pointer'
                                }}
                            >
                                ×
                            </button>

                        </div>

                        {error && (
                            <div
                                style={{
                                    marginBottom:
                                        '15px',
                                    padding:
                                        '10px',
                                    border:
                                        '1px solid #ddd'
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={
                                saveUser
                            }
                        >

                            <label style={labelStyle}>
                                Full Name
                            </label>

                            <input
                                name="full_name"
                                value={
                                    formData.full_name
                                }
                                onChange={
                                    handleChange
                                }
                                style={
                                    inputStyle
                                }
                                required
                            />

                            <label style={labelStyle}>
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                style={
                                    inputStyle
                                }
                                required
                            />

                            {!editingUser && (
                                <>
                                    <label style={labelStyle}>
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={
                                            formData.password
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                        required
                                    />
                                </>
                            )}

                            <label style={labelStyle}>
                                Role
                            </label>

                            <select
                                name="role"
                                value={
                                    formData.role
                                }
                                onChange={
                                    handleChange
                                }
                                style={
                                    inputStyle
                                }
                            >

                                <option value="departmental_coordinator">
                                    Department Exam Officer
                                </option>

                                <option value="lecturer">
                                    Lecturer
                                </option>

                                <option value="class_representative">
                                    Class Representative
                                </option>

                            </select>

                            <label style={labelStyle}>
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
                                style={
                                    inputStyle
                                }
                            >

                                <option value="">
                                    Select Department
                                </option>

                                {departments.map(
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
                                        </option>
                                    )
                                )}

                            </select>

                            <div
                                style={{
                                    display:
                                        'flex',
                                    justifyContent:
                                        'flex-end',
                                    gap:
                                        '10px',
                                    marginTop:
                                        '22px'
                                }}
                            >

                                <button
                                    type="button"
                                    className="dashboard-secondary-button"
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
                                    className="dashboard-primary-button"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingUser
                                            ? 'Save Changes'
                                            : 'Create User'}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </ExamOfficerLayout>
    );
};


// ==========================================================
// INLINE TABLE STYLES
// ==========================================================

const thStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom:
        '1px solid #ddd',
    fontSize: '13px'
};

const tdStyle = {
    padding: '12px',
    borderBottom:
        '1px solid #eee',
    fontSize: '13px'
};

const emptyStyle = {
    padding: '30px',
    textAlign: 'center',
    color: '#666'
};

const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    marginTop: '14px',
    fontWeight: '600',
    fontSize: '13px'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border:
        '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box'
};

export default ExamOfficerUsersPage;