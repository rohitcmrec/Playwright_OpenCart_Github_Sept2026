import { Page, Locator } from '@playwright/test'

export class RegisterPage {
    private readonly page: Page

    constructor(page: Page) {
        this.page = page;
    }
}