import { test, expect } from '@playwright/test';
import { ProductPage } from '../productsearch/pages/productsearchpage';
import { CartPage } from './pages/cartPage';

async function selectAvailableProduct(page, productPage, cartPage, excludeNames = []) {
  await productPage.navigate();
  await productPage.getProductCount();

  const cards = page.locator('a.card');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const name = (await card.locator('[data-test="product-name"]').textContent()).trim();

    if (excludeNames.includes(name)) continue;

    const isOutOfStock = await card.locator('[data-test="out-of-stock"]').count();
    if (isOutOfStock > 0) {
      console.log(`SKIP (out of stock): ${name}`);
      continue;
    }

    await card.click();
    await cartPage.addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });

    const isEnabled = await cartPage.addToCartBtn.isEnabled().catch(() => false);

    if (isEnabled) {
      console.log(`SELECTED: ${name}`);
      return name;
    }

    console.log(`SKIP (add-to-cart disabled): ${name}`);
    await productPage.navigate();
    await productPage.getProductCount();
  }

  throw new Error('No simple in-stock product found to run the test');
}

test.describe('Cart Tests', () => {
  let productPage;
  let cartPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
  });

  test('TC-001: Add product to cart and verify cart total', async ({ page }) => {
    test.setTimeout(60000);

    const productName = await selectAvailableProduct(page, productPage, cartPage);
    await cartPage.addToCart();

    await expect(cartPage.cartQuantityBadge).toHaveText('1');

    await cartPage.goToCheckout();

    const row = cartPage.getRowByProductName(productName);

    await expect(row.locator('[data-test="product-title"]')).toHaveText(productName);
    await expect(row.locator('[data-test="product-price"]')).toBeVisible();
    await expect(row.locator('[data-test="product-quantity"]')).toBeVisible();
    await expect(row.locator('[data-test="line-price"]')).toBeVisible();

    const unitPriceText = await row.locator('[data-test="product-price"]').textContent();
    const unitPrice = parseFloat(unitPriceText.replace(/[^0-9.]/g, ''));

    const quantityValue = await row.locator('[data-test="product-quantity"]').inputValue();
    const quantity = parseFloat(quantityValue);

    const lineTotal = await cartPage.getRowLineTotalValue(row);
    expect(lineTotal).toBeCloseTo(unitPrice * quantity, 2);

    await expect(cartPage.continueShoppingBtn).toBeVisible();
    await expect(cartPage.continueShoppingBtn).toBeEnabled();

    await expect(cartPage.proceedCheckoutBtn).toBeVisible();
    await expect(cartPage.proceedCheckoutBtn).toBeEnabled();
  });

  test('TC-002: Add multiple products', async ({ page }) => {
    test.setTimeout(60000);

    const addedNames = [];

    for (let i = 0; i < 2; i++) {
      const name = await selectAvailableProduct(page, productPage, cartPage, addedNames);

      await cartPage.addToCart();

      await expect(cartPage.cartQuantityBadge).toHaveText(
        String(i + 1),
        { timeout: 10000 }
      );

      addedNames.push(name);
    }

    await cartPage.goToCheckout();
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('[data-test="product-title"]').first()
    ).toBeVisible({ timeout: 10000 });

    expect(await cartPage.getCartRowCount()).toBe(addedNames.length);

    for (const name of addedNames) {
      const row = cartPage.getRowByProductName(name);

      await expect(row).toBeVisible();
      await expect(row.locator('[data-test="product-title"]')).toHaveText(name);
      await expect(row.locator('[data-test="product-price"]')).toBeVisible();
      await expect(row.locator('[data-test="product-quantity"]')).toBeVisible();
    }

    const sumOfLineTotals = await cartPage.getSumOfAllLineTotals();
    const grandTotal = await cartPage.getGrandTotalValue();

    expect(grandTotal).toBeCloseTo(sumOfLineTotals, 2);
  });

  test('TC-003: Invalid cart quantity (0) auto-corrects to 1', async ({ page }) => {
    test.setTimeout(60000);

    const productName = await selectAvailableProduct(page, productPage, cartPage);

    await cartPage.addToCart();

    await expect(cartPage.cartQuantityBadge).toHaveText('1', { timeout: 10000 });

    await cartPage.goToCheckout();

    const row = cartPage.getRowByProductName(productName);
    await expect(row).toBeVisible();

    await cartPage.setRowQuantity(row, '0');

    await expect(
      row.locator('[data-test="product-quantity"]')
    ).toHaveValue('1', { timeout: 10000 });

    await expect(cartPage.quantityUpdatedMessage).toBeVisible({ timeout: 10000 });
    await expect(cartPage.quantityUpdatedMessage).toContainText('Product quantity updated');

    const unitPriceText = await row.locator('[data-test="product-price"]').textContent();
    const unitPrice = parseFloat(unitPriceText.replace(/[^0-9.]/g, ''));

    const lineTotal = await cartPage.getRowLineTotalValue(row);

    expect(lineTotal).toBeCloseTo(unitPrice * 1, 2);
  });

  test('TC-004: Remove item from cart and verify cart updates', async ({ page }) => {
    test.setTimeout(60000);

    const addedNames = [];

    // TC-002 এর মতো একই লজিক দিয়ে ২টা প্রোডাক্ট অ্যাড করা
    for (let i = 0; i < 2; i++) {
      const name = await selectAvailableProduct(page, productPage, cartPage, addedNames);
      await cartPage.addToCart();

      await expect(cartPage.cartQuantityBadge).toHaveText(
        String(i + 1),
        { timeout: 10000 }
      );

      addedNames.push(name);
    }

    await cartPage.goToCheckout();
    await page.waitForLoadState('networkidle');

    // প্রাথমিক অবস্থা কনফার্ম করুন: দুটো row-ই আছে
    expect(await cartPage.getCartRowCount()).toBe(2);

    const grandTotalBefore = await cartPage.getGrandTotalValue();

    const [removedName, remainingName] = addedNames;
    const rowToRemove = cartPage.getRowByProductName(removedName);
    const removedRowLineTotal = await cartPage.getRowLineTotalValue(rowToRemove);

    await cartPage.removeItemFromRow(rowToRemove);

    await expect(rowToRemove).toHaveCount(0);

    
    const remainingRow = cartPage.getRowByProductName(remainingName);
    await expect(remainingRow).toBeVisible();

    await expect(cartPage.cartQuantityBadge).toHaveText('1', { timeout: 10000 });


    expect(await cartPage.getCartRowCount()).toBe(1);

    const grandTotalAfter = await cartPage.getGrandTotalValue();
    expect(grandTotalAfter).toBeCloseTo(grandTotalBefore - removedRowLineTotal, 2);
  });
});