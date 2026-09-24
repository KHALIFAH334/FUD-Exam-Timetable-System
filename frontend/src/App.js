import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from 'react-router-dom';

import {
    AuthProvider
} from './context/AuthContext';

import ProtectedRoute
    from './components/ProtectedRoute';


// ==========================================================
// NORMAL PORTAL
// ==========================================================

import LoginPage
    from './pages/LoginPage';

import ExamOfficerDashboard
    from './pages/ExamOfficerDashboard';

import AcademicSessionsPage
    from './pages/AcademicSessionsPage';

import DepartmentsPage
    from './pages/DepartmentsPage';

import CoursesPage
    from './pages/CoursesPage';


import VenuesPage
    from './pages/VenuesPage';

import TimeSlotsPage
    from './pages/TimeSlotsPage';

import BlackoutDatesPage
    from './pages/BlackoutDatesPage';

import InvigilatorsPage
    from './pages/InvigilatorsPage';

import GenerateTimetablePage
    from './pages/GenerateTimetablePage';

import TimetableVersionsPage
    from './pages/TimetableVersionsPage';

import PublishedTimetablePage
    from './pages/PublishedTimetablePage';

import FeedbackLinksPage
    from './pages/FeedbackLinksPage';

import PublicFeedbackPage
    from './pages/PublicFeedbackPage';

import ComplaintsPage
    from './pages/ComplaintsPage';

import CoordinatorDashboard
    from './pages/CoordinatorDashboard';


// ==========================================================
// SUPER ADMIN
// ==========================================================

import AdminLoginPage
    from './pages/AdminLoginPage';

import AdminDashboard
    from './pages/AdminDashboard';


import './styles/global.css';


// ==========================================================
// DETECT PORTAL
// ==========================================================

const isAdminPortal =
    window.location.port === '3001';


function App() {

    return (

        <BrowserRouter>

            <AuthProvider>

                <Routes>

                    {/* =================================================
                        ADMIN PORTAL — PORT 3001
                    ================================================= */}

                    {
                        isAdminPortal
                            ? (

                                <>

                                    <Route
                                        path="/login"
                                        element={
                                            <AdminLoginPage />
                                        }
                                    />


                                    <Route
                                        path="/admin-login"
                                        element={
                                            <Navigate
                                                to="/login"
                                                replace
                                            />
                                        }
                                    />


                                    <Route
                                        path="/admin"
                                        element={
                                            <AdminDashboard />
                                        }
                                    />


                                    <Route
                                        path="/"
                                        element={
                                            <Navigate
                                                to="/login"
                                                replace
                                            />
                                        }
                                    />


                                    <Route
                                        path="*"
                                        element={
                                            <Navigate
                                                to="/admin"
                                                replace
                                            />
                                        }
                                    />

                                </>

                            )

                            : (

                                <>

                                    {/* =================================
                                        NORMAL LOGIN
                                    ================================= */}

                                    <Route
                                        path="/login"
                                        element={
                                            <LoginPage />
                                        }
                                    />


                                    {/* =================================
                                        ROOT
                                    ================================= */}

                                    <Route
                                        path="/"
                                        element={
                                            <Navigate
                                                to="/login"
                                                replace
                                            />
                                        }
                                    />


                                    {/* =================================
                                        EXAM OFFICER
                                    ================================= */}

                                    <Route
                                        path="/exam-officer"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <ExamOfficerDashboard />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/sessions"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <AcademicSessionsPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/departments"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <DepartmentsPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/courses"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <CoursesPage />
                                            </ProtectedRoute>
                                        }
                                    />




                                    <Route
                                        path="/exam-officer/venues"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <VenuesPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/time-slots"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <TimeSlotsPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/blackout-dates"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <BlackoutDatesPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/invigilators"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <InvigilatorsPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/generate-timetable"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <GenerateTimetablePage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/timetable-versions"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <TimetableVersionsPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/published-timetable"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <PublishedTimetablePage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/feedback-links"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <FeedbackLinksPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/exam-officer/complaints"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'exam_officer'
                                                ]}
                                            >
                                                <ComplaintsPage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    {/* =================================
                                        PUBLIC FEEDBACK
                                    ================================= */}

                                    <Route
                                        path="/feedback/:token"
                                        element={
                                            <PublicFeedbackPage />
                                        }
                                    />


                                    {/* =================================
                                        COORDINATOR
                                    ================================= */}

                                    <Route
                                        path="/coordinator"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'departmental_coordinator'
                                                ]}
                                            >
                                                <CoordinatorDashboard />
                                            </ProtectedRoute>
                                        }
                                    />


                                    <Route
                                        path="/departmental-coordinator/published-timetable"
                                        element={
                                            <ProtectedRoute
                                                allowedRoles={[
                                                    'departmental_coordinator'
                                                ]}
                                            >
                                                <PublishedTimetablePage />
                                            </ProtectedRoute>
                                        }
                                    />


                                    {/* =================================
                                        UNAUTHORIZED
                                    ================================= */}

                                    <Route
                                        path="/unauthorized"
                                        element={

                                            <div className="message-page">

                                                <h1>
                                                    Access Denied
                                                </h1>

                                                <p>
                                                    You are not authorized
                                                    to access this page.
                                                </p>

                                            </div>

                                        }
                                    />


                                    {/* =================================
                                        NORMAL FALLBACK
                                    ================================= */}

                                    <Route
                                        path="*"
                                        element={
                                            <Navigate
                                                to="/login"
                                                replace
                                            />
                                        }
                                    />

                                </>

                            )
                    }

                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}


export default App;