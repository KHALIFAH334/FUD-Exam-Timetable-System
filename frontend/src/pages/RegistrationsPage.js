import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';
import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/registrations.css';


const EMPTY_FORM = {
    student_id: '',
    course_id: '',
    registration_type: 'regular'
};


const REGISTRATION_TYPES = [
    {
        value: 'regular',
        label: 'Regular'
    },
    {
        value: 'carry_over',
        label: 'Carry Over'
    },
    {
        value: 'spill_over',
        label: 'Spill Over'
    }
];


const RegistrationsPage = () => {

    const [registrations, setRegistrations] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [modalMode, setModalMode] = useState(null);
    const [selectedRegistration, setSelectedRegistration] =
        useState(null);

    const [formData, setFormData] = useState({
        ...EMPTY_FORM
    });


    // ======================================================
    // LOAD REGISTRATIONS
    // ======================================================

    const loadRegistrations = async () => {

        try {

            setLoading(true);
            setError('');

            const response =
                await api.get('/registrations');

            setRegistrations(
                response.data.registrations || []
            );

        } catch (error) {

            console.error(
                'Load registrations error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Unable to load registrations.'
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD STUDENTS + COURSES
    // ======================================================

    const loadOptions = async () => {

        try {

            setOptionsLoading(true);

            const [
                studentResponse,
                courseResponse
            ] = await Promise.all([

                api.get('/students'),

                api.get('/courses')

            ]);


            setStudents(
                studentResponse.data.students || []
            );


            setCourses(
                courseResponse.data.courses || []
            );

        } catch (error) {

            console.error(
                'Load registration options error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Unable to load students and courses.'
            );

        } finally {

            setOptionsLoading(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadRegistrations();
        loadOptions();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const regularCount =
        useMemo(
            () =>
                registrations.filter(
                    registration =>
                        registration.registration_type ===
                        'regular'
                ).length,
            [registrations]
        );


    const carryOverCount =
        useMemo(
            () =>
                registrations.filter(
                    registration =>
                        registration.registration_type ===
                        'carry_over'
                ).length,
            [registrations]
        );


    const spillOverCount =
        useMemo(
            () =>
                registrations.filter(
                    registration =>
                        registration.registration_type ===
                        'spill_over'
                ).length,
            [registrations]
        );


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        setError('');
        setSuccess('');

        setSelectedRegistration(null);

        setFormData({
            ...EMPTY_FORM
        });

        setModalMode('create');
    };


    // ======================================================
    // OPEN VIEW
    // ======================================================

    const openView = (registration) => {

        setSelectedRegistration(
            registration
        );

        setModalMode('view');
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEdit = (registration) => {

        setError('');
        setSuccess('');

        setSelectedRegistration(
            registration
        );

        setFormData({

            student_id:
                registration.student_id
                    ? String(
                        registration.student_id
                    )
                    : '',

            course_id:
                registration.course_id
                    ? String(
                        registration.course_id
                    )
                    : '',

            registration_type:
                registration.registration_type ||
                'regular'
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

        setSelectedRegistration(null);

        setFormData({
            ...EMPTY_FORM
        });
    };


    // ======================================================
    // HANDLE CHANGE
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

        if (!formData.student_id) {

            setError(
                'Please select a student.'
            );

            return false;
        }


        if (!formData.course_id) {

            setError(
                'Please select a course.'
            );

            return false;
        }


        if (
            !REGISTRATION_TYPES.some(
                type =>
                    type.value ===
                    formData.registration_type
            )
        ) {

            setError(
                'Please select a valid registration type.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE
    // ======================================================

    const createRegistration =
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

                    student_id:
                        Number(
                            formData.student_id
                        ),

                    course_id:
                        Number(
                            formData.course_id
                        ),

                    registration_type:
                        formData.registration_type
                };


                const response =
                    await api.post(
                        '/registrations',
                        body
                    );


                setSuccess(
                    response.data.message ||
                    'Course registration created successfully.'
                );


                closeModal();

                await loadRegistrations();

            } catch (error) {

                console.error(
                    'Create registration error:',
                    error
                );

                setError(
                    error.response?.data?.message ||
                    'Unable to create registration.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // UPDATE
    // ======================================================

    const updateRegistration =
        async (event) => {

            event.preventDefault();

            setError('');
            setSuccess('');


            if (!selectedRegistration?.id) {

                setError(
                    'No registration was selected.'
                );

                return;
            }


            if (!validateForm()) {
                return;
            }


            try {

                setSaving(true);


                const body = {

                    course_id:
                        Number(
                            formData.course_id
                        ),

                    registration_type:
                        formData.registration_type
                };


                const response =
                    await api.put(
                        `/registrations/${selectedRegistration.id}`,
                        body
                    );


                setSuccess(
                    response.data.message ||
                    'Course registration updated successfully.'
                );


                closeModal();

                await loadRegistrations();

            } catch (error) {

                console.error(
                    'Update registration error:',
                    error
                );

                setError(
                    error.response?.data?.message ||
                    'Unable to update registration.'
                );

            } finally {

                setSaving(false);
            }
        };


    // ======================================================
    // REFRESH
    // ======================================================

    const refreshAll = () => {

        loadRegistrations();
        loadOptions();
    };


    // ======================================================
    // GET TYPE LABEL
    // ======================================================

    const getRegistrationTypeLabel = (type) => {

        const found =
            REGISTRATION_TYPES.find(
                item =>
                    item.value === type
            );

        return found?.label || type;
    };


    return (

        <ExamOfficerLayout
            activePage="Registrations"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="registrations-header">

                <div>

                    <span className="registrations-label">
                        COURSE REGISTRATION
                    </span>

                    <h2>
                        Registrations
                    </h2>

                    <p>
                        Manage student course registrations,
                        registration types and examination
                        eligibility records.
                    </p>

                </div>


                <button
                    type="button"
                    className="registration-create-button"
                    onClick={openCreate}
                >
                    + New Registration
                </button>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {success && (

                <div className="registration-success">

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

                <div className="registration-error">

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

            <section className="registration-summary-grid">

                <div className="registration-summary-card">

                    <span>
                        Total Registrations
                    </span>

                    <strong>
                        {registrations.length}
                    </strong>

                </div>


                <div className="registration-summary-card">

                    <span>
                        Regular
                    </span>

                    <strong>
                        {regularCount}
                    </strong>

                </div>


                <div className="registration-summary-card">

                    <span>
                        Carry Over
                    </span>

                    <strong>
                        {carryOverCount}
                    </strong>

                </div>


                <div className="registration-summary-card">

                    <span>
                        Spill Over
                    </span>

                    <strong>
                        {spillOverCount}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                TABLE
                ================================================== */}

            <section className="registrations-panel">

                <div className="registrations-panel-heading">

                    <div>

                        <span className="registrations-label">
                            REGISTRATION RECORDS
                        </span>

                        <h3>
                            Registration List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="registration-refresh-button"
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

                    <div className="registrations-loading">
                        Loading registrations...
                    </div>

                ) : registrations.length === 0 ? (

                    <div className="registrations-empty">

                        <strong>
                            No registrations found
                        </strong>

                        <span>
                            Create a registration to begin
                            assigning students to examination
                            courses.
                        </span>

                    </div>

                ) : (

                    <div className="registrations-table-wrapper">

                        <table className="registrations-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Course
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Session
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    registrations.map(
                                        (
                                            registration,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    registration.id
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <strong
                                                        className="registration-student-name"
                                                    >
                                                        {
                                                            registration.student_name
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            registration.matric_number
                                                        }
                                                    </small>

                                                </td>


                                                <td>

                                                    <strong
                                                        className="registration-course-code"
                                                    >
                                                        {
                                                            registration.course_code
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            registration.course_title
                                                        }
                                                    </small>

                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            registration.student_department_code ||
                                                            '—'
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            registration.course_department_code &&
                                                            registration.course_department_code !==
                                                            registration.student_department_code
                                                                ? `Course: ${registration.course_department_code}`
                                                                : ''
                                                        }
                                                    </small>

                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            registration.session_name
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            registration.semester
                                                        }
                                                    </small>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            `registration-type ${registration.registration_type}`
                                                        }
                                                    >
                                                        {
                                                            getRegistrationTypeLabel(
                                                                registration.registration_type
                                                            )
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="registration-actions">

                                                        <button
                                                            type="button"
                                                            className="registration-view-button"
                                                            onClick={() =>
                                                                openView(
                                                                    registration
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="registration-edit-button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    registration
                                                                )
                                                            }
                                                        >
                                                            Edit
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

                    <div className="registration-modal-overlay">

                        <div className="registration-modal">

                            <div className="registration-modal-header">

                                <div>

                                    <span className="registrations-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW REGISTRATION'
                                                : 'UPDATE REGISTRATION'
                                        }

                                    </span>

                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Registration'
                                                : 'Edit Registration'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="registration-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            {error && (

                                <div className="registration-modal-error">
                                    {error}
                                </div>

                            )}


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createRegistration
                                        : updateRegistration
                                }
                            >

                                {/* STUDENT */}

                                <div className="registration-form-group">

                                    <label>
                                        Student
                                    </label>

                                    <select
                                        name="student_id"
                                        value={
                                            formData.student_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            optionsLoading ||
                                            saving ||
                                            modalMode === 'edit'
                                        }
                                        required
                                    >

                                        <option value="">
                                            {
                                                optionsLoading
                                                    ? 'Loading students...'
                                                    : 'Select Student'
                                            }
                                        </option>


                                        {
                                            students.map(
                                                student => (

                                                    <option
                                                        key={
                                                            student.id
                                                        }
                                                        value={
                                                            student.id
                                                        }
                                                        disabled={
                                                            !student.is_active
                                                        }
                                                    >

                                                        {
                                                            student.matric_number
                                                        }

                                                        {' — '}

                                                        {
                                                            student.full_name
                                                        }

                                                        {
                                                            !student.is_active
                                                                ? ' (Inactive)'
                                                                : ''
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                {/* COURSE */}

                                <div className="registration-form-group">

                                    <label>
                                        Course
                                    </label>

                                    <select
                                        name="course_id"
                                        value={
                                            formData.course_id
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
                                                    ? 'Loading courses...'
                                                    : 'Select Course'
                                            }
                                        </option>


                                        {
                                            courses.map(
                                                course => (

                                                    <option
                                                        key={
                                                            course.id
                                                        }
                                                        value={
                                                            course.id
                                                        }
                                                        disabled={
                                                            !course.is_active
                                                        }
                                                    >

                                                        {
                                                            course.course_code
                                                        }

                                                        {' — '}

                                                        {
                                                            course.course_title
                                                        }

                                                        {' — Level '}

                                                        {
                                                            course.level
                                                        }

                                                        {
                                                            !course.is_active
                                                                ? ' (Inactive)'
                                                                : ''
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>

                                </div>


                                {/* REGISTRATION TYPE */}

                                <div className="registration-form-group">

                                    <label>
                                        Registration Type
                                    </label>

                                    <select
                                        name="registration_type"
                                        value={
                                            formData.registration_type
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
                                            REGISTRATION_TYPES.map(
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


                                <div className="registration-modal-actions">

                                    <button
                                        type="button"
                                        className="registration-cancel-button"
                                        onClick={closeModal}
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="registration-save-button"
                                        disabled={
                                            saving ||
                                            optionsLoading
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Registration'
                                                    : 'Update Registration'
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
                selectedRegistration &&
                (

                    <div className="registration-modal-overlay">

                        <div className="registration-modal">

                            <div className="registration-modal-header">

                                <div>

                                    <span className="registrations-label">
                                        REGISTRATION INFORMATION
                                    </span>

                                    <h3>
                                        Registration Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="registration-modal-close"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>

                            </div>


                            <div className="registration-detail-grid">

                                <div>

                                    <span>
                                        Student
                                    </span>

                                    <strong>
                                        {
                                            selectedRegistration.student_name
                                        }
                                    </strong>

                                    <small>
                                        {
                                            selectedRegistration.matric_number
                                        }
                                    </small>

                                </div>


                                <div>

                                    <span>
                                        Course
                                    </span>

                                    <strong>
                                        {
                                            selectedRegistration.course_code
                                        }
                                    </strong>

                                    <small>
                                        {
                                            selectedRegistration.course_title
                                        }
                                    </small>

                                </div>


                                <div>

                                    <span>
                                        Student Department
                                    </span>

                                    <strong>
                                        {
                                            selectedRegistration.student_department_code ||
                                            '—'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Course Department
                                    </span>

                                    <strong>
                                        {
                                            selectedRegistration.course_department_code ||
                                            '—'
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Academic Session
                                    </span>

                                    <strong>
                                        {
                                            selectedRegistration.session_name
                                        }
                                    </strong>

                                    <small>
                                        {
                                            selectedRegistration.semester
                                        }
                                    </small>

                                </div>


                                <div>

                                    <span>
                                        Registration Type
                                    </span>

                                    <strong>
                                        {
                                            getRegistrationTypeLabel(
                                                selectedRegistration.registration_type
                                            )
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="registration-modal-actions">

                                <button
                                    type="button"
                                    className="registration-cancel-button"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="registration-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedRegistration
                                        )
                                    }
                                >
                                    Edit Registration
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </ExamOfficerLayout>
    );
};


export default RegistrationsPage;