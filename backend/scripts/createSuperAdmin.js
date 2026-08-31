const readline =
    require('readline');

const bcrypt =
    require('bcryptjs');

const db =
    require('../src/config/db');


const rl =
    readline.createInterface({

        input: process.stdin,

        output: process.stdout

    });


const ask = (
    question
) => {

    return new Promise(
        resolve => {

            rl.question(
                question,
                answer => resolve(
                    answer.trim()
                )
            );

        }
    );
};


const main = async () => {

    try {

        console.log('');
        console.log(
            '=========================================='
        );

        console.log(
            ' FUD EXAM TIMETABLE - SUPER ADMIN SETUP'
        );

        console.log(
            '=========================================='
        );

        console.log('');


        const fullName =
            await ask(
                'Full name: '
            );


        const email =
            (
                await ask(
                    'Email: '
                )
            ).toLowerCase();


        const password =
            await ask(
                'Password: '
            );


        if (
            !fullName ||
            !email ||
            !password
        ) {

            throw new Error(
                'Full name, email and password are required.'
            );
        }


        if (
            password.length < 8
        ) {

            throw new Error(
                'Password must contain at least 8 characters.'
            );
        }


        const [
            existing
        ] =
            await db.query(
                `
                SELECT
                    id,
                    role
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [
                    email
                ]
            );


        if (
            existing.length > 0
        ) {

            throw new Error(
                `A user with ${email} already exists.`
            );
        }


        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        const [
            result
        ] =
            await db.query(
                `
                INSERT INTO users
                (
                    faculty_id,
                    department_id,
                    full_name,
                    email,
                    password_hash,
                    role,
                    is_active
                )
                VALUES
                (
                    NULL,
                    NULL,
                    ?,
                    ?,
                    ?,
                    'super_admin',
                    TRUE
                )
                `,
                [
                    fullName,

                    email,

                    passwordHash
                ]
            );


        console.log('');

        console.log(
            'Super Admin created successfully.'
        );

        console.log(
            `User ID: ${result.insertId}`
        );

        console.log(
            `Email: ${email}`
        );

        console.log(
            'Role: super_admin'
        );

        console.log('');


    } catch (error) {

        console.error(
            'ERROR:',
            error.message
        );

        process.exitCode = 1;

    } finally {

        await db.end();

        rl.close();
    }
};


main();