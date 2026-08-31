import {
    Navigate
} from 'react-router-dom';

import {
    useAuth
} from '../context/AuthContext';


const ProtectedRoute = ({
    children,
    allowedRoles
}) => {

    const {
        user,
        loading
    } = useAuth();


    if (loading) {

        return (
            <div className="page-loader">
                Loading system...
            </div>
        );
    }


    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    if (
        allowedRoles &&
        !allowedRoles.includes(
            user.role
        )
    ) {

        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }


    return children;
};


export default ProtectedRoute;