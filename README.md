# Hacktoberfest Swag 2026

An independent, community-maintained directory of open-source contribution programs that offer swag or other rewards.

[Visit the directory](https://hacktoberfest-swag.com) · [Add an opportunity](https://github.com/benbarth/hacktoberfest-swag/issues/new?template=new-swag-opportunity.yml) · [Read the contribution guide](CONTRIBUTING.md)

## Hacktoberfest changed in 2026

The official event no longer uses the old individual sign-up and four-pull-request challenge. Hacktoberfest 2026 is organized around in-person and online Fests focused on hands-on building and learning with open-source AI. Visit [hacktoberfest.com](https://hacktoberfest.com/) to host a Fest or find an event.

Projects may still run their own contribution reward programs. Those independent opportunities are what this repository collects. Every listing has its own eligibility rules, deadlines, and fulfillment terms.

Swag should recognize useful work. It should never incentivize low-value pull requests or create extra work for maintainers.

## Repository structure

```text
participants/              YAML source data
hacktoberfest_swag/         Python automation package
tests/                      Python tests
src/                        Astro website
public/                     Static website assets
.github/workflows/          Validation, links, rollover, and Pages deployment
```

## Local development

The website requires Node.js 24 or newer. Astro reads participant YAML directly, validates it with a typed content collection, and refreshes the page when a file changes.

```shell
npm ci --no-audit --no-fund
npm run dev
```

Open `http://localhost:4321`. No intermediate dataset or second watcher is required.

The website targets WCAG 2.2 Level AA. Its [accessibility statement](https://hacktoberfest-swag.com/accessibility.html) documents the test scope and provides a structured barrier-report form.

Repository automation requires Python 3.12 or newer:

```shell
python -m pip install -e '.[dev]'
```

Useful commands:

```shell
python -m hacktoberfest_swag validate
python -m hacktoberfest_swag links
pytest
ruff check .
npm run check
npm run build
```

## Automation

- `Validate` checks every participant file with the rewritten `SoftCreatR/validate-yaml-schema` v3 action, runs the Python suite, type-checks Astro, and produces a static build.
- `Check links` tests changed URLs on pull requests and audits the current season weekly. Definite `404` and `410` responses fail. Rate limits, bot blocks, server errors, and timeouts are reported as warnings after retries.
- `Open a new season` runs on January 1. It tags the previous season if needed, removes older year directories, and creates the current year directory. It has no dependency on external links.
- `Deploy website` reads the YAML source directly, builds Astro, and publishes the output through GitHub Pages. A successful rollover triggers a fresh deployment even though bot-authored pushes do not start new workflows.

Yearly source data remains recoverable through the matching Git tag, such as [`2025`](https://github.com/benbarth/hacktoberfest-swag/tree/2025).

## Maintainers

- [Ben Barth](https://github.com/benbarth)
- [Sascha Greuel](https://github.com/SoftCreatR)
- [Chandler Weiner](https://github.com/crweiner)
