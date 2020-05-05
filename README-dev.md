# README GUIDE FOR CELO DEVELOPERS

## Monorepo inter-package dependencies

Many packages depend on other packages within the monorepo. When this happens, follow these rules:

1.  All packages must use **master version** of sibling packages.
2.  Exception to (1) are packages that represent a GAE/firebase app which must use the last published version.
3.  To differentiate published vs unpublished version. Master version (in package.json) must end with suffix `-dev` and should not be published.
4.  If a developer want to publish a version; then after publishing it needs to set master version to next `-dev` version and change all package.json that require on it.

To check which packages need amending, you can run (in the root pkg):

    yarn check:packages

A practical example:

- In any given moment, `contractkit/package.json#version` field **must** of the form `x.y.z-dev`
- If current version of contractkit is: `0.1.6-dev` and we want to publish a new version, we should:
  - publish version `0.1.6`
  - change `package.json#version` to `0.1.7-dev`
  - change in other packages within monorepo that were using `0.1.6-dev` to `0.1.7-dev`

## How to publish a new npm package

> Note: Packages with mainline versions (i.e. without a `-foo` suffix) should be published from the `master` branch.

> Note: All packages are prefixed with "@celo/" and only members of the [Celo NPM organization](https://www.npmjs.com/settings/celo/members) can publish new packages or update the existing ones.

### Update the version numbers to an unpublished version

It is important to ensure that the `master` branch is ahead of the published package on NPM, otherwise `yarn` may use the published version of the package rather than the local development version.

In order to maintain this, create and merge a PR to the `master` branch bumping the package version to the next number that will be published. (i.e. If you are about to publish `x.y.z`, set the package version to `x.y.z+1`)
Update all references to that package in the monorepo to the new version (i.e. `x.y.z+1`)
Prefer appending a `-dev` suffix to the version number to ensure an internal dependency will never be mistaken for a published one.

> Note: Publishing breaking changes requires an increment to the minor version number for `0.` releases. Once `1.0.0` is pusblished breaking changes are generally prohibited outside the rare major version release. Read the [semver specification](https://semver.org/) for more information.

> Note: Services deployed to App Engine must only depend on published NPM packages. These packages are `verification-pool-api`, `blockchain-api` and `notification-service`.

### Checkout the commit to be published and verify version numbers

Checkout the commit that will become the new published version (i.e. `git checkout HEAD~1` assuming that the commit for bumping the version number is `HEAD`)

Check the `package.json` file and remove the `-dev` suffix if present. Additionally remove the `-dev` suffix from any internal dependencies and use ensure they are published (e.g. `@celo/utils`)

### Verify installation in Docker

Test installation in isolation using Docker.
This confirms that it is locally installable and does not have implicit dependency on rest of the `celo-monorepo` or have an implicit dependency which is an explicit dependency of another `celo-monorepo` package.

```
# Specify the package to test. e.g. celocli, contractkit, utils
celo-monorepo $ PACKAGE=cli
celo-monorepo $ docker run --rm -v $PWD/packages/${PACKAGE}:/tmp/npm_package -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install /tmp/npm_package/
```

### Publish the package

```
# Publish the package publicly
celo-monorepo/packages/cli $ yarn publish --access=public
```

Let's say the published package version number 0.0.20, verify that it is installable

```
/tmp/tmp1 $ npm install @celo/cli@0.0.20
```

Add a tag with the most recent git commit of the published branch. Note that this commit comes before package.json is updated with the new package version.

```
$ npm dist-tag add <package-name>@<version> <tag>
```

Additionally, if this version is intended to be used on a deployed network (e.g. `baklava` or `alfajores`), tag the version with all appropriate network names.

```
$ npm dist-tag add <package-name>@<version> <network>
```

Once you publish do some manual tests, for example, after publishing `celocli`

```
# Docker for an isolated environment again
celo-monorepo $ docker run --rm -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install @celo/celocli@0.0.20
/tmp/tmp1# ./node_modules/.bin/celocli
CLI Tool for transacting with the Celo protocol

VERSION
  @celo/celocli/0.0.20 linux-x64 node-v8.16.1

USAGE
  $ celocli [COMMAND]

COMMANDS
  account         Manage your account, send and receive Celo Gold and Celo Dollars
  bonds           Manage bonded deposits to participate in governance and earn rewards
  config          Configure CLI options which persist across commands
  exchange        Commands for interacting with the Exchange
  help            display help for celocli
  node            Manage your full node
  validator       View validator information and register your own
  validatorgroup  View validator group information and cast votes

root@f8c51e3c7bc3:/tmp/tmp1# ./node_modules/.bin/celocli account:new
This is not being stored anywhere, so, save the mnemonic somewhere to use this account at a later point

mnemonic: wall school patrol also peasant enroll build merit health reduce junior obtain awful sword warfare sponsor honey display resemble bubble trend elevator ostrich assist
privateKey: a9531609ca3d1c224e0742a4bb9b9e2fae67cc9d872797869092804e1500d67c
publicKey: 0429b83753806f2b61ddab2e8a139214c3c8a5dfd0557557830b13342f2490bad6f61767e1b0707be51685e5e13683e6fa276333cbdb06f07768a09b8070e27259accountAddress: 0xf63e0F60DFcd84090D2863e0Dfa452B871fdC6d7
```
