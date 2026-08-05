import 'dotenv/config';
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication & Registration', () => {

    let loginPage;

    test.beforeEach(async ({ page }) => {

        loginPage = new LoginPage(page);

        await loginPage.navigate();

        await loginPage.openLoginPage();

    });

    test('TC-001 Login with valid credentials', async () => {

        const email = process.env.EMAIL;;
        const password = process.env.PASSWORD;

        await loginPage.login(email, password);

        await loginPage.verifySuccessfulLogin();

    });

    test('TC-002 Login with invalid password', async () => {

        const email = process.env.EMAIL;
        const password = "WrongPassword123";

        await loginPage.login(email, password);

        await loginPage.verifyInvalidCredentialError();

    });

    test('TC-003 Login with empty fields validation', async () => {

        await loginPage.login('', '');

        await loginPage.verifyEmailRequiredValidation();

    });

});