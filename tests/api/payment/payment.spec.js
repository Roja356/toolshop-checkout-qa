const { test, expect } = require('@playwright/test');
const env = require('../../../config/env');


test('TC-PAYMENT-01 Validate payment with correct payment method/details', async ({ request }) => {

    // ==========================================
    // Request Body
    // ==========================================

    const requestBody = {
        payment_method: 'bank-transfer',

        payment_details: {
            bank_name: 'string',
            account_name: 'string',
            account_number: '012345678'
        }
    };

    // ==========================================
    // Send Request
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/payment/check`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        }
    );

    // ==========================================
    // Read Response
    // ==========================================

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case      : TC-PAYMENT-01');
    console.log('Method         : POST');
    console.log('Endpoint       : /payment/check');
    console.log('Payment Method :', requestBody.payment_method);
    console.log('Status Code    :', response.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // Expected Status
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Validate Response
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('message');

    expect(responseBody.message).toBe(
        'Payment was successful'
    );

});


test('TC-PAYMENT-02 Validate payment with missing required fields', async ({ request }) => {

    // ==========================================
    // Request Body
    // account_number intentionally missing
    // ==========================================

    const requestBody = {
        payment_method: 'bank-transfer',

        payment_details: {
            bank_name: 'string',
            account_name: 'string'
        }
    };

    // ==========================================
    // Send Request
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/payment/check`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        }
    );

    // ==========================================
    // Read Response
    // ==========================================

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case      : TC-PAYMENT-02');
    console.log('Method         : POST');
    console.log('Endpoint       : /payment/check');
    console.log('Payment Method :', requestBody.payment_method);
    console.log('Status Code    :', response.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // Expected Status Code
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // Validate Error Message
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('message');

    expect(responseBody.message).toBe(
        'The payment details.account number field is required.'
    );

});



test('TC-PAYMENT-03 Validate payment with invalid/malformed payment data', async ({ request }) => {

    // ==========================================
    // Request Body
    // Invalid account number format
    // ==========================================

    const requestBody = {
        payment_method: 'bank-transfer',

        payment_details: {
            bank_name: 'string',
            account_name: 'string',
            account_number: ' 012345678'
        }
    };

    // ==========================================
    // Send Request
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/payment/check`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        }
    );

    // ==========================================
    // Read Response
    // ==========================================

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case      : TC-PAYMENT-03');
    console.log('Method         : POST');
    console.log('Endpoint       : /payment/check');
    console.log('Payment Method :', requestBody.payment_method);
    console.log('Account Number :', requestBody.payment_details.account_number);
    console.log('Status Code    :', response.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // Expected Status Code
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // Validate Error Message
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('message');

    expect(responseBody.message).toBe(
        'The payment details.account number field format is invalid.'
    );

});