
const { test, expect } = require('@playwright/test');

const env = require('../../../config/env');
const { createTestUser } = require('../../../utils/user');
const { getAccessToken } = require('../../../utils/auth');
const { createCart } = require('../../../utils/cart');

let testUser;
let authToken;

test.beforeAll(async ({ request }) => {

    testUser = await createTestUser(request);

    expect(testUser).toBeDefined();
    expect(testUser.id).toBeDefined();
    expect(testUser.email).toBeDefined();
    expect(testUser.password).toBeDefined();

    authToken = await getAccessToken(
        request,
        testUser
    );

    expect(authToken).toBeDefined();
    expect(authToken).not.toBe('');

    console.log('\n==========================================');
    console.log('SHARED TEST USER');
    console.log('User ID :', testUser.id);
    console.log('Email   :', testUser.email);
    console.log('Token   : Generated');
    console.log('==========================================');
});


// ==========================================================
// TC-INVOICE-01
// Create invoice as registered user
// ==========================================================

test(
    'TC-INVOICE-01 Create invoice as registered user',
    async ({ request }) => {

        // ==================================================
        // 1. CREATE CART
        // ==================================================

        const cartId = await createCart(
            request,
            authToken
        );

        // createCart() returns the ID directly
        expect(cartId).toBeDefined();
        expect(cartId).not.toBe('');

        console.log('\n==========================================');
        console.log('CREATE CART');
        console.log('Cart ID :', cartId);
        console.log('==========================================');


        // ==================================================
        // 2. INVOICE REQUEST BODY
        // ==================================================

        const requestBody = {

            billing_street: 'Test street 98',

            billing_city: 'Vienna',

            billing_country: 'Austria',

            payment_method: 'bank-transfer',

            cart_id: cartId,

            payment_details: {
                bank_name: 'Test Bank',
                account_name: 'Jane Doe',
                account_number: '012345678'
            }
        };


        // ==================================================
        // 3. CREATE INVOICE
        // ==================================================

        const response = await request.post(
            `${env.baseURL}/invoices`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },

                data: requestBody
            }
        );

        const responseText = await response.text();


        // ==================================================
        // 4. DEBUG INFORMATION
        // ==================================================

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-01');
        console.log('Method         : POST');
        console.log('Endpoint       : /invoices');
        console.log('User ID        :', testUser.id);
        console.log('User Email     :', testUser.email);
        console.log('Cart ID        :', cartId);
        console.log('Status Code    :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');


        // ==================================================
        // 5. STATUS CODE
        // ==================================================

        expect(
            response.status(),
            `Invoice creation failed. Response: ${responseText}`
        ).toBe(201);


        // ==================================================
        // 6. PARSE RESPONSE
        // ==================================================

        const responseBody = JSON.parse(responseText);


        // ==================================================
        // 7. RESPONSE VALIDATION
        // ==================================================

        expect(responseBody).toHaveProperty('id');

        expect(responseBody).toHaveProperty(
            'invoice_number'
        );

        expect(responseBody).toHaveProperty(
            'user_id'
        );


        // ==================================================
        // 8. VERIFY INVOICE OWNER
        // ==================================================

        expect(responseBody.user_id).toBe(
            testUser.id
        );
    }
);

// ==========================================================
// TC-INVOICE-02
// Create invoice as guest
// ==========================================================

