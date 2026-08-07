const { expect } = require('@playwright/test');
const env = require('../config/env');

async function getAccessToken(request, user) {

    // ==========================================
    // Validate user credentials
    // ==========================================

    if (!user || !user.email || !user.password) {
        throw new Error(
            `Invalid user credentials. Email: ${user?.email}, Password exists: ${!!user?.password}`
        );
    }

    // ==========================================
    // Login
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/users/login`,
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                email: user.email,
                password: user.password
            }
        }
    );

    const responseText = await response.text();

    console.log(`
==========================================
LOGIN TEST USER
Email  : ${user.email}
Status : ${response.status()}
==========================================
`);

    // ==========================================
    // Validate login
    // ==========================================

    if (response.status() !== 200) {
        throw new Error(
            `Login failed. Status: ${response.status()}, Response: ${responseText}`
        );
    }

    // ==========================================
    // Parse response
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('access_token');

    return responseBody.access_token;
}

module.exports = {
    getAccessToken
};