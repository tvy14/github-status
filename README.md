# github-status

Auto-generated GitHub profile stats cards — language breakdown, contribution stats, and top repos. Regenerates daily via GitHub Actions and commits the output to this repo so it can be embedded anywhere as a raw image URL.

## Generated files

| File | Description |
|------|-------------|
| `generated/languages.svg` | Top languages across all tracked accounts |
| `generated/stats.svg` | Contribution stats card |
| `generated/top-repos.svg` | Most active repositories |
| `generated/status.gif` | Animated combo of all three cards |

## How it works

A GitHub Actions workflow runs on a daily cron schedule. It fetches repository and language data from all configured accounts via the GitHub API, merges the byte counts, generates SVG cards and an animated GIF, then commits the results to `generated/`.

Tracked accounts are configured in `src/index.js` under `ADDITIONAL_ACCOUNTS`.

## Usage

Embed in any Markdown file:

```md
![Languages](https://raw.githubusercontent.com/tvy14/github-status/main/generated/languages.svg)
![Status](https://raw.githubusercontent.com/tvy14/github-status/main/generated/status.gif)
```

## Workflow

Runs daily at 02:23 Asia/Taipei time, on every push to `src/` or workflow files, and manually via `workflow_dispatch`.