test(
    'TC-INVOICE-02 Create invoice as guest',
    async ({ request }) => {

        // ==================================================
        // 1. CREATE GUEST CART
        // ==================================================

        const cartId = await createCart(request);

        expect(cartId).toBeDefined();
        expect(cartId).not.toBe('');

        console.log('\n==========================================');
        console.log('CREATE GUEST CART');
        console.log('Cart ID :', cartId);
        console.log('==========================================');


        // ==================================================
        // 2. GUEST INVOICE REQUEST BODY
        // ==================================================

        const guestEmail =
            `guest_${Date.now()}@example.com`;

        const requestBody = {

            billing_street: 'Test street 98',

            billing_city: 'Vienna',

            billing_country: 'Austria',

            payment_method: 'bank-transfer',

            cart_id: cartId,

            payment_details: {
                bank_name: 'Test Bank',
                account_name: 'John Guest',
                account_number: '012345678'
            },

            guest_email: guestEmail,

            guest_first_name: 'John',

            guest_last_name: 'Guest'
        };


        // ==================================================
        // 3. CREATE GUEST INVOICE
        // ==================================================

        const response = await request.post(
            `${env.baseURL}/invoices/guest`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },

                data: requestBody
            }
        );

        const responseText = await response.text();


        // ==================================================
        // 4. DEBUG INFORMATION
        // ==================================================

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-02');
        console.log('Method         : POST');
        console.log('Endpoint       : /invoices/guest');
        console.log('User Type      : Guest');
        console.log('Guest Email    :', guestEmail);
        console.log('Cart ID        :', cartId);
        console.log('Status Code    :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');


        // ==================================================
        // 5. STATUS CODE VALIDATION
        // ==================================================

        expect(
            response.status(),
            `Guest invoice creation failed. Response: ${responseText}`
        ).toBe(201);


        // ==================================================
        // 6. PARSE RESPONSE
        // ==================================================

        const responseBody = JSON.parse(responseText);


        // ==================================================
        // 7. RESPONSE VALIDATION
        // ==================================================

        expect(responseBody).toHaveProperty('id');

        expect(responseBody).toHaveProperty(
            'invoice_number'
        );


        // ==================================================
        // 8. VERIFY GUEST INVOICE
        // ==================================================

        expect(responseBody.user_id).toBeNull();
    }
);

// ==========================================================
// TC-INVOICE-03
// Create invoice with empty cart
// ==========================================================

test(
    'TC-INVOICE-03 Create invoice with empty cart',
    async ({ request }) => {

        // ==========================================
        // 1. Create NEW empty cart
        // ==========================================

        const cart = await createCart(request, authToken);

        expect(cart).toBeDefined();
        expect(cart.id).toBeDefined();

        const emptyCartId = cart.id;

        // ==========================================
        // 2. Verify cart is empty
        // ==========================================

        expect(cart.cart_items).toEqual([]);

        // ==========================================
        // 3. Invoice Body
        // ==========================================

        const requestBody = {
            billing_street: 'Test street 98',
            billing_city: 'Vienna',
            billing_country: 'Austria',

            payment_method: 'bank-transfer',

            cart_id: emptyCartId,

            payment_details: {
                bank_name: 'Test Bank',
                account_name: 'Jane Doe',
                account_number: '012345678'
            }
        };

        // ==========================================
        // 4. Create Invoice
        // ==========================================

        const response = await request.post(
            `${env.baseURL}/invoices`,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                data: requestBody
            }
        );

        const responseText = await response.text();

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-03');
        console.log('Method         : POST');
        console.log('Endpoint       : /invoices');
        console.log('User Email     :', testUser.email);
        console.log('Cart ID        :', emptyCartId);
        console.log('Cart Status    :', cart.status || '200');
        console.log('Status Code    :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');

        // ==========================================
        // Expected: 422
        // ==========================================

        expect(response.status()).toBe(422);

        // ==========================================
        // Validate Error Message
        // ==========================================

        const responseBody = JSON.parse(responseText);

        expect(responseBody.message).toContain(
            'cart is empty'
        );
    }
);


// ==========================================================
// TC-INVOICE-04
// Get invoice list for logged-in user
// ==========================================================

