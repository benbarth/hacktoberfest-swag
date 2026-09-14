# Contributing

Thanks for helping keep the directory current. Submit only programs with clear rules, a stable public details page, and rewards tied to meaningful work.

Hacktoberfest 2026 no longer uses the old individual registration and four-pull-request model. Official participation now centers on Fests and hands-on open-source AI learning. This repository separately tracks project-run contribution rewards.

## Add an opportunity

1. Check that the organization is not already listed in `participants/2026/`.
2. Create a lowercase, filesystem-safe YAML file such as `participants/2026/example-project.yml`.
3. Use the format below and submit a pull request.

```yaml
Name: Example Project
Website: https://example.com/
Swag:
  - stickers
  - shirt
Description: Fix an accepted issue and have the pull request reviewed and merged during October 2026.
Details: https://example.com/hacktoberfest-2026/
```

`Swag` accepts these canonical values:

- `glasses`
- `laptop`
- `mask`
- `mug`
- `other`
- `plant`
- `shirt`
- `socks`
- `stickers`
- `swag`

Use HTTPS URLs. The details page must explain eligibility, deadlines, reward availability, geographic limits, and any fulfillment steps. Do not claim that every participant receives an item unless the organizer says so explicitly.

## Update or remove an opportunity

Edit the existing YAML file when rules or URLs change. For a listing that should be removed, use the [takedown request](https://github.com/benbarth/hacktoberfest-swag/issues/new?template=takedown-request.yml) or submit a pull request that explains why removal is appropriate.

Organizations that have asked not to appear are recorded in the blocklist section of `.gitignore`. Do not recreate a blocked listing.

## Validate your change

For an immediate preview, install Node.js 24 or newer and run:

```shell
npm ci --no-audit --no-fund
npm run dev
```

Astro reads `participants/` directly, reports schema errors with the source file, and refreshes the browser after a valid edit. No generated data file is involved.

Before opening a pull request, install Python 3.12 or newer and run:

```shell
python -m pip install -e '.[dev]'
python -m hacktoberfest_swag validate
python -m hacktoberfest_swag links participants/2026/example-project.yml
pytest
ruff check .
npm run check
```

Pull requests receive the same schema, link, Python, and website checks in GitHub Actions. URL checks retry transient failures. A confirmed `404` or `410` fails validation, while bot blocks, rate limits, timeouts, and server errors produce warnings for maintainers to review.

## Yearly rollover

The January 1 workflow intentionally removes participant directories from past years and creates the directory for the new season. Before cleanup, the workflow preserves the completed season with a matching Git tag. Link health never blocks this rollover.

Do not move past-year files forward without confirming that the program is active and its rules are current.

## Conduct

All participation in this repository is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
