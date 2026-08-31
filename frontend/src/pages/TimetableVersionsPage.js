import { useEffect, useMemo, useState } from 'react';

import api from '../services/api';
import ExamOfficerLayout from '../layouts/ExamOfficerLayout';

import '../styles/timetableVersions.css';


const TimetableVersionsPage = () => {

    const [timetables, setTimetables] = useState([]);

    const [selectedTimetable, setSelectedTimetable] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [detailLoading, setDetailLoading] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [downloadLoading, setDownloadLoading] =
        useState(null);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('');

    const [deleteLoading, setDeleteLoading] =
    useState(null);

const [editForm, setEditForm] =
    useState({
        title: '',
        notes: ''
    });
    
        
    const [modalMode, setModalMode] =
        useState(null);


    // ======================================================
    // LOAD TIMETABLES
    // ======================================================

    const loadTimetables = async () => {

        try {

            setLoading(true);
            setError('');

            const params = {};

            if (statusFilter) {
                params.status = statusFilter;
            }


            const response =
                await api.get(
                    '/timetables',
                    {
                        params
                    }
                );


            setTimetables(
                response.data?.timetables ||
                response.data ||
                []
            );

        } catch (error) {

            console.error(
                'Load timetables error:',
                error
            );

            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Unable to load timetable versions.'
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadTimetables();

    }, [statusFilter]);


    // ======================================================
    // SUMMARY
    // ======================================================

    const draftCount = useMemo(
        () =>
            timetables.filter(
                item =>
                    String(item.status).toLowerCase() ===
                    'draft'
            ).length,
        [timetables]
    );


    const publishedCount = useMemo(
        () =>
            timetables.filter(
                item =>
                    String(item.status).toLowerCase() ===
                    'published'
            ).length,
        [timetables]
    );


    const archivedCount = useMemo(
        () =>
            timetables.filter(
                item =>
                    String(item.status).toLowerCase() ===
                    'archived'
            ).length,
        [timetables]
    );


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (value) => {

        if (!value) {
            return '—';
        }


        const parsed =
            new Date(value);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return String(value);
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
// OPEN EDIT
// ======================================================

const openEdit = (
    timetable
) => {

    setEditForm({

        title:
            timetable.title ||
            '',

        notes:
            timetable.notes ||
            ''

    });


    setSelectedTimetable(
        timetable
    );

    setError('');

    setSuccess('');

    setModalMode(
        'edit'
    );
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
        previous => ({

            ...previous,

            [name]:
                value

        })
    );


    setError('');
};


// ======================================================
// UPDATE TIMETABLE
// ======================================================

const saveEdit = async (
    event
) => {

    event.preventDefault();


    if (
        !selectedTimetable?.id
    ) {

        setError(
            'No timetable was selected.'
        );

        return;
    }


    if (
        !editForm.title.trim()
    ) {

        setError(
            'Timetable title is required.'
        );

        return;
    }


    try {

        setActionLoading(true);

        setError('');

        setSuccess('');


        const response =
            await api.put(
                `/timetables/${selectedTimetable.id}`,
                {

                    title:
                        editForm.title.trim(),

                    notes:
                        editForm.notes.trim()

                }
            );


        setSuccess(
            response.data?.message ||
            'Timetable updated successfully.'
        );


        setModalMode(
            null
        );


        setSelectedTimetable(
            null
        );


        await loadTimetables();


    } catch (error) {

        console.error(
            'Update timetable error:',
            error
        );


        setError(
            getErrorMessage(
                error,
                'Unable to update timetable.'
            )
        );

    } finally {

        setActionLoading(false);
    }
};


// ======================================================
// DELETE TIMETABLE
// ======================================================

const deleteVersion = async (
    timetable
) => {

    if (
        !timetable?.id
    ) {

        return;
    }


    const status =
        String(
            timetable.status ||
            ''
        ).toLowerCase();


    if (
        status === 'published'
    ) {

        setError(
            'Published timetable cannot be deleted. Archive it first.'
        );

        return;
    }


    const confirmed =
        window.confirm(
            `Delete timetable "${timetable.title}" — V${timetable.version_number}?\n\nThis action cannot be undone.`
        );


    if (
        !confirmed
    ) {

        return;
    }


    try {

        setDeleteLoading(
            timetable.id
        );

        setError('');

        setSuccess('');


        const response =
            await api.delete(
                `/timetables/${timetable.id}`
            );


        setSuccess(
            response.data?.message ||
            'Timetable deleted successfully.'
        );


        if (
            selectedTimetable?.id ===
            timetable.id
        ) {

            setSelectedTimetable(
                null
            );

            setModalMode(
                null
            );
        }


        await loadTimetables();


    } catch (error) {

        console.error(
            'Delete timetable error:',
            error
        );


        setError(
            getErrorMessage(
                error,
                'Unable to delete timetable.'
            )
        );

    } finally {

        setDeleteLoading(
            null
        );
    }
};

    // ======================================================
    // OPEN TIMETABLE
    // ======================================================

    const openTimetable = async (
        timetable
    ) => {

        try {

            setError('');
            setSuccess('');

            setDetailLoading(true);

            setSelectedTimetable(null);

            setModalMode('view');


            const response =
                await api.get(
                    `/timetables/${timetable.id}`
                );


            setSelectedTimetable(
                response.data?.timetable
                    ? response.data
                    : response.data
            );

        } catch (error) {

            console.error(
                'Load timetable details error:',
                error
            );

            setError(
                getErrorMessage(
                    error,
                    'Unable to load timetable details.'
                )
            );

            setModalMode(null);

        } finally {

            setDetailLoading(false);
        }
    };


    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (downloadLoading) {
            return;
        }

        setModalMode(null);

        setSelectedTimetable(null);
    };


    // ======================================================
    // PUBLISH
    // ======================================================

    const publishTimetable = async (
        timetable
    ) => {

        const confirmed =
            window.confirm(
                `Publish Version ${timetable.version_number} for ${timetable.session_name} — ${timetable.semester}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setError('');
            setSuccess('');

            setActionLoading(true);


            const response =
                await api.patch(
                    `/timetables/${timetable.id}/publish`
                );


            setSuccess(
                response.data?.message ||
                'Timetable published successfully.'
            );


            await loadTimetables();

        } catch (error) {

            console.error(
                'Publish timetable error:',
                error
            );

            setError(
                getErrorMessage(
                    error,
                    'Unable to publish timetable.'
                )
            );

        } finally {

            setActionLoading(false);
        }
    };


    // ======================================================
    // ARCHIVE
    // ======================================================

    const archiveTimetable = async (
        timetable
    ) => {

        const confirmed =
            window.confirm(
                `Archive Version ${timetable.version_number} for ${timetable.session_name} — ${timetable.semester}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setError('');
            setSuccess('');

            setActionLoading(true);


            const response =
                await api.patch(
                    `/timetables/${timetable.id}/archive`
                );


            setSuccess(
                response.data?.message ||
                'Timetable archived successfully.'
            );


            await loadTimetables();

        } catch (error) {

            console.error(
                'Archive timetable error:',
                error
            );

            setError(
                getErrorMessage(
                    error,
                    'Unable to archive timetable.'
                )
            );

        } finally {

            setActionLoading(false);
        }
    };


    // ======================================================
    // DOWNLOAD FILE
    // ======================================================

    const downloadVersion = async (
        timetable,
        format
    ) => {

        const downloadKey =
            `${timetable.id}-${format}`;

        try {

            setError('');
            setSuccess('');

            setDownloadLoading(
                downloadKey
            );


            const response =
                await api.get(
                    `/timetables/${timetable.id}/download/${format}`,
                    {
                        responseType:
                            'blob'
                    }
                );


            const blob =
                response.data;


            const objectUrl =
                window.URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    'a'
                );


            link.href =
                objectUrl;


            const baseName =
                String(
                    timetable.title ||
                    'Examination_Timetable'
                )
                    .replace(
                        /[^a-z0-9]+/gi,
                        '_'
                    )
                    .replace(
                        /^_+|_+$/g,
                        ''
                    );


            link.download =
                `${baseName}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            window.URL.revokeObjectURL(
                objectUrl
            );


            setSuccess(
                `${format === 'pdf' ? 'PDF' : 'Excel'} timetable downloaded successfully.`
            );

        } catch (error) {

            console.error(
                'Download timetable error:',
                error
            );


            /*
             * Blob responses can contain JSON errors,
             * so try to decode them before displaying
             * the fallback message.
             */

            let message =
                'Unable to download timetable.';


            if (
                error.response?.data instanceof Blob
            ) {

                try {

                    const text =
                        await error.response.data.text();


                    const parsed =
                        JSON.parse(text);


                    message =
                        parsed.message ||
                        message;

                } catch {
                    // Keep fallback message.
                }

            } else {

                message =
                    getErrorMessage(
                        error,
                        message
                    );
            }


            setError(message);

        } finally {

            setDownloadLoading(null);
        }
    };


    // ======================================================
    // DATA FROM DETAIL RESPONSE
    // ======================================================

    const detailTimetable =
        selectedTimetable?.timetable ||
        null;


    const detailEntries =
        Array.isArray(
            selectedTimetable?.entries
        )
            ? selectedTimetable.entries
            : [];


    const detailStatistics =
        selectedTimetable?.statistics ||
        {};


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <ExamOfficerLayout
            activePage="Timetable Versions"
        >

            {/* ==================================================
                HEADER
                ================================================== */}

            <section className="timetable-versions-header">

                <div>

                    <span className="timetable-versions-label">
                        EXAMINATION SCHEDULE MANAGEMENT
                    </span>

                    <h2>
                        Timetable Versions
                    </h2>

                    <p>
                        Review generated timetable versions,
                        publish the approved version, download
                        schedules and archive previous versions.
                    </p>

                </div>

            </section>


            {/* ==================================================
                ALERTS
                ================================================== */}

            {success && (

                <div className="timetable-success">

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

                <div className="timetable-error">

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

            <section className="timetable-summary-grid">

                <div className="timetable-summary-card">

                    <span>
                        Total Versions
                    </span>

                    <strong>
                        {timetables.length}
                    </strong>

                </div>


                <div className="timetable-summary-card">

                    <span>
                        Draft Versions
                    </span>

                    <strong>
                        {draftCount}
                    </strong>

                </div>


                <div className="timetable-summary-card">

                    <span>
                        Published Versions
                    </span>

                    <strong>
                        {publishedCount}
                    </strong>

                </div>


                <div className="timetable-summary-card">

                    <span>
                        Archived Versions
                    </span>

                    <strong>
                        {archivedCount}
                    </strong>

                </div>

            </section>


            {/* ==================================================
                TABLE
                ================================================== */}

            <section className="timetable-panel">

                <div className="timetable-panel-heading">

                    <div>

                        <span className="timetable-versions-label">
                            TIMETABLE VERSION HISTORY
                        </span>

                        <h3>
                            Examination Timetables
                        </h3>

                    </div>


                    <div className="timetable-controls">

                        <select
                            value={statusFilter}
                            onChange={event =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All Statuses
                            </option>

                            <option value="draft">
                                Draft
                            </option>

                            <option value="published">
                                Published
                            </option>

                            <option value="archived">
                                Archived
                            </option>

                        </select>


                        <button
                            type="button"
                            className="timetable-refresh-button"
                            onClick={
                                loadTimetables
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

                </div>


                {loading ? (

                    <div className="timetable-loading">
                        Loading timetable versions...
                    </div>

                ) : timetables.length === 0 ? (

                    <div className="timetable-empty">

                        <strong>
                            No timetable versions found
                        </strong>

                        <span>
                            Generate and save a timetable draft
                            to create the first version.
                        </span>

                    </div>

                ) : (

                    <div className="timetable-table-wrapper">

                        <table className="timetable-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Session
                                    </th>

                                    <th>
                                        Title
                                    </th>

                                    <th>
                                        Version
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Notes
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    timetables.map(
                                        (
                                            timetable,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    timetable.id
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            timetable.session_name
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            timetable.semester
                                                        }
                                                    </small>

                                                </td>


                                                <td>

                                                    <strong className="timetable-title">

                                                        {
                                                            timetable.title
                                                        }

                                                    </strong>

                                                </td>


                                                <td>

                                                    <span className="version-badge">

                                                        V{
                                                            timetable.version_number
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            `timetable-status ${String(timetable.status || '').toLowerCase()}`
                                                        }
                                                    >
                                                        {
                                                            timetable.status
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="timetable-notes">

                                                        {
                                                            timetable.notes ||
                                                            'No notes'
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <div className="timetable-actions">

                                                        {/* VIEW */}

                                                        <button
                                                            type="button"
                                                            className="timetable-view-button"
                                                            onClick={() =>
                                                                openTimetable(
                                                                    timetable
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

<button
    type="button"
    className="timetable-edit-button"
    onClick={() =>
        openEdit(timetable)
    }
    disabled={
        actionLoading ||
        downloadLoading !== null ||
        deleteLoading !== null ||
        String(
            timetable.status
        ).toLowerCase() ===
        'published'
    }
>
    Edit
</button>

<button
    type="button"
    className="timetable-delete-button"
    onClick={() =>
        deleteVersion(
            timetable
        )
    }
    disabled={
        actionLoading ||
        downloadLoading !== null ||
        deleteLoading !== null ||
        String(
            timetable.status
        ).toLowerCase() ===
        'published'
    }
>
    {
        deleteLoading ===
        timetable.id
            ? 'Deleting...'
            : 'Delete'
    }
</button>
                                                        {/* PUBLISH */}

                                                        {
                                                            String(
                                                                timetable.status
                                                            ).toLowerCase() ===
                                                            'draft' &&
                                                            (

                                                                <button
                                                                    type="button"
                                                                    className="timetable-publish-button"
                                                                    onClick={() =>
                                                                        publishTimetable(
                                                                            timetable
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading ||
                                                                        downloadLoading !== null
                                                                    }
                                                                >
                                                                    Publish
                                                                </button>

                                                            )
                                                        }


                                                        {/* ARCHIVE */}

                                                        {
                                                            String(
                                                                timetable.status
                                                            ).toLowerCase() !==
                                                            'archived' &&
                                                            (

                                                                <button
                                                                    type="button"
                                                                    className="timetable-archive-button"
                                                                    onClick={() =>
                                                                        archiveTimetable(
                                                                            timetable
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading ||
                                                                        downloadLoading !== null
                                                                    }
                                                                >
                                                                    Archive
                                                                </button>

                                                            )
                                                        }


                                                        {/* EXCEL */}

                                                        <button
                                                            type="button"
                                                            className="timetable-download-excel"
                                                            onClick={() =>
                                                                downloadVersion(
                                                                    timetable,
                                                                    'excel'
                                                                )
                                                            }
                                                            disabled={
                                                                downloadLoading !== null ||
                                                                actionLoading
                                                            }
                                                        >

                                                            {
                                                                downloadLoading ===
                                                                `${timetable.id}-excel`
                                                                    ? 'Downloading...'
                                                                    : 'Excel'
                                                            }

                                                        </button>


                                                        {/* PDF */}

                                                        <button
                                                            type="button"
                                                            className="timetable-download-pdf"
                                                            onClick={() =>
                                                                downloadVersion(
                                                                    timetable,
                                                                    'pdf'
                                                                )
                                                            }
                                                            disabled={
                                                                downloadLoading !== null ||
                                                                actionLoading
                                                            }
                                                        >

                                                            {
                                                                downloadLoading ===
                                                                `${timetable.id}-pdf`
                                                                    ? 'Downloading...'
                                                                    : 'PDF'
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

            {
    modalMode === 'edit' &&
    selectedTimetable &&
    (

        <div className="timetable-modal-overlay">

            <div className="timetable-modal">

                <div className="timetable-modal-header">

                    <div>

                        <span className="timetable-versions-label">
                            EDIT TIMETABLE VERSION
                        </span>

                        <h3>
                            Edit Timetable
                        </h3>

                    </div>


                    <button
                        type="button"
                        className="timetable-modal-close"
                        onClick={() =>
                            setModalMode(null)
                        }
                        disabled={
                            actionLoading
                        }
                    >
                        ×
                    </button>

                </div>


                {
                    error &&
                    (

                        <div className="timetable-error">

                            {error}

                        </div>

                    )
                }


                <form
                    onSubmit={
                        saveEdit
                    }
                >

                    <div className="timetable-form-group">

                        <label>
                            Timetable Title
                        </label>


                        <input
                            type="text"
                            name="title"
                            value={
                                editForm.title
                            }
                            onChange={
                                handleEditChange
                            }
                            maxLength="200"
                            required
                            disabled={
                                actionLoading
                            }
                        />

                    </div>


                    <div className="timetable-form-group">

                        <label>
                            Notes
                        </label>


                        <textarea
                            name="notes"
                            value={
                                editForm.notes
                            }
                            onChange={
                                handleEditChange
                            }
                            rows="5"
                            placeholder="Optional notes about this timetable version..."
                            disabled={
                                actionLoading
                            }
                        />

                    </div>


                    <div className="timetable-modal-actions">

                        <button
                            type="button"
                            className="timetable-cancel-button"
                            onClick={() =>
                                setModalMode(null)
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="timetable-edit-button"
                            disabled={
                                actionLoading
                            }
                        >

                            {
                                actionLoading
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
            {/* ==================================================
                DETAIL MODAL
                ================================================== */}

            {
                modalMode === 'view' &&
                (

                    <div className="timetable-modal-overlay">

                        <div className="timetable-modal">

                            <div className="timetable-modal-header">

                                <div>

                                    <span className="timetable-versions-label">
                                        TIMETABLE DETAILS
                                    </span>

                                    <h3>
                                        Examination Timetable
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="timetable-modal-close"
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

                                        <div className="timetable-detail-loading">
                                            Loading complete timetable...
                                        </div>

                                    )
                                    : detailTimetable
                                        ? (

                                            <>

                                                <div className="timetable-detail-header">

                                                    <div>

                                                        <span>
                                                            Academic Session
                                                        </span>

                                                        <strong>
                                                            {
                                                                detailTimetable.session_name
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                detailTimetable.semester
                                                            }
                                                        </small>

                                                    </div>


                                                    <span
                                                        className={
                                                            `timetable-status ${String(detailTimetable.status || '').toLowerCase()}`
                                                        }
                                                    >
                                                        {
                                                            detailTimetable.status
                                                        }
                                                    </span>

                                                </div>


                                                <div className="timetable-detail-grid">

                                                    <div>

                                                        <span>
                                                            Title
                                                        </span>

                                                        <strong>
                                                            {
                                                                detailTimetable.title
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Version
                                                        </span>

                                                        <strong>
                                                            V{
                                                                detailTimetable.version_number
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Examinations
                                                        </span>

                                                        <strong>
                                                            {
                                                                detailStatistics.entries ??
                                                                detailEntries.length
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Venue Allocations
                                                        </span>

                                                        <strong>
                                                            {
                                                                detailStatistics.venue_allocations ??
                                                                0
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Invigilator Assignments
                                                        </span>

                                                        <strong>
                                                            {
                                                                detailStatistics.invigilator_assignments ??
                                                                0
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Notes
                                                        </span>

                                                        <strong>
                                                            {
                                                                detailTimetable.notes ||
                                                                'No notes'
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>


                                                {
                                                    detailEntries.length > 0 &&
                                                    (

                                                        <div className="timetable-detail-table-wrapper">

                                                            <table className="timetable-detail-table">

                                                                <thead>

                                                                    <tr>

                                                                        <th>
                                                                            Course
                                                                        </th>

                                                                        <th>
                                                                            Department
                                                                        </th>

                                                                        <th>
                                                                            Date
                                                                        </th>

                                                                        <th>
                                                                            Time
                                                                        </th>

                                                                        <th>
                                                                            Candidates
                                                                        </th>

                                                                        <th>
                                                                            Venues
                                                                        </th>

                                                                        <th>
                                                                            Invigilators
                                                                        </th>

                                                                    </tr>

                                                                </thead>


                                                                <tbody>

                                                                    {
                                                                        detailEntries.map(
                                                                            entry => (

                                                                                <tr
                                                                                    key={
                                                                                        entry.id
                                                                                    }
                                                                                >

                                                                                    <td>

                                                                                        <strong>
                                                                                            {
                                                                                                entry.course_code
                                                                                            }
                                                                                        </strong>

                                                                                        <small>
                                                                                            {
                                                                                                entry.course_title
                                                                                            }
                                                                                        </small>

                                                                                    </td>


                                                                                    <td>
                                                                                        {
                                                                                            entry.department_code
                                                                                        }
                                                                                    </td>


                                                                                    <td>
                                                                                        {
                                                                                            formatDate(
                                                                                                entry.exam_date
                                                                                            )
                                                                                        }
                                                                                    </td>


                                                                                    <td>

                                                                                        {
                                                                                            entry.slot_label
                                                                                        }

                                                                                        <small>

                                                                                            {
                                                                                                entry.start_time
                                                                                            }

                                                                                            {' — '}

                                                                                            {
                                                                                                entry.end_time
                                                                                            }

                                                                                        </small>

                                                                                    </td>


                                                                                    <td>
                                                                                        {
                                                                                            entry.candidate_count
                                                                                        }
                                                                                    </td>


                                                                                    <td>

                                                                                        {
                                                                                            entry.venue_allocation?.venue_count ??
                                                                                            0
                                                                                        }

                                                                                    </td>


                                                                                    <td>

                                                                                        {
                                                                                            entry.invigilator_allocation?.assigned_count ??
                                                                                            0
                                                                                        }

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


                                                <div className="timetable-modal-actions">

                                                    <button
                                                        type="button"
                                                        className="timetable-cancel-button"
                                                        onClick={
                                                            closeModal
                                                        }
                                                    >
                                                        Close
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="timetable-download-excel"
                                                        onClick={() =>
                                                            downloadVersion(
                                                                detailTimetable,
                                                                'excel'
                                                            )
                                                        }
                                                        disabled={
                                                            downloadLoading !== null
                                                        }
                                                    >
                                                        Excel
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="timetable-download-pdf"
                                                        onClick={() =>
                                                            downloadVersion(
                                                                detailTimetable,
                                                                'pdf'
                                                            )
                                                        }
                                                        disabled={
                                                            downloadLoading !== null
                                                        }
                                                    >
                                                        PDF
                                                    </button>


                                                    {
                                                        String(
                                                            detailTimetable.status
                                                        ).toLowerCase() ===
                                                        'draft' &&
                                                        (

                                                            <button
                                                                type="button"
                                                                className="timetable-publish-button"
                                                                onClick={
                                                                    async () => {

                                                                        await publishTimetable(
                                                                            detailTimetable
                                                                        );

                                                                        if (
                                                                            !error
                                                                        ) {
                                                                            closeModal();
                                                                        }

                                                                    }
                                                                }
                                                                disabled={
                                                                    actionLoading ||
                                                                    downloadLoading !== null
                                                                }
                                                            >
                                                                Publish Timetable
                                                            </button>

                                                        )
                                                    }

                                                </div>

                                            </>

                                        )
                                        : (

                                            <div className="timetable-detail-loading">
                                                Timetable details could not be loaded.
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


export default TimetableVersionsPage;