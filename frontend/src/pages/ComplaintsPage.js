import {
    useEffect,
    useMemo,
    useState
} from 'react';

import api from '../services/api';

import ExamOfficerLayout
    from '../layouts/ExamOfficerLayout';

import '../styles/complaints.css';


const ComplaintsPage = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [complaints, setComplaints] =
        useState([]);

    const [summary, setSummary] =
        useState({
            total: 0,
            open: 0,
            under_review: 0,
            resolved: 0,
            rejected: 0
        });


    const [loading, setLoading] =
        useState(true);


    const [detailLoading, setDetailLoading] =
        useState(false);


    const [actionLoading, setActionLoading] =
        useState(false);


    const [selectedComplaint, setSelectedComplaint] =
        useState(null);


    const [error, setError] =
        useState('');


    const [success, setSuccess] =
        useState('');


    const [statusFilter, setStatusFilter] =
        useState('');


    const [categoryFilter, setCategoryFilter] =
        useState('');


    const [searchTerm, setSearchTerm] =
        useState('');


    const [modalOpen, setModalOpen] =
        useState(false);


    const [reviewStatus, setReviewStatus] =
        useState('');


    const [officerResponse, setOfficerResponse] =
        useState('');


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
    // LOAD COMPLAINTS
    // ======================================================

    const loadComplaints = async () => {

        try {

            setLoading(true);

            setError('');


            const params = {};


            if (
                statusFilter
            ) {

                params.status =
                    statusFilter;
            }


            if (
                categoryFilter
            ) {

                params.category =
                    categoryFilter;
            }


            const response =
                await api.get(
                    '/timetable-feedback/submissions',
                    {
                        params
                    }
                );


            const data =
                response.data || {};


            setComplaints(
                Array.isArray(
                    data.submissions
                )
                    ? data.submissions
                    : []
            );


            setSummary(
                data.summary || {
                    total: 0,
                    open: 0,
                    under_review: 0,
                    resolved: 0,
                    rejected: 0
                }
            );


        } catch (error) {

            console.error(
                'Load complaints error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load complaints.'
                )
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // INITIAL / FILTER LOAD
    // ======================================================

    useEffect(() => {

        loadComplaints();

    }, [
        statusFilter,
        categoryFilter
    ]);


    // ======================================================
    // SEARCH
    // ======================================================

    const filteredComplaints =
        useMemo(
            () => {

                const search =
                    searchTerm
                        .trim()
                        .toLowerCase();


                if (!search) {

                    return complaints;
                }


                return complaints.filter(
                    complaint => {

                        const searchable =
                            [
                                complaint.reference,

                                complaint.submitter_name,

                                complaint.department_name,

                                complaint.department_code,

                                complaint.course_code,

                                complaint.course_title,

                                complaint.category,

                                complaint.comment,

                                complaint.session_name,

                                complaint.semester,

                                complaint.status
                            ]
                                .filter(Boolean)
                                .join(' ')
                                .toLowerCase();


                        return searchable.includes(
                            search
                        );
                    }
                );

            },
            [
                complaints,
                searchTerm
            ]
        );


    // ======================================================
    // OPEN COMPLAINT
    // ======================================================

    const openComplaint = async (
        complaint
    ) => {

        try {

            setError('');

            setSuccess('');

            setDetailLoading(true);

            setSelectedComplaint(null);

            setModalOpen(true);


            const response =
                await api.get(
                    `/timetable-feedback/submissions/${complaint.id}`
                );


            const detail =
                response.data?.feedback ||
                response.data;


            setSelectedComplaint(
                detail
            );


            setReviewStatus(
                detail?.status ||
                complaint.status ||
                'open'
            );


            setOfficerResponse(
                detail?.officer_response ||
                ''
            );


        } catch (error) {

            console.error(
                'Load complaint details error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to load complaint details.'
                )
            );


            setModalOpen(false);

        } finally {

            setDetailLoading(false);
        }
    };


    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (
            actionLoading
        ) {

            return;
        }


        setModalOpen(false);

        setSelectedComplaint(null);

        setReviewStatus('');

        setOfficerResponse('');
    };


    // ======================================================
    // UPDATE COMPLAINT
    // ======================================================

    const updateComplaint = async (
        event
    ) => {

        event.preventDefault();


        if (
            !selectedComplaint
        ) {

            return;
        }


        if (
            !reviewStatus
        ) {

            setError(
                'Please select a complaint status.'
            );

            return;
        }


        if (
            (
                reviewStatus === 'resolved' ||
                reviewStatus === 'rejected'
            ) &&
            !officerResponse.trim()
        ) {

            setError(
                'An officer response is required when resolving or rejecting a complaint.'
            );

            return;
        }


        try {

            setActionLoading(true);

            setError('');

            setSuccess('');


            const response =
                await api.patch(
                    `/timetable-feedback/submissions/${selectedComplaint.id}`,
                    {
                        status:
                            reviewStatus,

                        officer_response:
                            officerResponse.trim()
                                || null
                    }
                );


            const updatedComplaint =
                response.data?.feedback ||
                selectedComplaint;


            setSelectedComplaint(
                updatedComplaint
            );


            setSuccess(
                response.data?.message ||
                'Complaint updated successfully.'
            );


            await loadComplaints();


        } catch (error) {

            console.error(
                'Update complaint error:',
                error
            );


            setError(
                getErrorMessage(
                    error,
                    'Unable to update complaint.'
                )
            );

        } finally {

            setActionLoading(false);
        }
    };


    // ======================================================
    // FORMAT STATUS
    // ======================================================

    const formatStatus = (
        value
    ) => {

        return String(
            value || ''
        )
            .replace(
                /_/g,
                ' '
            )
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    };


    // ======================================================
    // FORMAT CATEGORY
    // ======================================================

    const formatCategory = (
        value
    ) => {

        return String(
            value || ''
        )
            .replace(
                /_/g,
                ' '
            )
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    };


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (
        value
    ) => {

        if (!value) {

            return '—';
        }


        const parsed =
            new Date(
                value
            );


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return String(
                value
            );
        }


        return parsed.toLocaleDateString(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        );
    };


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Complaints"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="complaints-header">

                <div>

                    <span className="complaints-label">
                        EXAMINATION FEEDBACK MANAGEMENT
                    </span>


                    <h2>
                        Complaints
                    </h2>


                    <p>
                        Review timetable feedback submitted
                        by class representatives and level
                        coordinators.
                    </p>

                </div>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {
                success &&
                (

                    <div className="complaints-success">

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
                (

                    <div className="complaints-error">

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

            <section className="complaints-summary-grid">

                <div className="complaints-summary-card">

                    <span>
                        Total Complaints
                    </span>

                    <strong>
                        {
                            summary.total ??
                            complaints.length
                        }
                    </strong>

                </div>


                <div className="complaints-summary-card open">

                    <span>
                        Open
                    </span>

                    <strong>
                        {
                            summary.open ??
                            0
                        }
                    </strong>

                </div>


                <div className="complaints-summary-card review">

                    <span>
                        Under Review
                    </span>

                    <strong>
                        {
                            summary.under_review ??
                            0
                        }
                    </strong>

                </div>


                <div className="complaints-summary-card resolved">

                    <span>
                        Resolved
                    </span>

                    <strong>
                        {
                            summary.resolved ??
                            0
                        }
                    </strong>

                </div>


                <div className="complaints-summary-card rejected">

                    <span>
                        Rejected
                    </span>

                    <strong>
                        {
                            summary.rejected ??
                            0
                        }
                    </strong>

                </div>

            </section>


            {/* ==================================================
                COMPLAINT PANEL
                ================================================== */}

            <section className="complaints-panel">

                <div className="complaints-panel-heading">

                    <div>

                        <span className="complaints-label">
                            FEEDBACK SUBMISSIONS
                        </span>


                        <h3>
                            Examination Complaints
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="complaints-refresh-button"
                        onClick={
                            loadComplaints
                        }
                        disabled={
                            loading ||
                            actionLoading
                        }
                    >
                        {
                            loading
                                ? 'Loading...'
                                : 'Refresh'
                        }
                    </button>

                </div>


                {/* ==================================================
                    FILTERS
                    ================================================== */}

                <div className="complaints-filters">

                    <div className="complaints-search">

                        <label>
                            Search
                        </label>


                        <input
                            type="text"
                            value={
                                searchTerm
                            }
                            onChange={
                                event =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                            }
                            placeholder="Search reference, name, course..."
                        />

                    </div>


                    <div>

                        <label>
                            Status
                        </label>


                        <select
                            value={
                                statusFilter
                            }
                            onChange={
                                event =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                            }
                        >

                            <option value="">
                                All Statuses
                            </option>

                            <option value="open">
                                Open
                            </option>

                            <option value="under_review">
                                Under Review
                            </option>

                            <option value="resolved">
                                Resolved
                            </option>

                            <option value="rejected">
                                Rejected
                            </option>

                        </select>

                    </div>


                    <div>

                        <label>
                            Category
                        </label>


                        <select
                            value={
                                categoryFilter
                            }
                            onChange={
                                event =>
                                    setCategoryFilter(
                                        event.target.value
                                    )
                            }
                        >

                            <option value="">
                                All Categories
                            </option>

                            <option value="exam_clash">
                                Exam Clash
                            </option>

                            <option value="exam_date">
                                Exam Date
                            </option>

                            <option value="exam_time">
                                Exam Time
                            </option>

                            <option value="venue">
                                Venue
                            </option>

                            <option value="missing_course">
                                Missing Course
                            </option>

                            <option value="wrong_course">
                                Wrong Course
                            </option>

                            <option value="student_conflict">
                                Student Conflict
                            </option>

                            <option value="other">
                                Other
                            </option>

                        </select>

                    </div>

                </div>


                {/* ==================================================
                    TABLE
                    ================================================== */}

                {
                    loading
                        ? (

                            <div className="complaints-loading">

                                Loading complaints...

                            </div>

                        )
                        : filteredComplaints.length === 0
                            ? (

                                <div className="complaints-empty">

                                    <strong>
                                        No complaints found
                                    </strong>

                                    <span>
                                        There are no complaints matching
                                        the current filters.
                                    </span>

                                </div>

                            )
                            : (

                                <div className="complaints-table-wrapper">

                                    <table className="complaints-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    Reference
                                                </th>

                                                <th>
                                                    Submitter
                                                </th>

                                                <th>
                                                    Department
                                                </th>

                                                <th>
                                                    Level
                                                </th>

                                                <th>
                                                    Course
                                                </th>

                                                <th>
                                                    Category
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Date
                                                </th>

                                                <th>
                                                    Action
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                filteredComplaints.map(
                                                    (
                                                        complaint,
                                                        index
                                                    ) => (

                                                        <tr
                                                            key={
                                                                complaint.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    index + 1
                                                                }
                                                            </td>


                                                            <td>

                                                                <strong className="complaint-reference">

                                                                    {
                                                                        complaint.reference
                                                                    }

                                                                </strong>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        complaint.submitter_name
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        formatStatus(
                                                                            complaint.submitter_role
                                                                        )
                                                                    }
                                                                </small>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        complaint.department_code
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        complaint.department_name
                                                                    }
                                                                </small>

                                                            </td>


                                                            <td>
                                                                {
                                                                    complaint.level
                                                                }
                                                            </td>


                                                            <td>

                                                                {
                                                                    complaint.course_code ||
                                                                    '—'
                                                                }

                                                                {
                                                                    complaint.course_title &&
                                                                    (

                                                                        <small>
                                                                            {
                                                                                complaint.course_title
                                                                            }
                                                                        </small>

                                                                    )
                                                                }

                                                            </td>


                                                            <td>

                                                                {
                                                                    formatCategory(
                                                                        complaint.category
                                                                    )
                                                                }

                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        `complaint-status ${String(
                                                                            complaint.status ||
                                                                            ''
                                                                        ).toLowerCase()}`
                                                                    }
                                                                >

                                                                    {
                                                                        formatStatus(
                                                                            complaint.status
                                                                        )
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        complaint.created_at
                                                                    )
                                                                }
                                                            </td>


                                                            <td>

                                                                <button
                                                                    type="button"
                                                                    className="complaint-view-button"
                                                                    onClick={() =>
                                                                        openComplaint(
                                                                            complaint
                                                                        )
                                                                    }
                                                                >
                                                                    View
                                                                </button>

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
                DETAIL / REVIEW MODAL
                ================================================== */}

            {
                modalOpen &&
                (

                    <div className="complaints-modal-overlay">

                        <div className="complaints-modal">

                            {/* HEADER */}

                            <div className="complaints-modal-header">

                                <div>

                                    <span className="complaints-label">
                                        COMPLAINT DETAILS
                                    </span>


                                    <h3>
                                        {
                                            selectedComplaint?.reference ||
                                            'Complaint'
                                        }
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="complaints-modal-close"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            {
                                detailLoading
                                    ? (

                                        <div className="complaints-loading">

                                            Loading complaint...

                                        </div>

                                    )
                                    : selectedComplaint
                                        ? (

                                            <>

                                                {/* ==================================================
                                                    COMPLAINT INFORMATION
                                                    ================================================== */}

                                                <div className="complaints-detail-grid">

                                                    <div>

                                                        <span>
                                                            Submitter
                                                        </span>

                                                        <strong>
                                                            {
                                                                selectedComplaint.submitter_name
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                formatStatus(
                                                                    selectedComplaint.submitter_role
                                                                )
                                                            }
                                                        </small>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Department
                                                        </span>

                                                        <strong>
                                                            {
                                                                selectedComplaint.department_code
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                selectedComplaint.department_name
                                                            }
                                                        </small>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Level
                                                        </span>

                                                        <strong>
                                                            Level {
                                                                selectedComplaint.level
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Course
                                                        </span>

                                                        <strong>
                                                            {
                                                                selectedComplaint.course_code ||
                                                                'No course selected'
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                selectedComplaint.course_title ||
                                                                ''
                                                            }
                                                        </small>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Category
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatCategory(
                                                                    selectedComplaint.category
                                                                )
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Submitted
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatDate(
                                                                    selectedComplaint.created_at
                                                                )
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>


                                                {/* ==================================================
                                                    ORIGINAL COMPLAINT
                                                    ================================================== */}

                                                <div className="complaints-comment-box">

                                                    <span>
                                                        Feedback / Complaint
                                                    </span>


                                                    <p>
                                                        {
                                                            selectedComplaint.comment
                                                        }
                                                    </p>

                                                </div>


                                                {/* ==================================================
                                                    REVIEW FORM
                                                    ================================================== */}

                                                <form
                                                    className="complaints-review-form"
                                                    onSubmit={
                                                        updateComplaint
                                                    }
                                                >

                                                    <div className="complaints-form-grid">

                                                        <div>

                                                            <label>
                                                                Status
                                                            </label>


                                                            <select
                                                                value={
                                                                    reviewStatus
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        setReviewStatus(
                                                                            event.target.value
                                                                        )
                                                                }
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                            >

                                                                <option value="open">
                                                                    Open
                                                                </option>

                                                                <option value="under_review">
                                                                    Under Review
                                                                </option>

                                                                <option value="resolved">
                                                                    Resolved
                                                                </option>

                                                                <option value="rejected">
                                                                    Rejected
                                                                </option>

                                                            </select>

                                                        </div>

                                                    </div>


                                                    <div>

                                                        <label>
                                                            Officer Response
                                                        </label>


                                                        <textarea
                                                            value={
                                                                officerResponse
                                                            }
                                                            onChange={
                                                                event =>
                                                                    setOfficerResponse(
                                                                        event.target.value
                                                                    )
                                                            }
                                                            placeholder="Enter your response or action taken..."
                                                            rows="6"
                                                            maxLength="5000"
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        />

                                                        <small>
                                                            Required when resolving
                                                            or rejecting a complaint.
                                                        </small>

                                                    </div>


                                                    {
                                                        selectedComplaint.officer_response &&
                                                        (

                                                            <div className="complaints-existing-response">

                                                                <span>
                                                                    Previous Officer Response
                                                                </span>

                                                                <p>
                                                                    {
                                                                        selectedComplaint.officer_response
                                                                    }
                                                                </p>

                                                            </div>

                                                        )
                                                    }


                                                    {
                                                        selectedComplaint.reviewed_by_name &&
                                                        (

                                                            <div className="complaints-review-meta">

                                                                Reviewed by:
                                                                {' '}
                                                                {
                                                                    selectedComplaint.reviewed_by_name
                                                                }


                                                                {
                                                                    selectedComplaint.reviewed_at &&
                                                                    (
                                                                        <>
                                                                            {' '}
                                                                            on
                                                                            {' '}
                                                                            {
                                                                                formatDate(
                                                                                    selectedComplaint.reviewed_at
                                                                                )
                                                                            }
                                                                        </>
                                                                    )
                                                                }

                                                            </div>

                                                        )
                                                    }


                                                    <div className="complaints-modal-actions">

                                                        <button
                                                            type="button"
                                                            className="complaints-cancel-button"
                                                            onClick={
                                                                closeModal
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            Close
                                                        </button>


                                                        <button
                                                            type="submit"
                                                            className="complaints-save-button"
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >

                                                            {
                                                                actionLoading
                                                                    ? 'Saving...'
                                                                    : 'Save Review'
                                                            }

                                                        </button>

                                                    </div>

                                                </form>

                                            </>

                                        )
                                        : (

                                            <div className="complaints-empty">

                                                Complaint details could not
                                                be loaded.

                                            </div>

                                        )
                            }

                        </div>

                    </div>

                )
            }

        </ExamOfficerLayout>
    );
};


export default ComplaintsPage;