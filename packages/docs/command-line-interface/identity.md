---
description: Tests whether the account has setup the attestation service properly by calling the test endpoint on it
---

## Commands

### Test-attestation-service

Tests whether the account has setup the attestation service properly by calling the test endpoint on it

```
USAGE
  $ celocli identity:test-attestation-service

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Your validator's account address
  --message=message                                  (required) The message of the SMS
  --phoneNumber=+14152223333                         (required) The phone number to send the test message to

EXAMPLE
  test-attestation-service --from 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/identity/test-attestation-service.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/test-attestation-service.ts)_
