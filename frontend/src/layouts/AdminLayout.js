import {
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import {
    useAuth
} from '../context/AuthContext';

import '../styles/admin.css';


const AdminLayout = ({
    children,
    activePage = 'Dashboard'
}) => {

    const navigate =
        useNavigate();

    const {
        user,
        logout
    } = useAuth();

    const [
        sidebarOpen,
        setSidebarOpen
    ] = useState(false);


    const menuItems = [

        {
            label: 'Dashboard',
            path: '/admin'
        },

        {
            label: 'Faculties',
            path: '/admin#faculties'
        },

        {
            label: 'Faculty Exam Officers',
            path: '/admin#exam-officers'
        },

        {
            label: 'Department Exam Officer',
            path: '/admin#coordinators'
        },

        {
            label: 'Users',
            path: '/admin#users'
        }

    ];


    const handleNavigation = (
        item
    ) => {

        if (
            item.path.includes('#')
        ) {

            const [
                path,
                hash
            ] =
                item.path.split('#');


            navigate(path);


            setTimeout(() => {

                const element =
                    document.getElementById(
                        hash
                    );


                if (element) {

                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                }

            }, 100);

        } else {

            navigate(item.path);

        }


        setSidebarOpen(false);
    };


    const handleLogout = () => {

        logout();

        navigate('/login');
    };


    return (

        <div className="admin-shell">

            <aside
                className={
                    sidebarOpen
                        ? 'admin-sidebar open'
                        : 'admin-sidebar'
                }
            >

                <div className="admin-brand">

                    <img
                        src="/fud-logo.png"
                        alt="FUD Logo"
                    />

                    <div>

                        <strong>
                            FUD
                        </strong>

                        <span>
                            System Administration
                        </span>

                    </div>

                </div>


                <div className="admin-divider" />


                <nav className="admin-navigation">

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
                                            ? 'admin-nav-item active'
                                            : 'admin-nav-item'
                                    }
                                    onClick={() =>
                                        handleNavigation(
                                            item
                                        )
                                    }
                                >

                                    <span className="admin-nav-dot" />

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


                <div className="admin-sidebar-bottom">

                    <div className="admin-user">

                        <div className="admin-avatar">

                            {
                                user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                'A'
                            }

                        </div>


                        <div>

                            <strong>
                                {
                                    user?.full_name ||
                                    'Super Admin'
                                }
                            </strong>

                            <span>
                                System Administrator
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="admin-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        Logout
                    </button>

                </div>

            </aside>


            <div className="admin-main">

                <header className="admin-topbar">

                    <div className="admin-topbar-left">

                        <button
                            type="button"
                            className="admin-menu-toggle"
                            onClick={() =>
                                setSidebarOpen(
                                    previous =>
                                        !previous
                                )
                            }
                        >
                            ☰
                        </button>


                        <div>

                            <span>
                                FUD EXAMINATION
                                TIMETABLE SYSTEM
                            </span>

                            <h1>
                                {activePage}
                            </h1>

                        </div>

                    </div>


                    <div className="admin-topbar-user">

                        <div className="admin-topbar-avatar">

                            {
                                user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                'A'
                            }

                        </div>


                        <div>

                            <strong>
                                {
                                    user?.full_name ||
                                    'Super Admin'
                                }
                            </strong>

                            <span>
                                Super Administrator
                            </span>

                        </div>

                    </div>

                </header>


                <main className="admin-content">

                    {children}

                </main>


                <footer className="admin-footer">

                    <span>
                        Federal University Dutse
                        Examination Timetable System
                    </span>

                    <span>
                    Yahaya Sule Audu System Administration © 2026
                    </span>

                </footer>

            </div>

        </div>
    );
};


export default AdminLayout;