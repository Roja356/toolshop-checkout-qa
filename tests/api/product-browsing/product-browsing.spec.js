const { test, expect } = require('@playwright/test');
const env = require('../../../config/env');

test.describe('Product Browsing API', () => {

    test('TC-PROD-01 Get all products without any filter', async ({ request }) => {

        // ============================
        // Act
        // ============================

        const response = await request.get(`${env.baseURL}/products`);

        // ============================
        // Assert - Status Code
        // ============================

        expect(response.status()).toBe(200);

        // ============================
        // Response Body
        // ============================

        const responseBody = await response.json();

        // ============================
        // Debug Output (Raw JSON)
        // ============================

        console.log("\n========================================================");
        console.log("Test Case   : TC-PROD-01");
        console.log("Status Code :", response.status());
        console.log("Total Products :", responseBody.data.length);
        console.log("Response Body:");
        console.log(JSON.stringify(responseBody, null, 2));
        console.log("========================================================\n");

        // ============================
        // Assertions - Response Structure
        // ============================

        expect(responseBody).toHaveProperty('current_page');
        expect(responseBody).toHaveProperty('data');

        expect(Array.isArray(responseBody.data)).toBe(true);
        expect(responseBody.data.length).toBeGreaterThan(0);

        // ============================
        // Assertions - Each Product
        // ============================

        responseBody.data.forEach((product) => {

            // Basic Product Information
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('description');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('in_stock');
            expect(typeof product.in_stock).toBe('boolean');

            // Category
            expect(product).toHaveProperty('category');
            expect(product.category).toHaveProperty('id');
            expect(product.category).toHaveProperty('name');
            expect(product.category).toHaveProperty('slug');

            // Brand
            expect(product).toHaveProperty('brand');
            expect(product.brand).toHaveProperty('id');
            expect(product.brand).toHaveProperty('name');

            // Product Image
            expect(product).toHaveProperty('product_image');
            expect(product.product_image).toHaveProperty('id');
            expect(product.product_image).toHaveProperty('file_name');

        });

    });




    test('TC-PROD-02 Get products by first product brand ID', async ({ request }) => {

        // ==========================================
        // STEP 1 : Get All Products
        // ==========================================

        const productResponse = await request.get(`${env.baseURL}/products`);

        expect(productResponse.status()).toBe(200);

        const productBody = await productResponse.json();

        // ==========================================
        // STEP 2 : Extract Brand ID from First Product
        // ==========================================

        const firstProduct = productBody.data[0];
        const brandId = firstProduct.brand.id;
        const brandName = firstProduct.brand.name;

        console.log("\n===============================================");
        console.log("First Product :", firstProduct.name);
        console.log("Brand ID      :", brandId);
        console.log("Brand Name    :", brandName);
        console.log("===============================================\n");

        // ==========================================
        // STEP 3 : Get Products by Brand ID
        // ==========================================

        const brandResponse = await request.get(
            `${env.baseURL}/products?by_brand=${brandId}`
        );

        expect(brandResponse.status()).toBe(200);

        const brandProducts = await brandResponse.json();

        // ==========================================
        // Debug Output
        // ==========================================

        console.log("Status Code :", brandResponse.status());
        console.log("Response Body:");
        console.log(JSON.stringify(brandProducts, null, 2));

        // ==========================================
        // Assertions
        // ==========================================

        expect(brandProducts).toHaveProperty('data');
        expect(Array.isArray(brandProducts.data)).toBe(true);
        expect(brandProducts.data.length).toBeGreaterThan(0);

        // Every returned product should belong to the same brand
        brandProducts.data.forEach(product => {

            expect(product.brand.id).toBe(brandId);
            expect(product.brand.name).toBe(brandName);

        });

    });

    test('TC-PROD-03 Filter products by valid category ID', async ({ request }) => {

    // ==========================================
    // Step 1: Get all products
    // ==========================================

    const allProductsResponse = await request.get(`${env.baseURL}/products`);

    expect(allProductsResponse.status()).toBe(200);

    const allProducts = await allProductsResponse.json();

    // Get first product's category ID
    const categoryId = allProducts.data[0].category.id;
    const categoryName = allProducts.data[0].category.name;

    // ==========================================
    // Step 2: Filter products by Category ID
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?by_category=${categoryId}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Console Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-03");
    console.log("Status Code    :", response.status());
    console.log("Category ID    :", categoryId);
    console.log("Category Name  :", categoryName);
    console.log("Products Found :", responseBody.data.length);
    console.log("==========================================\n");

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);
    expect(responseBody.data.length).toBeGreaterThan(0);

    // ==========================================
    // Assertions - Each Product
    // ==========================================

    responseBody.data.forEach((product) => {

        // Basic Information
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('in_stock');

        // Verify Product belongs to selected category
        expect(product.category.id).toBe(categoryId);
        expect(product.category.name).toBe(categoryName);

        // Category
        expect(product).toHaveProperty('category');
        expect(product.category).toHaveProperty('id');
        expect(product.category).toHaveProperty('name');
        expect(product.category).toHaveProperty('slug');

        // Brand
        expect(product).toHaveProperty('brand');
        expect(product.brand).toHaveProperty('id');
        expect(product.brand).toHaveProperty('name');

        // Product Image
        expect(product).toHaveProperty('product_image');
        expect(product.product_image).toHaveProperty('id');
        expect(product.product_image).toHaveProperty('file_name');

    });

});


test('TC-PROD-04 Filter products by non-existent category ID', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const invalidCategoryId = '01KYVC4TFTAAQCGAX408XS8JZR';

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?by_category=${invalidCategoryId}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Console Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-04");
    console.log("Status Code    :", response.status());
    console.log("Category ID    :", invalidCategoryId);
    console.log("Products Found :", responseBody.data.length);
    console.log("==========================================\n");

    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    // Verify no products are returned
    expect(responseBody.data).toHaveLength(0);

    // Verify pagination information exists
    expect(responseBody).toHaveProperty('current_page');
    expect(responseBody).toHaveProperty('total');

    // Total should be zero
    expect(responseBody.total).toBe(0);

});

});


