# README GUIDE FOR CELO DEVELOPERS

## How to run a local testnet

Often when developing, it is useful to create a test network localy using the full celo-blockchain binary to go beyond what can be done with other options such as [Ganache](https://www.trufflesuite.com/ganache)

The quickest way to get started with a local testnet is by running `yarn celotool local-testnet` from the `monorepo` root.

This command will create a local testnet with a single validator node and deploy all smart contract migrations to it.
Once the network is initialized a NodeJS REPL is provided to help interact with the running nodes.
For more options, consult `yarn celotool local-testnet --help`, which provides an overview of the tool and its options.

## Monorepo inter-package dependencies

Many packages depend on other packages within the monorepo. When this happens, follow these rules:

1.  All packages must use **master version** of sibling packages.
2.  Exception to (1) are packages that represent a GAE/firebase app which must use the last published version.
3.  To differentiate published vs unpublished version. Master version (in package.json) must end with suffix `-dev` and should not be published.
4.  If a developer wants to publish a version; then after publishing it needs to set master version to next `-dev` version and change all package.json that require on it.

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

> Note: Services deployed to App Engine must only depend on published NPM packages. These packages are `blockchain-api` and `notification-service`.

### Checkout the commit to be published and verify version numbers

Checkout the commit that will become the new published version (i.e. `git checkout HEAD~1` assuming that the commit for bumping the version number is `HEAD`)

Check the `package.json` file and remove the `-dev` suffix if present. Additionally remove the `-dev` suffix from any internal dependencies and use ensure they are published (e.g. `@celo/utils`)

### Verify installation in Docker

Test installation in isolation using Docker.
This confirms that it is locally installable and does not have implicit dependency on rest of the `celo-monorepo` or have an implicit dependency which is an explicit dependency of another `celo-monorepo` package.

```
# Specify the package to test. e.g. celocli, contractkit, utils
celo-monorepo $ PACKAGE=cli
celo-monorepo $ docker run --rm -v $PWD/packages/${PACKAGE}:/tmp/npm_package -it --entrypoint bash gcr.io/celo-testnet/circleci-node18:1.0.0
circleci@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
circleci@e0d56700584f:/tmp/tmp1# npm install /tmp/npm_package/
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
celo-monorepo $ docker run --rm -it --entrypoint bash gcr.io/celo-testnet/circleci-node18:1.0.0
circleci@7040a7660754:/$ mkdir /tmp/tmp1 && cd /tmp/tmp1
circleci@7040a7660754:/tmp/tmp1$ npm install @celo/celocli@0.0.48
...
circleci@7040a7660754:/tmp/tmp1$ ./node_modules/.bin/celocli
CLI Tool for transacting with the Celo protocol

VERSION
  @celo/celocli/1.6.3 linux-x64 node-v18.9.0

USAGE
  $ celocli [COMMAND]

COMMANDS
  account         Manage your account, keys, and metadata
  config          Configure CLI options which persist across commands
  election        Participate in and view the state of Validator Elections
  exchange        Exchange Celo Dollars and Celo Gold via the stability mechanism
  governance      Interact with on-chain governance proposals and hotfixes
  help            display help for celocli
  identity        Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol
  lockedgold      View and manage locked Celo Gold
  multisig        Shows information about multi-sig contract
  network         Prints Celo contract addesses.
  node            Manage your Celo node
  oracle          Remove expired oracle reports for a specified token (currently just Celo Dollar, aka: "StableToken")
  releasegold     View and manage Release Gold contracts
  reserve         Shows information about reserve
  rewards         Show rewards information about a voter, registered Validator, or Validator Group
  transfer        Transfer Celo Gold and Celo Dollars
  validator       View and manage Validators
  validatorgroup  View and manage Validator Groups

circleci@7040a7660754:/tmp/tmp1$ ./node_modules/.bin/celocli account:new
Failed to initialize libusb.
This is not being stored anywhere. Save the mnemonic somewhere to use this account at a later point.

mnemonic: fury puzzle field laptop evidence stuff rescue display home museum ritual message million cave stadium carbon clinic dutch robust vehicle control lizard brass dinosaur
accountAddress: 0x328e0394Dbb468FE4eD1fF73bD508442fBD305CF
privateKey: 7adb0c1a98b00b98a180cbfcc44666f1aab7d315669190fbac30bbdc4989a2ec
publicKey: 039f938bb038962080c9269b195b63999cf90b149921250c2b8a8db92f711d5c81
```
