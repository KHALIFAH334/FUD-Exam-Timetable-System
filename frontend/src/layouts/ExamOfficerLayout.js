import {
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import {
    useAuth
} from '../context/AuthContext';

import '../styles/dashboard.css';


const ExamOfficerLayout = ({
    children,
    activePage = 'Dashboard'
}) => {

    const navigate =
        useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [sidebarOpen, setSidebarOpen] =
        useState(true);


    // ======================================================
    // NAVIGATION
    // ======================================================

    const menuItems = [

        {
            label: 'Dashboard',
            path: '/exam-officer'
        },

        {
            label: 'Academic Sessions',
            path: '/exam-officer/sessions'
        },

        {
            label: 'Departments',
            path: '/exam-officer/departments'
        },

        {
            label: 'Courses',
            path: '/exam-officer/courses'
        },

        {
            label: 'Venues',
            path: '/exam-officer/venues'
        },

        {
            label: 'Time Slots',
            path: '/exam-officer/time-slots'
        },

        {
            label: 'Blackout Dates',
            path: '/exam-officer/blackout-dates'
        },

        {
            label: 'Invigilators',
            path: '/exam-officer/invigilators'
        },

        {
            label: 'Generate Timetable',
            path: '/exam-officer/generate-timetable'
        },

        {
            label: 'Timetable Versions',
            path: '/exam-officer/timetable-versions'
        },

        {
            label: 'Published Timetable',
            path: '/exam-officer/published-timetable'
        },

        {
            label: 'Feedback Links',
            path: '/exam-officer/feedback-links'
        },

        {
            label: 'Complaints',
            path: '/exam-officer/complaints'
        }

    ];


    // ======================================================
    // SIDEBAR
    // ======================================================

    const toggleSidebar = () => {

        setSidebarOpen(
            previous =>
                !previous
        );
    };


    const handleNavigation = (
        path
    ) => {

        navigate(path);
    };


    // ======================================================
    // LOGOUT
    // ======================================================

    const handleLogout = () => {

        logout();

        navigate('/login');
    };


    // ======================================================
    // INLINE SIDEBAR STYLE
    //
    // This deliberately avoids modifying dashboard.css.
    // ======================================================

    const sidebarStyle = {

        position: 'fixed',

        top: 0,

        left: 0,

        bottom: 0,

        width: '270px',

        zIndex: 2000,

        transform:
            sidebarOpen
                ? 'translateX(0)'
                : 'translateX(-100%)',

        transition:
            'transform 0.25s ease',

        overflowY: 'auto',

        overflowX: 'hidden'

    };


    const mainStyle = {

        marginLeft:
            sidebarOpen
                ? '270px'
                : '0',

        transition:
            'margin-left 0.25s ease'

    };


    return (

        <div className="fud-dashboard">

            {/* ==================================================
                SIDEBAR
                ================================================== */}

            <aside
                className="dashboard-sidebar"
                style={
                    sidebarStyle
                }
            >

                <div className="sidebar-brand">

                    <img
                        src="/fud-logo.png"
                        alt="FUD Logo"
                    />


                    <div>

                        <h2>
                            FUD
                        </h2>


                        <span>
                            Exam Timetable
                        </span>

                    </div>

                </div>


                <div className="sidebar-divider" />


                {/* CLOSE */}

                <button
                    type="button"
                    onClick={
                        toggleSidebar
                    }
                    aria-label="Close sidebar"
                    style={{
                        position:
                            'absolute',

                        top:
                            '15px',

                        right:
                            '12px',

                        width:
                            '32px',

                        height:
                            '32px',

                        display:
                            'flex',

                        alignItems:
                            'center',

                        justifyContent:
                            'center',

                        border:
                            'none',

                        borderRadius:
                            '5px',

                        background:
                            'rgba(255,255,255,.12)',

                        color:
                            '#ffffff',

                        fontSize:
                            '20px',

                        cursor:
                            'pointer',

                        zIndex:
                            10
                    }}
                >
                    ×
                </button>


                {/* ==================================================
                    NAVIGATION
                    ================================================== */}

                <nav className="sidebar-navigation">

                    {
                        menuItems.map(
                            item => (

                                <button
                                    key={
                                        item.label
                                    }
                                    type="button"
                                    className={
                                        activePage ===
                                        item.label
                                            ? 'sidebar-item active'
                                            : 'sidebar-item'
                                    }
                                    onClick={() =>
                                        handleNavigation(
                                            item.path
                                        )
                                    }
                                >

                                    <span
                                        className="sidebar-dot"
                                    />


                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>

                                </button>

                            )
                        )
                    }

                </nav>


                {/* ==================================================
                    USER
                    ================================================== */}

                <div className="sidebar-bottom">

                    <div className="sidebar-user">

                        <div className="user-avatar">

                            {
                                user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase()
                            }

                        </div>


                        <div>

                            <strong>
                                {
                                    user?.full_name ||
                                    'Exam Officer'
                                }
                            </strong>


                            <span>
                                Examination Officer
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        Logout
                    </button>

                </div>

            </aside>


            {/* ==================================================
                MAIN
                ================================================== */}

            <div
                className="dashboard-main"
                style={
                    mainStyle
                }
            >

                {/* ==================================================
                    TOP BAR
                    ================================================== */}

                <header className="dashboard-topbar">

                    <div
                        className="topbar-left"
                        style={{
                            display:
                                'flex',

                            alignItems:
                                'center',

                            gap:
                                '14px'
                        }}
                    >

                        {/* ==================================================
                            THREE-LINE BUTTON
                            ================================================== */}

                        <button
                            type="button"
                            onClick={
                                toggleSidebar
                            }
                            aria-label={
                                sidebarOpen
                                    ? 'Close sidebar'
                                    : 'Open sidebar'
                            }
                            style={{
                                width:
                                    '42px',

                                height:
                                    '42px',

                                minWidth:
                                    '42px',

                                display:
                                    'flex',

                                flexDirection:
                                    'column',

                                alignItems:
                                    'center',

                                justifyContent:
                                    'center',

                                gap:
                                    '5px',

                                padding:
                                    '0',

                                border:
                                    'none',

                                borderRadius:
                                    '7px',

                                background:
                                    '#006b36',

                                cursor:
                                    'pointer',

                                flexShrink:
                                    0,

                                zIndex:
                                    2100
                            }}
                        >

                            <span
                                style={{
                                    display:
                                        'block',

                                    width:
                                        '21px',

                                    height:
                                        '3px',

                                    background:
                                        '#ffffff',

                                    borderRadius:
                                        '3px'
                                }}
                            />

                            <span
                                style={{
                                    display:
                                        'block',

                                    width:
                                        '21px',

                                    height:
                                        '3px',

                                    background:
                                        '#ffffff',

                                    borderRadius:
                                        '3px'
                                }}
                            />

                            <span
                                style={{
                                    display:
                                        'block',

                                    width:
                                        '21px',

                                    height:
                                        '3px',

                                    background:
                                        '#ffffff',

                                    borderRadius:
                                        '3px'
                                }}
                            />

                        </button>


                        <div>

                            <span className="topbar-label">
                                Examination Timetable System
                            </span>


                            <h1>
                                {activePage}
                            </h1>

                        </div>

                    </div>


                    {/* ==================================================
                        USER
                        ================================================== */}

                    <div className="topbar-user">

                        <div className="topbar-avatar">

                            {
                                user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase()
                            }

                        </div>


                        <div className="topbar-user-details">

                            <strong>
                                {
                                    user?.full_name ||
                                    'Exam Officer'
                                }
                            </strong>


                            <span>
                                Examination Officer
                            </span>

                        </div>

                    </div>

                </header>


                {/* ==================================================
                    CONTENT
                    ================================================== */}

                <main className="dashboard-content">

                    {children}

                </main>


                {/* ==================================================
                    FOOTER
                    ================================================== */}

                <footer className="dashboard-footer">

                    <span>
                        Federal University Dutse
                        Examination Timetable System
                    </span>


                    <span>
                        FCP/CSE/23/2009
                        {' '}
                        Yahaya Sule Audu
                        {' '}
                        © 2026
                    </span>

                </footer>

            </div>

        </div>
    );
};


export default ExamOfficerLayout;