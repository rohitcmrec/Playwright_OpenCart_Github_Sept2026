import { FullConfig, chromium } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

const roles = [
    { username: '', password: '', role: '' },
    { username: '', password: '', role: '' }
]

async function roleSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;

    for (const role of roles) {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        // Navigate to the OpenCart home page
        await page.goto(`${baseURL}/opencart`);

        // Use existing page objects to navigate to login and authenticate
        const homePage = new HomePage(page);
        const loginPage = await homePage.clickLoginPage();
        await loginPage.performLogin(role.username, role.password);

        await page.context().storageState({ path: `.playwright/${role.role}.json` });

        await browser.close();
    }
}

export default roleSetup;