test('TC-PROD-05 Filter products within a valid price range', async ({ request }) => {

    // ==========================================
    // Step 1: Get all products
    // ==========================================

    const allProductsResponse = await request.get(`${env.baseURL}/products`);

    expect(allProductsResponse.status()).toBe(200);

    const allProducts = await allProductsResponse.json();

    // Get first product price
    const firstProduct = allProducts.data[0];

    const price = firstProduct.price;

    const minPrice = Math.floor(price);
    const maxPrice = Math.ceil(price);

    // ==========================================
    // Step 2: Filter by Price Range
    // between=price,min,max
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?between=price,${minPrice},${maxPrice}`
    );

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    // ==========================================
    // Console Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-05");
    console.log("Request URL    :", `${env.baseURL}/products?between=price,${minPrice},${maxPrice}`);
    console.log("Status Code    :", response.status());
    console.log("Selected Price :", price);
    console.log("Price Range    :", `${minPrice} - ${maxPrice}`);
    console.log("Products Found :", responseBody.data.length);
    console.log("==========================================");

    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    expect(responseBody.data.length).toBeGreaterThan(0);

    responseBody.data.forEach((product) => {

        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');

        expect(product.price).toBeGreaterThanOrEqual(minPrice);
        expect(product.price).toBeLessThanOrEqual(maxPrice);

        expect(product).toHaveProperty('category');
        expect(product.category).toHaveProperty('id');
        expect(product.category).toHaveProperty('name');

        expect(product).toHaveProperty('brand');
        expect(product.brand).toHaveProperty('id');
        expect(product.brand).toHaveProperty('name');

        expect(product).toHaveProperty('product_image');
        expect(product.product_image).toHaveProperty('id');
        expect(product.product_image).toHaveProperty('file_name');

    });

});


test('TC-PROD-06 Filter with min price greater than max price', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const minPrice = 30;
    const maxPrice = 10;

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?between=price,${minPrice},${maxPrice}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-06");
    console.log("Request URL    :", `${env.baseURL}/products?between=price,${minPrice},${maxPrice}`);
    console.log("Status Code    :", response.status());
    console.log("Min Price      :", minPrice);
    console.log("Max Price      :", maxPrice);
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("==========================================");

    // Show raw JSON response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    // ==========================================
    // Expected Result
    // ==========================================

    // Invalid range should return no products
    expect(responseBody.data.length).toBe(0);

});

test('TC-PROD-07 Filter with non-numeric price values', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const minPrice = 30;
    const maxPrice = "abc";

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?between=price,${minPrice},${maxPrice}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-07");
    console.log("Request URL    :", `${env.baseURL}/products?between=price,${minPrice},${maxPrice}`);
    console.log("Status Code    :", response.status());
    console.log("Min Price      :", minPrice);
    console.log("Max Price      :", maxPrice);
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("==========================================");

    // Show raw JSON response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    // ==========================================
    // Expected Result
    // ==========================================

    // Invalid range should return no products
    expect(responseBody.data.length).toBe(0);

});


test('TC-PROD-08 Sort products by price ascending', async ({ request }) => {

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?sort=price,asc`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-08");
    console.log("Request URL    :", `${env.baseURL}/products?sort=price,asc`);
    console.log("Status Code    :", response.status());
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    expect(responseBody.data.length).toBeGreaterThan(0);

    // ==========================================
    // Assertions - Product Fields
    // ==========================================

    responseBody.data.forEach((product) => {

        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');

        expect(typeof product.price).toBe('number');

    });

    // ==========================================
    // Assertion - Price Ascending Order
    // ==========================================

    for (let i = 1; i < responseBody.data.length; i++) {

        expect(responseBody.data[i].price)
            .toBeGreaterThanOrEqual(responseBody.data[i - 1].price);

    }

});



