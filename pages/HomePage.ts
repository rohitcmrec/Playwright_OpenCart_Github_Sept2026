import { Page, Locator } from "@playwright/test"
import { LoginPage } from "./LoginPage"
import { RegisterPage } from "./RegisterPage"

export class HomePage {

    private readonly page: Page
    private readonly myAccountLink: Locator
    private readonly registerLink: Locator
    private readonly loginLink: Locator

    constructor(page: Page) {
        this.page = page;
        this.myAccountLink = this.page.getByRole('link', { name: ' My Account', exact: true });
        this.registerLink = this.page.getByRole('link', { name: 'Register', exact: true })
        this.loginLink = this.page.getByRole('link', { name: 'Login', exact: true })
    }

    async titleHomePage(): Promise<string> {
        try {
            return await this.page.title();
        } catch (error) {
            console.log(` title cant be fetched due to ${error}`);
            throw error
        }
    }

    urlHomePage(): string {
        try {
            return this.page.url()
        } catch (error) {
            console.log(`URL cant be fetched due to ${error}`);
            throw error;
        }
    }

    async clickRegisterLink(): Promise<RegisterPage> {
        await this.myAccountLink.click()
        await this.registerLink.click();
        return new RegisterPage(this.page);
    }

    async clickLoginPage(): Promise<LoginPage> {
        await this.myAccountLink.click();
        await this.loginLink.click({ timeout: 5000 });
        return new LoginPage(this.page);
    }


}