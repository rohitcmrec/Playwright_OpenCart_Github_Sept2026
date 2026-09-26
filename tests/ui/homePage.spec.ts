import { test, Page, expect } from '@playwright/test'
import { HomePage } from '../../pages/HomePage'

let homePage: HomePage

test.beforeEach('before each step', async ({ page }) => {
    homePage = new HomePage(page)
    await page.goto('/opencart/')
})

test.afterEach('after each', async ({ page }) => {
    await page.close();
})

test('verify title', async () => {
    let title = await homePage.titleHomePage()
    console.log(`Actual tile is ${title}`);
})

test('verify URL', async () => {
    let URL = homePage.urlHomePage()
    console.log(`Actual URL is ${URL}`);
    expect(URL).toContain('/opencart/')

})