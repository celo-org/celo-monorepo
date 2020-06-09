# Blockchain Client Release Process

## Versioning

Releases of celo-blockchain are numbered according to semantic versioning, as described at semver.org

  * New releases of celo-blockchain can be expected as follows:
  * Major releases: approximately yearly
  * Minor releases: approximately 4 times a year
  * Patch releases: as needed

All builds are identified as `unstable` (a development build) or `stable` (a commit released as a particular version number). There should only ever exist one commit with a version `x.y.z-stable` for any `(x, y, z)`.

### Signatures

Artifacts produced by this build process (e.g. tags, binaries, Docker images) will be signed. Signatures are produced using any one of the core developer keys listed below.

{% hint style="warning" %}
Work in progress: Core developer keys are not yet hosted.
{% endhint %}

Public keys for these developers are hosted on celo.org and can be imported to `gpg` with the following command:

```bash
gpg --auto-key-locate wkd --locate-keys $NAME@celo.org
```

## Documentation

Documentation for client features, such as APIs and commands, are maintained in the `docs` directory within the `celo-blockchain` repository. Documentation on protocol features, such as the proof-of-stake protocol, will be hosted on docs.celo.org.

## Identifying releases:

### Git branches
Each minor version of celo-blockchain has its own “release branch”, e.g. `release/1.0`. 

Development is done on the master branch, which corresponds to the next major or minor version. Changes to be included in a patch release of an existing minor version are cherry-picked to that existing “release branch”.

### Git tags
All releases should be tagged with the version number, e.g. `vX.Y.Z`. Each release should include a summary of the release contents, including links to pull requests and issues with detailed description of any notable changes.

Tags should be signed and can be verified with the following command.

```bash
git verify-tag vX.Y.Z
```

On Github, each release tag has attached the Geth binaries for supported platforms, along with signatures that can be used to verify the binary.

Release binary signatures can be verified with the following command:


```bash
gpg --verify celo-blockchain-vX.Y.Z-stable.tar.gz.asc
```

### Docker tags
Each released Docker image should should be tagged with it’s version number such that for release `x.y.z`, the image should have tags `x`, `x.y`, and `x.y.z`, with the first two tags potentially being moved from a previous image. Just as a Git tag `x.y.z` immutably points to a commit hash, the Docker tag, `x.y.z` should immutably point to an image hash.

## Build process

### Docker images
Docker images are built automatically with cloudbuild upon pushes to `master` and all release branches. Automated builds will be tagged in GCR with the corresponding commit hash.

Release images are to be signed by public key [xxx], which is canonically published at [secure location]. A signed release image should be produced from the image automatically build at the corresponding commit hash, and pushed to `us.gcr.io/celo-testnet/celo-node`. Signatures will be included with the Github release.

Release image signatures can be verified with the following command:


```bash
gpg --verify celo-blockchain-vX.Y.Z.docker.asc <(docker save us.gcr.io/celo-testnet/celo-node:vX.Y.Z)
```

### Binaries
Binaries for common platforms are built automatically with cloudbuild upon pushes to `master` and all release branches. 

A signed release image should be produced from the image automatically built at the corresponding commit hash, and pushed to `us.gcr.io/celo-testnet/celo-node`.

## Testing

All builds of `celo-blockchain` are automatically tested for performance and backwards compatibility in CI. Any regressions in these tests should be considered a blocker for a release.

Minor and major releases are expected to go through additional rounds of manual testing as needed to verify behavior under stress conditions, such as a network with faulty nodes, are poor network connectivity.

## Promotion process

### Source control
Patch releases should be constructed by cherry-picking all included commits from `master` to the `release/x.y` branch. The first commit of this process should change the version number encoded in the source from `x.y.z-stable` to `x.y.z+1-unstable` and the final commit should change the version number to `x.y.z+1-stable`.

Major and minor releases should be constructed by pushing a commit to change the encoded version number from `x.y.z-unstable` to `x.y.z-stable`. A `release/x.y` branch should be created from this commit.  The next commit must change the version number from `x.y.z-stable` to `x.y+1.0-unstable`, or `x+1.0.0-unstable` if the next planned release is a major release. 

Only one commit should ever have a “stable” tag at any given version number. When that commit is created, a tag should be added along with release notes. If the release is canceled at any point after the tag has been published, a new version number should be used for the following release.

### Distribution
Distribution of an image should occur along the following schedule:

<table>
  <tr>
    <td>Date</td>
    <td>Action</td>
  </tr>
  <tr>
    <td>T</td>
    <td>
      <ol>
        <li>Publish the Git tag and signed release image.</li>
        <li>Communicate T+1w baklava upgrade date.</li>
        <li>Tag release image with `baklava`</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+1w</td>
    <td>
      <ol>
        <li>Confirm some baklava users have upgraded without issues</li>
        <li>If release introduces a hard fork</li>
        <li>Ensure at least a quorum of the validator set has upgraded</li>
        <li>Submit governance proposal to increment minimum client version</li>
        <li>Communicate T+2w alfajores upgrade date</li>
        <li>Tag release image with `alfajores`</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+2w</td>
    <td>
      <ol>
        <li>Confirm alfajores users have upgraded without issues</li>
        <li>If release introduces a hard fork</li>
        <li>Ensure at least a quorum of the validator set has upgraded</li>
        <li>Submit governance proposal to increment minimum client version </li>
        <li>Communicate T+3w mainnet upgrade date</li>
        <li>Tag release image with `mainnet` and `latest`</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td>T+3w</td>
    <td>
      <ol>
        <li>Confirm mainnet users have upgraded without issues</li>
        <li>If release introduces a hard fork</li>
        <li>Ensure at least a quorum of the validator set has upgraded</li>
        <li>Submit governance proposal to increment minimum client version</li>
      </ol>
    </td>
  </tr>
</table>

### Emergency Patches
Bugs which affect the stability or core functionality of the network may need to be released outside the standard release cycle. In this case, an emergency patch release should be created on top of all supported minor releases which contains the minimal change and corresponding test for the fix.

If the issue is not exploitable, release notes should describe the issue in detail and the image should be distributed publicly. If network stability is a risk, a Governance may be proposed to increment the minimum client version.

If the issue is exploitable and mitigations are not readily available, a patch should be prepared privately and signed binaries should be distributed from private commits. Establishing trust is key to pushing out the fix. An audit from a reputable third party may be contracted to verify the release to help earn that trust. A hotfix should be proposed to raise the minimum client version number to the patched release and then patch details made public. 

> Pushing with this process would be disruptive to any nodes that do not upgrade quickly. It should only be used when the circumstances require it.

## Vulnerability Disclosure

Vulnerabilities in `celo-blockchain` releases should be disclosed according to the [security policy](https://github.com/celo-org/celo-blockchain/blob/master/SECURITY.md).

## Dependencies

None

## Dependents

None
 
