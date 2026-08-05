import { expect } from '@playwright/test';

export class LoginPage {

    constructor(page) {
        this.page = page;

        // Locators (Replace these with your actual locators)
        this.signInBtn = page.locator('[data-test="nav-sign-in"]');
        this.emailInput = page.locator('[data-test="email"]');
        this.passwordInput = page.locator('[data-test="password"]');
        this.loginBtn = page.locator('[data-test="login-submit"]');

        this.accountHeader = page.locator('[data-test="nav-menu"]');
        this.errorMessage = page.getByText('Invalid email or password');
        this.emailValidation = page.getByText('Email is required');
    }

    async navigate() {
        await this.page.goto('/');
    }

    async openLoginPage() {
        await this.signInBtn.click();
    }

    async login(email, password) {

        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginBtn.click();

    }

    async verifySuccessfulLogin() {
        await expect(this.accountHeader).toBeVisible();
    }

    async verifyInvalidCredentialError() {
        await expect(this.errorMessage).toBeVisible();
    }

    async verifyEmailRequiredValidation() {
        await expect(this.emailValidation).toBeVisible();
    }

}