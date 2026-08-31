import {
    useAuth
} from '../context/AuthContext';


const CoordinatorDashboard = () => {

    const {
        user,
        logout
    } = useAuth();


    return (

        <div className="temporary-dashboard">

            <h1>
                Department Coordinator
                Dashboard
            </h1>

            <p>
                Welcome,
                {' '}
                {user?.full_name}
            </p>

            <p>
                Department ID:
                {' '}
                {user?.department_id}
            </p>

            <button
                onClick={logout}
            >
                Logout
            </button>

        </div>
    );
};


export default CoordinatorDashboard;