test(
    'TC-INVOICE-04 Get invoice list for logged-in user',
    async ({ request }) => {

        // ==========================================
        // GET /invoices?page=1
        // ==========================================

        const response = await request.get(
            `${env.baseURL}/invoices?page=1`,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`
                }
            }
        );

        const responseText = await response.text();

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-04');
        console.log('Method         : GET');
        console.log('Endpoint       : /invoices?page=1');
        console.log('User Email     :', testUser.email);
        console.log('Status Code    :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');

        // ==========================================
        // Validate Status
        // ==========================================

        expect(response.status()).toBe(200);

        // ==========================================
        // Validate Response
        // ==========================================

        const responseBody = JSON.parse(responseText);

        expect(responseBody).toBeDefined();
    }
);





// ======================================================
// TC-INVOICE-05
// Get single invoice detail by valid ID
// ======================================================

test(
    'TC-INVOICE-05 Get single invoice detail by valid ID',
    async ({ request }) => {

        // ==================================================
        // 1. CREATE NEW TEST USER
        // ==================================================

        const testUser = await createTestUser(request);

        expect(testUser).toBeDefined();
        expect(testUser.email).toBeDefined();
        expect(testUser.password).toBeDefined();

        console.log('\n==========================================');
        console.log('CREATE TEST USER');
        console.log('Email :', testUser.email);
        console.log('==========================================');


        // ==================================================
        // 2. LOGIN WITH TEST USER
        // ==================================================

        const authToken = await getAccessToken(
            request,
            testUser
        );

        expect(authToken).toBeDefined();
        expect(authToken).not.toBe('');

        console.log('\n==========================================');
        console.log('LOGIN TEST USER');
        console.log('Email :', testUser.email);
        console.log('Token : Generated');
        console.log('==========================================');


        // ==================================================
        // 3. CREATE NEW CART
        // ==================================================
        // IMPORTANT:
        // createCart() returns the CART ID directly.
        // It does NOT return { id: ... }

        const cartId = await createCart(
            request,
            authToken
        );

        expect(cartId).toBeDefined();
        expect(cartId).not.toBe('');

        console.log('\n==========================================');
        console.log('CREATE CART');
        console.log('Cart ID :', cartId);
        console.log('==========================================');


        // ==================================================
        // 4. CREATE INVOICE
        // ==================================================

        const invoicePayload = {

            billing_street: 'Test street 98',

            billing_city: 'Vienna',

            billing_country: 'Austria',

            payment_method: 'bank-transfer',

            cart_id: cartId,

            payment_details: {
                bank_name: 'Test Bank',
                account_name: 'Jane Doe',
                account_number: '012345678'
            }
        };


        const createInvoiceResponse =
            await request.post(
                `${env.baseURL}/invoices`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },

                    data: invoicePayload
                }
            );


        const createInvoiceText =
            await createInvoiceResponse.text();


        // ==================================================
        // 5. LOG CREATE INVOICE RESULT
        // ==================================================

        console.log('\n==========================================');
        console.log('CREATE INVOICE');
        console.log('Method      : POST');
        console.log('Endpoint    : /invoices');
        console.log('Cart ID     :', cartId);
        console.log('Status Code :', createInvoiceResponse.status());
        console.log('Response    :', createInvoiceText);
        console.log('==========================================');


        // ==================================================
        // 6. VALIDATE INVOICE CREATION
        // ==================================================

        expect(
            createInvoiceResponse.status(),
            `Invoice creation failed. Response: ${createInvoiceText}`
        ).toBe(201);


        const createdInvoice =
            JSON.parse(createInvoiceText);


        expect(createdInvoice).toBeDefined();

        expect(createdInvoice).toHaveProperty('id');

        expect(createdInvoice.id).toBeDefined();

        expect(createdInvoice.id).not.toBe('');


        // ==================================================
        // 7. GET DYNAMICALLY CREATED INVOICE ID
        // ==================================================

        const invoiceId =
            createdInvoice.id;


        console.log('\n==========================================');
        console.log('CREATED INVOICE');
        console.log('Invoice ID :', invoiceId);
        console.log('==========================================');


        // ==================================================
        // 8. GET SINGLE INVOICE DETAIL
        // ==================================================

        const getInvoiceResponse =
            await request.get(
                `${env.baseURL}/invoices/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Accept': 'application/json'
                    }
                }
            );


        const getInvoiceText =
            await getInvoiceResponse.text();


        // ==================================================
        // 9. TEST RESULT LOG
        // ==================================================

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-05');
        console.log('Method         : GET');
        console.log('Endpoint       : /invoices/{invoice_id}');
        console.log('User Email     :', testUser.email);
        console.log('Invoice ID     :', invoiceId);
        console.log('Status Code    :', getInvoiceResponse.status());
        console.log('Response Body  :', getInvoiceText);
        console.log('==========================================');


        // ==================================================
        // 10. VALIDATE STATUS CODE
        // ==================================================

        expect(
            getInvoiceResponse.status()
        ).toBe(200);


        // ==================================================
        // 11. VALIDATE RESPONSE BODY
        // ==================================================

        const invoiceDetails =
            JSON.parse(getInvoiceText);


        expect(invoiceDetails).toBeDefined();

        expect(invoiceDetails).toHaveProperty('id');

        expect(invoiceDetails.id).toBe(invoiceId);


        // ==================================================
        // 12. FINAL RESULT
        // ==================================================

        console.log('\n==========================================');
        console.log('TC-INVOICE-05 PASSED');
        console.log('Invoice ID :', invoiceId);
        console.log('Status     : 200 OK');
        console.log('==========================================');
    }
);

