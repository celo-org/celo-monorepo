# Release Process

This repo uses changesets to determine what packages need a version bump.

Each PR MUST be accompanied by a changeset unless it has zero affect on package consumers (ie changing github action workflows).

To create a changeset run `changeset add` (or  `yarn cs`)

This will bring up an interactive console which asks which packages are affect and if they require minor or major update.

## Auto Releasing

(coming soon)

## Manual Releasing

when time to release new versions of npm package run `changeset version` this will look thru the changeset files that have been generated since last release to bump the versions for package automatically to major if any changesets specify major change minor if only minor and patch if a the package had no changesets of its own but depends on one which will be updated.

finally `changeset publish` will go thru and publish to npm the packages that need publishing.

after go ahead and run `git push --follow-tags` to push git tags up to github.

### For Pre Releasing

changesets has 2 strategies for pre release versions.

The first is to enter `pre` mode on changesets. [docs here](https://github.com/changesets/changesets/blob/main/docs/prereleases.md)

```
yarn changeset pre enter beta
yarn changeset version
git add .
git commit -m "Enter prerelease mode and version packages"
yarn changeset publish
git push --follow-tags
```

The other is to append --snapshot. which is great for daily releases.

```
yarn changeset version --snapshot canary

yarn changeset publish --no-git-tag --snapshot

```

<https://github.com/changesets/changesets/blob/main/docs/snapshot-releases.md>

## Package Versioning

Based on semantic versioning best practices [semver.org](semver.org)

Given a version number MAJOR.MINOR.PATCH, increment the:

- MAJOR version when you make incompatible API changes
- MINOR version when you add functionality in a backward compatible manner
- PATCH version when you make backward compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.
