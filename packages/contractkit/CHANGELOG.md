# Changelog
All notable changes to the [Celo ContractKit package](https://www.npmjs.com/package/@celo/contractkit) will be documented in this file. 

This package will follow the release process outlined [here](https://docs.celo.org/community/release-process).


## Development (not published yet)
### **[0.4.19--dev]**
Features
- ODIS Client Update - [#5621](https://github.com/celo-org/celo-monorepo/pull/5621)]

Bug Fixes
- [one-line summary] - ( [link PR] )

Other Changes
- Parallelize and simplify fetching of comprensive registry address map - [#5568](https://github.com/celo-org/celo-monorepo/pull/5568)

## Published

### **[0.4.18]** -- 2020-10-30
Features
- CIP encryption - [#5091](https://github.com/celo-org/celo-monorepo/pull/5091)
- ODIS Client Update - [#5621](https://github.com/celo-org/celo-monorepo/pull/5621)
- KomenciKit - [#5436](https://github.com/celo-org/celo-monorepo/pull/5436)

Other Changes
- Small change for attestation service - [#5270](https://github.com/celo-org/celo-monorepo/pull/5270)
- CIP-08 Compressed key support - [#5624](https://github.com/celo-org/celo-monorepo/pull/5624)

### **[0.4.17]** -- 2020-10-27
Bug Fixes
- Uses the most up-to-date version of @celo/utils (0.1.21) & fixes backward compatibility issues from the last release

### **[0.4.16]** -- 2020-10-23
Features
- Select static node based on region resolved from timezone - [#5266](https://github.com/celo-org/celo-monorepo/pull/5266)
- Add wrapper for MetaTransactionWallet contract - [#5156](https://github.com/celo-org/celo-monorepo/pull/5156)
- Add proxy initializeImplementation calldata parameter decoding to block explorer - [#5507](https://github.com/celo-org/celo-monorepo/pull/5507)
- Implement `signTypedData` across all different wallets/signers - [#5311](https://github.com/celo-org/celo-monorepo/pull/5311)

Bug Fixes
- Handle errors when fetching contract addresses from registry - [#5301](https://github.com/celo-org/celo-monorepo/pull/5301)
- Decode proxy contract function calls properly in block explorer - [#5449](https://github.com/celo-org/celo-monorepo/pull/5449)
- Allow AWS HSM signing from AWS user/role without DescribeKey permission for all keys - [#5337](https://github.com/celo-org/celo-monorepo/pull/5337)

Other Changes
- Filter out MetaTransactionWallet from registered contracts [#5523](https://github.com/celo-org/celo-monorepo/pull/5523)
- Enable non-singletons in web3/wrapper contract caches [#5518](https://github.com/celo-org/celo-monorepo/pull/5518), [#5507](https://github.com/celo-org/celo-monorepo/pull/5507)
- `AwsHsmSigner` and `AwsHsmWallet` moved from default exports to named exports - [#5337](https://github.com/celo-org/celo-monorepo/pull/5337)
- Added `PROXY_SET_IMPLEMENTATION_SIGNATURE` - [#5111](https://github.com/celo-org/celo-monorepo/pull/5111)
- Add blockchain parameters to network config - [#5319](https://github.com/celo-org/celo-monorepo/pull/5319)
- Make initialization of the proxy part of the governance proposal - [#5481](https://github.com/celo-org/celo-monorepo/pull/5481)

## Published
### **[0.4.14]** -- 2020-09-23
_Note: Changes before and including 0.4.14 are not documented_