test(
    'TC-INVOICE-06 Get single invoice detail by valid ID',
    async ({ request }) => {

        // ==========================================
        // 1. Create NEW test user
        // ==========================================

        const testUser = await createTestUser(request);

        expect(testUser).toBeDefined();
        expect(testUser.email).toBeDefined();
        expect(testUser.password).toBeDefined();


        // ==========================================
        // 2. Generate NEW access token
        // ==========================================

        const token = await getAccessToken(
            request,
            testUser
        );

        expect(token).toBeDefined();
        expect(token).not.toBe('');


        // ==========================================
        // 3. Create NEW authenticated cart
        // ==========================================

        const cartId = await createCart(
            request,
            token
        );

        expect(cartId).toBeDefined();
        expect(cartId).not.toBe('');


        // ==========================================
        // 4. Create invoice
        // ==========================================

        const createInvoiceResponse = await request.post(
            `${env.baseURL}/invoices`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                data: {
                    billing_street: 'Test street 98',
                    billing_city: 'Vienna',
                    billing_country: 'Austria',
                    payment_method: 'bank-transfer',

                    cart_id: cartId,

                    payment_details: {
                        bank_name: 'Test Bank',
                        account_name: 'Jane Doe',
                        account_number: '012345678'
                    }
                }
            }
        );

        const createInvoiceText =
            await createInvoiceResponse.text();

        console.log('\n==========================================');
        console.log('CREATE INVOICE');
        console.log('Status   :', createInvoiceResponse.status());
        console.log('Response :', createInvoiceText);
        console.log('==========================================');

        expect(
            createInvoiceResponse.status(),
            `Invoice creation failed: ${createInvoiceText}`
        ).toBe(201);


        // ==========================================
        // 5. Get DYNAMIC invoice ID
        // ==========================================

        const invoiceBody =
            JSON.parse(createInvoiceText);

        const invoiceId = invoiceBody.id;

        expect(invoiceId).toBeDefined();
        expect(invoiceId).not.toBe('');


        // ==========================================
        // 6. GET SAME invoice using dynamic ID
        // ==========================================

        const response = await request.get(
            `${env.baseURL}/invoices/${invoiceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        const responseText =
            await response.text();


        // ==========================================
        // 7. Result
        // ==========================================

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-06');
        console.log('Method         : GET');
        console.log('Endpoint       : /invoices/{invoice_id}');
        console.log('User Email     :', testUser.email);
        console.log('Invoice ID     :', invoiceId);
        console.log('Status Code    :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');


        // ==========================================
        // 8. Validate status
        // ==========================================

        expect(response.status()).toBe(200);


        // ==========================================
        // 9. Validate returned invoice ID
        // ==========================================

        const responseBody =
            JSON.parse(responseText);

        expect(responseBody.id).toBe(invoiceId);


        console.log('\n==========================================');
        console.log('TC-INVOICE-06 PASSED');
        console.log('Status    : 200 OK');
        console.log('Invoice ID:', invoiceId);
        console.log('==========================================');
    }
);



test(
    'TC-INVOICE-07 Get another user invoice using different user token',
    async ({ request }) => {

        // =====================================================
        // 1. CREATE USER A
        // =====================================================

        const timestampA = Date.now();

        const userA = {
            first_name: 'QA',
            last_name: 'UserA',

            address: {
                street: 'Test Street',
                house_number: '98',
                city: 'Vienna',
                state: 'Vienna',
                country: 'Austria',
                postal_code: '1010'
            },

            phone: `01${timestampA.toString().slice(-8)}`,
            dob: '1990-01-01',
            password: `Qa@${timestampA}Xy!`,
            email: `qa_user_A_${timestampA}@example.com`
        };

        const registerA = await request.post(
            `${env.baseURL}/users/register`,
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: userA
            }
        );

        const registerAText = await registerA.text();

        console.log(`
==========================================
CREATE USER A
Status   : ${registerA.status()}
Email    : ${userA.email}
Response : ${registerAText}
==========================================
`);

        expect(
            registerA.status(),
            `User A registration failed: ${registerAText}`
        ).toBe(201);

        const userABody = JSON.parse(registerAText);

        expect(userABody.id).toBeDefined();

        // =====================================================
        // 2. LOGIN USER A
        // =====================================================

        const tokenA = await getAccessToken(
            request,
            {
                email: userA.email,
                password: userA.password
            }
        );

        expect(tokenA).toBeDefined();
        expect(tokenA).not.toBe('');

        console.log(`
==========================================
USER A
Email : ${userA.email}
Token : Generated
==========================================
`);

        // =====================================================
        // 3. CREATE CART FOR USER A
        // =====================================================

        const cartResponse = await request.post(
            `${env.baseURL}/carts`,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${tokenA}`
                }
            }
        );

        const cartText = await cartResponse.text();

        console.log(`
==========================================
CREATE CART - USER A
Status   : ${cartResponse.status()}
Response : ${cartText}
==========================================
`);

        expect(
            cartResponse.status(),
            `Cart creation failed: ${cartText}`
        ).toBe(201);

        const cartBody = JSON.parse(cartText);

        expect(cartBody.id).toBeDefined();

        const cartId = cartBody.id;

        // =====================================================
        // 4. CREATE INVOICE FOR USER A
        // =====================================================

        const createInvoiceResponse = await request.post(
            `${env.baseURL}/invoices`,
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenA}`
                },

                data: {
                    billing_street: 'Test street 98',
                    billing_city: 'Vienna',
                    billing_country: 'Austria',

                    payment_method: 'bank-transfer',

                    cart_id: cartId,

                    payment_details: {
                        bank_name: 'Test Bank',
                        account_name: 'Jane Doe',
                        account_number: '012345678'
                    }
                }
            }
        );

        const invoiceText =
            await createInvoiceResponse.text();

        console.log(`
