const { test, expect } = require('@playwright/test');
const env = require('../../../config/env');
const { createCart } = require('../../../utils/cart');
const { getFirstProductId } = require('../../../utils/product');

test.describe('CartAPI', () => {




test('TC-CART-01 Create a new empty cart', async ({ request }) => {

    // ==========================================
    // Act
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/carts`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(201);

    // ==========================================
    // Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-CART-01");
    console.log("Request Method : POST");
    console.log("Request URL    :", `${env.baseURL}/carts`);
    console.log("Status Code    :", response.status());
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toBeDefined();

    // Verify cart ID exists
    expect(responseBody).toHaveProperty('id');
});
});


test('TC-CART-02 Add valid item to cart', async ({ request }) => {

    // Create fresh cart
    const cartId = await createCart(request);

    // Get existing product ID dynamically
    const productId = await getFirstProductId(request);

    const requestBody = {
        product_id: productId,
        quantity: 1
    };

    const response = await request.post(
        `${env.baseURL}/carts/${cartId}`,
        {
            data: requestBody
        }
    );

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    console.log("\n==========================================");
    console.log("Test Case   : TC-CART-02");
    console.log("Status Code :", response.status());
    console.log("Cart ID     :", cartId);
    console.log("Product ID  :", productId);
    console.log("Quantity    :", requestBody.quantity);
    console.log("==========================================");

    console.log(JSON.stringify(responseBody, null, 2));

    expect(responseBody).toBeDefined();
});

test('TC-CART-03 Add item with quantity 0', async ({ request }) => {

    // ==========================================
    // 1. Create a new cart
    // ==========================================

    const createCartResponse = await request.post(
        `${env.baseURL}/carts`
    );

    expect(createCartResponse.status()).toBe(201);

    const cart = await createCartResponse.json();

    expect(cart).toHaveProperty('id');

    const cartId = cart.id;

    // ==========================================
    // 2. Verify the created cart
    // ==========================================

    const verifyCartResponse = await request.get(
        `${env.baseURL}/carts/${cartId}`
    );

    expect(verifyCartResponse.status()).toBe(200);

    // ==========================================
    // 3. Get a currently existing product
    // ==========================================

    const productsResponse = await request.get(
        `${env.baseURL}/products?page=1`
    );

    expect(productsResponse.status()).toBe(200);

    const productsBody = await productsResponse.json();

    expect(productsBody).toHaveProperty('data');
    expect(productsBody.data.length).toBeGreaterThan(0);

    const productId = productsBody.data[0].id;

    expect(productId).toBeDefined();

    // ==========================================
    // 4. Add product with quantity 0
    // ==========================================

    const requestBody = {
        product_id: productId,
        quantity: 0
    };

    const response = await request.post(
        `${env.baseURL}/carts/${cartId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        }
    );

    // ==========================================
    // 5. Response
    // ==========================================

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case      : TC-CART-03');
    console.log('Method         : POST');
    console.log('Endpoint       : /carts/{cartId}');
    console.log('Cart ID        :', cartId);
    console.log('Product ID     :', productId);
    console.log('Quantity       :', requestBody.quantity);
    console.log('Status Code    :', response.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // 6. Expected Status
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // 7. Validate error message
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('errors');
    expect(responseBody.errors).toHaveProperty('quantity');

    expect(responseBody.errors.quantity).toContain(
        'The quantity field must be at least 1.'
    );
});



test('TC-CART-04 Add item with negative quantity', async ({ request }) => {

    // ==========================================
    // 1. Create a new cart
    // ==========================================

    const createCartResponse = await request.post(
        `${env.baseURL}/carts`
    );

    expect(createCartResponse.status()).toBe(201);

    const cart = await createCartResponse.json();

    expect(cart).toHaveProperty('id');

    const cartId = cart.id;

    // ==========================================
    // 2. Verify the created cart
    // ==========================================

    const verifyCartResponse = await request.get(
        `${env.baseURL}/carts/${cartId}`
    );

    expect(verifyCartResponse.status()).toBe(200);

    // ==========================================
    // 3. Get a valid product dynamically
    // ==========================================

    const productsResponse = await request.get(
        `${env.baseURL}/products?page=1`
    );

    expect(productsResponse.status()).toBe(200);

    const productsBody = await productsResponse.json();

    expect(productsBody).toHaveProperty('data');
    expect(productsBody.data.length).toBeGreaterThan(0);

    const productId = productsBody.data[0].id;

    expect(productId).toBeDefined();

    // ==========================================
    // 4. Request Body
    // ==========================================

    const requestBody = {
        product_id: productId,
        quantity: -1
    };

    // ==========================================
    // 5. Send Request
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/carts/${cartId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        }
    );

    // ==========================================
    // 6. Response
    // ==========================================

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case      : TC-CART-04');
    console.log('Method         : POST');
    console.log('Endpoint       : /carts/{cartId}');
    console.log('Cart ID        :', cartId);
    console.log('Product ID     :', productId);
    console.log('Quantity       :', requestBody.quantity);
    console.log('Status Code    :', response.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // 7. Expected Status Code
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // 8. Validate Error Message
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('errors');
    expect(responseBody.errors).toHaveProperty('quantity');

    expect(responseBody.errors.quantity).toContain(
        'The quantity field must be at least 1.'
    );

});


test('TC-CART-05 Add item with invalid/non-existent product_id', async ({ request }) => {

    // ==========================================
    // 1. Create a fresh cart
    // ==========================================

    const createCartResponse = await request.post(
        `${env.baseURL}/carts`
    );

    expect(createCartResponse.status()).toBe(201);

    const cart = await createCartResponse.json();

    expect(cart).toHaveProperty('id');

    const cartId = cart.id;

    // ==========================================
    // 2. Invalid / Non-existent Product ID
    // ==========================================

    const invalidProductId = '01KYY1ZD48AV29B075V5EMPT4R';

    const requestBody = {
        product_id: invalidProductId,
        quantity: 1
    };

    // ==========================================
    // 3. Send Request
    // ==========================================

    const response = await request.post(
        `${env.baseURL}/carts/${cartId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        }
    );

    // ==========================================
    // 4. Read Response
    // ==========================================

    const responseText = await response.text();

    console.log('\n==========================================');
    console.log('Test Case      : TC-CART-05');
    console.log('Method         : POST');
    console.log('Endpoint       : /carts/{cartId}');
    console.log('Cart ID        :', cartId);
    console.log('Product ID     :', invalidProductId);
    console.log('Quantity       :', requestBody.quantity);
    console.log('Status Code    :', response.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // 5. Expected Status Code
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // 6. Validate Error Message
    // ==========================================

    const responseBody = JSON.parse(responseText);

    expect(responseBody).toHaveProperty('errors');

    expect(responseBody.errors).toHaveProperty('product_id');

    expect(responseBody.errors.product_id).toContain(
        'The selected product id is invalid.'
    );
});


test('TC-CART-06 Remove specific item from cart', async ({ request }) => {

    // ==========================================
    // 1. Create a fresh cart
    // Cart ID comes dynamically from utils/cart.js
    // ==========================================

    const cartId = await createCart(request);

    expect(cartId).toBeDefined();

    // ==========================================
    // 2. Remove cart
    // DELETE /carts/{cartId}
    // ==========================================

    const response = await request.delete(
        `${env.baseURL}/carts/${cartId}`
    );

    // ==========================================
    // 3. Response
    // ==========================================

    console.log('\n==========================================');
    console.log('Test Case      : TC-CART-06');
    console.log('Method         : DELETE');
    console.log('Endpoint       :', `/carts/${cartId}`);
    console.log('Cart ID        :', cartId);
    console.log('Status Code    :', response.status());
    console.log('==========================================');

    // ==========================================
    // 4. Expected Result
    // ==========================================

    expect(response.status()).toBe(204);

});

test('TC-CART-07 Verify the cart ID is already deleted', async ({ request }) => {

    // ==========================================
    // 1. Create a fresh cart
    // ==========================================

    const cartId = await createCart(request);

    expect(cartId).toBeDefined();

    // ==========================================
    // 2. Delete the cart
    // ==========================================

    const deleteResponse = await request.delete(
        `${env.baseURL}/carts/${cartId}`
    );

    expect(deleteResponse.status()).toBe(204);

    // ==========================================
    // 3. Verify the cart is deleted
    // ==========================================

    const getResponse = await request.get(
        `${env.baseURL}/carts/${cartId}`
    );

    const responseText = await getResponse.text();

    // ==========================================
    // 4. Output
    // ==========================================

    console.log('\n==========================================');
    console.log('Test Case      : TC-CART-07');
    console.log('Method         : GET');
    console.log('Endpoint       :', `/carts/${cartId}`);
    console.log('Cart ID        :', cartId);
    console.log('Status Code    :', getResponse.status());
    console.log('Response Body  :', responseText);
    console.log('==========================================');

    // ==========================================
    // 5. Expected Result
    // ==========================================

    expect(getResponse.status()).toBe(404);

    expect(responseText).toContain('Requested item not found');

});