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

- `main` -- Always stable, LTS releases tagged from here
- `dev` -- Development branch for ongoing work
- Feature branches: `feat/webgpu-backend`, `feat/code-editor`, etc.

## Commit Conventions

Conventional Commits format:
```
type(scope): description

- bullet points of changes

Version: v26.1-08.0.RC
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
