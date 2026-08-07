const { test, expect } = require('@playwright/test');
const env = require('../../../config/env');
const { getAccessToken } = require('../../../utils/auth');
const { createTestUser } = require('../../../utils/user');

test.describe('Authentication API', () => {

    test('TC-AUTH-01 Login with valid credentials', async ({ request }) => {

        // ==========================================
        // 1. Create a valid test user
        // ==========================================

        const user = await createTestUser(request);

        expect(user).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.password).toBeDefined();

        console.log('\n==========================================');
        console.log('LOGIN TEST USER');
        console.log('Email    :', user.email);
        console.log('Password : Generated');
        console.log('==========================================');

        // ==========================================
        // 2. Login with valid credentials
        // ==========================================

        const response = await request.post(
            `${env.baseURL}/users/login`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: {
                    email: user.email,
                    password: user.password
                }
            }
        );

        // ==========================================
        // 3. Read response
        // ==========================================

        const responseText = await response.text();

        console.log('\n==========================================');
        console.log('TC-AUTH-01');
        console.log('Method       : POST');
        console.log('Endpoint     : /users/login');
        console.log('User Email   :', user.email);
        console.log('Status Code  :', response.status());
        console.log('Response Body:', responseText);
        console.log('==========================================');

        // ==========================================
        // 4. Validate status
        // ==========================================

        expect(response.status()).toBe(200);

        // ==========================================
        // 5. Validate response body
        // ==========================================

        const responseBody = JSON.parse(responseText);

        expect(responseBody).toBeDefined();

        // Login response should contain an access token
        expect(responseBody.access_token).toBeDefined();
        expect(typeof responseBody.access_token).toBe('string');
        expect(responseBody.access_token.length).toBeGreaterThan(0);
    });
});





    test('TC-AUTH-02 Login with invalid password', async ({ request }) => {

    // ==========================================
    // Arrange
    // Use valid email + intentionally wrong password
    // ==========================================

    const loginPayload = {
        email: process.env.EMAIL,
        password: 'WrongPassword123'
    };

    // ==========================================
    // Act
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/users/login`,
        {
            data: loginPayload,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    );

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log('\n==========================================');
    console.log('Test Case   : TC-AUTH-02');
    console.log('Method      : POST');
    console.log('Endpoint    : /users/login');
    console.log('Email       :', process.env.EMAIL);
    console.log('Status Code :', response.status());
    console.log('Response Body:', responseBody);
    console.log('==========================================\n');

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(401);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Unauthorized');

    // Invalid password must not return access token
    expect(responseBody.access_token).toBeUndefined();
});

     test('TC-AUTH-03 Login with non-existing Emails', async ({ request }) => {

        // Arrange
        const loginPayload = {
            email:"bushra2@practicesoftwaretesting.com",
            password: env.password,
            
        };

        // Act
        const response = await request.post(`${env.baseURL}/users/login`, {
            data: loginPayload,
            headers: {
                'Content-Type': 'application/json'
            }
        });

         const responseBody = await response.json();

    // Debug Output
    console.log("\n==========================================");
    console.log("Test Case   : TC-AUTH-03");
    console.log("Status Code :", response.status());
    console.log("Response Body:");
    console.log(responseBody);
    console.log("==========================================\n");

    // Assert - Status Code
    expect(response.status()).toBe(401);

    // Assert - Response Body
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Unauthorized');
    expect(responseBody.access_token).toBeUndefined();

});

   test('TC-AUTH-04 Login with Empty password field', async ({ request }) => {

    // Arrange
    const loginPayload = {
        email: env.email
    };

    // Act
    const response = await request.post(`${env.baseURL}/users/login`, {
        data: loginPayload,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Read Response Body
    const responseBody = await response.json();

    // Debug Output
    console.log("\n==========================================");
    console.log("Test Case   : TC-AUTH-04");
    console.log("Status Code :", response.status());
    console.log("Response Body:");
    console.log(responseBody);
    console.log("==========================================\n");

    // Assert - Status Code
    expect(response.status()).toBe(401);

    // Assert - Response Body
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid login request');
    expect(responseBody.access_token).toBeUndefined();

});


test('TC-AUTH-05 Login with malformed JSON body', async ({ request }) => {

        // Arrange
        const loginPayload = {
            email: env.email,
            password: " Qa@ToolShop2026!"
        };

        // Act
        const response = await request.post(`${env.baseURL}/users/login`, {
            data: loginPayload,
            headers: {
                'Content-Type': 'application/json'
            }
        });

         const responseBody = await response.json();

    // Debug Output
    console.log("\n==========================================");
    console.log("Test Case   : TC-AUTH-05");
    console.log("Status Code :", response.status());
    console.log("Response Body:");
    console.log(responseBody);
    console.log("==========================================\n");

    // Assert - Status Code
    expect(response.status()).toBe(401);

    // Assert - Response Body
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Unauthorized');
    expect(responseBody.access_token).toBeUndefined();

});

   test('TC-AUTH-06 Get current user info with valid token', async ({ request }) => {

    // ==========================================
    // 1. Create a fresh valid test user
    // ==========================================

    const user = await createTestUser(request);

    expect(user).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.password).toBeDefined();

    // ==========================================
    // 2. Login using the same user credentials
    // ==========================================

    const loginResponse = await request.post(
        `${env.baseURL}/users/login`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: {
                email: user.email,
                password: user.password
            }
        }
    );

    const loginText = await loginResponse.text();

    console.log('\n==========================================');
    console.log('TC-AUTH-06 LOGIN');
    console.log('Email       :', user.email);
    console.log('Status Code :', loginResponse.status());
    console.log('Response    :', loginText);
    console.log('==========================================');

    expect(
        loginResponse.status(),
        `Login failed: ${loginText}`
    ).toBe(200);

    const loginBody = JSON.parse(loginText);

    expect(loginBody.access_token).toBeDefined();

    const token = loginBody.access_token;

    // ==========================================
    // 3. Get current user
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/users/me`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        }
    );

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case   : TC-AUTH-06');
    console.log('Method      : GET');
    console.log('Endpoint    : /users/me');
    console.log('User Email  :', user.email);
    console.log('Status Code :', response.status());
    console.log('Response    :', responseText);
    console.log('==========================================');

    // ==========================================
    // 4. Validate status
    // ==========================================

    expect(
        response.status(),
        `GET /users/me failed: ${responseText}`
    ).toBe(200);

    const responseBody = JSON.parse(responseText);

    // ==========================================
    // 5. Validate response
    // ==========================================

    expect(responseBody).toHaveProperty('id');
    expect(responseBody).toHaveProperty('email');
    expect(responseBody).toHaveProperty('first_name');
    expect(responseBody).toHaveProperty('last_name');

    // ==========================================
    // 6. Verify correct logged-in user
    // ==========================================

    expect(responseBody.email).toBe(user.email);
});
    test('TC-AUTH-07 Get current user info without token', async ({ request }) => {

        // Act - No Authorization header sent
        const response = await request.get(`${env.baseURL}/users/me`);

        // Assert - Status Code
        expect(response.status()).toBe(401);

        // Assert - Response Body
        const responseBody = await response.json();

        // Debug Output
        console.log("\n==========================================");
        console.log("Test Case   : TC-AUTH-07");
        console.log("Status Code :", response.status());
        console.log("Response Body:");
        console.log(responseBody);
        console.log("==========================================\n");

        // Assertion - Unauthorized message present
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Unauthorized');

    });



    test('TC-AUTH-08 Get current user info with expired token', async ({ request }) => {

        // Increase timeout for this test since it needs to wait for token expiry
        test.setTimeout(370000); // 360 seconds = 6 minutes (extra buffer)

        // Arrange - Get a valid token
        const token = await getAccessToken(request);
        console.log("Token obtained. Waiting for expiry (5 minutes)...");

        // Wait for the token to expire (expires_in: 300 seconds)
        await new Promise(resolve => setTimeout(resolve, 308000)); // 308 seconds

        // Act - Use the now-expired token
        const response = await request.get(`${env.baseURL}/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Assert - Status Code
        expect(response.status()).toBe(401);

        // Assert - Response Body
        const responseBody = await response.json();

        // Debug Output
        console.log("\n==========================================");
        console.log("Test Case   : TC-AUTH-08");
        console.log("Status Code :", response.status());
        console.log("Response Body:");
        console.log(responseBody);
        console.log("==========================================\n");

        // Assertion
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Unauthorized');

    });


    