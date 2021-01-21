# Blockchain Client

## Versioning

Releases of celo-blockchain are numbered according to semantic versioning, as described at [semver.org](https://semver.org).

New releases of celo-blockchain can be expected as follows:

* Major releases: approximately yearly
* Minor releases: approximately 4 times a year
* Patch releases: as needed

All builds are identified as `unstable` \(a development build\) or `stable` \(a commit released as a particular version number\). There should only ever exist one commit with a version `x.y.z-stable` for any `(x, y, z)`.

### Signatures

Artifacts produced by this build process \(e.g. tags, binaries, Docker images\) will be signed. Signatures are produced using any one of the core developer keys listed below.

Public keys for corek developers are hosted on celo.org and can be imported to `gpg` with the following command:

```bash
gpg --auto-key-locate wkd --locate-keys $EMAIL
```

Currently hosted core developer keys include:

* joshua@clabs.co
* mariano@clabs.co
* or@clabs.co
* victor@clabs.co

## Documentation

Documentation for client features, such as APIs and commands, are maintained in the `docs` directory within the `celo-blockchain` repository. Documentation on protocol features, such as the proof-of-stake protocol, is hosted on [docs.celo.org](https://docs.celo.org/celo-codebase/protocol).

## Identifying releases:

### Git branches

Each minor version of celo-blockchain has its own “release branch”, e.g. `release/1.0`.

Development is done on the `master` branch, which corresponds to the next major or minor version. Changes to be included in a patch release of an existing minor version are cherry-picked to that existing release branch.

### Git tags

All releases should be tagged with the version number, e.g. `vX.Y.Z`. Each release should include a summary of the release contents, including links to pull requests and issues with detailed description of any notable changes.

Tags should be signed and can be verified with the following command.

```bash
git verify-tag vX.Y.Z
```

On Github, each release tag should have attached the Geth binaries for supported platforms, along with signatures that can be used to verify the binary and Docker images.

### Docker tags

Each released Docker image should should be tagged with it’s version number such that for release `x.y.z`, the image should have tags `x`, `x.y`, and `x.y.z`, with the first two tags potentially being moved from a previous image. Just as a Git tag `x.y.z` immutably points to a commit hash, the Docker tag, `x.y.z` should immutably point to an image hash.

## Build process

### Binaries

Binaries for common platforms are built automatically with [Google Cloud Build](https://cloud.google.com/cloud-build) upon pushes to `master` and all release branches.

A signature should be produced over the binary automatically built at the corresponding commit hash and included in the Github release.

Release binary signatures can be verified with the following command:

```bash
gpg --verify celo-blockchain-vX.Y.Z-stable.tar.gz.asc celo-blockchain-vX.Y.Z-stable.tar.gz
```

### Docker images

Docker images are built automatically with [Google Cloud Build](https://cloud.google.com/cloud-build) upon pushes to `master` and all release branches. Automated builds will be tagged in [Google Container Registry](https://cloud.google.com/container-registry) with the corresponding commit hash.

A signature should be produced over the image automatically built at the corresponding commit hash and included with the Github release.

Release image signatures can be verified with the following command:

```bash
docker save $(docker image inspect us.gcr.io/celo-org/geth:X.Y.Z -f '{{ .Id }}') | gpg --verify celo-blockchain-vX.Y.Z.docker.asc -
```

## Testing

All builds of `celo-blockchain` are automatically tested for performance and backwards compatibility in CI. Any regressions in these tests should be considered a blocker for a release.

Minor and major releases are expected to go through additional rounds of manual testing as needed to verify behavior under stress conditions, such as a network with faulty nodes, and poor network connectivity.

## Promotion process

### Source control

Patch releases should be constructed by cherry-picking all included commits from `master` to the `release/x.y` branch. The first commit of this process should change the version number encoded in the source from `x.y.z-stable` to `x.y.z+1-unstable` and the final commit should change the version number to `x.y.z+1-stable`.

Major and minor releases should be constructed by pushing a commit to the `master` branch to change the encoded version number from `x.y.z-unstable` to `x.y.z-stable`. A `release/x.y` branch should be created from this commit. The next commit must change the version number from `x.y.z-stable` to `x.y+1.0-unstable`, or `x+1.0.0-unstable` if the next planned release is a major release.

Only one commit should ever have a “stable” tag at any given version number. When that commit is created, a tag should be added along with release notes. Once the tag is published it should not be reused for any further release or changes.

### Distribution

Distribution of an image should occur along the following schedule:

<table>
  <thead>
    <tr>
      <th style="text-align:left">Date</th>
      <th style="text-align:left">Action</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">T</td>
      <td style="text-align:left">
        <ol>
          <li>Publish the Git tag and signed release artifacts.</li>
          <li>Communicate T+1w Baklava upgrade date.</li>
          <li>Tag released Docker image with <code>baklava</code>.</li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">T+1w</td>
      <td style="text-align:left">
        <ol>
          <li>Confirm Baklava users have upgraded without issues</li>
          <li>If release introduces a hard fork
            <ol>
              <li>Ensure at least a quorum of the validator set has upgraded</li>
              <li>Submit governance proposal to increment minimum client version</li>
            </ol>
          </li>
          <li>Communicate T+2w Alfajores upgrade date</li>
          <li>Tag released Docker image with <code>alfajores</code>
          </li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">T+2w</td>
      <td style="text-align:left">
        <ol>
          <li>Confirm Alfajores users have upgraded without issues</li>
          <li>If release introduces a hard fork
            <ol>
              <li>Ensure at least a quorum of the validator set has upgraded</li>
              <li>Submit governance proposal to increment minimum client version</li>
            </ol>
          </li>
          <li>Communicate T+3w Mainnet upgrade date</li>
          <li>Tag released Docker image with <code>mainnet</code> and <code>latest</code>
          </li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">T+3w</td>
      <td style="text-align:left">
        <ol>
          <li>Confirm Mainnet users have upgraded without issues</li>
          <li>If release introduces a hard fork
            <ol>
              <li>Ensure at least a quorum of the validator set has upgraded</li>
              <li>Submit governance proposal to increment minimum client version</li>
            </ol>
          </li>
        </ol>
      </td>
    </tr>
  </tbody>
</table>

### Emergency Patches

Bugs which affect the security, stability, or core functionality of the network may need to be released outside the standard release cycle. In this case, an emergency patch release should be created on top of all supported minor releases which contains the minimal change and corresponding test for the fix.

If the issue is not exploitable, release notes should describe the issue in detail and the image should be distributed publicly. If network stability is at risk, a Governance proposal may be submitted to increment the minimum client version.

If the issue is exploitable and mitigations are not readily available, a patch should be prepared privately and signed binaries should be distributed from private commits. Establishing trust is key to pushing out the fix. An audit from a reputable third party may be contracted to verify the release to help earn that trust. A hotfix should be proposed to raise the minimum client version number to the patched release and then patch details made public.

> Pushing an upgrade with this process will be disruptive to any nodes that do not upgrade quickly. It should _only_ be used when the circumstances require it.

## Vulnerability Disclosure

Vulnerabilities in `celo-blockchain` releases should be disclosed according to the [security policy](https://github.com/celo-org/celo-blockchain/blob/master/SECURITY.md).

## Dependencies

None

## Dependents

None

