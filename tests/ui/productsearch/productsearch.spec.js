import { test, expect } from '@playwright/test';
import { ProductPage } from './pages/productsearchpage';

test.describe('Product Browsing & Search', () => {

    let productPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        await productPage.navigate();
    });

    test('TC-001 Browse catalog and view product detail', async ({ page }) => {

        
        const productCount = await productPage.getProductCount();
        expect(productCount).toBeGreaterThan(0);

       
        await expect(productPage.productCards.first()).toBeVisible();

       
        await productPage.clickFirstProduct();

        
        await productPage.verifyProductDetailLoaded();

    });


test('TC-002 Search product by keyword', async ({ page }) => {

    await productPage.searchProduct('Hammer');

    
    const searchTerm = await productPage.getSearchTermText();
    expect(searchTerm).toContain('Hammer');

    
    const resultCountText = await productPage.getSearchResultCountText();
    expect(resultCountText).toContain('Hammer');

    
    const resultCount = await productPage.getProductCount();
    expect(resultCount).toBeGreaterThan(0);
    
});



test('TC-003 Filter products by category', async ({ page }) => {

    await productPage.filterByCategory('hand-tools');

    const resultCount = await productPage.getProductCount();
    expect(resultCount).toBeGreaterThan(0);

});
test('TC-004 Sort products by price ascending', async ({ page }) => {

    await productPage.sortByPriceLowToHigh();

    await productPage.getProductCount();

    const prices = await productPage.productPrice.allTextContents();
    const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));

    console.log('All prices:', numericPrices);
    console.log('Total count:', numericPrices.length);

    for (let i = 0; i < numericPrices.length - 1; i++) {
        expect(numericPrices[i]).toBeLessThanOrEqual(numericPrices[i + 1]);
    }

});

test('TC-005 Search with no matching results shows appropriate message', async ({ page }) => {

    await productPage.searchProduct('Moishturizer');

    
    const searchTerm = await productPage.getSearchTermText();
    expect(searchTerm).toContain('Moishturizer');

    
    const resultCountText = await productPage.getSearchResultCountText();
    expect(resultCountText).toContain('0 products found');

   
    const resultCount = await productPage.productCards.count();
    expect(resultCount).toBe(0);

   
    await expect(page.locator('text=There are no products found')).toBeVisible();

});
});
