# maintenance-reports

This branch is an automated log. GitHub workflows on `main` write small JSON
status records here through the GitHub contents API. It is never merged into
`main`.

**Never delete this branch.** The workflows and the library assistant's
maintenance reviews read and write it; deleting it breaks those jobs.
People and assistants should not push to it by hand.

## Folders

- `.library-checks/<main-commit-sha>.json`: website check result for each
  checked `main` commit (written by `check.yml`).
- `.library-cms-checks/latest.json`: latest CMS content/publisher check result
  (written by `check.yml`).
- `.library-analytics-checks/latest.json` and `<sha>.json`: daily visitor-report
  connection check status, no visitor figures (written by `analytics.yml`).
- `.library-analytics-deployments/latest.json` and `<sha>.json`: Analytics
  connector deployment outcome (written by `analytics-deploy.yml`).

History was rebuilt on 2026-11-05 to drop an old copy of the website and
keep only these records. A backup of the old history is kept outside GitHub.
