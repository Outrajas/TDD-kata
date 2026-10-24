# Assessment submission checklist

This checklist tracks the assignment deliverables against the current repository state.

## Required

- [x] Persistent PostgreSQL schema, migrations, and API implementation.
- [x] Registration, login, protected vehicle operations, admin-only deletion/restock, and purchase flow.
- [x] Backend tests and recorded test report (`docs/test-report.md`).
- [x] Root README with project overview, local setup, stack, AI disclosure, and assessment status.
- [x] Root `PROMPTS.md` containing the conversation log captured so far. It includes the user and assistant turns available in this task; verify no needed chat segment is missing before final submission.
- [x] Implement the React/Tailwind flows for customer registration/login, inventory listing/search, purchase, and admin create/edit/delete/restock.
- [x] Capture a real browser screenshot of the home and signed-out account entry in `docs/screenshots/` and link it from the README.
- [x] Run and document backend and frontend tests, builds, lint, and type checks.
- [x] Demonstrate Red–Green–Refactor through descriptive commits, with failing tests before their implementation and an AI co-author trailer separated by two blank lines on each AI-assisted commit.
- [x] Set the new dealership GitHub repository as `origin` and add its URL to the README. Push the commits as the final delivery step. Do not use the EduPortal example repository as the project remote.

## Optional

- [ ] Deploy the application and add the live URL to the README.

## AI-assisted commit trailer

Use this format at the end of each AI-assisted commit message, with two empty lines before the trailer:

```text
Co-authored-by: OpenAI Codex <codex@users.noreply.github.com>
```

Keep each commit focused and describe the behavior added or refactored. Avoid claiming a Red–Green–Refactor sequence in a single commit message; the sequence should be visible in the history.
