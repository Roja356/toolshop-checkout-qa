import { expect } from '@playwright/test';

export class CheckoutPage {
  constructor(page) {
    this.page = page;

    // ===== Header / Navigation =====
    this.navSignIn = page.locator('[data-test="nav-sign-in"]');
    this.navMenu = page.locator('[data-test="nav-menu"]');
    this.cartQuantityBadge = page.locator('[data-test="cart-quantity"]');

    // ===== Step 1: Cart =====
    this.cartProductTitle = page.locator('[data-test="product-title"]');
    this.cartProductPrice = page.locator('[data-test="product-price"]');
    this.cartProductQuantity = page.locator('[data-test="product-quantity"]');
    this.cartLineTotal = page.locator('[data-test="line-price"]');
    this.cartGrandTotal = page.locator('[data-test="cart-total"]');
    this.continueShoppingBtn = page.locator('[data-test="continue-shopping"]');
    this.proceedCheckoutBtn = page.locator('[data-test="proceed-1"]');
    this.cartRow = page.locator('table tbody tr');

    // ===== Step 2: Sign In =====
    this.emailInput = page.locator('[data-test="email"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginSubmitBtn = page.locator('[data-test="login-submit"]');
    this.registerLink = page.locator('[data-test="register-link"]');
    this.forgotPasswordLink = page.locator('[data-test="forgot-password-link"]');
    this.guestEmailInput = page.locator('[data-test="guest-email"]');
    this.guestFirstNameInput = page.locator('[data-test="guest-first-name"]');
    this.guestLastNameInput = page.locator('[data-test="guest-last-name"]');
    this.guestSubmitBtn = page.locator('[data-test="guest-submit"]');
    this.loggedInMessage = page.getByText(/Hello .*, you are already logged in/);
    this.proceedSignInBtn = page.locator('[data-test="proceed-2"]');

    // ===== Step 3: Billing Address =====
    this.countrySelect = page.locator('[data-test="country"]');
    this.postalCodeInput = page.locator('[data-test="postal_code"]');
    this.houseNumberInput = page.locator('[data-test="house_number"]');
    this.streetInput = page.locator('[data-test="street"]');
    this.cityInput = page.locator('[data-test="city"]');
    this.stateInput = page.locator('[data-test="state"]');
    this.proceedBillingBtn = page.locator('[data-test="proceed-3"]');

    // ===== Step 4: Payment =====
    this.paymentMethodSelect = page.locator('[data-test="payment-method"]');
    this.finishBtn = page.locator('[data-test="finish"]');

    // ===== Order Confirmation =====
    this.confirmationMessage = page.getByText('Payment was successful');
    this.orderNumber = page.locator('[data-test="order-number"], .order-number, .confirmation-number');
  }

  // ===== Navigation =====
  async goto() {
    await this.page.goto('/checkout');
  }

  // ===== Step 1: Cart =====
  async getCartRowCount() {
    return await this.cartRow.count();
  }

  async getGrandTotalValue() {
    const text = await this.cartGrandTotal.textContent();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getRowLineTotalValue(row) {
    const text = await row.locator('[data-test="line-price"]').textContent();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  getRowByProductName(productName) {
    const cleanName = productName.trim().replace(/"/g, '\\"');
    return this.cartRow.filter({
      has: this.page.locator(`[data-test="product-title"]:text-is("${cleanName}")`),
    });
  }

  async proceedFromCart() {
    await this.proceedCheckoutBtn.click();
  }

  // ===== Step 2: Sign In =====
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginSubmitBtn.click();
  }

  async proceedFromSignIn() {
    await this.proceedSignInBtn.click();
  }

  // ===== Step 3: Billing Address =====
  async fillBillingAddress({ country = 'Austria', postalCode = '1010', houseNumber = '42', street = 'Test Street', city = 'Vienna', state = 'Vienna' } = {}) {
    await this.countrySelect.selectOption({ label: country });
    await this.postalCodeInput.fill(postalCode);
    await this.houseNumberInput.fill(houseNumber);
    await this.streetInput.fill(street);
    await this.cityInput.fill(city);
    await this.stateInput.fill(state);
  }

  async proceedFromBilling() {
    await this.proceedBillingBtn.click();
  }

  // ===== Step 4: Payment =====
  async selectPaymentMethod(method) {
    await this.paymentMethodSelect.selectOption({ label: method });
  }

  async confirmOrder() {
    await this.finishBtn.click();
  }

  // ===== Verification =====
  async verifyConfirmation() {
    await expect(this.confirmationMessage).toBeVisible({ timeout: 15000 });
  }
}