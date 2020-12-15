# Changelog
All notable changes to the [celo cli package](https://www.npmjs.com/package/@celo/celocli) will be documented in this file. 

This package will follow the release process outlined [here](https://docs.celo.org/community/release-process).


## Development (not published yet)
### **[0.0.61--dev]**
Features
- Pass through [oclif table flags](https://github.com/oclif/cli-ux#clitable) to commands which output tables - [#5618](https://github.com/celo-org/celo-monorepo/pull/5618)
- Add downtime slashing commands - [#5632](https://github.com/celo-org/celo-monorepo/pull/5632)

Bug Fixes
- [one-line summary] - ( [link PR] )

Other Changes
- [one-line summary - ( [link PR] )


## Published

### **[0.0.60]** -- 2020-10-27
Bug Fixes
- Uses the most up-to-date version of @celo/contractkit (0.4.17) & fixes backward compatibility issues from the last release
- Actually call toString in oracle report CLI - [#5594](https://github.com/celo-org/celo-monorepo/pull/5594)

Other Changes
- Support the use of scientific notation for the deposit of a governance proposal - [#5326](https://github.com/celo-org/celo-monorepo/pull/5326)
- Require `--force` with `account:claim-attestation-service-url` for non-TLS urls [#5599](https://github.com/celo-org/celo-monorepo/pull/5599)

### **[0.0.59]** -- 2020-10-23
Features
- Add `jsonTransactions` flag to `governance:show` for use in the (contract release process)[https://docs.celo.org/community/release-process/smart-contracts]  - [#5111](https://github.com/celo-org/celo-monorepo/pull/5111)

Bug Fixes
- Fix attestation service test delivering false negatives - [#5336](https://github.com/celo-org/celo-monorepo/pull/5336)
- Fix error when listing contract addresses and include some missing new contracts - [#5301](https://github.com/celo-org/celo-monorepo/pull/5301)

Other Changes
- Convert default log output color from red to yellow - [#5517](https://github.com/celo-org/celo-monorepo/pull/5517)


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
