import { expect } from '@playwright/test';

export class InvoicePage {
  constructor(page) {
    this.page = page;

    // ===== Navigation =====
    this.navMenu = page.locator('[data-test="nav-menu"]');
    this.navMyInvoices = page.locator('[data-test="nav-my-invoices"]');

    // ===== Invoice List Page =====
    this.pageTitle = page.locator('[data-test="page-title"]');
    this.invoiceTable = page.locator('table');
    this.invoiceRows = page.locator('table tbody tr');
    this.paginationPrev = page.locator('[data-test="pagination-prev"]');
    this.paginationNext = page.locator('[data-test="pagination-next"]');

    // ===== Invoice Details Page =====
    this.downloadPdfBtn = page.locator('[data-test="download-invoice"]');
    this.invoiceNumberInput = page.locator('[data-test="invoice-number"]');
    this.invoiceDateInput = page.locator('[data-test="invoice-date"]');
    this.totalInput = page.locator('[data-test="total"]');
    this.streetInput = page.locator('[data-test="street"]');
    this.postalCodeInput = page.locator('[data-test="postal_code"]');
    this.cityInput = page.locator('[data-test="city"]');
    this.stateInput = page.locator('[data-test="state"]');
    this.countryInput = page.locator('[data-test="country"]');
    this.paymentMethodInput = page.locator('[data-test="payment-method"]');
    // Payment Information fields may use either underscore or hyphen
    // data-test attributes depending on the page context. Use robust
    // multi-selectors (matching the pattern in completeBankTransferPayment)
    // so the locators work on both the checkout form and invoice details page.
    this.accountNameInput = page.locator('[data-test="account_name"], [data-test="account-name"], input[name="account_name"], input[formcontrolname="account_name"]').first();
    this.accountNumberInput = page.locator('[data-test="account_number"], [data-test="account-number"], input[name="account_number"], input[formcontrolname="account_number"]').first();
    this.bankNameInput = page.locator('[data-test="bank_name"], [data-test="bank-name"], input[name="bank_name"], input[formcontrolname="bank_name"]').first();

    // ===== Products Table (Invoice Details) =====
    this.productsTable = page.locator('table');
    this.productsRows = page.locator('table tbody tr');

    // ===== Order Confirmation =====
    // Confirmation page shows the invoice number as text like "INV-123456"
    this.orderConfirmation = page.getByText(/INV-\d+/);
  }

  // ===== Navigation =====
  async gotoInvoices() {
    await this.page.goto('/account/invoices');
  }

  async gotoInvoiceDetails(invoiceId) {
    await this.page.goto(`/account/invoices/${invoiceId}`);
  }

  async navigateToInvoicesViaMenu() {
    await this.navMenu.click();
    await this.navMyInvoices.click();
  }

  // ===== Invoice List =====
  async getInvoiceRowByNumber(invoiceNumber) {
    return this.invoiceRows.filter({
      has: this.page.locator(`td:first-child:text-is("${invoiceNumber}")`),
    });
  }

  async getInvoiceNumberFromRow(row) {
    return (await row.locator('td').nth(0).textContent()).trim();
  }

  async getBillingAddressFromRow(row) {
    return (await row.locator('td').nth(1).textContent()).trim();
  }

  async getInvoiceDateFromRow(row) {
    return (await row.locator('td').nth(2).textContent()).trim();
  }

  async getTotalFromRow(row) {
    return (await row.locator('td').nth(3).textContent()).trim();
  }

  async clickDetailsOnRow(row) {
    await row.locator('td').nth(4).locator('a').click();
  }

  // ===== Invoice Details =====
  async getInvoiceNumber() {
    return await this.invoiceNumberInput.inputValue();
  }

  async getInvoiceDate() {
    return await this.invoiceDateInput.inputValue();
  }

  async getTotal() {
    return await this.totalInput.inputValue();
  }

  async getStreet() {
    return await this.streetInput.inputValue();
  }

  async getPostalCode() {
    return await this.postalCodeInput.inputValue();
  }

  async getCity() {
    return await this.cityInput.inputValue();
  }

  async getState() {
    return await this.stateInput.inputValue();
  }

  async getCountry() {
    return await this.countryInput.inputValue();
  }

  async getPaymentMethod() {
    return await this.paymentMethodInput.inputValue();
  }

  async getAccountName() {
    await this.accountNameInput.waitFor({ state: 'visible', timeout: 15000 });
    return await this.accountNameInput.inputValue();
  }

  async getAccountNumber() {
    await this.accountNumberInput.waitFor({ state: 'visible', timeout: 15000 });
    return await this.accountNumberInput.inputValue();
  }

  async getBankName() {
    await this.bankNameInput.waitFor({ state: 'visible', timeout: 15000 });
    return await this.bankNameInput.inputValue();
  }

  // ===== Products Table =====
  async getProductRowCount() {
    return await this.productsRows.count();
  }

  async getProductNameFromRow(row) {
    return (await row.locator('td').nth(1).textContent()).trim();
  }

  async getProductQuantityFromRow(row) {
    return (await row.locator('td').nth(0).textContent()).trim();
  }

  async getProductPriceFromRow(row) {
    return (await row.locator('td').nth(2).textContent()).trim();
  }

  async getProductTotalFromRow(row) {
    return (await row.locator('td').nth(3).textContent()).trim();
  }

  // ===== Order Confirmation =====
  async getConfirmationText() {
    await this.orderConfirmation.waitFor({ state: 'visible', timeout: 15000 });
    return await this.orderConfirmation.textContent();
  }

  async getInvoiceNumberFromConfirmation() {
    const text = await this.getConfirmationText();
    const match = text.match(/INV-\d+/);
    return match ? match[0] : null;
  }
}