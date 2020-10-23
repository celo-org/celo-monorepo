# Changelog
All notable changes to the [celo cli package](https://www.npmjs.com/package/@celo/celocli) will be documented in this file. 

This package will follow the release process outlined [here](https://docs.celo.org/community/release-process).


## Development (not published yet)
### **[0.0.59--dev]**
Features
- Add `jsonTransactions` flag to `governance:show` for use in the (contract release process)[https://docs.celo.org/community/release-process/smart-contracts]  - ( [#5111](https://github.com/celo-org/celo-monorepo/pull/5111) )

Bug Fixes
- Fix attestation service test delivering false negatives - [#5336](https://github.com/celo-org/celo-monorepo/pull/5336)
- Fix error when listing contract addresses and include some missing new contracts - [#5301](https://github.com/celo-org/celo-monorepo/pull/5301)

Other Changes
- Convert default log output color from red to yellow - [#5517](https://github.com/celo-org/celo-monorepo/pull/5517)


## Published
### **[0.0.58]** -- 2020-10-08
Features
- CLI compatability with [Attestation Service 1.0.5](https://github.com/celo-org/celo-monorepo/releases/tag/attestation-service-1-0-5) - [#5011](https://github.com/celo-org/celo-monorepo/pull/5011)
- Adds an interactive prompt for forming proposals from Celo registry contracts and functions - [#3008](https://github.com/celo-org/celo-monorepo/pull/3008)

Other Changes
- Correct documentation on the validator and validator group deregister - [#5197](https://github.com/celo-org/celo-monorepo/pull/5197)

### **[0.0.57]** -- 2020-09-23
Features
- Adds ODIS identifier query to celocli - [#4976](https://github.com/celo-org/celo-monorepo/pull/4976)

Bug Fixes
- Fixes backward compatibility issues in cli - [#5124](https://github.com/celo-org/celo-monorepo/pull/5124)


_Note: Changes before 0.0.57 are not documented_
