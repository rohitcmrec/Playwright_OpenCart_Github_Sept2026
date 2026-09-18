import { test as base, expect } from '@playwright/test'
import { HomePage } from 'pages/HomePage'
import { LoginPage } from 'pages/LoginPage'
import { MyAccountPage } from 'pages/MyAccountPage'

export const test = base.extend<{ myAccountPage: MyAccountPage }>({
    myAccountPage: async ({ page }, use) => {
        const homePage = new HomePage(page);
        const loginPage = await homePage.clickLoginPage();
        const myAccountPage = await loginPage.performLogin('rohit1@ibm.com', '1234')
        await use(myAccountPage);
    }
})

export { expect }