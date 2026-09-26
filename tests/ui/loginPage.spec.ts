import { test, Page, expect, Locator } from '@playwright/test'
import { HomePage } from 'pages/HomePage'
import { LoginPage } from 'pages/LoginPage'
import { MyAccountPage } from 'pages/MyAccountPage'

let homePage: HomePage
let loginPage: LoginPage
let myAccountPage: MyAccountPage

test.beforeEach('test', async ({ page }) => {
    homePage = new HomePage(page)
    await page.goto('/opencart')
})

test('perform login', async () => {
    loginPage = await homePage.clickLoginPage()
    await loginPage.performLogin('rohit1@ibm.com', '1234')
})