import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';
import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/students.css';


const EMPTY_FORM = {
    department_id: '',
    matric_number: '',
    full_name: '',
    level: ''
};


const StudentsPage = () => {

    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [modalMode, setModalMode] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [formData, setFormData] = useState({
        ...EMPTY_FORM
    });


    // ======================================================
    // LOAD STUDENTS
    // ======================================================

    const loadStudents = async () => {

        try {

            setLoading(true);
            setError('');

            const response =
                await api.get('/students');

            setStudents(
                response.data.students || []
            );

        } catch (error) {

            console.error(
                'Load students error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Unable to load students.'
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

            setOptionsLoading(true);

            const response =
                await api.get('/departments');

            setDepartments(
                response.data.departments || []
            );

        } catch (error) {

            console.error(
                'Load departments error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Unable to load departments.'
            );

        } finally {

            setOptionsLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadStudents();
        loadDepartments();

    }, []);


    // ======================================================
    // STATISTICS
    // ======================================================

    const activeStudents =
        useMemo(
            () =>
                students.filter(
                    student =>
                        Boolean(student.is_active)
                ).length,
            [students]
        );


    const inactiveStudents =
        students.length -
        activeStudents;


    const departmentCount =
        new Set(
            students.map(
                student =>
                    student.department_id
            )
        ).size;


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        setError('');
        setSuccess('');

        setSelectedStudent(null);

        setFormData({
            ...EMPTY_FORM
        });

        setModalMode('create');
    };


    // ======================================================
    // OPEN VIEW
    // ======================================================

    const openView = (student) => {

        setSelectedStudent(student);

        setModalMode('view');
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEdit = (student) => {

        setError('');
        setSuccess('');

        setSelectedStudent(student);

        setFormData({

            department_id:
                student.department_id
                    ? String(student.department_id)
                    : '',

            matric_number:
                student.matric_number || '',

            full_name:
                student.full_name || '',

            level:
                student.level
                    ? String(student.level)
                    : ''
        });

        setModalMode('edit');
    };


    // ======================================================
    // CLOSE
    // ======================================================

    const closeModal = () => {

        if (saving) {
            return;
        }

        setModalMode(null);
        setSelectedStudent(null);

        setFormData({
            ...EMPTY_FORM
        });
    };


    // ======================================================
    // CHANGE
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

        if (!formData.department_id) {

            setError(
                'Please select a department.'
            );

            return false;
        }


        if (!formData.matric_number.trim()) {

            setError(
                'Matric number is required.'
            );

            return false;
        }


        if (!formData.full_name.trim()) {

            setError(
                'Student full name is required.'
            );

            return false;
        }


        const level =
            Number(formData.level);


        if (
            !Number.isFinite(level) ||
            level <= 0
        ) {

            setError(
                'Student level must be greater than zero.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE STUDENT
    // ======================================================

    const createStudent =
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

                    department_id:
                        Number(
                            formData.department_id
                        ),

                    matric_number:
                        formData.matric_number
                            .trim()
                            .toUpperCase(),

                    full_name:
                        formData.full_name.trim(),

                    level:
                        Number(
                            formData.level
                        )
                };


                const response =
                    await api.post(
                        '/students',
                        body
                    );


                setSuccess(
                    response.data.message ||
                    'Student created successfully.'
                );


                closeModal();

                await loadStudents();

            } catch (error) {

                console.error(
                    'Create student error:',
                    error
                );

                setError(
                    error.response?.data?.message ||
                    'Unable to create student.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // UPDATE STUDENT
    // ======================================================

    const updateStudent =
        async (event) => {

            event.preventDefault();

            setError('');
            setSuccess('');


            if (!selectedStudent?.id) {

                setError(
                    'No student was selected.'
                );

                return;
            }


            if (!validateForm()) {
                return;
            }


            try {

                setSaving(true);


                const body = {

                    department_id:
                        Number(
                            formData.department_id
                        ),

                    matric_number:
                        formData.matric_number
                            .trim()
                            .toUpperCase(),

                    full_name:
                        formData.full_name.trim(),

                    level:
                        Number(
                            formData.level
                        )
                };


                const response =
                    await api.put(
                        `/students/${selectedStudent.id}`,
                        body
                    );


                setSuccess(
                    response.data.message ||
                    'Student updated successfully.'
                );


                closeModal();

                await loadStudents();

            } catch (error) {

                console.error(
                    'Update student error:',
                    error
                );

                setError(
                    error.response?.data?.message ||
                    'Unable to update student.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // ACTIVATE / DEACTIVATE
    // ======================================================

    const toggleStatus =
        async (student) => {

            try {

                setError('');
                setSuccess('');


                const response =
                    await api.patch(
                        `/students/${student.id}/status`,
                        {
                            is_active:
                                !Boolean(
                                    student.is_active
                                )
                        }
                    );


                setSuccess(
                    response.data.message ||
                    'Student status updated successfully.'
                );


                await loadStudents();

            } catch (error) {

                console.error(
                    'Student status error:',
                    error
                );

                setError(
                    error.response?.data?.message ||
                    'Unable to update student status.'
                );
            }
        };


    // ======================================================
    // REFRESH
    // ======================================================

    const refreshAll = () => {

        loadStudents();
        loadDepartments();
    };


    return (

        <ExamOfficerLayout
            activePage="Students"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="students-header">

                <div>

                    <span className="students-label">
                        STUDENT RECORDS
                    </span>

                    <h2>
                        Students
                    </h2>

                    <p>
                        Manage registered students,
                        department assignments and
                        examination eligibility records.
                    </p>

                </div>


                <button
                    type="button"
                    className="student-create-button"
                    onClick={openCreate}
                >
                    + New Student
                </button>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {success && (

                <div className="student-success">

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


            {error && !modalMode && (

                <div className="student-error">

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

            <section className="student-summary-grid">

                <div className="student-summary-card">

                    <span>
                        Total Students
                    </span>

                    <strong>
                        {students.length}
                    </strong>

                </div>


                <div className="student-summary-card">

                    <span>
                        Active Students
                    </span>

                    <strong>
                        {activeStudents}
                    </strong>

                </div>


                <div className="student-summary-card">

                    <span>
                        Inactive Students
                    </span>

                    <strong>
                        {inactiveStudents}
                    </strong>

                </div>


                <div className="student-summary-card">

                    <span>
                        Departments Covered
                    </span>

                    <strong>
                        {departmentCount}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                TABLE
                ================================================== */}

            <section className="students-panel">

                <div className="students-panel-heading">

                    <div>

                        <span className="students-label">
                            STUDENT DATABASE
                        </span>

                        <h3>
                            Student List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="student-refresh-button"
                        onClick={refreshAll}
                        disabled={
                            loading ||
                            optionsLoading
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

                    <div className="students-loading">
                        Loading students...
                    </div>

                ) : students.length === 0 ? (

                    <div className="students-empty">

                        <strong>
                            No students found
                        </strong>

                        <span>
                            Create a student record to begin
                            managing examination registration.
                        </span>

                    </div>

                ) : (

                    <div className="students-table-wrapper">

                        <table className="students-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Matric Number
                                    </th>

                                    <th>
                                        Student Name
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Level
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
                                    students.map(
                                        (
                                            student,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    student.id
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <strong
                                                        className="student-matric"
                                                    >
                                                        {
                                                            student.matric_number
                                                        }
                                                    </strong>

                                                </td>


                                                <td>

                                                    <strong
                                                        className="student-name"
                                                    >
                                                        {
                                                            student.full_name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            student.department_name ||
                                                            '—'
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            student.department_code ||
                                                            ''
                                                        }
                                                    </small>

                                                </td>


                                                <td>
                                                    {student.level}
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            Boolean(
                                                                student.is_active
                                                            )
                                                                ? 'student-status active'
                                                                : 'student-status inactive'
                                                        }
                                                    >
                                                        {
                                                            Boolean(
                                                                student.is_active
                                                            )
                                                                ? 'Active'
                                                                : 'Inactive'
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="student-actions">

                                                        <button
                                                            type="button"
                                                            className="student-view-button"
                                                            onClick={() =>
                                                                openView(
                                                                    student
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="student-edit-button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    student
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className={
                                                                Boolean(
                                                                    student.is_active
                                                                )
                                                                    ? 'student-disable-button'
                                                                    : 'student-enable-button'
                                                            }
                                                            onClick={() =>
                                                                toggleStatus(
                                                                    student
                                                                )
                                                            }
                                                        >
                                                            {
                                                                Boolean(
                                                                    student.is_active
                                                                )
                                                                    ? 'Disable'
                                                                    : 'Activate'
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

                    <div className="student-modal-overlay">

                        <div className="student-modal">

                            <div className="student-modal-header">

                                <div>

                                    <span className="students-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW STUDENT RECORD'
                                                : 'UPDATE STUDENT RECORD'
                                        }

                                    </span>

                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Student'
                                                : 'Edit Student'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="student-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            {error && (

                                <div className="student-modal-error">
                                    {error}
                                </div>

                            )}


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createStudent
                                        : updateStudent
                                }
                            >

                                {/* DEPARTMENT */}

                                <div className="student-form-group">

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
                                            optionsLoading ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">
                                            {
                                                optionsLoading
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

                                                        {' ('}

                                                        {
                                                            department.short_code
                                                        }

                                                        {')'}

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                <div className="student-form-grid">

                                    {/* MATRIC */}

                                    <div className="student-form-group">

                                        <label>
                                            Matric Number
                                        </label>

                                        <input
                                            type="text"
                                            name="matric_number"
                                            value={
                                                formData.matric_number
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Example: FCP/CSE/23/2009"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* LEVEL */}

                                    <div className="student-form-group">

                                        <label>
                                            Level
                                        </label>

                                        <input
                                            type="number"
                                            name="level"
                                            value={
                                                formData.level
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="400"
                                            min="1"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>

                                </div>


                                {/* FULL NAME */}

                                <div className="student-form-group">

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
                                        placeholder="Enter student's full name"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="student-modal-actions">

                                    <button
                                        type="button"
                                        className="student-cancel-button"
                                        onClick={closeModal}
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="student-save-button"
                                        disabled={
                                            saving ||
                                            optionsLoading
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Student'
                                                    : 'Update Student'
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
                selectedStudent &&
                (

                    <div className="student-modal-overlay">

                        <div className="student-modal">

                            <div className="student-modal-header">

                                <div>

                                    <span className="students-label">
                                        STUDENT INFORMATION
                                    </span>

                                    <h3>
                                        Student Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="student-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            <div className="student-detail-grid">

                                <div>

                                    <span>
                                        Matric Number
                                    </span>

                                    <strong>
                                        {
                                            selectedStudent.matric_number
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Full Name
                                    </span>

                                    <strong>
                                        {
                                            selectedStudent.full_name
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Department
                                    </span>

                                    <strong>
                                        {
                                            selectedStudent.department_name ||
                                            '—'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Department Code
                                    </span>

                                    <strong>
                                        {
                                            selectedStudent.department_code ||
                                            '—'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Level
                                    </span>

                                    <strong>
                                        {
                                            selectedStudent.level
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {
                                            selectedStudent.is_active
                                                ? 'Active'
                                                : 'Inactive'
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="student-modal-actions">

                                <button
                                    type="button"
                                    className="student-cancel-button"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="student-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedStudent
                                        )
                                    }
                                >
                                    Edit Student
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </ExamOfficerLayout>
    );
};


export default StudentsPage;