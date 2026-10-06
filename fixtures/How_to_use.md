# Playwright Architecture Cheat Sheet: Context Isolation & Hooks

This reference guide explains how Playwright handles browser contexts across hooks (`beforeAll`, `beforeEach`) and custom fixtures, resolving the common "blank page / context mismatch" issue.

---

## 🚨 The Core Rule of Playwright Isolation
Unlike legacy frameworks (Selenium, Cypress), Playwright enforces strict **Test Isolation**. 
* **Each test (`test(...)`) runs in its own isolated Browser Context** (like a brand-new, incognito browser window).
* Cookies, cache, and local storage are **completely wiped** between tests.

---

## 🚫 Why `beforeAll` Fails for UI Navigation
If you use `page.goto()` inside a `beforeAll` block, your test will fail or open a blank `about:blank` page. 

### The Broken Timeline:
1. **`beforeAll` runs first:** Playwright opens a temporary browser window, navigates to your URL, and finishes.
2. **Context Destroyed:** As soon as `beforeAll` ends, **Playwright completely closes and destroys that window.** 
3. **The Test / Fixture starts:** Playwright opens a **brand-new, completely empty browser window** for your actual test block. 
4. **The Crash:** Your fixture or test tries to click elements, but it is trapped on a blank page because the navigation happened in a window that no longer exists.

---

## 💡 What is `beforeAll` Actually Useful For?
Because `beforeAll` runs in a separate, temporary context, **never use it for UI interactions or navigation**. Instead, use it for global, non-UI setup steps:

* 📊 **Database Seeding:** Deleting old test users or injecting test data via API/DB queries before UI tests start.
* 🔑 **API Token Generation:** Hitting a backend auth endpoint to grab a token string, saving it to a global variable, and reusing it across tests.
* 📁 **File System Prep:** Creating temporary directories or generating mock files needed for uploads.

---

## 🔄 How `beforeEach` and Fixtures Share the Window
Unlike `beforeAll`, a `beforeEach` hook runs **inside the exact same browser window** assigned to that specific test.

### The Working Timeline:
1. **Test Starts:** Playwright spins up a dedicated browser window for the test.
2. **`beforeEach` Runs:** Uses **this exact window** to navigate to the URL (`page.goto`).
3. **Fixture Executed:** Interacts with **this exact window** (which is now successfully sitting on your website) to perform steps like logging in.
4. **Test Executes:** Verifies assertions on the active page.

---

## 📋 The Hook Decision Matrix

| What are you trying to do? | Where should it go? | Why? |
| :--- | :--- | :--- |
| **Navigate to a URL** (`page.goto`) | `beforeEach` (or Fixture Setup) | Every test needs its own fresh window loaded to that URL. |
| **Log in via the UI** | `beforeEach` (or Fixture Setup) | Sessions are wiped between tests; each window must log in fresh. |
| **Seed / Clean a Database** | `beforeAll` | You only need to reset the data once for the entire test suite. |
| **Fetch a Global API Token** | `beforeAll` | Grab the string token once, store it in a variable, and pass it around. |

---

## 🛠️ Best Practice Implementation (Custom Fixture)

Instead of splitting navigation into a `beforeEach` hook and login into a fixture, the cleanest, most maintainable Playwright pattern is to **let the fixture handle the entire page state lifecycle**.

### 1. The Fixture File (`LoginFixture.ts`)
```typescript
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { MyAccountPage } from '../pages/MyAccountPage';

export const test = base.extend<{ myAccountPage: MyAccountPage }>({
    myAccountPage: async ({ page }, use) => {
        // 1. Handle navigation inside the fixture context
        await page.goto('https://naveenautomationlabs.com');
        
        // 2. Perform the UI setup actions
        const homePage = new HomePage(page);
        const loginPage = await homePage.clickLogin();
        const myAccountPage = await loginPage.performLogin('rohit1@ibm.com', '1234');
        
        // 3. Pass the fully prepared page context to the test block
        await use(myAccountPage);
    }
});

export { expect };
```

### 2. The Clean Test File (`login.spec.ts`)
```typescript
import { test, expect } from '../../fixtures/LoginFixture';

test.describe('Perform login via fixture', () => {
    // No beforeAll or beforeEach needed here! The fixture handles its own state.
    
    test('should successfully land on My Account page', async ({ myAccountPage }) => {
        const title = await myAccountPage.getMyAccountPageTitle();
        expect(title).toBe('My Account');
    });
});
```
