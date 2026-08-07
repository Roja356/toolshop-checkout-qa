import { expect } from '@playwright/test';

export class SecurityPage {

    constructor(page) {
        this.page = page;

        // Invoice
        this.accessDeniedMessage = page.getByText("This invoice doesn't exist.");

        // Logout
        this.userMenu = page.locator('[data-test="nav-menu"]');
        this.signOutBtn = page.locator('[data-test="nav-sign-out"]');
    }

    async openInvoice(invoiceId) {
        await this.page.goto(`/account/invoices/${invoiceId}`);
    }

    async verifyAccessDenied() {

    console.log(await this.page.url());

    await this.page.waitForTimeout(10000);

}

    async openInvoicesPage() {
        await this.page.goto('/account/invoices');
    }

    async logout() {
        await this.userMenu.click();
        await this.signOutBtn.click();
    }

}