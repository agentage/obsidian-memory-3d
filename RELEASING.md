# Releasing

Obsidian requires the GitHub release tag to equal `manifest.json`'s `version`, and the
release must attach `main.js`, `manifest.json`, and `styles.css`. `.npmrc` sets
`tag-version-prefix=` so `npm version` produces a bare tag (`0.1.1`, not `v0.1.1`).

## Standard release (tag push)

```bash
npm run verify                 # green gate before releasing
npm version patch              # bumps package.json + manifest.json + versions.json, makes the tag
git push --follow-tags         # fires .github/workflows/release.yml
```

The `version` npm script runs `version-bump.mjs`, which writes the new version into
`manifest.json` and records `version -> minAppVersion` in `versions.json`.

The **Release** workflow then: checks the tag matches `manifest.json`, runs `npm run verify`
(type-check + lint + format + tests + build), and publishes a GitHub Release with the three
plugin files attached.

## Manual release (workflow_dispatch)

Run the **Release** workflow from the Actions tab. It builds and releases the *current*
`manifest.json` version (creating the matching tag). Tick **draft** to inspect the assets
before publishing.

## Notes

- CI (`ci.yml`) runs `npm run verify` on every push to `master`; `pr-validation.yml` runs
  the full check suite + a sticky status comment on every PR.
- This plugin makes no network calls, so it has none of the sync plugin's host/docs
  disclosure or mobile-safe bundle checks.
- Submitting to the Obsidian community catalog additionally needs a one-time PR to
  `obsidianmd/obsidian-releases`.
