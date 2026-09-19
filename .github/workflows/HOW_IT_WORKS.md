# How `playwright.yml` Triggers GitHub Actions

## 1. The Magic: File Location

The **entire trigger mechanism is based purely on the file path**.  
GitHub automatically scans for any YAML file inside the `.github/workflows/` directory of a repository. When GitHub detects a file there, it registers it as a workflow — no manual registration or configuration needed.

---

## 2. The Trigger Events (`on:`)

```yaml
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
```

This block declares **two automatic triggers**:

| Event          | When it fires                                                          |
|----------------|------------------------------------------------------------------------|
| `push`         | Every time you `git push` a commit to `main` or `master`              |
| `pull_request` | Every time a PR is opened, updated, or synchronized targeting `main` or `master` |

When either event happens on GitHub's servers, GitHub reads the workflow file and spins up a **runner** to execute the jobs.

---

## 3. What the Runner Does (the `jobs:` block)

The `test` job runs on `ubuntu-latest` (a GitHub-hosted Linux VM) and executes these steps in order:

```
1. actions/checkout@v4          → clones your repo code onto the runner
2. actions/setup-node@v4        → installs Node.js LTS
3. npm ci                       → installs project dependencies
4. npx playwright install       → downloads Chromium, Firefox, WebKit browsers
5. npx playwright test          → runs ALL tests from ./tests directory
6. upload-artifact@v4           → uploads the HTML report (kept 30 days)
```

---

## 4. How `playwright.config.ts` Adapts for CI

The config detects the CI environment via the `process.env.CI` variable  
(GitHub Actions sets `CI=true` automatically on the runner):

```typescript
forbidOnly: !!process.env.CI,    // fails build if test.only is left in code
retries: process.env.CI ? 2 : 0, // retries failed tests twice on CI
workers: process.env.CI ? 1 : undefined, // runs tests serially on CI
headless: true                   // no display available on CI — headless required
```

---

## 5. The Full Flow

```
Developer
   │
   │  git push to main/master
   ▼
GitHub
   │  Detects .github/workflows/playwright.yml
   │  Reads the `on:` block — push event matches
   ▼
ubuntu-latest Runner (GitHub-hosted VM)
   │
   ├── actions/checkout@v4          (clone repo)
   ├── actions/setup-node@v4        (install Node LTS)
   ├── npm ci                       (install dependencies)
   ├── npx playwright install       (download browsers)
   ├── npx playwright test          (run all tests)
   └── upload-artifact@v4           (save HTML report)
   │
   ▼
GitHub
   └── Shows ✅ / ❌ status on the commit or PR
```

---

## 6. Key Takeaways

There is **no manual wiring** required. The three things that make it work are:

1. **File is in `.github/workflows/`** — GitHub auto-discovers it.
2. **`on:` block defines the events** — push or PR to `main`/`master` fires the workflow.
3. **`runs-on: ubuntu-latest`** — GitHub provisions and manages the VM; tests run remotely in the cloud.

---

## 7. Artifact: HTML Report

After every run, the Playwright HTML report is uploaded as a GitHub Actions artifact:

- **Name:** `playwright-report`
- **Location:** `playwright-report/` folder in the runner workspace
- **Retention:** 30 days
- **Access:** Go to the workflow run on GitHub → *Artifacts* section → download the zip
