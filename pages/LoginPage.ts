import { Page, Locator } from '@playwright/test'
import { MyAccountPage } from './MyAccountPage'

export class LoginPage {
    private readonly page: Page
    private readonly username: Locator
    private readonly password: Locator
    private readonly loginBtn: Locator

    constructor(page: Page) {
        this.page = page
        this.username = this.page.getByRole('textbox', { name: 'E-Mail Address', exact: true })
        this.password = this.page.getByRole('textbox', { name: 'Password', exact: true })
        this.loginBtn = this.page.getByRole('button', { name: 'Login', exact: true })
    }

    async performLogin(user: string, pwd: string) {
        await this.username.fill(user)
        await this.password.fill(pwd)
        await this.loginBtn.click();
        return new MyAccountPage(this.page);
    }
}