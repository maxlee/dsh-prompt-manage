# Releasing

Follow these steps to publish a new version of `dsh-prompt-manage` to npm.

## Pre-release checks

```bash
npm run check
npm test
npm pack --dry-run
```

## Sign in

Sign in to npm with the publisher account for `dsh-prompt-manage`:

```bash
npm login
```

## Publish

Bump the version in `package.json`, add a matching `CHANGELOG.md` section, then publish from the checkout:

```bash
npm publish --access public
```

Commit the release, tag it, and push both:

```bash
git add -A
git commit -m "chore: release v0.2.0"
git tag -a v0.2.0 -F release-notes.md
git push origin main
git push origin v0.2.0
```

## GitHub Release

Create the release from the same notes file used for the annotated tag:

```bash
gh release create v0.2.0 --title "v0.2.0" --notes-file release-notes.md --verify-tag
```

## Optional: trusted publishing

After the package exists on npm, future releases can publish from GitHub Actions instead of a local login. Bind the repository once:

```bash
npm trust github dsh-prompt-manage --file release.yml --repo maxlee/dsh-prompt-manage --allow-publish
```

Then add `.github/workflows/release.yml` with `permissions: { contents: read, id-token: write }` that runs the checks and `npm publish --provenance --access public` on `v*` tags.
