# Changelog
All notable changes to the [Celo ContractKit package](https://www.npmjs.com/package/@celo/contractkit) will be documented in this file. 

This package will follow the release process outlined [here](https://docs.celo.org/community/release-process).


## Development (not published yet)
### **[0.4.16--dev]**
Features
- Select static node based on region resolved from timezone - [#5266](https://github.com/celo-org/celo-monorepo/pull/5266)
- Add wrapper for MetaTransactionWallet contract - [#5156](https://github.com/celo-org/celo-monorepo/pull/5156)
- Add proxy initializeImplementation calldata parameter decoding to block explorer - [#5507](https://github.com/celo-org/celo-monorepo/pull/5507)

Bug Fixes
- Handle errors when fetching contract addresses from registry - [#5301](https://github.com/celo-org/celo-monorepo/pull/5301)
- Decode proxy contract function calls properly in block explorer - [#5449](https://github.com/celo-org/celo-monorepo/pull/5449)

Other Changes
- Filter out MetaTransactionWallet from registered contracts [#5523](https://github.com/celo-org/celo-monorepo/pull/5523)
- Enable non-singletons in web3/wrapper contract caches [#5518](https://github.com/celo-org/celo-monorepo/pull/5518), [#5507](https://github.com/celo-org/celo-monorepo/pull/5507)

## Published
### **[0.4.14]** -- 2020-09-23
_Note: Changes before and including 0.4.14 are not documented_
