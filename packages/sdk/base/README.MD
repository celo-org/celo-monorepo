
# @celo/base

This package contains shared classes and functions used by other celo packages. It was designed to have minimal external dependencies. (for shared celo functions that have big external dependencies see the @celo/utils, @celo/cryptographic-utils, @celo/phone-utils, @celo/network-utils packages)


## Notable Types

```typescript
// enums StableTokens and Token are enums, CeloTokenType is the type that must be one of the 2 enums
import { StableTokens, Token, CeloTokenType } from "@celo/base"

StableTokens.cUSD

StableTokens.cREAL

Token.CELO
```

## Notable Functions

```typescript
import { eqAddress, normalizeAddress, isNullAddress } from "@celo/base"
```
