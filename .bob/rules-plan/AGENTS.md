# Plan Mode Architecture Rules

## Non-Obvious Constraints

- **Page object chain is linear by design** — `HomePage → LoginPage → MyAccountPage`. Each page object receives the same `page` instance and returns the next page object. Adding a new page requires inserting it into this chain, not instantiating it independently in tests.
- **`globalSetup` is tightly coupled to `projects[0]`** — reading `config.projects[0].use.baseURL` means if the chromium project is ever removed or reordered, globalSetup breaks silently.
- **Auth state is file-system coupled** — `.playwright/auth.json` must exist on disk before any storageState-based test runs. CI pipelines need to either create this directory or reuse a cached artifact.
- **`fullyParallel: true`** — all tests run in parallel by default. Any test that mutates shared state (e.g. account settings) will race with others. Tests currently only read state, so this is safe.
- **No teardown for auth.json** — the saved session is never invalidated between runs. If the OpenCart session expires on the server, all storageState-based tests will fail until `globalSetup` is re-run (i.e., the suite is re-run from scratch).
- **`roleSetup.ts` is incomplete** — it has an incorrect import path (`node_modules/playwright/test`) and is not registered in `playwright.config.ts`. It cannot be used until fixed and registered as a `globalSetup`.
- **TypeScript strict mode is on** — `"strict": true` in tsconfig. All new code must satisfy strict null checks and no implicit `any`.
