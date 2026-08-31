import axios from 'axios';


// ==========================================================
// API CONFIGURATION
// ==========================================================

const api = axios.create({

    baseURL:
        'http://localhost:5000/api',

    headers: {
        'Content-Type':
            'application/json'
    }
});


// ==========================================================
// ADD TOKEN TO AUTHENTICATED REQUESTS
// ==========================================================

api.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem(
                'fud_exam_token'
            );


        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;
        }


        return config;
    },

    (error) => {

        return Promise.reject(
            error
        );
    }
);


// ==========================================================
// HANDLE EXPIRED / INVALID LOGIN
// ==========================================================

api.interceptors.response.use(

    (response) =>
        response,

    (error) => {

        if (
            error.response &&
            error.response.status === 401
        ) {

            localStorage.removeItem(
                'fud_exam_token'
            );

            localStorage.removeItem(
                'fud_exam_user'
            );
        }


        return Promise.reject(
            error
        );
    }
);


export default api;