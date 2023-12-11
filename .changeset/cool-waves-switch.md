---
'@celo/contractkit': major
---

Remove contracts from lib/generated. now available in @celo/abis package at @celo/abis/web3

If you were directly importing contracts from `@celo/contractkit/lib/generated/*` eg `@celo/lib/generated/Accounts` do a find replace

find: `@celo/contractkit/lib/generated/`
replace: `@celo/abis/web3/`
