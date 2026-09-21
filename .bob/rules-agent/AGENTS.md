# Agent Coding Rules

## Non-Obvious Patterns

- **No npm scripts** — always run tests with `npx playwright test`, never `npm test`.
- **Bare module imports work** — `import { HomePage } from 'pages/HomePage'` resolves because `tsconfig.json` has `paths: { "*": ["./*"] }`. Use bare paths (no `./`) for `pages/`, `utils/`, `fixtures/` imports.
- **Page factory chain** — navigation methods return a new page object instance. Always `return new NextPage(this.page)` at the end of navigation methods. Never instantiate page objects inside tests directly if a factory method exists.
- **Locators go in constructor** — all `Locator` properties are `private readonly`, defined in `constructor`, never created inline in methods.
- **storageStateFixture uses `{ browser }` not `{ page }`** — required to create a custom context; passing `{ page }` would give a context that ignores storageState.
- **`.playwright/` directory must exist** before `globalSetup` runs — create it with `New-Item -ItemType Directory -Force -Path '.playwright'` on Windows.
- **`globalSetup` reads `config.projects[0].use.baseURL`** — `FullConfig` has no top-level `use`; the root-level `use` is merged into each project before globalSetup runs.
- **DataProvider paths are relative to `utils/`** — `path.resolve(__dirname, filePath)` anchors from the `utils/` directory, not the project root.
- **`"type": "commonjs"`** in package.json — do not use ESM `import.meta` or top-level await outside async functions.
