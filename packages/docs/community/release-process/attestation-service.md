# Attestation Service

This release process will be adopted from Attestation Service v1.2.0 onwards.

## Versioning

Releases of Attestation Service are made as needed. Releases are numbered according to semantic versioning, as described at [semver.org](https://semver.org).

All builds are identified as `unstable` \(a development build\) or `stable` \(a commit released as a particular version number\). There should only ever exist one commit with a version `x.y.z` for any `(x, y, z)`.

## Documentation

Documentation is maintained under `packages/docs` directory and is hosted on [docs.celo.org](https://docs.celo.org/validator-guide/attestation-service).

## Identifying releases

### Git branches

Each minor version of Attestation Service has its own “release branch”, e.g. `release/attestation-service/1.0`.

Development is done on the `master` branch, which corresponds to the next major or minor version. Changes to be included in a patch release of an existing minor version are cherry-picked to that existing release branch.

### Git tags

Each release should be [created on Github](https://github.com/celo-org/celo-monorepo/releases) and tagged with the version number, e.g. `attestation-service-vX.Y.Z`. Each release should include a summary of the release contents, including links to pull requests and issues with detailed description of any notable changes.

Tags should be signed and can be verified with the following command.

```bash
git verify-tag attestation-service-vX.Y.Z
```

On Github, each release tag should have attached signatures that can be used to verify the Docker images.

### Docker tags

Each Docker image is tagged with `attestation-service-<commithash>`. Just as a Git tag immutably points to a commit hash, the Docker tag should immutably point to an image hash.

In addition, each Docker image correspinding to a released version should be tagged with `attestation-service-vx.y.z`.

The latest image qualified for deployment to various networks are also tagged as follows:

* Alfajores: `attestation-service-alfajores`
* Baklava: `attestation-service-baklava`
* Mainnet: `attestation-service-mainnet`

### Signatures

Artifacts produced by this build process \(e.g. tags, Docker images\) will be signed by a [core developer key](https://github.com/celo-org/celo-monorepo/blob/master/developer_key_publishing.md).

Public keys for core developers are hosted on celo.org and can be imported to `gpg` with the following command:

```bash
gpg --auto-key-locate wkd --locate-keys $EMAIL
```

Currently hosted core developer keys used for Attestation Service releases include:

* tim@clabs.co

## Build process

### Docker images

Docker images are built automatically with [Google Cloud Build](https://cloud.google.com/cloud-build) upon pushes to `master` and all release branches. Automated builds will be tagged in [Google Container Registry](https://cloud.google.com/container-registry) with the corresponding commit hash.

A signature should be produced over the image automatically built at the corresponding commit hash and included with the Github release.

Release image signatures can be verified with the following command:

```bash
docker save $(docker image inspect us.gcr.io/celo-testnet/celo-monorepo:attestation-service-vX.Y.Z -f '{{ .Id }}') | gpg --verify attestation-service-vX.Y.Z.docker.asc -
```

## Testing

As well as monorepo CI tests, all releases are expected to go through manual testing as needed to verify security properties, accuracy of documentation, and compatibility with deployed and anticipated versions of `celocli` and wallets including Valora.

This testing should include running the Valora e2e tests. Currently, these expect access to cLabs provisioned credentials for SMS providers. Follow the [Valora mobile build instructions](https://github.com/celo-org/wallet/blob/master/packages/mobile/README.md#setup). Then run:

```bash
git checkout verification-e2e-tests
cd packages/mobile
yarn test:e2e:ios -t e2e/src/RedeemInviteAndVerify.spec.js -i
```

## Promotion process

### Source control

Patch releases should be constructed by cherry-picking all included commits from `master` to the `release/attestation-service/x.y` branch. The first commit of this process should change the version number encoded in the source from `x.y.z-stable` to `x.y.z+1-unstable` and the final commit should change the version number to `x.y.z+1-stable`.

Major and minor releases should be constructed by pushing a commit to the `master` branch to change the encoded version number from `x.y.z-unstable` to `x.y.z`. A `release/attestation-service/x.y` branch should be created from this commit. The next commit must change the version number from `x.y.z-stable` to `x.y+1.0-unstable`, or `x+1.0.0-unstable` if the next planned release is a major release.

Only one commit should ever have a "stable" tag at any given version number. When that commit is created, a tag should be added along with release notes. Once the tag is published it should not be reused for any further release or changes.

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
      <td style="text-align:left">T-1w</td>
      <td style="text-align:left">
        <ol>
          <li>Deploy release candidate build to Alfajores testnet</li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">T</td>
      <td style="text-align:left">
        <ol>
          <li>Confirm Valora production and testing builds against Alfajores experience
            no issues and that e2e verification tests complete successfully</li>
          <li>Publish the Git release notes and tag, and signature of Docker image</li>
          <li>Communicate T+1w Baklava upgrade date.</li>
          <li>Tag released Docker image with <code>attestation-service-alfajores</code>
          </li>
          <li>and</li>
          <li><code>attestation-service-baklava</code>
          </li>
          <li>(removing tags from other releases)</li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">T+1w</td>
      <td style="text-align:left">
        <ol>
          <li>Confirm Baklava users have upgraded without issues and that Baklava attestation
            bots run successfully</li>
          <li>Communicate T+2w Mainnet upgrade date</li>
          <li>Tag released Docker image with <code>attestation-service-mainnet</code> (removing
            tag from other releases)</li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">T+2w</td>
      <td style="text-align:left">
        <ol>
          <li>Confirm Mainnet users have upgraded without issues</li>
        </ol>
      </td>
    </tr>
  </tbody>
</table>

### Emergency Patches

Bugs which affect the security, stability, or core functionality of the Celo identity protocol or prevent new users onboarding to wallets including Valora may need to be released outside the standard release cycle. In this case, an emergency patch release should be created on top of all supported minor releases which contains the minimal change and corresponding test for the fix.

If the issue is not exploitable, release notes should describe the issue in detail and the image should be distributed publicly.

If the issue is exploitable and mitigations are not readily available, a patch should be prepared privately and signed binaries should be distributed from private commits. Establishing trust is key to pushing out the fix. An audit from a reputable third party may be contracted to verify the release to help earn that trust.

## Vulnerability Disclosure

Vulnerabilities in Attestation Service releases should be disclosed according to the [security policy](https://github.com/celo-org/celo-monorepo/blob/master/SECURITY.md).

