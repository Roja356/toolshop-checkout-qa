export class CartPage {
  constructor(page) {
    this.page = page;

    this.quantityInput = page.locator('[data-test="quantity"]');
    this.addToCartBtn = page.locator('[data-test="add-to-cart"]');
    this.cartQuantityBadge = page.locator('[data-test="cart-quantity"]');

    this.cartProductTitle = page.locator('[data-test="product-title"]');
    this.cartQuantityInput = page.locator('[data-test="product-quantity"]');
    this.cartProductPrice = page.locator('[data-test="product-price"]');
    this.cartLineTotal = page.locator('[data-test="line-price"]');

    this.cartGrandTotal = page.locator('[data-test="cart-total"]');
    this.continueShoppingBtn = page.locator('[data-test="continue-shopping"]');
    this.proceedCheckoutBtn = page.locator('[data-test="proceed-1"]');

    this.cartRow = page.locator('table tbody tr');

    this.quantityUpdatedMessage = page.locator('.toast-message');
  }

  async addToCart() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) => /\/carts/.test(res.url()) && res.request().method() === 'POST',
        { timeout: 10000 }
      ).catch(() => null),
      this.addToCartBtn.click(),
    ]);

    if (response && !response.ok()) {
      const body = await response.text().catch(() => 'N/A');
      throw new Error(`Add to cart failed with status ${response.status()}. Body: ${body}`);
    }
  }

  async goToCheckout() {
    await this.page.goto('/checkout');
  }

  getRowByProductName(productName) {
    const cleanName = productName.trim().replace(/"/g, '\\"');
    return this.cartRow.filter({
      has: this.page.locator(`[data-test="product-title"]:text-is("${cleanName}")`),
    });
  }

  async getGrandTotalValue() {
    const text = await this.cartGrandTotal.textContent();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getRowLineTotalValue(row) {
    const text = await row.locator('[data-test="line-price"]').textContent();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getSumOfAllLineTotals() {
    const lineTotals = await this.cartLineTotal.allTextContents();
    return lineTotals.reduce((sum, text) => sum + parseFloat(text.replace(/[^0-9.]/g, '')), 0);
  }

  async getCartRowCount() {
    return await this.cartRow.count();
  }

  async setRowQuantity(row, value) {
    const input = row.locator('[data-test="product-quantity"]');
    await input.fill(String(value));
    await input.blur();
  }

  
  async removeItemFromRow(row) {
    const removeBtn = row.locator('a.btn.btn-danger');
    await removeBtn.click();
  }
}