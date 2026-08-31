import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';
import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/feedbackLinks.css';


const FeedbackLinksPage = () => {

    const [links, setLinks] = useState([]);

    const [timetables, setTimetables] = useState([]);

    const [loading, setLoading] = useState(true);

    const [creating, setCreating] = useState(false);

    const [actionLoading, setActionLoading] = useState(null);

    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');

    const [showCreateForm, setShowCreateForm] = useState(false);

    const [selectedTimetable, setSelectedTimetable] =
        useState('');

    const [expiresInDays, setExpiresInDays] =
        useState('7');


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
    // LOAD FEEDBACK LINKS
    // ======================================================

    const loadLinks = async () => {

        try {

            setLoading(true);

            setError('');

            const response =
                await api.get(
                    '/timetable-feedback/links'
                );

            setLinks(
                response.data?.links ||
                []
            );

        } catch (error) {

            console.error(
                'Load feedback links error:',
                error
            );

            setError(
                getErrorMessage(
                    error,
                    'Unable to load feedback links.'
                )
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // LOAD TIMETABLES
    // ======================================================

    const loadTimetables = async () => {

        try {

            const response =
                await api.get(
                    '/timetables'
                );

            const data =
                response.data?.timetables ||
                response.data ||
                [];


            setTimetables(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            console.error(
                'Load timetables error:',
                error
            );

        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadLinks();

        loadTimetables();

    }, []);


    // ======================================================
    // SUMMARY
    // ======================================================

    const activeCount =
        useMemo(
            () =>
                links.filter(
                    link =>
                        Boolean(
                            link.is_active
                        )
                ).length,
            [links]
        );


    const disabledCount =
        useMemo(
            () =>
                links.filter(
                    link =>
                        !Boolean(
                            link.is_active
                        )
                ).length,
            [links]
        );


    // ======================================================
    // CREATE LINK
    // ======================================================

    const createLink = async (
        event
    ) => {

        event.preventDefault();


        if (!selectedTimetable) {

            setError(
                'Please select a timetable.'
            );

            return;
        }


        const expiry =
            Number(
                expiresInDays
            );


        if (
            !Number.isInteger(expiry) ||
            expiry < 1 ||
            expiry > 30
        ) {

            setError(
                'Expiry must be between 1 and 30 days.'
            );

            return;
        }


        try {

            setCreating(true);

            setError('');

            setSuccess('');


            const response =
                await api.post(
                    '/timetable-feedback/links',
                    {
                        timetable_id:
                            Number(
                                selectedTimetable
                            ),

                        expires_in_days:
                            expiry
                    }
                );


            setSuccess(
                response.data?.message ||
                'Feedback link generated successfully.'
            );


            setSelectedTimetable('');

            setExpiresInDays('7');

            setShowCreateForm(false);


            await loadLinks();

        } catch (error) {

            console.error(
                'Create feedback link error:',
                error
            );

            setError(
                getErrorMessage(
                    error,
                    'Unable to generate feedback link.'
                )
            );

        } finally {

            setCreating(false);
        }
    };


    // ======================================================
    // ENABLE / DISABLE
    // ======================================================

    const updateLinkStatus = async (
        link
    ) => {

        const nextStatus =
            !Boolean(
                link.is_active
            );


        try {

            setActionLoading(
                link.id
            );

            setError('');

            setSuccess('');


            const response =
                await api.patch(
                    `/timetable-feedback/links/${link.id}/status`,
                    {
                        is_active:
                            nextStatus
                    }
                );


            setSuccess(
                response.data?.message ||
                (
                    nextStatus
                        ? 'Feedback link activated successfully.'
                        : 'Feedback link disabled successfully.'
                )
            );


            await loadLinks();

        } catch (error) {

            console.error(
                'Update feedback link error:',
                error
            );

            setError(
                getErrorMessage(
                    error,
                    'Unable to update feedback link.'
                )
            );

        } finally {

            setActionLoading(null);
        }
    };

    // ======================================================
// DELETE FEEDBACK LINK
// ======================================================

const deleteLink = async (
    link
) => {

    const confirmed =
        window.confirm(
            'Are you sure you want to permanently delete this feedback link? Any feedback submitted through this link will also be deleted.'
        );


    if (!confirmed) {
        return;
    }


    try {

        setActionLoading(
            `delete-${link.id}`
        );

        setError('');

        setSuccess('');


        const response =
            await api.delete(
                `/timetable-feedback/links/${link.id}`
            );


        setSuccess(
            response.data?.message ||
            'Feedback link deleted successfully.'
        );


        await loadLinks();

    } catch (error) {

        console.error(
            'Delete feedback link error:',
            error
        );


        setError(
            getErrorMessage(
                error,
                'Unable to delete feedback link.'
            )
        );

    } finally {

        setActionLoading(null);
    }
}; 

    // ======================================================
    // COPY LINK
    // ======================================================

    const copyLink = async (
        url
    ) => {

        try {

            await navigator.clipboard.writeText(
                url
            );

            setSuccess(
                'Feedback link copied to clipboard.'
            );

            setError('');

        } catch (error) {

            console.error(
                'Copy feedback link error:',
                error
            );

            setError(
                'Unable to copy the feedback link.'
            );
        }
    };


    // ======================================================
    // OPEN LINK
    // ======================================================

    const openLink = (
        url
    ) => {

        window.open(
            url,
            '_blank',
            'noopener,noreferrer'
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


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }


        return date.toLocaleDateString(
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
            activePage="Feedback Links"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="feedback-links-header">

                <div>

                    <span className="feedback-links-label">
                        EXAMINATION FEEDBACK MANAGEMENT
                    </span>

                    <h2>
                        Feedback Links
                    </h2>

                    <p>
                        Generate and manage feedback links for
                        published examination timetables.
                    </p>

                </div>


                <button
                    type="button"
                    className="feedback-create-button"
                    onClick={() => {

                        setShowCreateForm(
                            !showCreateForm
                        );

                        setError('');

                        setSuccess('');

                    }}
                >
                    {
                        showCreateForm
                            ? 'Cancel'
                            : '+ Create Feedback Link'
                    }
                </button>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {success && (

                <div className="feedback-success">

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


            {error && (

                <div className="feedback-error">

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

            <section className="feedback-summary-grid">

                <div className="feedback-summary-card">

                    <span>
                        Total Links
                    </span>

                    <strong>
                        {links.length}
                    </strong>

                </div>


                <div className="feedback-summary-card active">

                    <span>
                        Active Links
                    </span>

                    <strong>
                        {activeCount}
                    </strong>

                </div>


                <div className="feedback-summary-card disabled">

                    <span>
                        Disabled Links
                    </span>

                    <strong>
                        {disabledCount}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                CREATE FORM
                ================================================== */}

            {showCreateForm && (

                <section className="feedback-create-panel">

                    <div className="feedback-panel-heading">

                        <div>

                            <span className="feedback-links-label">
                                NEW FEEDBACK LINK
                            </span>

                            <h3>
                                Generate Feedback Link
                            </h3>

                        </div>

                    </div>


                    <form
                        className="feedback-create-form"
                        onSubmit={createLink}
                    >

                        <div className="feedback-form-group">

                            <label>
                                Published Timetable
                            </label>

                            <select
                                value={
                                    selectedTimetable
                                }
                                onChange={event =>
                                    setSelectedTimetable(
                                        event.target.value
                                    )
                                }
                                required
                            >

                                <option value="">
                                    Select timetable
                                </option>

                                {
                                    timetables
                                        .filter(
                                            timetable =>
                                                String(
                                                    timetable.status
                                                ).toLowerCase() ===
                                                'published'
                                        )
                                        .map(
                                            timetable => (

                                                <option
                                                    key={
                                                        timetable.id
                                                    }
                                                    value={
                                                        timetable.id
                                                    }
                                                >

                                                    {
                                                        timetable.title
                                                    }

                                                    {' — V'}

                                                    {
                                                        timetable.version_number
                                                    }

                                                    {' — '}

                                                    {
                                                        timetable.session_name
                                                    }

                                                    {' '}

                                                    {
                                                        timetable.semester
                                                    }

                                                </option>

                                            )
                                        )
                                }

                            </select>

                        </div>


                        <div className="feedback-form-group">

                            <label>
                                Link Expiry
                            </label>

                            <select
                                value={
                                    expiresInDays
                                }
                                onChange={event =>
                                    setExpiresInDays(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="1">
                                    1 day
                                </option>

                                <option value="3">
                                    3 days
                                </option>

                                <option value="7">
                                    7 days
                                </option>

                                <option value="14">
                                    14 days
                                </option>

                                <option value="30">
                                    30 days
                                </option>

                            </select>

                        </div>


                        <button
                            type="submit"
                            className="feedback-submit-button"
                            disabled={
                                creating
                            }
                        >

                            {
                                creating
                                    ? 'Generating...'
                                    : 'Generate Link'
                            }

                        </button>

                    </form>

                </section>

            )}


            {/* ==================================================
                LINKS TABLE
                ================================================== */}

            <section className="feedback-panel">

                <div className="feedback-panel-heading">

                    <div>

                        <span className="feedback-links-label">
                            GENERATED LINKS
                        </span>

                        <h3>
                            Feedback Links
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="feedback-refresh-button"
                        onClick={
                            loadLinks
                        }
                        disabled={
                            loading ||
                            actionLoading !== null
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

                    <div className="feedback-loading">
                        Loading feedback links...
                    </div>

                ) : links.length === 0 ? (

                    <div className="feedback-empty">

                        <strong>
                            No feedback links found
                        </strong>

                        <span>
                            Create a feedback link for a
                            published timetable to get started.
                        </span>

                    </div>

                ) : (

                    <div className="feedback-table-wrapper">

                        <table className="feedback-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Timetable
                                    </th>

                                    <th>
                                        Version
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Expires
                                    </th>

                                    <th>
                                        Feedback Link
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    links.map(
                                        (
                                            link,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    link.id
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
                                                            link.timetable?.title ||
                                                            'Examination Timetable'
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            link.timetable?.session_name ||
                                                            ''
                                                        }

                                                        {' '}

                                                        {
                                                            link.timetable?.semester ||
                                                            ''
                                                        }
                                                    </small>

                                                </td>


                                                <td>

                                                    <span className="feedback-version-badge">

                                                        V{
                                                            link.timetable?.version_number ||
                                                            '—'
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            `feedback-status ${
                                                                link.is_active
                                                                    ? 'active'
                                                                    : 'disabled'
                                                            }`
                                                        }
                                                    >

                                                        {
                                                            link.is_active
                                                                ? 'Active'
                                                                : 'Disabled'
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    {
                                                        formatDate(
                                                            link.expires_at
                                                        )
                                                    }

                                                </td>


                                                <td>

                                                    <div className="feedback-link-cell">

                                                        <input
                                                            type="text"
                                                            value={
                                                                link.url ||
                                                                ''
                                                            }
                                                            readOnly
                                                            onFocus={
                                                                event =>
                                                                    event.target.select()
                                                            }
                                                        />

                                                        <button
                                                            type="button"
                                                            className="feedback-copy-button"
                                                            onClick={() =>
                                                                copyLink(
                                                                    link.url
                                                                )
                                                            }
                                                        >
                                                            Copy
                                                        </button>

                                                    </div>

                                                </td>


                                                <td>

                                                    <div className="feedback-actions">

                                                        <button
                                                            type="button"
                                                            className="feedback-open-button"
                                                            onClick={() =>
                                                                openLink(
                                                                    link.url
                                                                )
                                                            }
                                                        >
                                                            Open
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className={
                                                                link.is_active
                                                                    ? 'feedback-disable-button'
                                                                    : 'feedback-enable-button'
                                                            }
                                                            onClick={() =>
                                                                updateLinkStatus(
                                                                    link
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                link.id
                                                            }
                                                        >

                                                            {
                                                                actionLoading ===
                                                                link.id
                                                                    ? 'Saving...'
                                                                    : link.is_active
                                                                        ? 'Disable'
                                                                        : 'Enable'
                                                            }

                                                        </button>
                                                        <button
    type="button"
    className="feedback-delete-button"
    onClick={() =>
        deleteLink(
            link
        )
    }
    disabled={
        actionLoading ===
        `delete-${link.id}`
    }
>
    {
        actionLoading ===
        `delete-${link.id}`
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

                )}

            </section>

        </ExamOfficerLayout>
    );
};


export default FeedbackLinksPage;