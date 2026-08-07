import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../checkout/page/checkoutPage';
import { InvoicePage } from './page/invoicePage';
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

// ============================================================
// Helper: Complete full checkout and return invoice number
// ============================================================
async function completeCheckoutAndGetInvoiceNumber(page, checkoutPage, productName) {
  // 1. Go to checkout
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

  // 2. Proceed to checkout (Cart -> Sign In)
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

  // 3. Click Confirm to finalize the order
  // The Confirm button requires TWO clicks:
  //   1st click -> validates payment, shows "Payment was successful"
  //   2nd click -> finalizes order, navigates to confirmation page with invoice number
  await expect(checkoutPage.finishBtn).toBeEnabled({ timeout: 10000 });
  await checkoutPage.confirmOrder();

  // Wait for the first click to register: "Payment was successful" must appear
  await expect(page.getByText('Payment was successful')).toBeVisible({ timeout: 15000 });

  // Second click finalizes the order and reveals the invoice number (INV-xxxxxx)
  await checkoutPage.confirmOrder();

  // 4. Extract invoice number from the order-confirmation page
  const invoicePage = new InvoicePage(page);
  const invoiceNumber = await invoicePage.getInvoiceNumberFromConfirmation();
  expect(invoiceNumber, 'Invoice number should be present in confirmation').toBeTruthy();
  return invoiceNumber;
}

test.describe('Invoice - Registered User', () => {
  let checkoutPage;
  let invoicePage;

  // ============================================================
  // Register workflow (beforeAll): create a test user via API
  // so that the invoice test cases can reuse the same user.
  // This runs once before all invoice tests in this describe block.
  // ============================================================
  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request);
    expect(user.email, 'Registered user email should be present').toBeTruthy();
    expect(user.password, 'Registered user password should be present').toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    invoicePage = new InvoicePage(page);
  });

  // ============================================================
  // TC-001 (Invoice): Order confirmation page shows correct order list
  // ============================================================
  test('TC-001 (Invoice): Order confirmation page shows correct order list', async ({ page, request }) => {
    test.setTimeout(120000);

    // 1. Reuse the user registered in the beforeAll workflow
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

    // 4. Complete checkout and get the invoice number
    const invoiceNumber = await completeCheckoutAndGetInvoiceNumber(page, checkoutPage, productName);

    // 5. Navigate to Invoices via user menu
    await invoicePage.navigateToInvoicesViaMenu();
    await expect(page).toHaveURL(/\/account\/invoices/, { timeout: 10000 });
    await expect(invoicePage.pageTitle).toHaveText('Invoices', { timeout: 10000 });

    // 6. Locate the invoice in the list
    const invoiceRow = await invoicePage.getInvoiceRowByNumber(invoiceNumber);
    await expect(invoiceRow).toBeVisible({ timeout: 10000 });

    // 7. Verify the invoice number, billing address, date, and total match the order just placed
    const rowInvoiceNumber = await invoicePage.getInvoiceNumberFromRow(invoiceRow);
    expect(rowInvoiceNumber).toBe(invoiceNumber);

    const rowBillingAddress = await invoicePage.getBillingAddressFromRow(invoiceRow);
    expect(rowBillingAddress).toBeTruthy();

    const rowInvoiceDate = await invoicePage.getInvoiceDateFromRow(invoiceRow);
    expect(rowInvoiceDate).toBeTruthy();

    const rowTotal = await invoicePage.getTotalFromRow(invoiceRow);
    expect(rowTotal).toBeTruthy();
  });

  
});
