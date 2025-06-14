# Cheatsheet

Covers changes in `package.json` scripts introduced starting with PR [#11369](https://github.com/celo-org/celo-monorepo/pull/11369). This is a temporary document, slated to be removed after the migration away from Truffle is completed, when `package.json` is expected to be further simplified.

> ... - means does not exist in this version

| Before                                  | After                                         |
| --------------------------------------- | --------------------------------------------- |
| `...`                                   | `build:foundry`                               |
| `build`                                 | `build`                                       |
| `build:sol`                             | `build:truffle-sol`                           |
| `build:ts`                              | `build:truffle-ts`                            |
| `check-opcodes`                         | `release:check-opcodes`                       |
| `check-versions`                        | `release:check-versions`                      |
| `determine-release-version`             | `release:determine-release-version`           |
| `make-release`                          | `release:make`                                |
| `verify-deployed`                       | `release:verify-deployed`                     |
| `verify-release`                        | `release:verify-release`                      |
| `pull-submodules`                       | `submodules:pull`                             |
| `delete-submodules`                     | `submodules:delete`                           |
| `compare-git-tags`                      | `tags:compare`                                |
| `view-tags`                             | `tags:view`                                   |
| `...`                                   | `test`                                        |
| `test:coverage`                         | `test:coverage`                               |
| `gas`                                   | `test:gas`                                    |
| `quicktest`                             | `test:quicktest`                              |
| `test:release-snapshots`                | `test:release-snapshots`                      |
| `test:scripts`                          | `test:scripts`                                |
| `test`                                  | `test:truffle`                                |
| `console`                               | `truffle:console`                             |
| `govern`                                | `truffle:govern`                              |
| `truffle-verify`                        | `truffle:verify`                              |
| `prepare_contracts_and_abis_publishing` | `utils:prepare-contracts-and-abis-publishing` |
| `prepare_devchain_anvil_publishing`     | `utils:prepare-devchain-anvil-publishing`     |
| `sourcify-publish`                      | `utils:sourcify-publish`                      |
| `validate_abis_exports`                 | `utils:validate-abis-exports`                 |
| `download-artifacts`                    | `...`                                         |
| `generate-stabletoken-files`            | `...`                                         |
| `revoke`                                | `...`                                         |
| `upload-artifacts`                      | `...`                                         |
