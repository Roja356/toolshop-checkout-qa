import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { CheckoutPage } from './page/checkoutPage';
import { createTestUser } from '../../../utils/user';
import { getAccessToken } from '../../../utils/auth';
import { createCart } from '../../../utils/cart';
import { getFirstProductId } from '../../../utils/product';

// ============================================================
// Helper: Add a product to cart via the UI
// ============================================================
async function addProductToCart(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const cards = page.locator('a.card');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const isOutOfStock = await card.locator('[data-test="out-of-stock"]').count();
    if (isOutOfStock > 0) continue;

    const productName = (await card.locator('[data-test="product-name"]').textContent()).trim();
    await card.click();
    await page.locator('[data-test="add-to-cart"]').waitFor({ state: 'visible', timeout: 10000 });

    const isEnabled = await page.locator('[data-test="add-to-cart"]').isEnabled().catch(() => false);
    if (isEnabled) {
      await page.locator('[data-test="add-to-cart"]').click();
      await expect(page.locator('[data-test="cart-quantity"]')).toHaveText('1', { timeout: 10000 });
      return productName;
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  throw new Error('No in-stock product found to add to cart');
}

// ============================================================
// Helper: Complete billing address step
// ============================================================
async function fillBillingAddress(checkoutPage, { country = 'Austria', postalCode = '1010', houseNumber = '42', street = 'Test Street', city = 'Vienna', state = 'Vienna' } = {}) {
  await checkoutPage.countrySelect.selectOption({ label: country });
  await checkoutPage.postalCodeInput.fill(postalCode);
  await checkoutPage.houseNumberInput.fill(houseNumber);
  await checkoutPage.streetInput.fill(street);
  await checkoutPage.cityInput.fill(city);
  await checkoutPage.stateInput.fill(state);
}

// ============================================================
// Helper: Complete payment step (Bank Transfer)
// ============================================================
async function completeBankTransferPayment(page, checkoutPage) {
  await checkoutPage.paymentMethodSelect.selectOption({ label: 'Bank Transfer' });
  await page.waitForTimeout(1000);

  // Bank transfer fields render dynamically. Use robust locators.
  const bankNameInput = page.locator('[data-test="bank_name"], [data-test="bank-name"], input[name="bank_name"], input[formcontrolname="bank_name"]').first();
  const accountNameInput = page.locator('[data-test="account_name"], [data-test="account-name"], input[name="account_name"], input[formcontrolname="account_name"]').first();
  const accountNumberInput = page.locator('[data-test="account_number"], [data-test="account-number"], input[name="account_number"], input[formcontrolname="account_number"]').first();

  await bankNameInput.fill('Test Bank');
  await accountNameInput.fill('Bank');
  await accountNumberInput.fill('012345678');
  await page.waitForTimeout(500);
}

test.describe('Checkout - Registered User', () => {
  let checkoutPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
  });

  // ============================================================
  // TC-001: Complete registered checkout (Positive)
  // ============================================================
  test('TC-001: Complete registered checkout', async ({ page, request }) => {
    test.setTimeout(120000);

    // 1. Dynamically register a new user via API
    const user = await createTestUser(request);
    expect(user.email).toBeTruthy();
    expect(user.password).toBeTruthy();

    // 2. Login via UI
    await page.goto('/auth/login');
    await checkoutPage.emailInput.fill(user.email);
    await checkoutPage.passwordInput.fill(user.password);
    await checkoutPage.loginSubmitBtn.click();
    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });

    // 3. Add a product to cart
    const productName = await addProductToCart(page);

    // 4. Go to checkout
    await checkoutPage.goto();
    await page.waitForLoadState('networkidle');

    // Step 1: Confirm Cart
    const row = checkoutPage.getRowByProductName(productName);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.locator('[data-test="product-title"]')).toHaveText(productName);
    await expect(row.locator('[data-test="product-price"]')).toBeVisible();
    await expect(row.locator('[data-test="product-quantity"]')).toBeVisible();
    await expect(row.locator('[data-test="line-price"]')).toBeVisible();
    await expect(checkoutPage.cartGrandTotal).toBeVisible();

    // 5. Proceed to checkout (Cart -> Sign In)
    await checkoutPage.proceedFromCart();
    await page.waitForTimeout(1500);

    // Step 2: Sign In (already logged in)
    await expect(checkoutPage.loggedInMessage).toBeVisible({ timeout: 10000 });
    await checkoutPage.proceedFromSignIn();
    await page.waitForTimeout(1500);

    // Step 3: Billing Address
    await expect(checkoutPage.streetInput).toBeVisible({ timeout: 10000 });
    await fillBillingAddress(checkoutPage);
    await page.waitForTimeout(500);
    await expect(checkoutPage.proceedBillingBtn).toBeEnabled({ timeout: 10000 });
    await checkoutPage.proceedFromBilling();
    await page.waitForTimeout(1500);

    // Step 4: Payment
    await expect(checkoutPage.paymentMethodSelect).toBeVisible({ timeout: 10000 });
    await completeBankTransferPayment(page, checkoutPage);

    // 6. Click Confirm to finalize the order
    await expect(checkoutPage.finishBtn).toBeEnabled({ timeout: 10000 });
    await checkoutPage.confirmOrder();

    // 7. Verify order confirmation message
    await expect(page.getByText('Payment was successful')).toBeVisible({ timeout: 15000 });
  });

  // ============================================================
  // TC-002: Checkout blocked when required address field is missing (Negative)
  // ============================================================
  test('TC-002: Checkout blocked when required address field is missing', async ({ page, request }) => {
    test.setTimeout(120000);

    // 1. Dynamically register a new user via API
    const user = await createTestUser(request);
    expect(user.email).toBeTruthy();
    expect(user.password).toBeTruthy();

    // 2. Login via UI
    await page.goto('/auth/login');
    await checkoutPage.emailInput.fill(user.email);
    await checkoutPage.passwordInput.fill(user.password);
    await checkoutPage.loginSubmitBtn.click();
    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });

    // 3. Add a product to cart
    await addProductToCart(page);

    // 4. Go to checkout
    await checkoutPage.goto();
    await page.waitForLoadState('networkidle');

    // Step 1: Cart -> proceed
    await checkoutPage.proceedFromCart();
    await page.waitForTimeout(1500);

    // Step 2: Sign In (already logged in) -> proceed
    await expect(checkoutPage.loggedInMessage).toBeVisible({ timeout: 10000 });
    await checkoutPage.proceedFromSignIn();
    await page.waitForTimeout(1500);

    // Step 3: Billing Address
    await expect(checkoutPage.streetInput).toBeVisible({ timeout: 10000 });

    // Select Austria as country
    await checkoutPage.countrySelect.selectOption({ label: 'Austria' });

    // The billing form is pre-filled from the user profile. Explicitly clear
    // the required fields that TC-002 leaves empty (Postal code, House number, State).
    await checkoutPage.postalCodeInput.fill('');
    await checkoutPage.houseNumberInput.fill('');
    await checkoutPage.stateInput.fill('');

    // Fill only Street and City
    await checkoutPage.streetInput.fill('Test Street');
    await checkoutPage.cityInput.fill('Vienna');
    await page.waitForTimeout(1000);

    // Verify the "Proceed to checkout" button is disabled (blocked)
    await expect(checkoutPage.proceedBillingBtn).toBeDisabled({ timeout: 10000 });
  });
});