==========================================
CREATE INVOICE - USER A
Status   : ${createInvoiceResponse.status()}
Response : ${invoiceText}
==========================================
`);

        expect(
            createInvoiceResponse.status(),
            `Invoice creation failed: ${invoiceText}`
        ).toBe(201);

        const invoiceBody =
            JSON.parse(invoiceText);

        expect(invoiceBody.id).toBeDefined();

        const invoiceId =
            invoiceBody.id;

        console.log(`
==========================================
USER A INVOICE
Invoice ID : ${invoiceId}
Owner      : ${userA.email}
==========================================
`);

        // =====================================================
        // 5. CREATE COMPLETELY DIFFERENT USER B
        // =====================================================

        const timestampB = Date.now() + 1;

        const userB = {
            first_name: 'QA',
            last_name: 'UserB',

            address: {
                street: 'Another Test Street',
                house_number: '99',
                city: 'Vienna',
                state: 'Vienna',
                country: 'Austria',
                postal_code: '1010'
            },

            phone: `01${timestampB.toString().slice(-8)}`,
            dob: '1991-01-01',
            password: `Qa@${timestampB}Xy!`,
            email: `qa_user_B_${timestampB}@example.com`
        };

        const registerB = await request.post(
            `${env.baseURL}/users/register`,
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },

                data: userB
            }
        );

        const registerBText =
            await registerB.text();

        console.log(`
==========================================
CREATE USER B
Status   : ${registerB.status()}
Email    : ${userB.email}
Response : ${registerBText}
==========================================
`);

        expect(
            registerB.status(),
            `User B registration failed: ${registerBText}`
        ).toBe(201);

        const userBBody =
            JSON.parse(registerBText);

        expect(userBBody.id).toBeDefined();

        // =====================================================
        // 6. VERIFY USER A AND USER B ARE DIFFERENT
        // =====================================================

        expect(userB.email).not.toBe(userA.email);

        expect(userBBody.id).not.toBe(
            userABody.id
        );

        // =====================================================
        // 7. LOGIN USER B
        // =====================================================

        const tokenB = await getAccessToken(
            request,
            {
                email: userB.email,
                password: userB.password
            }
        );

        expect(tokenB).toBeDefined();
        expect(tokenB).not.toBe('');

        // User B must have a different authentication token
        expect(tokenB).not.toBe(tokenA);

        console.log(`
==========================================
USER B
Email : ${userB.email}
Token : Generated
==========================================
`);

        // =====================================================
        // 8. USER B ATTEMPTS TO ACCESS USER A'S INVOICE
        // =====================================================

        const response = await request.get(
            `${env.baseURL}/invoices/${invoiceId}`,
            {
                headers: {
                    Accept: 'application/json',

                    // IMPORTANT:
                    // Invoice belongs to User A
                    // Request is made using User B token
                    Authorization: `Bearer ${tokenB}`
                }
            }
        );

        const responseText =
            await response.text();

        console.log(`
