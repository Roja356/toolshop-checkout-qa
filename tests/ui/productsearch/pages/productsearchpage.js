import { expect } from '@playwright/test';

export class ProductPage {

    constructor(page) {
        this.page = page;

        // Navigation
        this.homeLink = page.locator('[data-test="nav-home"]');

        // Product card / browse
        this.productCards = page.locator('[data-test^="product-"]');
        this.productName = page.locator('[data-test="product-name"]');
        this.productPrice = page.locator('[data-test="product-price"]');
        this.productImage = page.locator('.card-img-top');

        // Search
        this.searchInput = page.locator('[data-test="search-query"]');
        this.searchButton = page.locator('[data-test="search-submit"]');
        this.searchResetButton = page.locator('[data-test="search-reset"]');
        this.searchCaption = page.locator('[data-test="search-caption"]');
        this.searchTerm = page.locator('[data-test="search-term"]');
        this.searchResultCount = page.locator('[data-test="search-result-count"]');
        this.searchCompleted = page.locator('[data-test="search-completed"]');

        // Category filter
        this.categoriesMenuButton = page.locator('[data-test="nav-categories"]');

        this.sortDropdown = page.locator('[data-test="sort"]');

    }

    async navigate() {
        await this.page.goto('/');
        await this.homeLink.click();
    }

    async getProductCount() {
        await this.productCards.first().waitFor({ state: 'visible', timeout: 10000 });
        return await this.productCards.count();
    }

    async clickFirstProduct() {
        await this.productCards.first().click();
    }

    async verifyProductDetailLoaded() {
        await expect(this.productName).toBeVisible();
    }

    async searchProduct(keyword) {
        await this.searchInput.fill(keyword);
        await this.searchButton.click();
        await this.searchCaption.waitFor({ state: 'visible', timeout: 10000 });
        await this.waitForStableResultCount();
    }

    async getSearchTermText() {
        return await this.searchTerm.textContent();
    }

    async getSearchResultCountText() {
        return await this.searchResultCount.textContent();
    }

    async filterByCategory(categorySlug) {
        await this.categoriesMenuButton.click();
        await this.page.locator(`[data-test="nav-${categorySlug}"]`).click();
    }

    async sortByPriceLowToHigh() {
        await this.sortDropdown.selectOption({ label: 'Price (Low - High)' });
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1500);
        await this.waitForStablePrices();
    }

    async waitForStablePrices() {
        let previousPrices = '';
        let stableCount = 0;

        for (let i = 0; i < 10; i++) {
            const currentPrices = (await this.productPrice.allTextContents()).join(',');
            if (currentPrices === previousPrices && currentPrices !== '') {
                stableCount++;
                if (stableCount >= 2) return;
            } else {
                stableCount = 0;
            }
            previousPrices = currentPrices;
            await this.page.waitForTimeout(300);
        }
    }

    async waitForStableResultCount() {
        let previousText = '';
        let stableCount = 0;

        for (let i = 0; i < 10; i++) {
            const currentText = await this.searchResultCount.textContent();
            if (currentText === previousText && currentText !== '') {
                stableCount++;
                if (stableCount >= 2) return;
            } else {
                stableCount = 0;
            }
            previousText = currentText;
            await this.page.waitForTimeout(300);
        }
    }

}