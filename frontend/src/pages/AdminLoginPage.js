import {
    useState
} from 'react';

import {
    useNavigate
} from 'react-router-dom';

import '../styles/adminLogin.css';


const AdminLoginPage = () => {

    const navigate =
        useNavigate();


    const [
        email,
        setEmail
    ] = useState('');


    const [
        password,
        setPassword
    ] = useState('');


    const [
        error,
        setError
    ] = useState('');


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError('');

        setSubmitting(true);


        try {

            const response =
                await fetch(
                    'http://localhost:5000/api/auth/login',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            email:
                                email.trim(),

                            password:
                                password

                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    'Unable to sign in.'
                );
            }


            if (
                data.user?.role !==
                'super_admin'
            ) {

                throw new Error(
                    'This portal is restricted to Super Administrators.'
                );
            }


            localStorage.setItem(
                'fud_admin_token',
                data.token
            );


            localStorage.setItem(
                'fud_admin_user',
                JSON.stringify(
                    data.user
                )
            );


            navigate(
                '/admin',
                {
                    replace: true
                }
            );


        } catch (error) {

            console.error(
                'Admin login error:',
                error
            );


            setError(
                error.message ||
                'Unable to sign in.'
            );


        } finally {

            setSubmitting(false);
        }
    };


    return (

        <main className="admin-login-page">

            {/* ==================================================
                HEADER
                ================================================== */}

            <header className="admin-login-header">

                <div className="admin-login-brand">

                    <img
                        src="/fud-logo.png"
                        alt="Federal University Dutse"
                    />


                    <div>

                        <h1>
                            FEDERAL UNIVERSITY DUTSE
                        </h1>

                        <p>
                            SYSTEM ADMINISTRATION PORTAL
                        </p>

                    </div>

                </div>

            </header>


            {/* ==================================================
                LOGIN CONTENT
                ================================================== */}

            <section className="admin-login-content">

                <div className="admin-login-card">

                    {/* ADMIN LOGO */}

                    <div className="admin-login-icon">

                        <img
                            src="/fud-logo.png"
                            alt="FUD"
                        />

                    </div>


                    {/* HEADING */}

                    <div className="admin-login-heading">

                        <span>
                            RESTRICTED ADMINISTRATIVE ACCESS
                        </span>

                        <h2>
                            Super Admin Sign In
                        </h2>

                        <p>
                            University-wide system management
                        </p>

                    </div>


                    {/* SECURITY NOTICE */}

                    <div className="admin-login-security">

                        <strong>
                            Administrator Access
                        </strong>

                        Only authorized Super Administrators
                        can access this portal.

                    </div>


                    {/* ERROR */}

                    {
                        error &&
                        (

                            <div className="admin-login-error">

                                {error}

                            </div>

                        )
                    }


                    {/* FORM */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="admin-login-form-group">

                            <label htmlFor="admin-email">
                                Administrator Email
                            </label>


                            <input
                                id="admin-email"
                                type="email"
                                value={
                                    email
                                }
                                onChange={
                                    event =>
                                        setEmail(
                                            event.target.value
                                        )
                                }
                                placeholder="Enter administrator email"
                                autoComplete="username"
                                required
                                disabled={
                                    submitting
                                }
                            />

                        </div>


                        <div className="admin-login-form-group">

                            <label htmlFor="admin-password">
                                Password
                            </label>


                            <input
                                id="admin-password"
                                type="password"
                                value={
                                    password
                                }
                                onChange={
                                    event =>
                                        setPassword(
                                            event.target.value
                                        )
                                }
                                placeholder="Enter administrator password"
                                autoComplete="current-password"
                                required
                                disabled={
                                    submitting
                                }
                            />

                        </div>


                        <button
                            type="submit"
                            className="admin-login-button"
                            disabled={
                                submitting
                            }
                        >

                            {
                                submitting
                                    ? 'Signing in...'
                                    : 'Admin Login'
                            }

                        </button>

                    </form>

                </div>

            </section>


            {/* ==================================================
                FOOTER
                ================================================== */}

            <footer className="admin-login-footer">

                <span>
                    Federal University Dutse
                    Examination Timetable System
                </span>


                <span>
                    FCP/CSE/23/2009 Yahaya Sule Audu © 2026
                </span>

            </footer>

        </main>
    );
};


export default AdminLoginPage;