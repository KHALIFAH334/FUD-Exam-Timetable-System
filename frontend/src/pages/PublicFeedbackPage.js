import {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    useParams
} from 'react-router-dom';

import api from '../services/api';

import '../styles/publicFeedback.css';


const STANDARD_LEVELS = [
    100,
    200,
    300,
    400,
    500
];


const PublicFeedbackPage = () => {

    const {
        token
    } = useParams();


    // ======================================================
    // STATE
    // ======================================================

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [showDepartmentSuggestions, setShowDepartmentSuggestions] =
        useState(false);


    const [timetable, setTimetable] =
        useState(null);


    const [formOptions, setFormOptions] =
        useState({

            submitter_roles: [],

            categories: [],

            departments: []
        });


    const [formData, setFormData] =
        useState({

            submitter_name: '',

            submitter_role:
                'class_rep',

            department_id: '',

            department_name: '',

            level: '',

            course_id: '',

            category:
                'other',

            comment: ''
        });


    // ======================================================
    // LOAD PUBLIC FEEDBACK FORM
    // ======================================================

    useEffect(() => {

        const loadForm = async () => {

            try {

                setLoading(true);

                setError('');

                const response =
                    await api.get(
                        `/timetable-feedback/form/${token}`
                    );


                const data =
                    response.data || {};


                setTimetable(
                    data.timetable ||
                    null
                );


                setFormOptions({

                    submitter_roles:
                        Array.isArray(
                            data.options?.submitter_roles
                        )
                            ? data.options.submitter_roles
                            : [],

                    categories:
                        Array.isArray(
                            data.options?.categories
                        )
                            ? data.options.categories
                            : [],

                    departments:
                        Array.isArray(
                            data.options?.departments
                        )
                            ? data.options.departments
                            : []
                });


            } catch (error) {

                console.error(
                    'Load feedback form error:',
                    error
                );


                setError(
                    error.response?.data?.message ||
                    error.message ||
                    'Unable to load the feedback form.'
                );

            } finally {

                setLoading(false);
            }
        };


        if (token) {

            loadForm();

        } else {

            setLoading(false);

            setError(
                'Invalid feedback link.'
            );
        }

    }, [token]);


    // ======================================================
    // DEPARTMENT SEARCH RESULTS
    // ======================================================

    const filteredDepartments =
        useMemo(
            () => {

                const search =
                    String(
                        formData.department_name ||
                        ''
                    )
                        .trim()
                        .toLowerCase();


                if (!search) {

                    return formOptions.departments;
                }


                return formOptions.departments.filter(
                    department => {

                        const code =
                            String(
                                department.code ||
                                ''
                            )
                                .toLowerCase();


                        const name =
                            String(
                                department.name ||
                                ''
                            )
                                .toLowerCase();


                        return (
                            code.includes(search) ||
                            name.includes(search)
                        );
                    }
                );

            },
            [
                formOptions.departments,
                formData.department_name
            ]
        );


    // ======================================================
    // SELECTED DEPARTMENT
    // ======================================================

    const selectedDepartment =
        useMemo(
            () => {

                return formOptions.departments.find(
                    department =>
                        Number(
                            department.id
                        ) ===
                        Number(
                            formData.department_id
                        )
                ) || null;

            },
            [
                formOptions.departments,
                formData.department_id
            ]
        );


    // ======================================================
    // AVAILABLE LEVELS
    //
    // Always show the normal university levels.
    // ======================================================

    const availableLevels =
        STANDARD_LEVELS;


    // ======================================================
    // AVAILABLE COURSES
    //
    // Courses are filtered by department + level.
    // ======================================================

    const availableCourses =
        useMemo(
            () => {

                if (
                    !selectedDepartment ||
                    !formData.level
                ) {

                    return [];
                }


                const departmentCourses =
                    Array.isArray(
                        selectedDepartment.courses
                    )
                        ? selectedDepartment.courses
                        : [];


                return departmentCourses.filter(
                    course =>
                        Number(
                            course.level
                        ) ===
                        Number(
                            formData.level
                        )
                );

            },
            [
                selectedDepartment,
                formData.level
            ]
        );


    // ======================================================
    // COURSE REQUIRED
    // ======================================================

    const courseRequiredCategories = [
        'exam_clash',
        'exam_date',
        'exam_time',
        'venue',
        'wrong_course',
        'student_conflict'
    ];


    const courseRequired =
        courseRequiredCategories.includes(
            formData.category
        );


    // ======================================================
    // SELECT DEPARTMENT
    // ======================================================

    const selectDepartment = (
        department
    ) => {

        setFormData(
            previous => ({

                ...previous,

                department_id:
                    String(
                        department.id
                    ),

                department_name:
                    `${department.code} — ${department.name}`,

                level:
                    '',

                course_id:
                    ''
            })
        );


        setShowDepartmentSuggestions(
            false
        );


        setError('');
    };


    // ======================================================
    // DEPARTMENT INPUT
    // ======================================================

    const handleDepartmentChange = (
        event
    ) => {

        const value =
            event.target.value;


        setFormData(
            previous => ({

                ...previous,

                department_name:
                    value,

                department_id:
                    '',

                level:
                    '',

                course_id:
                    ''
            })
        );


        setShowDepartmentSuggestions(
            true
        );


        setError('');
    };


    // ======================================================
    // GENERAL INPUT
    // ======================================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value
        } = event.target;


        setFormData(
            previous => {

                const updated = {

                    ...previous,

                    [name]:
                        value
                };


                if (
                    name === 'level'
                ) {

                    updated.course_id =
                        '';
                }


                if (
                    name === 'category'
                ) {

                    if (
                        !courseRequiredCategories.includes(
                            value
                        )
                    ) {

                        updated.course_id =
                            '';
                    }
                }


                return updated;
            }
        );


        setError('');
    };


    // ======================================================
    // SUBMIT FEEDBACK
    // ======================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        setError('');

        setSuccess('');


        // --------------------------------------------------
        // NAME
        // --------------------------------------------------

        if (
            formData.submitter_name
                .trim()
                .length < 2
        ) {

            setError(
                'Please enter your name.'
            );

            return;
        }


        // --------------------------------------------------
        // DEPARTMENT
        // --------------------------------------------------

        if (
            !formData.department_id
        ) {

            setError(
                'Please select a valid department from the suggestions.'
            );

            return;
        }


        // --------------------------------------------------
        // LEVEL
        // --------------------------------------------------

        if (
            !formData.level
        ) {

            setError(
                'Please select your level.'
            );

            return;
        }


        // --------------------------------------------------
        // COURSE
        // --------------------------------------------------

        if (
            courseRequired &&
            !formData.course_id
        ) {

            setError(
                'Please select the course related to this feedback.'
            );

            return;
        }


        // --------------------------------------------------
        // COMMENT
        // --------------------------------------------------

        if (
            formData.comment
                .trim()
                .length < 5
        ) {

            setError(
                'Feedback must contain at least 5 characters.'
            );

            return;
        }


        try {

            setSubmitting(true);


            const payload = {

                submitter_name:
                    formData.submitter_name.trim(),

                submitter_role:
                    formData.submitter_role,

                department_id:
                    Number(
                        formData.department_id
                    ),

                level:
                    Number(
                        formData.level
                    ),

                course_id:
                    formData.course_id
                        ? Number(
                            formData.course_id
                        )
                        : null,

                category:
                    formData.category,

                comment:
                    formData.comment.trim()
            };


            const response =
                await api.post(
                    `/timetable-feedback/form/${token}`,
                    payload
                );


            const tracking =
                response.data?.tracking ||
                {};


            setSuccess(
                `Feedback submitted successfully. Reference: ${
                    tracking.reference ||
                    response.data?.feedback?.reference ||
                    'Generated'
                }`
            );


            setFormData(
                previous => ({

                    ...previous,

                    submitter_name:
                        '',

                    course_id:
                        '',

                    category:
                        'other',

                    comment:
                        ''
                })
            );


        } catch (error) {

            console.error(
                'Submit feedback error:',
                error
            );


            setError(
                error.response?.data?.message ||
                error.message ||
                'Unable to submit feedback.'
            );

        } finally {

            setSubmitting(false);
        }
    };


    // ======================================================
    // LOADING
    // ======================================================

    if (
        loading
    ) {

        return (

            <div className="public-feedback-page">

                <div className="public-feedback-loading">

                    <strong>
                        Loading Feedback Form
                    </strong>

                    <span>
                        Please wait...
                    </span>

                </div>

            </div>
        );
    }


    // ======================================================
    // INVALID LINK
    // ======================================================

    if (
        error &&
        !timetable
    ) {

        return (

            <div className="public-feedback-page">

                <div className="public-feedback-error-card">

                    <div className="public-feedback-logo-wrapper">

                        <img
                            src="/fud-logo.png"
                            alt="Federal University Dutse"
                            className="public-feedback-logo-image"
                        />

                    </div>


                    <span className="public-feedback-label">
                        EXAMINATION FEEDBACK
                    </span>


                    <h1>
                        Feedback Form Unavailable
                    </h1>


                    <p>
                        {error}
                    </p>

                </div>

            </div>
        );
    }


    // ======================================================
    // PAGE
    // ======================================================

    return (

        <div className="public-feedback-page">

            <div className="public-feedback-container">

                {/* ==================================================
                    HEADER
                    ================================================== */}

                <section className="public-feedback-header">

                    <div className="public-feedback-brand">

                        <div className="public-feedback-logo-wrapper">

                            <img
                                src="/fud-logo.png"
                                alt="Federal University Dutse logo"
                                className="public-feedback-logo-image"
                            />

                        </div>


                        <div>

                            <strong>
                                FEDERAL UNIVERSITY DUTSE
                            </strong>

                            <span>
                                Examination Timetable System
                            </span>

                        </div>

                    </div>


                    <div>

                        <span className="public-feedback-label">
                            EXAMINATION FEEDBACK
                        </span>

                        <h1>
                            Timetable Feedback Form
                        </h1>

                    </div>

                </section>


                {/* ==================================================
                    TIMETABLE
                    ================================================== */}

                <section className="public-feedback-timetable">

                    <span>
                        Examination Timetable
                    </span>


                    <h2>
                        {
                            timetable?.title ||
                            'Examination Timetable'
                        }
                    </h2>


                    <div className="public-feedback-meta">

                        <div>

                            <small>
                                Academic Session
                            </small>

                            <strong>
                                {
                                    timetable?.session_name ||
                                    '—'
                                }
                            </strong>

                        </div>


                        <div>

                            <small>
                                Semester
                            </small>

                            <strong>
                                {
                                    timetable?.semester ||
                                    '—'
                                }
                            </strong>

                        </div>


                        <div>

                            <small>
                                Version
                            </small>

                            <strong>
                                V{
                                    timetable?.version_number ||
                                    '—'
                                }
                            </strong>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    ALERTS
                    ================================================== */}

                {
                    success &&
                    (

                        <div className="public-feedback-success">

                            <strong>
                                Success
                            </strong>

                            <span>
                                {success}
                            </span>

                        </div>

                    )
                }


                {
                    error &&
                    (

                        <div className="public-feedback-error">

                            <strong>
                                Error
                            </strong>

                            <span>
                                {error}
                            </span>

                        </div>

                    )
                }


                {/* ==================================================
                    FORM
                    ================================================== */}

                <form
                    className="public-feedback-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="public-feedback-section-title">

                        <span>
                            FEEDBACK DETAILS
                        </span>


                        <h2>
                            Submit Your Feedback
                        </h2>


                        <p>
                            Use this form to report an issue or
                            provide feedback about the published
                            examination timetable.
                        </p>

                    </div>


                    {/* ==================================================
                        NAME + ROLE
                        ================================================== */}

                    <div className="public-feedback-grid">

                        <div className="public-feedback-field">

                            <label>
                                Your Name
                            </label>


                            <input
                                type="text"
                                name="submitter_name"
                                value={
                                    formData.submitter_name
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter your name"
                                maxLength="120"
                                required
                            />

                        </div>


                        <div className="public-feedback-field">

                            <label>
                                Your Role
                            </label>


                            <select
                                name="submitter_role"
                                value={
                                    formData.submitter_role
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >

                                {
                                    formOptions
                                        .submitter_roles
                                        .map(
                                            role => (

                                                <option
                                                    key={
                                                        role
                                                    }
                                                    value={
                                                        role
                                                    }
                                                >

                                                    {
                                                        role
                                                            .replace(
                                                                /_/g,
                                                                ' '
                                                            )
                                                            .replace(
                                                                /\b\w/g,
                                                                c =>
                                                                    c.toUpperCase()
                                                            )
                                                    }

                                                </option>

                                            )
                                        )
                                }

                            </select>

                        </div>

                    </div>


                    {/* ==================================================
                        DEPARTMENT + LEVEL
                        ================================================== */}

                    <div className="public-feedback-grid">

                        {/* DEPARTMENT */}

                        <div className="public-feedback-field department-search-field">

                            <label>
                                Department
                            </label>


                            <input
                                type="text"
                                value={
                                    formData.department_name
                                }
                                onChange={
                                    handleDepartmentChange
                                }
                                onFocus={() =>
                                    setShowDepartmentSuggestions(
                                        true
                                    )
                                }
                                onBlur={() => {

                                    setTimeout(
                                        () => {

                                            setShowDepartmentSuggestions(
                                                false
                                            );

                                        },
                                        200
                                    );

                                }}
                                placeholder="Type department code or name"
                                autoComplete="off"
                                required
                            />


                            {
                                showDepartmentSuggestions &&
                                filteredDepartments.length > 0 &&
                                (

                                    <div className="department-suggestions">

                                        {
                                            filteredDepartments.map(
                                                department => (

                                                    <button
                                                        key={
                                                            department.id
                                                        }
                                                        type="button"
                                                        className="department-suggestion"
                                                        onMouseDown={
                                                            event =>
                                                                event.preventDefault()
                                                        }
                                                        onClick={() =>
                                                            selectDepartment(
                                                                department
                                                            )
                                                        }
                                                    >

                                                        <strong>
                                                            {
                                                                department.code
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                department.name
                                                            }
                                                        </span>

                                                    </button>

                                                )
                                            )
                                        }

                                    </div>

                                )
                            }


                            {
                                formOptions
                                    .departments
                                    .length === 0 &&
                                (

                                    <small className="department-no-data">
                                        No departments are available
                                        for this feedback link.
                                    </small>

                                )
                            }

                        </div>


                        {/* LEVEL */}

                        <div className="public-feedback-field">

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
                                disabled={
                                    !selectedDepartment
                                }
                                required
                            >

                                <option value="">

                                    {
                                        selectedDepartment
                                            ? 'Select Level'
                                            : 'Select Department First'
                                    }

                                </option>


                                {
                                    availableLevels.map(
                                        level => (

                                            <option
                                                key={
                                                    level
                                                }
                                                value={
                                                    level
                                                }
                                            >
                                                Level {level}
                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>

                    </div>


                    {/* ==================================================
                        CATEGORY + COURSE
                        ================================================== */}

                    <div className="public-feedback-grid">

                        {/* CATEGORY */}

                        <div className="public-feedback-field">

                            <label>
                                Feedback Category
                            </label>


                            <select
                                name="category"
                                value={
                                    formData.category
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >

                                {
                                    formOptions
                                        .categories
                                        .map(
                                            category => (

                                                <option
                                                    key={
                                                        category
                                                    }
                                                    value={
                                                        category
                                                    }
                                                >

                                                    {
                                                        category
                                                            .replace(
                                                                /_/g,
                                                                ' '
                                                            )
                                                            .replace(
                                                                /\b\w/g,
                                                                c =>
                                                                    c.toUpperCase()
                                                            )
                                                    }

                                                </option>

                                            )
                                        )
                                }

                            </select>

                        </div>


                        {/* COURSE */}

                        <div className="public-feedback-field">

                            <label>

                                Course

                                {
                                    courseRequired
                                        ? ' *'
                                        : ' (Optional)'
                                }

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
                                    !selectedDepartment ||
                                    !formData.level
                                }
                                required={
                                    courseRequired
                                }
                            >

                                <option value="">

                                    {
                                        !selectedDepartment
                                            ? 'Select Department First'
                                            : !formData.level
                                                ? 'Select Level First'
                                                : availableCourses.length === 0
                                                    ? 'No courses available for this level'
                                                    : 'Select Course'
                                    }

                                </option>


                                {
                                    availableCourses.map(
                                        course => (

                                            <option
                                                key={
                                                    course.id
                                                }
                                                value={
                                                    course.id
                                                }
                                            >

                                                {
                                                    course.course_code
                                                }

                                                {' — '}

                                                {
                                                    course.course_title
                                                }

                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>

                    </div>


                    {/* ==================================================
                        COMMENT
                        ================================================== */}

                    <div className="public-feedback-field">

                        <label>
                            Feedback / Complaint
                        </label>


                        <textarea
                            name="comment"
                            value={
                                formData.comment
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Describe the issue or feedback clearly..."
                            rows="7"
                            maxLength="5000"
                            required
                        />


                        <small>
                            Minimum 5 characters.
                        </small>

                    </div>


                    {/* ==================================================
                        SUBMIT
                        ================================================== */}

                    <div className="public-feedback-actions">

                        <button
                            type="submit"
                            disabled={
                                submitting
                            }
                        >

                            {
                                submitting
                                    ? 'Submitting...'
                                    : 'Submit Feedback'
                            }

                        </button>

                    </div>

                </form>


                {/* ==================================================
                    FOOTER
                    ================================================== */}

                <footer className="public-feedback-footer">

                    Federal University Dutse Examination Timetable System

                </footer>

            </div>

        </div>
    );
};


export default PublicFeedbackPage;