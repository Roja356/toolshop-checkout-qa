# Toolshop Checkout QA — TS-1420

## Environments
- Web UI (stable): https://practicesoftwaretesting.com
- Web UI (bug-seeded): https://with-bugs.practicesoftwaretesting.com
- API (stable): https://api.practicesoftwaretesting.com
- API (bug-seeded): https://api-with-bugs.practicesoftwaretesting.com
- Local (Docker): UI → http://localhost:4200 , API → http://localhost:8091

## Conventions
- Test IDs: manual TC-P/N/E/S## ; automated tests reference manual TC ID in title
- Locators (UI): data-test attributes via getByTestId, no XPath
- Secrets/config: env vars only, never hardcoded
- Branching: feature/<track>-<task-id> → PR into main, no direct push
- Traceability: every AC (AC-01…AC-06) + NFR maps to ≥1 test

## Folder structure
- /api-tests → API test suite
- /ui-tests → Playwright UI tests
- /perf → k6 performance scripts
- /.github/workflows → CI/CD pipeline
- /docs → reports, traceability matrix
