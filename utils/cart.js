const { expect } = require('@playwright/test');
const env = require('../config/env');

async function createCart(request, token = null) {

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    // Authenticated cart হলে token পাঠাবে
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await request.post(
        `${env.baseURL}/carts`,
        {
            headers
        }
    );

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('CREATE CART');
    console.log('Authenticated :', token ? 'YES' : 'NO');
    console.log('Status        :', response.status());
    console.log('Response      :', responseText);
    console.log('==========================================');

    expect(
        response.status(),
        `Cart creation failed: ${responseText}`
    ).toBe(201);

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('id');

    return responseBody.id;
}

module.exports = {
    createCart
};