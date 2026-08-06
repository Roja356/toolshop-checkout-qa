import { test, expect } from '@playwright/test';
import { LoginPage } from '../authentication/pages/LoginPage';
import { SecurityPage } from './pages/SecurityPage';

test.describe('Invoice Security', () => {


    test('TC-001 - User cannot access another user invoice', async ({ page }) => {

        const loginPage = new LoginPage(page);
        const securityPage = new SecurityPage(page);

    
        await loginPage.navigate();

    
        await loginPage.openLoginPage();

        
        await loginPage.login(
            process.env.EMAIL,
            process.env.PASSWORD
        );

        
        await loginPage.verifySuccessfulLogin();


        await securityPage.openInvoice('01kz30gqprct8b1xty10gt27yf');


        await securityPage.verifyAccessDenied();

    });


    test('TC-002 - Redirect to login after logout', async ({ page }) => {

        const loginPage = new LoginPage(page);
        const securityPage = new SecurityPage(page);

        // Navigate
        await loginPage.navigate();

        // Login
        await loginPage.openLoginPage();

        await loginPage.login(
            process.env.EMAIL,
            process.env.PASSWORD
        );

        await loginPage.verifySuccessfulLogin();

        // Open protected page
        await securityPage.openInvoicesPage();

        await securityPage.logout();

        // Try to access protected page again
        await securityPage.openInvoicesPage();

        // Verify redirect to login page
        await expect(page).toHaveURL(/.*auth\/login/);

    });

    test('TC-003 - Guest user cannot access invoice without authentication', async ({ page }) => {

        const securityPage = new SecurityPage(page);

        
        await securityPage.openInvoice('01KZC09KDWV1C6F4SGBKSBNVFY');

       
        await securityPage.verifyAccessDenied();

    });

});