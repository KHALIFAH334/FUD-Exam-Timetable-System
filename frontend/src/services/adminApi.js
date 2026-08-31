import axios from 'axios';


const adminApi = axios.create({

    baseURL:
        'http://localhost:5000/api',

    headers: {
        'Content-Type':
            'application/json'
    }

});


adminApi.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem(
                'fud_admin_token'
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


adminApi.interceptors.response.use(

    (response) =>
        response,

    (error) => {

        if (
            error.response &&
            error.response.status === 401
        ) {

            localStorage.removeItem(
                'fud_admin_token'
            );

            localStorage.removeItem(
                'fud_admin_user'
            );

            window.location.href =
                '/admin-login';

        }


        return Promise.reject(
            error
        );

    }

);


export default adminApi;