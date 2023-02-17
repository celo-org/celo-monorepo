# Release data

This directory contains metadata about previous releases of the Celo Core
Contracts.

## `initializationData/`

This subdirectory contains, for each core contracts release, the JSON file with
arguments to newly deployed contracts.

## `versionReports/`

This subdirectory contains the version reports output by the `check-versions`
script between each successive major release. They are used by the
`protocol-test-release-snapshots` CI job as a regression snapshot test for the
`check-versions` script, so the `oldArtifactsFolder` and `newArtifactsFolder`
should be set to paths that CircleCI jobs use (`/home/circleci/app/...`, see one
of the files for an example).

## `nonstandard/`

This will include release data for any contracts releases that didn't follow the
standard release process.

### `releaseBRL.json`

This file is the initialization data used when deploying the `cREAL`
stable token. The release occured between Core Contracts releases 5 and 6 and
didn't exactly follow the release process.
