import { Page, Locator } from '@playwright/test'

export class MyAccountPage {
    private readonly page: Page

    constructor(page: Page) {
        this.page = page;
    }

    async getMyAccountPageTitle() {
        const title = await this.page.title()
        return title
    }
}