==========================================
Test Case      : TC-INVOICE-07

Method         : GET
Endpoint       : /invoices/{invoice_id}

Invoice Owner  : ${userA.email}
Requester      : ${userB.email}

Invoice ID     : ${invoiceId}

Token A        : Different
Token B        : Different

Expected Status: 404
Actual Status  : ${response.status()}

Response Body  : ${responseText}
==========================================
`);

        // =====================================================
        // 9. VALIDATE STATUS
        // =====================================================

        expect(
            response.status(),
            `User B accessed User A's invoice. Response: ${responseText}`
        ).toBe(404);

        // =====================================================
        // 10. VALIDATE RESPONSE MESSAGE
        // =====================================================

        const responseBody =
            JSON.parse(responseText);

        expect(responseBody).toHaveProperty(
            'message',
            'Requested item not found'
        );

        console.log(`
==========================================
TC-INVOICE-07 PASSED

User A Invoice : ${invoiceId}
User A         : ${userA.email}
User B         : ${userB.email}

Expected       : 404
Actual         : ${response.status()}

Message        : ${responseBody.message}
==========================================
`);
    }
);

test(
    'TC-INVOICE-08 Access invoice endpoint without token',
    async ({ request }) => {

        // =====================================================
        // 1. CREATE NEW TEST USER
        // =====================================================

        const user = await createTestUser(request);

        expect(user).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.password).toBeDefined();


        // =====================================================
        // 2. LOGIN USER
        // =====================================================

        const token = await getAccessToken(request, user);

        expect(token).toBeDefined();
        expect(token).not.toBe('');


        // =====================================================
        // 3. CREATE NEW CART
        // =====================================================

        const cartId = await createCart(request);

        expect(cartId).toBeDefined();

        console.log('\n==========================================');
        console.log('CREATE CART');
        console.log('Cart ID :', cartId);
        console.log('==========================================');


        // =====================================================
        // 4. CREATE INVOICE AS AUTHENTICATED USER
        // =====================================================

        const invoiceBody = {
            billing_street: 'Test street 98',
            billing_city: 'Vienna',
            billing_country: 'Austria',
            payment_method: 'bank-transfer',

            cart_id: cartId,

            payment_details: {
                bank_name: 'Test Bank',
                account_name: 'Jane Doe',
                account_number: '012345678'
            }
        };


        const createInvoiceResponse = await request.post(
            `${env.baseURL}/invoices`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',

                    // Token is required ONLY for invoice creation
                    'Authorization': `Bearer ${token}`
                },

                data: invoiceBody
            }
        );

        const createInvoiceText =
            await createInvoiceResponse.text();

        console.log('\n==========================================');
        console.log('CREATE INVOICE');
        console.log('Status   :', createInvoiceResponse.status());
        console.log('Response :', createInvoiceText);
        console.log('==========================================');


        // Invoice must be created successfully
        expect(createInvoiceResponse.status()).toBe(201);


        // =====================================================
        // 5. GET DYNAMIC INVOICE ID
        // =====================================================

        const invoiceBodyResponse =
            JSON.parse(createInvoiceText);

        expect(invoiceBodyResponse).toHaveProperty('id');

        const invoiceId = invoiceBodyResponse.id;

        expect(invoiceId).toBeDefined();
        expect(invoiceId).not.toBe('');


        console.log('\n==========================================');
        console.log('DYNAMIC INVOICE CREATED');
        console.log('Invoice ID :', invoiceId);
        console.log('Owner      :', user.email);
        console.log('==========================================');


        // =====================================================
        // 6. ACCESS INVOICE WITHOUT TOKEN
        // =====================================================

        // IMPORTANT:
        // এখানে Authorization header intentionally দেওয়া হয়নি.

        const response = await request.get(
            `${env.baseURL}/invoices/${invoiceId}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );


        const responseText = await response.text();

        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-08');
        console.log('Method         : GET');
        console.log('Endpoint       : /invoices/{invoice_id}');
        console.log('Invoice Owner  :', user.email);
        console.log('Invoice ID     :', invoiceId);
        console.log('Authorization  : NOT PROVIDED');
        console.log('Expected Status: 401');
        console.log('Actual Status  :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');


        // =====================================================
        // 7. VALIDATE STATUS
        // =====================================================

        expect(response.status()).toBe(401);


        // =====================================================
        // 8. VALIDATE RESPONSE MESSAGE
        // =====================================================

        const responseBody = JSON.parse(responseText);

        expect(responseBody).toHaveProperty(
            'message',
            'Unauthorized'
        );
    }
);


test(
    'TC-INVOICE-09 Access invoice endpoint with invalid token',
    async ({ request }) => {

        // =====================================================
        // 1. CREATE TEST USER
        // =====================================================

        const user = await createTestUser(request);

        expect(user).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.password).toBeDefined();


        // =====================================================
        // 2. LOGIN USER
        // =====================================================

        const token = await getAccessToken(request, user);

        expect(token).toBeDefined();
        expect(token).not.toBe('');


        console.log('\n==========================================');
        console.log('LOGIN TEST USER');
        console.log('Email :', user.email);
        console.log('Token : Generated');
        console.log('==========================================');


        // =====================================================
        // 3. CREATE CART
        // =====================================================

        const cartId = await createCart(request);

        expect(cartId).toBeDefined();


        console.log('\n==========================================');
        console.log('CREATE CART');
        console.log('Cart ID :', cartId);
        console.log('==========================================');


        // =====================================================
        // 4. CREATE INVOICE USING VALID TOKEN
        // =====================================================

        const invoiceBody = {
            billing_street: 'Test street 98',
            billing_city: 'Vienna',
            billing_country: 'Austria',
            payment_method: 'bank-transfer',

            cart_id: cartId,

            payment_details: {
                bank_name: 'Test Bank',
                account_name: 'Jane Doe',
                account_number: '012345678'
            }
        };


        const createInvoiceResponse = await request.post(
            `${env.baseURL}/invoices`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },

                data: invoiceBody
            }
        );


        const createInvoiceText =
            await createInvoiceResponse.text();


        console.log('\n==========================================');
        console.log('CREATE INVOICE');
        console.log('Status   :', createInvoiceResponse.status());
        console.log('Response :', createInvoiceText);
        console.log('==========================================');


        // Invoice must be created successfully
        expect(createInvoiceResponse.status()).toBe(201);


        // =====================================================
        // 5. GET DYNAMIC INVOICE ID
        // =====================================================

        const invoice = JSON.parse(createInvoiceText);

        expect(invoice).toHaveProperty('id');

        const invoiceId = invoice.id;

        expect(invoiceId).toBeDefined();
        expect(invoiceId).not.toBe('');


        console.log('\n==========================================');
        console.log('INVOICE CREATED');
        console.log('Invoice ID :', invoiceId);
        console.log('Owner      :', user.email);
        console.log('==========================================');


        // =====================================================
        // 6. CREATE INVALID TOKEN
        // =====================================================
        //
        // We are NOT waiting for token expiry.
        //
        // We intentionally modify the valid token so that
        // it becomes invalid.
        // =====================================================

        const invalidToken = `${token}invalid`;


        console.log('\n==========================================');
        console.log('INVALID TOKEN');
        console.log('Valid Token   : Generated');
        console.log('Invalid Token : Tampered');
        console.log('==========================================');


        // =====================================================
        // 7. ACCESS INVOICE WITH INVALID TOKEN
        // =====================================================

        const response = await request.get(
            `${env.baseURL}/invoices/${invoiceId}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${invalidToken}`
                }
            }
        );


        const responseText = await response.text();


        console.log('\n==========================================');
        console.log('Test Case      : TC-INVOICE-09');
        console.log('Method         : GET');
        console.log('Endpoint       : /invoices/{invoice_id}');
        console.log('Invoice ID     :', invoiceId);
        console.log('User           :', user.email);
        console.log('Token Type     : INVALID TOKEN');
        console.log('Expected Status: 401');
        console.log('Actual Status  :', response.status());
        console.log('Response Body  :', responseText);
        console.log('==========================================');


        // =====================================================
        // 8. VALIDATE STATUS CODE
        // =====================================================

        expect(response.status()).toBe(401);


        // =====================================================
        // 9. VALIDATE RESPONSE MESSAGE
        // =====================================================

        const responseBody = JSON.parse(responseText);

        expect(responseBody).toHaveProperty(
            'message',
            'Unauthorized'
        );
    }
);