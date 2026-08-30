# NOISE3D Version Control Policy

## Version Number Format

Starting from the WebGPU era, NOISE3D adopts a calendar-semantic hybrid scheme:

```
v{YY}.{MAJOR}-{MM}.{MINOR}.{TYPE}
```

| Field | Description | Example |
|-------|-------------|---------|
| YY    | Two-digit year of release | 26 (2026) |
| MAJOR | Major version within the year, incremented on breaking architecture changes | 1 |
| MM    | Two-digit month of release | 08 |
| MINOR | Minor version within the month, incremented per feature release | 0, 1, 2... |
| TYPE  | Release type: Alpha, RC (Release Candidate), LTS (Long-Term Support) | RC, LTS |

### Examples

- `v26.1-08.0.RC` -- First major version of 2026, August, minor 0, Release Candidate
- `v26.1-08.0.LTS` -- Same version promoted to LTS after testing
- `v26.1-08.1.Alpha` -- August, second minor release, Alpha stage
- `v26.1-09.0.RC` -- September release, new minor cycle

### Release Flow

1. **Alpha** -- Early development, features incomplete, may crash
2. **RC** (Release Candidate) -- Feature complete, pre-test release for Playwright validation
3. **LTS** -- Tested and stable, tagged as long-term support

### Git Tagging

Each release gets two Git tags:
- `v26.1-08.0.RC` -- Pre-test release candidate
- `v26.1-08.0.LTS` -- Post-test stable release

### Historical Versions (v1-v9)

Versions 1.0.0 through 9.0.0 used a simple incrementing scheme. These tags are preserved in Git history. Starting from the WebGPU integration release, the new scheme applies.

## Branch Strategy

<!-- GitHub@NDBlockConnect | BlockConnect@StarsailsClover -->

Aligned with the BC Development Process (Git Control):

- `main` -- Always stable, LTS releases tagged from here
- Each increment (a "Major" in BC terms) is developed on an independent
  feature branch, e.g. `feat/v26.1-26.0-command-palette`, and merged into
  `main` at release time with a merge commit
- All commits are SSH-signed (`commit.gpgsign=true`, `gpg.format=ssh`)
- English commit/merge/PR messages
- `.gitignore` keeps the repository to essential sources, docs, and scripts

### BC Version Control Mapping

The BC scheme `v{Year}.{Major}-Alpha {N}` (ten Alphas per Major; Alpha 10
is the LTS release, normally hidden from display) maps onto this repo's
calendar-semantic tags as follows:

| BC concept | This repo |
|------------|-----------|
| Major version | `v26.1` (year 26, Major 1) |
| Alpha 1..9 | `v26.1-XX.0.RC` pre-releases |
| Alpha 10 / Major release | `v26.1-XX.0.LTS` releases |
| Sub-Major (exception) | `v26.1-20.1` style hotfixes |
| Pre-Release publication | RC tag + changelog entry with instability disclaimer |
| Release publication | LTS tag after full regression rounds |

Per-Major themes are tracked in `docs/ROADMAP.md` and
`docs/ROADMAP-UX.md`; robustness work and bug fixes ride along with each
increment. A 30-minute simulated-usage and abuse test is performed
against the previous increment before planning the next one (Playwright
full-suite rounds serve as this assessment).

## Commit Conventions

## Commit Conventions

Conventional Commits format:
```
type(scope): description

- bullet points of changes

Version: v26.1-08.0.RC
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
