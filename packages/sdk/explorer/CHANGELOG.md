# @celo/explorer

## 5.0.5

### Patch Changes

- 53bbd4958: Note celo sdk packages will no longer be fix bumped (ie will not share the same version always) and will now use ^range when depending on each other
- d48c68afc: Calls to getContractMappingFromSourcify() are now memoized in the same structure (this.addressMapping) as getContractMappingFromCore, getContractMappingWithSelector now runs in parallel
- Updated dependencies [d48c68afc]
- Updated dependencies [d48c68afc]
- Updated dependencies [53bbd4958]
- Updated dependencies [d48c68afc]
- Updated dependencies [53bbd4958]
- Updated dependencies [d48c68afc]
  - @celo/contractkit@5.1.0
  - @celo/connect@5.1.0
  - @celo/utils@5.0.5
  - @celo/base@5.0.5
