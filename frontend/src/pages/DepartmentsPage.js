import {
    useEffect,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/departments.css';


const EMPTY_FORM = {
    faculty_id: '',
    name: '',
    short_code: ''
};


const DepartmentsPage = () => {

    const [departments, setDepartments] = useState([]);

    const [faculties, setFaculties] = useState([]);

    const [loading, setLoading] = useState(true);

    const [facultiesLoading, setFacultiesLoading] =
        useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');

    const [modalMode, setModalMode] = useState(null);

    const [selectedDepartment, setSelectedDepartment] =
        useState(null);

    const [formData, setFormData] =
        useState(EMPTY_FORM);


    // ======================================================
    // LOAD DEPARTMENTS
    // ======================================================

    const loadDepartments = async () => {

        try {

            setLoading(true);
            setError('');

            const response =
                await api.get('/departments');

            setDepartments(
                response.data.departments || []
            );

        } catch (error) {

            console.error(
                'Department loading error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Unable to load departments.'
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD FACULTIES
    // ======================================================

    const loadFaculties = async () => {

        try {

            setFacultiesLoading(true);

            const response =
                await api.get('/faculties');

            setFaculties(
                response.data.faculties || []
            );

        } catch (error) {

            console.error(
                'Faculty loading error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Unable to load faculties.'
            );

        } finally {

            setFacultiesLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadDepartments();
        loadFaculties();

    }, []);


    // ======================================================
    // HELPERS
    // ======================================================

    const getFacultyName = (department) => {

        if (department?.faculty_name) {
            return department.faculty_name;
        }

        const faculty =
            faculties.find(
                item =>
                    Number(item.id) ===
                    Number(department?.faculty_id)
            );

        return faculty?.name || '—';
    };


    const getFacultyShortCode = (department) => {

        if (department?.faculty_short_code) {
            return department.faculty_short_code;
        }

        const faculty =
            faculties.find(
                item =>
                    Number(item.id) ===
                    Number(department?.faculty_id)
            );

        return faculty?.short_code || '';
    };


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        setError('');
        setSuccess('');

        setSelectedDepartment(null);

        setFormData({
            ...EMPTY_FORM
        });

        setModalMode('create');
    };


    // ======================================================
    // OPEN VIEW
    // ======================================================

    const openView = (department) => {

        setSelectedDepartment(
            department
        );

        setModalMode('view');
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEdit = (department) => {

        setError('');
        setSuccess('');

        setSelectedDepartment(
            department
        );

        setFormData({

            faculty_id:
                department.faculty_id
                    ? String(department.faculty_id)
                    : '',

            name:
                department.name || '',

            short_code:
                department.short_code || ''
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

        setSelectedDepartment(null);

        setFormData({
            ...EMPTY_FORM
        });
    };


    // ======================================================
    // HANDLE FORM CHANGE
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
    };


    // ======================================================
    // VALIDATION
    // ======================================================

    const validateForm = () => {

        const departmentName =
            formData.name.trim();

        const departmentCode =
            formData.short_code
                .trim()
                .toUpperCase();

        const facultyId =
            Number(formData.faculty_id);


        if (!facultyId) {

            setError(
                'Please select a faculty.'
            );

            return false;
        }


        if (!departmentName) {

            setError(
                'Department name is required.'
            );

            return false;
        }


        if (!departmentCode) {

            setError(
                'Department short code is required.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE DEPARTMENT
    // ======================================================

    const createDepartment =
        async (event) => {

            event.preventDefault();

            setError('');
            setSuccess('');


            if (!validateForm()) {
                return;
            }


            try {

                setSaving(true);


                const body = {

                    faculty_id:
                        Number(
                            formData.faculty_id
                        ),

                    name:
                        formData.name.trim(),

                    short_code:
                        formData.short_code
                            .trim()
                            .toUpperCase()
                };


                const response =
                    await api.post(
                        '/departments',
                        body
                    );


                setSuccess(
                    response.data.message ||
                    'Department created successfully.'
                );


                closeModal();

                await loadDepartments();

            } catch (error) {

                console.error(
                    'Create department error:',
                    error
                );


                setError(
                    error.response?.data?.message ||
                    'Unable to create department.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // UPDATE DEPARTMENT
    // ======================================================

    const updateDepartment =
        async (event) => {

            event.preventDefault();

            setError('');
            setSuccess('');


            if (!selectedDepartment?.id) {

                setError(
                    'No department was selected.'
                );

                return;
            }


            if (!validateForm()) {
                return;
            }


            try {

                setSaving(true);


                const body = {

                    faculty_id:
                        Number(
                            formData.faculty_id
                        ),

                    name:
                        formData.name.trim(),

                    short_code:
                        formData.short_code
                            .trim()
                            .toUpperCase()
                };


                const response =
                    await api.put(
                        `/departments/${selectedDepartment.id}`,
                        body
                    );


                setSuccess(
                    response.data.message ||
                    'Department updated successfully.'
                );


                closeModal();

                await loadDepartments();

            } catch (error) {

                console.error(
                    'Update department error:',
                    error
                );


                setError(
                    error.response?.data?.message ||
                    'Unable to update department.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // DELETE DEPARTMENT
    // ======================================================

    const deleteDepartment =
        async (department) => {

            const confirmed =
                window.confirm(
                    `Are you sure you want to delete "${department.name}"?`
                );


            if (!confirmed) {
                return;
            }


            try {

                setError('');
                setSuccess('');


                const response =
                    await api.delete(
                        `/departments/${department.id}`
                    );


                setSuccess(
                    response.data.message ||
                    'Department deleted successfully.'
                );


                await loadDepartments();

            } catch (error) {

                console.error(
                    'Delete department error:',
                    error
                );


                const dependencies =
                    error.response?.data?.dependencies;


                let message =
                    error.response?.data?.message ||
                    'Unable to delete department.';


                if (dependencies) {

                    const details = [];

                    if (dependencies.courses > 0) {
                        details.push(
                            `Courses: ${dependencies.courses}`
                        );
                    }

                    if (dependencies.students > 0) {
                        details.push(
                            `Students: ${dependencies.students}`
                        );
                    }

                    if (dependencies.invigilators > 0) {
                        details.push(
                            `Invigilators: ${dependencies.invigilators}`
                        );
                    }

                    if (dependencies.users > 0) {
                        details.push(
                            `Users: ${dependencies.users}`
                        );
                    }


                    if (details.length > 0) {

                        message +=
                            ` (${details.join(', ')})`;
                    }
                }


                setError(message);
            }
        };


    // ======================================================
    // PAGE
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Departments"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="departments-header">

                <div>

                    <span className="departments-label">
                        ACADEMIC STRUCTURE
                    </span>

                    <h2>
                        Departments
                    </h2>

                    <p>
                        Manage departments across the
                        University's faculties and maintain
                        department codes used by the
                        examination timetable system.
                    </p>

                </div>


                <button
                    type="button"
                    className="department-create-button"
                    onClick={openCreate}
                >
                    + New Department
                </button>

            </section>


            {/* ==================================================
                SUCCESS
                ================================================== */}

            {success && (

                <div className="department-success">

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

            {error && !modalMode && (

                <div className="department-error">

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

            <section className="department-summary-grid">

                <div className="department-summary-card">

                    <span>
                        Total Departments
                    </span>

                    <strong>
                        {departments.length}
                    </strong>

                </div>


                <div className="department-summary-card">

                    <span>
                        Faculties Represented
                    </span>

                    <strong>

                        {
                            new Set(
                                departments.map(
                                    department =>
                                        department.faculty_id
                                )
                            ).size
                        }

                    </strong>

                </div>


                <div className="department-summary-card">

                    <span>
                        Current Records
                    </span>

                    <strong>
                        {
                            loading
                                ? '...'
                                : departments.length
                        }
                    </strong>

                </div>

            </section>


            {/* ==================================================
                DEPARTMENT PANEL
                ================================================== */}

            <section className="departments-panel">

                <div className="departments-panel-heading">

                    <div>

                        <span className="departments-label">
                            DEPARTMENT RECORDS
                        </span>

                        <h3>
                            Department List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="department-refresh-button"
                        onClick={() => {
                            loadDepartments();
                            loadFaculties();
                        }}
                        disabled={
                            loading ||
                            facultiesLoading
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

                    <div className="departments-loading">
                        Loading departments...
                    </div>

                ) : departments.length === 0 ? (

                    <div className="departments-empty">

                        <strong>
                            No departments found
                        </strong>

                        <span>
                            Create a department to begin
                            configuring the academic structure.
                        </span>

                    </div>

                ) : (

                    <div className="departments-table-wrapper">

                        <table className="departments-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Short Code
                                    </th>

                                    <th>
                                        Faculty
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    departments.map(
                                        (
                                            department,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    department.id
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <strong
                                                        className="department-name"
                                                    >
                                                        {
                                                            department.name ||
                                                            '—'
                                                        }
                                                    </strong>

                                                </td>


                                                <td>

                                                    <span className="department-code">
                                                        {
                                                            department.short_code ||
                                                            '—'
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="faculty-cell">

                                                        <strong>
                                                            {
                                                                getFacultyName(
                                                                    department
                                                                )
                                                            }
                                                        </strong>

                                                        {
                                                            getFacultyShortCode(
                                                                department
                                                            ) &&
                                                            (

                                                                <small>
                                                                    {
                                                                        getFacultyShortCode(
                                                                            department
                                                                        )
                                                                    }
                                                                </small>

                                                            )
                                                        }

                                                    </div>

                                                </td>


                                                <td>

                                                    <div className="department-actions">

                                                        <button
                                                            type="button"
                                                            className="department-view-button"
                                                            onClick={() =>
                                                                openView(
                                                                    department
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="department-edit-button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    department
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="department-delete-button"
                                                            onClick={() =>
                                                                deleteDepartment(
                                                                    department
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

                    <div className="department-modal-overlay">

                        <div className="department-modal">

                            <div className="department-modal-header">

                                <div>

                                    <span className="departments-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW ACADEMIC UNIT'
                                                : 'UPDATE ACADEMIC UNIT'
                                        }

                                    </span>

                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Department'
                                                : 'Edit Department'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="department-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            {error && (

                                <div className="department-modal-error">
                                    {error}
                                </div>

                            )}


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createDepartment
                                        : updateDepartment
                                }
                            >

                                {/* FACULTY */}

                                <div className="department-form-group">

                                    <label>
                                        Faculty
                                    </label>

                                    <select
                                        name="faculty_id"
                                        value={
                                            formData.faculty_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            facultiesLoading ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">
                                            {
                                                facultiesLoading
                                                    ? 'Loading faculties...'
                                                    : 'Select Faculty'
                                            }
                                        </option>


                                        {
                                            faculties.map(
                                                faculty => (

                                                    <option
                                                        key={
                                                            faculty.id
                                                        }
                                                        value={
                                                            faculty.id
                                                        }
                                                    >
                                                        {
                                                            faculty.name
                                                        }
                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                {/* DEPARTMENT NAME */}

                                <div className="department-form-group">

                                    <label>
                                        Department Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={
                                            formData.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: Software Engineering"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                {/* SHORT CODE */}

                                <div className="department-form-group">

                                    <label>
                                        Department Short Code
                                    </label>

                                    <input
                                        type="text"
                                        name="short_code"
                                        value={
                                            formData.short_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: CSE"
                                        maxLength="20"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="department-modal-actions">

                                    <button
                                        type="button"
                                        className="department-cancel-button"
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
                                        className="department-save-button"
                                        disabled={
                                            saving ||
                                            facultiesLoading
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Department'
                                                    : 'Update Department'
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
                selectedDepartment &&
                (

                    <div className="department-modal-overlay">

                        <div className="department-modal">

                            <div className="department-modal-header">

                                <div>

                                    <span className="departments-label">
                                        DEPARTMENT INFORMATION
                                    </span>

                                    <h3>
                                        Department Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="department-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            <div className="department-detail-grid">

                                <div>

                                    <span>
                                        Department Name
                                    </span>

                                    <strong>
                                        {
                                            selectedDepartment.name
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Short Code
                                    </span>

                                    <strong>
                                        {
                                            selectedDepartment.short_code
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Faculty
                                    </span>

                                    <strong>
                                        {
                                            getFacultyName(
                                                selectedDepartment
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Faculty Code
                                    </span>

                                    <strong>
                                        {
                                            getFacultyShortCode(
                                                selectedDepartment
                                            ) || '—'
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="department-modal-actions">

                                <button
                                    type="button"
                                    className="department-cancel-button"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="department-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedDepartment
                                        )
                                    }
                                >
                                    Edit Department
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </ExamOfficerLayout>
    );
};


export default DepartmentsPage;