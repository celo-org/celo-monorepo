# README GUIDE FOR CELO DEVELOPERS

## How to publish a new npm package

First checkout the alfajores branch.

```
celo-monorepo $ git checkout alfajores
celo-monorepo $ yarn
```

Before publishing a new celocli package, test in isolation using Docker. This confirms that it is locally installable and does not have implict dependency on rest of the celo-monorepo or have an implicit dependency which is an explicit dependency of another celo-monorepo package.

```
# To test utils package, change $PWD/packages/cli to $PWD/packages/utils
# To test contractkit package, change $PWD/packages/contractkit to $PWD/packages/contractkit
celo-monorepo $ docker run -v $PWD/packages/cli:/tmp/npm_package -it --entrypoint bash node:10fn
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install /tmp/npm_package/
```

After testing, exit the docker container, and publish the package. Do note that all our packages are prefixed with "@celo/" and only members listed [here](https://www.npmjs.com/settings/celo/members) can publish new packages or update the existing ones.

```
# Publish the package publicly
celo-monorepo/packages/cli $ yarn publish --access=public
# Increment the version number, after testing, we will push that commit to GitHub
```

Let's say the published package version number 0.0.15, verify that it is installable

```
/tmp/tmp1 $ npm install @celo/cli@0.0.20
```

Add a tag with the most recent git commit of the published branch. Note that this commit comes before package.json is updated with the new package version.

```
$ npm dist-tag add <package-name>@<version> [<tag>]
```

Once you publish do some manual tests, for example, after publishing `celocli`

```
# Docker for an isolated environment again
celo-monorepo $ docker run -it --entrypoint bash node:10
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

Now push your changes `git push origin alfajores`.
If you don't have access to the repo, you might have to open a PR.


## Continuous integration setup

### Circle CI

Config files: [Celo-monorepo](https://github.com/celo-org/celo-monorepo/blob/master/.circleci/config.yml) and [Celo-blockchain](https://github.com/celo-org/celo-blockchain/blob/master/.circleci/config.yml)

While we have [several](https://github.com/celo-org/) repos, most of our work is confined into two repos, [celo-monorepo](https://github.com/celo-org/celo-monorepo/) and [celo-blockchain](https://github.com/celo-org/celo-blockchain/). The latter is a fork of Go-ethereum, commonly known as Geth. We use Circle CI for testing. Our celo-monorepo has multiple Typescript packages and uses yarn workspaces. For testing, this maps well to [Circle CI workflows](https://circleci.com/blog/introducing-workflows-on-circleci-2-0/). Our main workflow is `celo-monorepo-build` where in the step `install_dependencies`, we download all the dependencies and build all of our packages. Then, in parallel, we test all the packages. Some of our end-to-end tests require pulling in, building celo-blockchain and runnning it as well. Some of our tests like `npm-install-testing-cron-workflow` and `protocol-testing-with-code-coverage-cron-workflow` run as cron-jobs. Given the monorepo setup, by default, all the tests run on every pull request. To avoid that, we have a [script](https://github.com/celo-org/celo-monorepo/blob/master/scripts/ci_check_if_test_should_run_v2.sh) which decides whether a test should run depending on the branch name and the files it modified.

### Google Cloud Build

Config files: [https://github.com/celo-org/celo-monorepo/blob/master/cloudbuild.yaml](https://github.com/celo-org/celo-monorepo/blob/master/cloudbuild.yaml) and [https://github.com/celo-org/celo-blockchain/blob/master/cloudbuild.yaml](https://github.com/celo-org/celo-blockchain/blob/master/cloudbuild.yaml)

We use Google Cloud build to automatically build and upload new docker files to GCR (Google Container Reegistry). These docker files can then be referenced and used in the testnet `.env` config files which are located in the root directory of celo-monorepo, for example, [.env.integration](https://github.com/celo-org/celo-monorepo/blob/2fd020704c624e31e9885ee6265ecb60df194c17/.env.integration#L14)