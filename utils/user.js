const { expect } = require('@playwright/test');
const env = require('../config/env');

let cachedUser = null;

async function createTestUser(request, forceNew = false) {

    // ==================================================
    // REUSE EXISTING USER
    // ==================================================

    if (cachedUser && !forceNew) {

        console.log('\n==========================================');
        console.log('REUSING EXISTING TEST USER');
        console.log('Email :', cachedUser.email);
        console.log('==========================================');

        return cachedUser;
    }


    // ==================================================
    // GENERATE UNIQUE USER DATA
    // ==================================================

    const timestamp = Date.now();

    const user = {

        first_name: 'QA',

        last_name: 'Automation',

        address: {
            street: 'Test Street',
            house_number: '98',
            city: 'Vienna',
            state: 'Vienna',
            country: 'Austria',
            postal_code: '1010'
        },

        phone: `01${timestamp.toString().slice(-8)}`,

        dob: '1990-01-01',

        password: `Qa@${timestamp}Xy!`,

        email: `qa_user_${timestamp}@example.com`
    };


    // ==================================================
    // REGISTER USER
    // ==================================================

    const response = await request.post(
        `${env.baseURL}/users/register`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },

            data: user
        }
    );

    const responseText = await response.text();


    console.log('\n==========================================');
    console.log('CREATE TEST USER');
    console.log('Status   :', response.status());
    console.log('Email    :', user.email);
    console.log('Response :', responseText);
    console.log('==========================================');


    // ==================================================
    // VALIDATE REGISTRATION
    // ==================================================

    expect(
        response.status(),
        `User registration failed. Response: ${responseText}`
    ).toBe(201);


    // ==================================================
    // BUILD USER OBJECT
    // ==================================================

    let registeredUser = {

        email: user.email,

        password: user.password
    };


    // ==================================================
    // TRY TO GET USER ID FROM RESPONSE
    // ==================================================

    try {

        const responseBody = JSON.parse(responseText);

        if (responseBody.id) {
            registeredUser.id = responseBody.id;
        }

    } catch (error) {

        console.log('Registration response is not valid JSON.');
    }


    // ==================================================
    // CACHE ONLY NORMAL USER
    // ==================================================
    // forceNew user will NOT replace the shared cached user.
    // This prevents other tests from being affected.

    if (!forceNew) {
        cachedUser = registeredUser;
    }


    return registeredUser;
}


module.exports = {
    createTestUser
};