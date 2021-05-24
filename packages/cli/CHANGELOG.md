# Changelog
All notable changes to the [celo cli package](https://www.npmjs.com/package/@celo/celocli) will be documented in this file. 

This package will follow the release process outlined [here](https://docs.celo.org/community/release-process).


## Development (not published yet)
### **[1.2.1--dev]**
Features
- [one-line summary] - [link PR]

Bug Fixes
- [one-line summary] - [link PR]

Other Changes
- [one-line summary] - [link PR]
## Published

### **[1.2.0]** -- 2021-04-22
Features
- cEUR support - [#7524](https://github.com/celo-org/celo-monorepo/pull/7524)
- Add more info to network:contracts - [#7379](https://github.com/celo-org/celo-monorepo/pull/7379)
- Approvehotfix to support multisigs - [#7671](https://github.com/celo-org/celo-monorepo/pull/7671)

Other Changes
- Add --globalHelp option to BaseCommand - [#7669](https://github.com/celo-org/celo-monorepo/pull/7669)

### **[1.1.1--beta]** -- 2021-03-22
Features
- Support Portuguese mnemonics - [#7220](https://github.com/celo-org/celo-monorepo/pull/7220)
- Improve granularity of governance tooling information - [#6475](https://github.com/celo-org/celo-monorepo/pull/6475)
- Small fixes in the proposal process for cEUR/Release 3 - [#7184](https://github.com/celo-org/celo-monorepo/pull/7184)
- CIP8 name access via the CLI - [#6855](https://github.com/celo-org/celo-monorepo/pull/6855)

Other Changes
- Upload/Download Profile Data with CIP8 - [#6604](https://github.com/celo-org/celo-monorepo/pull/6604)
- Improve naming in the DKG  - [#4062](https://github.com/celo-org/celo-monorepo/pull/4062)
- Fix packages vulnerabilities - [#7476](https://github.com/celo-org/celo-monorepo/pull/7476)

### **[1.1.0]** -- 2021-02-16
Features
- Add plugins to CLI - [#5973](https://github.com/celo-org/celo-monorepo/pull/5973)
- New CLI command `identity:get-attestations` to query attestations - [#5974](https://github.com/celo-org/celo-monorepo/pull/5974)

Bug Fixes
- `releasegold:show` should succeed w/o account registration - [#7092](https://github.com/celo-org/celo-monorepo/pull/7092)
- Add check for signer or registered account in `releasegold:show` - [#7098](https://github.com/celo-org/celo-monorepo/pull/7098)

Other Changes
- Clarify Docs for `multisig:transfer` - [#6982](https://github.com/celo-org/celo-monorepo/pull/6982)

### **[1.0.3]** -- 2021-01-25
Bug Fixes
- Add missing lib in the `shrinkwrap.json` that avoids the usage of the package - [#6671](https://github.com/celo-org/celo-monorepo/pull/6671)

### **[1.0.2]** -- 2021-01-22
Bug Fixes
- Fixed Global Flag Parsing in CLI - [#6619](https://github.com/celo-org/celo-monorepo/pull/6619)

Other Changes
- Fix libraries versions (`shrinkwrap`) to avoid supply chain attacks - [#6575](https://github.com/celo-org/celo-monorepo/pull/6575)

### **[1.0.1]** -- 2021-01-20
Features
- Pass through [oclif table flags](https://github.com/oclif/cli-ux#clitable) to commands which output tables - [#5618](https://github.com/celo-org/celo-monorepo/pull/5618)
- CIP 8 Encryption - [#5091](https://github.com/celo-org/celo-monorepo/pull/5091)
- Add authorized signers to release gold show - [#5596](https://github.com/celo-org/celo-monorepo/pull/5596)
- Extract governance:build-proposal command - [#5847](https://github.com/celo-org/celo-monorepo/pull/5847)
- Add downtime slashing commands - [#5632](https://github.com/celo-org/celo-monorepo/pull/5632)
- Add ability to withdraw attestation rewards via CLI [#6176](https://github.com/celo-org/celo-monorepo/pull/6176)
- Mnemonic validation flexibility within Valora - [#6372](https://github.com/celo-org/celo-monorepo/pull/6372)
- Write transfer and transferFrom commands for MultiSig contract - [#6425](https://github.com/celo-org/celo-monorepo/pull/6425)

Bug Fixes
- Fix param order on account:new internal call - [#6319](https://github.com/celo-org/celo-monorepo/pull/6319)
- Remove broken header links in generated CLI docs - [#6415](https://github.com/celo-org/celo-monorepo/pull/6415)
- Fix @ledgerhq package version in CK and CLI  - [#6496](https://github.com/celo-org/celo-monorepo/pull/6496)
- Fix call to set gas currency in CLI base - [#6505](https://github.com/celo-org/celo-monorepo/pull/6505)

Other Changes
- KomenciKit - [#5436](https://github.com/celo-org/celo-monorepo/pull/5436)
- Update base and utils package versions [#5655](https://github.com/celo-org/celo-monorepo/pull/5655)
- Parallelize and simplify fetching of comprensive registry address map - [#5568](https://github.com/celo-org/celo-monorepo/pull/5568)
- Add readability to (big) number and timestamp/duration outputs in CK and CLI - [#5584](https://github.com/celo-org/celo-monorepo/pull/5584)
- Rename build-proposal flag - [#5885](https://github.com/celo-org/celo-monorepo/pull/5885)
- Compatibility with Sdk Modularization - [#4790](https://github.com/celo-org/celo-monorepo/pull/4790)
- Adjust how CLI docs are generated - [#5882](https://github.com/celo-org/celo-monorepo/pull/5882)
- Add install instructions for CLI readme - [#6466](https://github.com/celo-org/celo-monorepo/pull/6466)

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
