# Cheatsheet

Covers changes in `package.json`

> ... - means does not exist in this version

| Before                                  | After                                         |
| --------------------------------------- | --------------------------------------------- |
| `download-artifacts`                    | `artifacts:download`                          |
| `upload-artifacts`                      | `artifacts:upload`                            |
| `...`                                   | `build:foundry`                               |
| `build`                                 | `build`                                       |
| `build:sol`                             | `build:truffle-sol`                           |
| `build:ts`                              | `build:truffle-ts`                            |
| `devchain`                              | `devchain`                                    |
| `init-network`                          | `devchain:init-network`                       |
| `test:generate-old-devchain-and-build`  | `devchain:generate-old-devchain-and-build`    |
| `migrate`                               | `devchain:migrate`                            |
| `devchain:reset`                        | `devchain:reset`                              |
| `check-opcodes`                         | `release:check-opcodes`                       |
| `check-versions`                        | `release:check-versions`                      |
| `determine-release-version`             | `release:determine-release-version`           |
| `make-release`                          | `release:make-release`                        |
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
| `migrate`                               | `truffle:migrate`                             |
| `set_block_gas_limit`                   | `truffle:set-block-gas-limit`                 |
| `truffle-verify`                        | `truffle:verify`                              |
| `prepare_contracts_and_abis_publishing` | `utils:prepare-contracts-and-abis-publishing` |
| `prepare_devchain_anvil_publishing`     | `utils:prepare-devchain-anvil-publishing`     |
| `sourcify-publish`                      | `utils:sourcify-publish`                      |
| `validate_abis_exports`                 | `utils:validate-abis-exports`                 |
| `generate-stabletoken-files`            | `...`                                         |
| `revoke`                                | `...`                                         |
