# AdManDock — Local-first developer tools

A private, local-first developer workspace scaffold.

## Requirements
- Node.js 22.12+ (recommended)
- npm
- Angular CLI 21

## Run
```bash
npm install
npm start
```
Open http://localhost:4200

## Included
- Standalone Angular application
- Lazy-loaded feature routes
- Responsive application shell, sidebar and visual design tokens
- Light/dark/system theme preference
- English/French language switch
- Dashboard and placeholder tool pages
- Reusable editor and copy button
- JSON Explorer for local validation, formatting and minification
- JSON Diff for structural comparison of JSON documents
- Dexie-based local preferences/favorites/recent tools persistence
- Vitest unit tests for the core tool catalog and JSON processing

## Important
This is an early release, not a production-ready product. Review dependency versions before deployment. Tool input is processed locally and is not persisted or transmitted by AdManDock.

## GitHub repository ruleset
Import `.github/rulesets/public-default.json` from **Settings → Rules → Rulesets → New ruleset → Import a ruleset**. It applies to the default branch, requires pull requests with one approval and resolved review conversations, requires the `build` CI check, and prevents branch deletion and force pushes.

The `build` CI check runs the unit tests with coverage, requires at least 80% coverage for statements, branches, functions, and lines, audits npm dependencies (blocking high and critical vulnerabilities), and builds the application. Coverage totals appear in the workflow logs, and HTML/LCOV reports are available as the `coverage-report` artifact. Because the check is required by the ruleset, any failure blocks merging.

To test the required CI gate without affecting normal pushes or pull requests, run the workflow manually from GitHub Actions and choose a `failure_scenario` (`tests`, `coverage`, `audit`, or `build`). Choose `none` for a normal run. These scenarios intentionally fail after the corresponding real check passes; they do not simulate actual test, coverage, audit, or build errors.

To remove the temporary failure scenarios, first choose `none` for any manual run. Then remove the four `Simulate ... failure` steps and the `workflow_dispatch` input from `.github/workflows/ci.yml`, and finally delete `.github/ci-failure-fixtures/`. The fixtures correspond to pipeline order: tests, coverage, audit, then build.