test('TC-PROD-09 Sort products by price descending', async ({ request }) => {

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?sort=price,desc`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-09");
    console.log("Request URL    :", `${env.baseURL}/products?sort=price,desc`);
    console.log("Status Code    :", response.status());
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    expect(responseBody.data.length).toBeGreaterThan(0);

    // ==========================================
    // Assertions - Product Fields
    // ==========================================

    responseBody.data.forEach((product) => {

        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');

        expect(typeof product.price).toBe('number');

    });

    // ==========================================
    // Assertion - Price Descending Order
    // ==========================================

   for (let i = 1; i < responseBody.data.length; i++) {

    expect(responseBody.data[i].price)
        .toBeLessThanOrEqual(responseBody.data[i - 1].price);
   }

});


test('TC-PROD-10 Invalid sort field/value', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const invalidSortField = 'invalidfield';
    const sortOrder = 'asc';

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?sort=${invalidSortField},${sortOrder}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-10");
    console.log("Request URL    :", `${env.baseURL}/products?sort=${invalidSortField},${sortOrder}`);
    console.log("Status Code    :", response.status());
    console.log("Invalid Field  :", invalidSortField);
    console.log("Sort Value     :", sortOrder);
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Validation Error
    // ==========================================

    expect(responseBody).toHaveProperty('errors');

    // Verify validation error is not empty
    expect(Object.keys(responseBody.errors).length).toBeGreaterThan(0);

});


test('TC-PROD-11 Retrieve a valid page number', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const pageNumber = 1;

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?page=${pageNumber}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-11");
    console.log("Request URL    :", `${env.baseURL}/products?page=${pageNumber}`);
    console.log("Status Code    :", response.status());
    console.log("Requested Page :", pageNumber);
    console.log("Current Page   :", responseBody.current_page);
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("Total Products :", responseBody.total);
    console.log("Last Page      :", responseBody.last_page);
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Pagination Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    expect(responseBody).toHaveProperty('current_page');
    expect(responseBody).toHaveProperty('last_page');
    expect(responseBody).toHaveProperty('per_page');
    expect(responseBody).toHaveProperty('total');

    // ==========================================
    // Assertions - Requested Page
    // ==========================================

    expect(responseBody.current_page).toBe(pageNumber);

    // Page number should be valid
    expect(responseBody.current_page).toBeGreaterThan(0);

    // Page should not exceed last page
    expect(responseBody.current_page)
        .toBeLessThanOrEqual(responseBody.last_page);

    // ==========================================
    // Assertions - Product Data
    // ==========================================

    expect(responseBody.data.length).toBeGreaterThan(0);

    responseBody.data.forEach((product) => {

        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');

    });

});


test('TC-PROD-12 Retrieve a nonexisting page number', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const pageNumber = 1000;

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products?page=${pageNumber}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Assert - Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-12");
    console.log("Request URL    :", `${env.baseURL}/products?page=${pageNumber}`);
    console.log("Status Code    :", response.status());
    console.log("Requested Page :", pageNumber);
    console.log("Current Page   :", responseBody.current_page);
    console.log("Last Page      :", responseBody.last_page);
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("Total Products :", responseBody.total);
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    expect(responseBody).toHaveProperty('current_page');
    expect(responseBody).toHaveProperty('last_page');
    expect(responseBody).toHaveProperty('total');

    // ==========================================
    // Assertions - Non-existing Page
    // ==========================================

    expect(responseBody.current_page).toBe(pageNumber);

    // ==========================================
    // Non-existing page should not contain products
    // ==========================================

    expect(responseBody.data.length).toBe(0);

});


test('TC-PROD-13 Combine multiple filters together', async ({ request }) => {

    // ==========================================
    // Step 1: Get current products
    // ==========================================

    const allProductsResponse = await request.get(
        `${env.baseURL}/products`
    );

    expect(allProductsResponse.status()).toBe(200);

    const allProductsBody = await allProductsResponse.json();

    expect(allProductsBody).toHaveProperty('data');
    expect(allProductsBody.data.length).toBeGreaterThan(0);

    // ==========================================
    // Step 2: Get first product data
    // ==========================================

    const firstProduct = allProductsBody.data[0];

    const brandId = firstProduct.brand.id;
    const categoryId = firstProduct.category.id;

    // Use a wider price range
    const minPrice = 10;
    const maxPrice = 30;

    // ==========================================
    // Step 3: Apply multiple filters
    // ==========================================

    const requestUrl =
        `${env.baseURL}/products` +
        `?by_brand=${brandId}` +
        `&by_category=${categoryId}` +
        `&between=price,${minPrice},${maxPrice}`;

    const response = await request.get(requestUrl);

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    // ==========================================
    // Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-13");
    console.log("Status Code    :", response.status());
    console.log("Brand ID       :", brandId);
    console.log("Category ID    :", categoryId);
    console.log("Price Range    :", `${minPrice} - ${maxPrice}`);
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("==========================================");

    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    expect(responseBody.data.length).toBeGreaterThan(0);

    // ==========================================
    // Verify ALL filters
    // ==========================================

    responseBody.data.forEach((product) => {

        // Brand
        expect(product.brand.id).toBe(brandId);

        // Category
        expect(product.category.id).toBe(categoryId);

        // Price
        expect(product.price).toBeGreaterThanOrEqual(minPrice);
        expect(product.price).toBeLessThanOrEqual(maxPrice);

    });

});


test('TC-PROD-14 Combine filters that yield no matching results', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const brandId = '01KYVXA21H9EJYMK2KHNAVPGEG';
    const categoryId = '01KYVXA2BDFZET7G9ZMFN7S1WR';

    const minPrice = 10;
    const maxPrice = 30;

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(
        `${env.baseURL}/products` +
        `?by_brand=${brandId}` +
        `&by_category=${categoryId}` +
        `&between=price,${minPrice},${maxPrice}`
    );

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(200);

    // ==========================================
    // Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-14");
    console.log("Request URL    :",
        `${env.baseURL}/products` +
        `?by_brand=${brandId}` +
        `&by_category=${categoryId}` +
        `&between=price,${minPrice},${maxPrice}`
    );
    console.log("Status Code    :", response.status());
    console.log("Brand ID       :", brandId);
    console.log("Category ID    :", categoryId);
    console.log("Price Range    :", `${minPrice} - ${maxPrice}`);
    console.log("Products Found :", responseBody.data?.length ?? 0);
    console.log("==========================================");

    // Raw JSON Response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Response Structure
    // ==========================================

    expect(responseBody).toHaveProperty('data');
    expect(Array.isArray(responseBody.data)).toBe(true);

    // ==========================================
    // Expected Result
    // ==========================================

    // No product should match all three filters
    expect(responseBody.data.length).toBe(0);

});


test('TC-PROD-15 SQL injection attempt in query parameter', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const maliciousCategory = "' OR '1'='1";

    // Encode the query parameter safely
    const encodedCategory = encodeURIComponent(maliciousCategory);

    const requestUrl =
        `${env.baseURL}/products?by_category=${encodedCategory}`;

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(requestUrl);

    // ==========================================
    // Assert - Status Code
    // ==========================================

    // API should reject the malicious input
    expect(response.status()).toBe(200);

    // ==========================================
    // Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-15");
    console.log("Request URL    :", requestUrl);
    console.log("Status Code    :", response.status());
    console.log("Injected Value :", maliciousCategory);
    console.log("==========================================");

    // Raw JSON response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Security Assertion
    // ==========================================

    // Response should not expose a database/SQL error
    const responseText = JSON.stringify(responseBody).toLowerCase();

    expect(responseText).not.toContain('sql syntax');
    expect(responseText).not.toContain('sqlstate');
    expect(responseText).not.toContain('database error');

});

test('TC-PROD-16 XSS attempt in query parameter', async ({ request }) => {

    // ==========================================
    // Arrange
    // ==========================================

    const maliciousSort = '<script>alert(1)</script>';
    const sortOrder = 'asc';

    const encodedSort = encodeURIComponent(maliciousSort);

    const requestUrl =
        `${env.baseURL}/products?sort=${encodedSort},${sortOrder}`;

    // ==========================================
    // Act
    // ==========================================

    const response = await request.get(requestUrl);

    // ==========================================
    // Assert - Status Code
    // ==========================================

    expect(response.status()).toBe(422);

    // ==========================================
    // Response Body
    // ==========================================

    const responseBody = await response.json();

    // ==========================================
    // Debug Output
    // ==========================================

    console.log("\n==========================================");
    console.log("Test Case      : TC-PROD-16");
    console.log("Request URL    :", requestUrl);
    console.log("Status Code    :", response.status());
    console.log("Malicious Value:", maliciousSort);
    console.log("==========================================");

    // Raw JSON response
    console.log(JSON.stringify(responseBody, null, 2));

    // ==========================================
    // Assertions - Validation Error
    // ==========================================

    expect(responseBody).toHaveProperty('errors');

    expect(Object.keys(responseBody.errors).length)
        .toBeGreaterThan(0);

});