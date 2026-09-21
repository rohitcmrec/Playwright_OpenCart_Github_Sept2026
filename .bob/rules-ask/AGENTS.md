# Ask Mode Context

## Non-Obvious Structure

- `storageState/` contains only `globalSetup.ts` (the one-time login runner). The fixture that *consumes* the saved session (`storageStateFixture.ts`) lives in `fixtures/`, not in `storageState/`.
- There are **three separate auth approaches** in the codebase, each in a different file:  
  1. `fixtures/loginFixture.ts` — full UI login per test  
  2. `fixtures/storageStateFixture.ts` — pre-auth via `{ browser }` context  
  3. `tests/myAccountPage.testUse.spec.ts` — `test.use({ storageState })` inline  
- `utils/dataProvider.ts` exists but `test-data/` is currently empty — the data infrastructure is ready but no data files have been added yet.
- The `storageState/roleSetup.ts` file is a scaffold (empty `roles` array) for multi-role auth — it is **not wired up** anywhere and imports from `node_modules/playwright/test` (incorrect path).
- `playwright.config.ts` has `reporter: 'list'` not `html` — there is no auto-generated HTML report unless `--reporter=html` is passed explicitly.
