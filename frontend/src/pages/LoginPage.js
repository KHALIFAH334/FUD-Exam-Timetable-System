import {
    useState
} from 'react';

import {
    Navigate,
    useNavigate
} from 'react-router-dom';

import {
    useAuth
} from '../context/AuthContext';

import '../styles/login.css';


const LoginPage = () => {

    const navigate =
        useNavigate();


    const {
        user,
        login
    } = useAuth();


    const [email, setEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [error, setError] =
        useState('');

    const [submitting, setSubmitting] =
        useState(false);


    // ======================================================
    // USER ALREADY LOGGED IN
    // ======================================================

    if (user) {

        if (
            user.role ===
            'exam_officer'
        ) {

            return (
                <Navigate
                    to="/exam-officer"
                    replace
                />
            );
        }


        if (
            user.role ===
            'departmental_coordinator'
        ) {

            return (
                <Navigate
                    to="/coordinator"
                    replace
                />
            );
        }
    }


    // ======================================================
    // LOGIN
    // ======================================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();

            setError('');

            setSubmitting(true);


            try {

                const result =
                    await login(
                        email.trim(),
                        password
                    );


                const role =
                    result.user.role;


                if (
                    role ===
                    'exam_officer'
                ) {

                    navigate(
                        '/exam-officer'
                    );

                    return;
                }


                if (
                    role ===
                    'departmental_coordinator'
                ) {

                    navigate(
                        '/coordinator'
                    );

                    return;
                }


                setError(
                    'Your account does not have access to this system.'
                );

            } catch (error) {

                setError(
                    error.response?.data?.message ||
                    error.message ||
                    'Unable to sign in. Please check your credentials.'
                );

            } finally {

                setSubmitting(false);
            }
        };


    return (

        <main className="fud-login-page">

            {/* =============================================
                TOP BRAND BAR
                ============================================= */}

            <header className="fud-login-header">

                <div className="fud-header-content">

                    <img
                        src="/fud-logo.png"
                        alt="Federal University Dutse"
                        className="fud-header-logo"
                    />


                    <div className="fud-header-title">

                        <h1>
                            FEDERAL UNIVERSITY DUTSE
                        </h1>

                        <p>
                            Knowledge, Excellence & Service
                        </p>

                    </div>

                </div>

            </header>


            {/* =============================================
                LOGIN CONTENT
                ============================================= */}

            <section className="fud-login-content">

                <div className="fud-login-shell">

                    {/* =====================================
                        LEFT INFORMATION
                        ===================================== */}

                    <section className="fud-login-information">

                        <div className="system-badge">
                            EXAMINATION SYSTEM
                        </div>


                        <h2>
                            Examination Timetable
                            Scheduling & Management
                            System
                        </h2>


                        <p className="system-description">

                            A centralized platform for
                            automated examination timetable
                            generation, conflict management,
                            venue allocation, publication
                            and timetable feedback.

                        </p>


                        <div className="feature-list">

                            <div className="feature-item">

                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Automated timetable
                                    generation
                                </span>

                            </div>


                            <div className="feature-item">

                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Conflict-free scheduling
                                </span>

                            </div>


                            <div className="feature-item">

                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Venue and invigilator
                                    management
                                </span>

                            </div>


                            <div className="feature-item">

                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Timetable publication and
                                    complaint management
                                </span>

                            </div>

                        </div>


                        <div className="system-access-note">

                            <strong>
                                Authorized Access
                            </strong>

                            <span>
                                Examination Office and
                                Departmental Coordinators
                            </span>

                        </div>

                    </section>


                    {/* =====================================
                        LOGIN CARD
                        ===================================== */}

                    <section className="fud-login-card">

                        <div className="login-card-header">

                            <div className="mini-logo-wrapper">

                                <img
                                    src="/fud-logo.png"
                                    alt="FUD"
                                    className="mini-fud-logo"
                                />

                            </div>


                            <div>

                                <h2>
                                    Sign In
                                </h2>

                                <p>
                                    Examination Timetable Portal
                                </p>

                            </div>

                        </div>


                        {error && (

                            <div className="login-error">

                                {error}

                            </div>

                        )}


                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="form-group">

                                <label htmlFor="email">

                                    Email Address

                                </label>


                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={
                                        event =>
                                            setEmail(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Enter your email address"
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label htmlFor="password">

                                    Password

                                </label>


                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={
                                        event =>
                                            setPassword(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />

                            </div>


                            <button
                                type="submit"
                                className="fud-login-button"
                                disabled={
                                    submitting
                                }
                            >

                                {
                                    submitting
                                        ? 'Signing in...'
                                        : 'Login'
                                }

                            </button>

                        </form>


                        <div className="login-security-note">

                            <span className="security-dot">
                                ●
                            </span>

                            Secure institutional access

                        </div>

                    </section>

                </div>

            </section>


            {/* =============================================
                FOOTER
                ============================================= */}

            <footer className="fud-login-footer">

                <p>
                    Federal University Dutse
                    Examination Timetable System
                </p>

                <p>
                        FCP/CSE/23/2009
                    Yahaya Sule Audu © 2026
                </p>

            </footer>

        </main>
    );
};


export default LoginPage;