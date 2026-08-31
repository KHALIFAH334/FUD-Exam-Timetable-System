import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import api from '../services/api';


// ==========================================================
// AUTH CONTEXT
// ==========================================================

const AuthContext =
    createContext(null);


// ==========================================================
// AUTH PROVIDER
// ==========================================================

export const AuthProvider = ({
    children
}) => {

    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);


    // ------------------------------------------------------
    // RESTORE EXISTING LOGIN
    // ------------------------------------------------------

    useEffect(() => {

        const restoreLogin =
            async () => {

                const token =
                    localStorage.getItem(
                        'fud_exam_token'
                    );


                if (!token) {

                    setLoading(false);

                    return;
                }


                try {

                    const response =
                        await api.get(
                            '/auth/me'
                        );


                    setUser(
                        response.data.user
                    );


                    localStorage.setItem(
                        'fud_exam_user',
                        JSON.stringify(
                            response.data.user
                        )
                    );

                } catch (error) {

                    localStorage.removeItem(
                        'fud_exam_token'
                    );

                    localStorage.removeItem(
                        'fud_exam_user'
                    );

                    setUser(null);
                }


                setLoading(false);
            };


        restoreLogin();

    }, []);


    // ------------------------------------------------------
    // LOGIN
    // ------------------------------------------------------

    const login = async (
        email,
        password
    ) => {

        const response =
            await api.post(
                '/auth/login',
                {
                    email,
                    password
                }
            );


        if (
            !response.data.success
        ) {

            throw new Error(
                response.data.message ||
                'Login failed'
            );
        }


        localStorage.setItem(
            'fud_exam_token',
            response.data.token
        );


        localStorage.setItem(
            'fud_exam_user',
            JSON.stringify(
                response.data.user
            )
        );


        setUser(
            response.data.user
        );


        return response.data;
    };


    // ------------------------------------------------------
    // LOGOUT
    // ------------------------------------------------------

    const logout = () => {

        localStorage.removeItem(
            'fud_exam_token'
        );

        localStorage.removeItem(
            'fud_exam_user'
        );

        setUser(null);
    };


    return (

        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated:
                    Boolean(user)
            }}
        >

            {children}

        </AuthContext.Provider>
    );
};


// ==========================================================
// AUTH HOOK
// ==========================================================

export const useAuth = () => {

    return useContext(
        AuthContext
    );
};