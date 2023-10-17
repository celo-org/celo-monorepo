---
'@celo/explorer': patch
---

Calls to getContractMappingFromSourcify() are now memoized in the same structure (this.addressMapping) as getContractMappingFromCore, getContractMappingWithSelector now runs in parallel
