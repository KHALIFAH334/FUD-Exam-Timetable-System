import {
    useEffect,
    useMemo,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/courses.css';


const CoursesPage = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [courses, setCourses] =
        useState([]);

    const [sessions, setSessions] =
        useState([]);

    const [departments, setDepartments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingOptions, setLoadingOptions] =
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

    const [selectedCourse, setSelectedCourse] =
        useState(null);


    const [formData, setFormData] =
        useState({

            session_id: '',

            department_id: '',

            course_code: '',

            course_title: '',

            level: '',

            credit_units: 3,

            regular_students: 0,

            spillover_students: 0,

            carryover_students: 0,

            is_general_studies: false,

            combined_group_id: ''

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
    // LOAD COURSES
    // ======================================================

    const loadCourses = async () => {

        try {

            setLoading(true);

            setError('');


            const response =
                await api.get(
                    '/courses'
                );


            setCourses(
                Array.isArray(
                    response.data?.courses
                )
                    ? response.data.courses
                    : []
            );


        } catch (error) {

            console.error(
                'Load courses error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load courses.'
                )
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD OPTIONS
    // ======================================================

    const loadOptions = async () => {

        try {

            setLoadingOptions(true);


            const [
                sessionsResponse,
                departmentsResponse
            ] = await Promise.all([

                api.get(
                    '/sessions'
                ),

                api.get(
                    '/departments'
                )

            ]);


            setSessions(
                Array.isArray(
                    sessionsResponse.data?.sessions
                )
                    ? sessionsResponse.data.sessions
                    : []
            );


            setDepartments(
                Array.isArray(
                    departmentsResponse.data?.departments
                )
                    ? departmentsResponse.data.departments
                    : []
            );


        } catch (error) {

            console.error(
                'Load course options error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load course options.'
                )
            );

        } finally {

            setLoadingOptions(false);
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadCourses();

        loadOptions();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const activeCourses =
        useMemo(
            () =>
                courses.filter(
                    course =>
                        Boolean(
                            course.is_active
                        )
                ).length,
            [courses]
        );


    const totalStudents =
        useMemo(
            () =>
                courses.reduce(
                    (
                        total,
                        course
                    ) =>
                        total +
                        Number(
                            course.registered_students ||
                            0
                        ),
                    0
                ),
            [courses]
        );


    const departmentCount =
        useMemo(
            () =>
                new Set(
                    courses.map(
                        course =>
                            course.department_id
                    )
                ).size,
            [courses]
        );


    // ======================================================
    // STUDENT TOTAL
    // ======================================================

    const calculatedTotal =
        Number(
            formData.regular_students || 0
        ) +
        Number(
            formData.spillover_students || 0
        ) +
        Number(
            formData.carryover_students || 0
        );


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

            session_id: '',

            department_id: '',

            course_code: '',

            course_title: '',

            level: '',

            credit_units: 3,

            regular_students: 0,

            spillover_students: 0,

            carryover_students: 0,

            is_general_studies: false,

            combined_group_id: ''

        });
    };


    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreate = () => {

        resetForm();

        setSelectedCourse(null);

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
        course
    ) => {

        setSelectedCourse(
            course
        );


        setFormData({

            session_id:
                course.session_id ||
                '',

            department_id:
                course.department_id ||
                '',

            course_code:
                course.course_code ||
                '',

            course_title:
                course.course_title ||
                '',

            level:
                course.level ||
                '',

            credit_units:
                course.credit_units ||
                3,

            regular_students:
                course.regular_students ??
                course.registered_students ??
                0,

            spillover_students:
                course.spillover_students ??
                0,

            carryover_students:
                course.carryover_students ??
                0,

            is_general_studies:
                Boolean(
                    course.is_general_studies
                ),

            combined_group_id:
                course.combined_group_id ||
                ''

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
        course
    ) => {

        setSelectedCourse(
            course
        );

        setError('');

        setSuccess('');

        setModalMode(
            'view'
        );
    };


    // ======================================================
    // CLOSE
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

        setSelectedCourse(
            null
        );

        setError('');
    };


    // ======================================================
    // VALIDATE
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
            !formData.department_id
        ) {

            setError(
                'Please select a department.'
            );

            return false;
        }


        if (
            !formData.course_code.trim()
        ) {

            setError(
                'Course code is required.'
            );

            return false;
        }


        if (
            !formData.course_title.trim()
        ) {

            setError(
                'Course title is required.'
            );

            return false;
        }


        if (
            !formData.level ||
            Number(
                formData.level
            ) <= 0
        ) {

            setError(
                'Please enter a valid level.'
            );

            return false;
        }


        if (
            calculatedTotal <
            0
        ) {

            setError(
                'Student total cannot be negative.'
            );

            return false;
        }


        return true;
    };


    // ======================================================
    // CREATE
    // ======================================================

    const createCourse = async (
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
                    '/courses',
                    {

                        session_id:
                            Number(
                                formData.session_id
                            ),

                        department_id:
                            Number(
                                formData.department_id
                            ),

                        course_code:
                            formData
                                .course_code
                                .trim(),

                        course_title:
                            formData
                                .course_title
                                .trim(),

                        level:
                            Number(
                                formData.level
                            ),

                        credit_units:
                            Number(
                                formData.credit_units
                            ),

                        regular_students:
                            Number(
                                formData.regular_students ||
                                0
                            ),

                        spillover_students:
                            Number(
                                formData.spillover_students ||
                                0
                            ),

                        carryover_students:
                            Number(
                                formData.carryover_students ||
                                0
                            ),

                        is_general_studies:
                            Boolean(
                                formData.is_general_studies
                            ),

                        combined_group_id:
                            formData.combined_group_id
                                ? Number(
                                    formData.combined_group_id
                                )
                                : null

                    }
                );


            setSuccess(
                response.data?.message ||
                'Course created successfully.'
            );


            setModalMode(
                null
            );


            await loadCourses();


        } catch (error) {

            console.error(
                'Create course error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to create course.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // UPDATE
    // ======================================================

    const updateCourse = async (
        event
    ) => {

        event.preventDefault();


        if (
            !selectedCourse?.id
        ) {

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
                    `/courses/${selectedCourse.id}`,
                    {

                        session_id:
                            Number(
                                formData.session_id
                            ),

                        department_id:
                            Number(
                                formData.department_id
                            ),

                        course_code:
                            formData
                                .course_code
                                .trim(),

                        course_title:
                            formData
                                .course_title
                                .trim(),

                        level:
                            Number(
                                formData.level
                            ),

                        credit_units:
                            Number(
                                formData.credit_units
                            ),

                        regular_students:
                            Number(
                                formData.regular_students ||
                                0
                            ),

                        spillover_students:
                            Number(
                                formData.spillover_students ||
                                0
                            ),

                        carryover_students:
                            Number(
                                formData.carryover_students ||
                                0
                            ),

                        is_general_studies:
                            Boolean(
                                formData.is_general_studies
                            ),

                        combined_group_id:
                            formData.combined_group_id
                                ? Number(
                                    formData.combined_group_id
                                )
                                : null

                    }
                );


            setSuccess(
                response.data?.message ||
                'Course updated successfully.'
            );


            setModalMode(
                null
            );


            await loadCourses();


        } catch (error) {

            console.error(
                'Update course error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update course.'
                )
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // TOGGLE STATUS
    // ======================================================

    const toggleStatus = async (
        course
    ) => {

        try {

            setError('');

            setSuccess('');


            const nextStatus =
                !Boolean(
                    course.is_active
                );


            const response =
                await api.patch(
                    `/courses/${course.id}/status`,
                    {
                        is_active:
                            nextStatus
                    }
                );


            setSuccess(
                response.data?.message ||
                'Course status updated successfully.'
            );


            await loadCourses();


        } catch (error) {

            console.error(
                'Course status error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update course status.'
                )
            );
        }
    };


    // ======================================================
    // DELETE
    // ======================================================

    const deleteCourse = async (
        course
    ) => {

        const confirmed =
            window.confirm(
                `Delete ${course.course_code} — ${course.course_title}?\n\nThis cannot be undone. A course already used in registrations or timetables cannot be deleted.`
            );


        if (
            !confirmed
        ) {

            return;
        }


        try {

            setDeleting(
                course.id
            );

            setError('');

            setSuccess('');


            const response =
                await api.delete(
                    `/courses/${course.id}`
                );


            setSuccess(
                response.data?.message ||
                'Course deleted successfully.'
            );


            if (
                selectedCourse?.id ===
                course.id
            ) {

                setModalMode(
                    null
                );

                setSelectedCourse(
                    null
                );
            }


            await loadCourses();


        } catch (error) {

            console.error(
                'Delete course error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to delete course.'
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
            activePage="Courses"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="courses-header">

                <div>

                    <span className="courses-label">
                        COURSE MANAGEMENT
                    </span>

                    <h2>
                        Courses
                    </h2>

                    <p>
                        Manage examination courses and
                        registered student categories for
                        timetable generation.
                    </p>

                </div>


                <button
                    type="button"
                    className="course-create-button"
                    onClick={
                        openCreate
                    }
                >
                    + Create Course
                </button>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {
                success &&
                (

                    <div className="course-success">

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

                    <div className="course-error">

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

            <section className="course-summary-grid">

                <div className="course-summary-card">

                    <span>
                        Total Courses
                    </span>

                    <strong>
                        {courses.length}
                    </strong>

                </div>


                <div className="course-summary-card">

                    <span>
                        Active Courses
                    </span>

                    <strong>
                        {activeCourses}
                    </strong>

                </div>


                <div className="course-summary-card">

                    <span>
                        Registered Students
                    </span>

                    <strong>
                        {totalStudents}
                    </strong>

                </div>


                <div className="course-summary-card">

                    <span>
                        Departments Covered
                    </span>

                    <strong>
                        {departmentCount}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                COURSE TABLE
                ================================================== */}

            <section className="courses-panel">

                <div className="courses-panel-heading">

                    <div>

                        <span className="courses-label">
                            COURSE RECORDS
                        </span>

                        <h3>
                            Course List
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="course-refresh-button"
                        onClick={
                            loadCourses
                        }
                        disabled={
                            loading ||
                            loadingOptions ||
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

                            <div className="courses-loading">
                                Loading courses...
                            </div>

                        )

                        : courses.length === 0

                            ? (

                                <div className="courses-empty">

                                    <strong>
                                        No courses found
                                    </strong>

                                    <span>
                                        Create a course to begin
                                        configuring examination
                                        records.
                                    </span>

                                </div>

                            )

                            : (

                                <div className="courses-table-wrapper">

                                    <table className="courses-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
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
                                                    Level
                                                </th>

                                                <th>
                                                    Student Breakdown
                                                </th>

                                                <th>
                                                    Total
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
                                                courses.map(
                                                    (
                                                        course,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                course.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    index + 1
                                                                }
                                                            </td>


                                                            <td>

                                                                <strong
                                                                    className="course-name"
                                                                >
                                                                    {
                                                                        course.course_code
                                                                    }
                                                                </strong>

                                                                <span
                                                                    className="course-title"
                                                                >
                                                                    {
                                                                        course.course_title
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        course.department_name ||
                                                                        '—'
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        course.department_code ||
                                                                        ''
                                                                    }
                                                                </small>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        course.session_name ||
                                                                        '—'
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        course.semester ||
                                                                        ''
                                                                    }
                                                                </small>

                                                            </td>


                                                            <td>
                                                                {
                                                                    course.level
                                                                }
                                                            </td>


                                                            <td>

                                                                <small>
                                                                    Regular:
                                                                    {' '}
                                                                    {
                                                                        course.regular_students ??
                                                                        course.registered_students ??
                                                                        0
                                                                    }
                                                                </small>

                                                                <small>
                                                                    Spill-over:
                                                                    {' '}
                                                                    {
                                                                        course.spillover_students ??
                                                                        0
                                                                    }
                                                                </small>

                                                                <small>
                                                                    Carry-over:
                                                                    {' '}
                                                                    {
                                                                        course.carryover_students ??
                                                                        0
                                                                    }
                                                                </small>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        course.registered_students ??
                                                                        0
                                                                    }
                                                                </strong>

                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        Boolean(
                                                                            course.is_active
                                                                        )
                                                                            ? 'course-status active'
                                                                            : 'course-status inactive'
                                                                    }
                                                                >

                                                                    {
                                                                        Boolean(
                                                                            course.is_active
                                                                        )
                                                                            ? 'Active'
                                                                            : 'Inactive'
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <div className="course-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="course-view-button"
                                                                        onClick={() =>
                                                                            openView(
                                                                                course
                                                                            )
                                                                        }
                                                                    >
                                                                        View
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="course-edit-button"
                                                                        onClick={() =>
                                                                            openEdit(
                                                                                course
                                                                            )
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            Boolean(
                                                                                course.is_active
                                                                            )
                                                                                ? 'course-disable-button'
                                                                                : 'course-enable-button'
                                                                        }
                                                                        onClick={() =>
                                                                            toggleStatus(
                                                                                course
                                                                            )
                                                                        }
                                                                    >

                                                                        {
                                                                            Boolean(
                                                                                course.is_active
                                                                            )
                                                                                ? 'Disable'
                                                                                : 'Activate'
                                                                        }

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="course-delete-button"
                                                                        onClick={() =>
                                                                            deleteCourse(
                                                                                course
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleting !== null
                                                                        }
                                                                    >

                                                                        {
                                                                            deleting ===
                                                                            course.id
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

                    <div className="course-modal-overlay">

                        <div className="course-modal">

                            <div className="course-modal-header">

                                <div>

                                    <span className="courses-label">

                                        {
                                            modalMode === 'create'
                                                ? 'NEW COURSE RECORD'
                                                : 'UPDATE COURSE RECORD'
                                        }

                                    </span>


                                    <h3>

                                        {
                                            modalMode === 'create'
                                                ? 'Create Course'
                                                : 'Edit Course'
                                        }

                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="course-modal-close"
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

                                    <div className="course-modal-error">
                                        {error}
                                    </div>

                                )
                            }


                            <form
                                onSubmit={
                                    modalMode === 'create'
                                        ? createCourse
                                        : updateCourse
                                }
                            >

                                <div className="course-form-grid">

                                    {/* SESSION */}

                                    <div className="course-form-group">

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
                                                loadingOptions ||
                                                saving
                                            }
                                            required
                                        >

                                            <option value="">
                                                {
                                                    loadingOptions
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


                                    {/* DEPARTMENT */}

                                    <div className="course-form-group">

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
                                                loadingOptions ||
                                                saving
                                            }
                                            required
                                        >

                                            <option value="">
                                                {
                                                    loadingOptions
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


                                    {/* COURSE CODE */}

                                    <div className="course-form-group">

                                        <label>
                                            Course Code
                                        </label>

                                        <input
                                            type="text"
                                            name="course_code"
                                            value={
                                                formData.course_code
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Example: CSE 401"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* LEVEL */}

                                    <div className="course-form-group">

                                        <label>
                                            Level
                                        </label>

                                        <select
                                            name="level"
                                            value={
                                                formData.level
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                        >

                                            <option value="">
                                                Select Level
                                            </option>

                                            <option value="100">
                                                Level 100
                                            </option>

                                            <option value="200">
                                                Level 200
                                            </option>

                                            <option value="300">
                                                Level 300
                                            </option>

                                            <option value="400">
                                                Level 400
                                            </option>

                                            <option value="500">
                                                Level 500
                                            </option>

                                        </select>

                                    </div>


                                    {/* COURSE TITLE */}

                                    <div className="course-form-group course-form-wide">

                                        <label>
                                            Course Title
                                        </label>

                                        <input
                                            type="text"
                                            name="course_title"
                                            value={
                                                formData.course_title
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Example: Advanced Software Engineering"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* CREDIT UNITS */}

                                    <div className="course-form-group">

                                        <label>
                                            Credit Units
                                        </label>

                                        <input
                                            type="number"
                                            name="credit_units"
                                            value={
                                                formData.credit_units
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


                                    {/* REGULAR */}

                                    <div className="course-form-group">

                                        <label>
                                            Regular Students
                                        </label>

                                        <input
                                            type="number"
                                            name="regular_students"
                                            value={
                                                formData.regular_students
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="0"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* SPILL OVER */}

                                    <div className="course-form-group">

                                        <label>
                                            Spill-over Students
                                        </label>

                                        <input
                                            type="number"
                                            name="spillover_students"
                                            value={
                                                formData.spillover_students
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="0"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* CARRY OVER */}

                                    <div className="course-form-group">

                                        <label>
                                            Carry-over Students
                                        </label>

                                        <input
                                            type="number"
                                            name="carryover_students"
                                            value={
                                                formData.carryover_students
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="0"
                                            required
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* TOTAL */}

                                    <div className="course-total-students">

                                        <span>
                                            Total Students
                                        </span>

                                        <strong>
                                            {
                                                calculatedTotal
                                            }
                                        </strong>

                                        <small>
                                            Regular + Spill-over + Carry-over
                                        </small>

                                    </div>


                                    {/* COMBINED GROUP */}

                                    <div className="course-form-group">

                                        <label>
                                            Combined Group ID
                                        </label>

                                        <input
                                            type="number"
                                            name="combined_group_id"
                                            value={
                                                formData.combined_group_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            min="1"
                                            placeholder="Optional"
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>

                                </div>


                                {/* GENERAL STUDIES */}

                                <label className="course-checkbox">

                                    <input
                                        type="checkbox"
                                        name="is_general_studies"
                                        checked={
                                            formData.is_general_studies
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                    <span>
                                        Mark as General Studies course
                                    </span>

                                </label>


                                <div className="course-modal-actions">

                                    <button
                                        type="button"
                                        className="course-cancel-button"
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
                                        className="course-save-button"
                                        disabled={
                                            saving ||
                                            loadingOptions
                                        }
                                    >

                                        {
                                            saving
                                                ? 'Saving...'
                                                : modalMode === 'create'
                                                    ? 'Create Course'
                                                    : 'Update Course'
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
                selectedCourse &&
                (

                    <div className="course-modal-overlay">

                        <div className="course-modal">

                            <div className="course-modal-header">

                                <div>

                                    <span className="courses-label">
                                        COURSE INFORMATION
                                    </span>

                                    <h3>
                                        Course Details
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="course-modal-close"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div className="course-detail-grid">

                                <div>

                                    <span>
                                        Course Code
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.course_code
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Course Title
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.course_title
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Department
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.department_name ||
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
                                            selectedCourse.session_name ||
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
                                            selectedCourse.semester ||
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
                                            selectedCourse.level
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Credit Units
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.credit_units
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Regular Students
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.regular_students ??
                                            selectedCourse.registered_students ??
                                            0
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Spill-over Students
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.spillover_students ??
                                            0
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Carry-over Students
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.carryover_students ??
                                            0
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Total Students
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.registered_students ??
                                            0
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        General Studies
                                    </span>

                                    <strong>
                                        {
                                            selectedCourse.is_general_studies
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
                                            selectedCourse.is_active
                                                ? 'Active'
                                                : 'Inactive'
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="course-modal-actions">

                                <button
                                    type="button"
                                    className="course-cancel-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="course-save-button"
                                    onClick={() =>
                                        openEdit(
                                            selectedCourse
                                        )
                                    }
                                >
                                    Edit Course
                                </button>


                                <button
                                    type="button"
                                    className="course-delete-button"
                                    onClick={() =>
                                        deleteCourse(
                                            selectedCourse
                                        )
                                    }
                                    disabled={
                                        deleting !== null
                                    }
                                >

                                    {
                                        deleting ===
                                        selectedCourse.id
                                            ? 'Deleting...'
                                            : 'Delete Course'
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


export default CoursesPage;