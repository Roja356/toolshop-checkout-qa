const { expect } = require('@playwright/test');
const env = require('../config/env');

async function getFirstProduct(request) {

    const response = await request.get(
        `${env.baseURL}/products`
    );

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);
    expect(responseBody.data.length).toBeGreaterThan(0);

    return responseBody.data[0];
}

async function getFirstProductId(request) {

    const product = await getFirstProduct(request);

    return product.id;
}

module.exports = {
    getFirstProduct,
    getFirstProductId
};