# `celocli identity`

Interact with ODIS and the attestations service


## `celocli identity:current-attestation-services`

Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol

```
Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol

USAGE
  $ celocli identity:current-attestation-services

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)
```

_See code: [src/commands/identity/current-attestation-services.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/current-attestation-services.ts)_

## `celocli identity:test-attestation-service`

Tests whether the account has setup the attestation service properly by calling the test endpoint on it

```
Tests whether the account has setup the attestation service properly by calling the test endpoint on it

USAGE
  $ celocli identity:test-attestation-service

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Your validator's signer
                                                     or account address

  --globalHelp                                       View all available global flags

  --message=message                                  (required) The message of the SMS

  --phoneNumber=+14152223333                         (required) The phone number to send
                                                     the test message to

  --provider=provider                                Test a specific provider (try
                                                     "twilio" or "nexmo")

EXAMPLE
  test-attestation-service --from 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [src/commands/identity/test-attestation-service.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/test-attestation-service.ts)_

## `celocli identity:withdraw-attestation-rewards`

Withdraw accumulated attestation rewards for a given currency

```
Withdraw accumulated attestation rewards for a given currency

USAGE
  $ celocli identity:withdraw-attestation-rewards

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d          (required) Address to
                                                             withdraw from. Can be the
                                                             attestation signer address
                                                             or the underlying account
                                                             address

  --globalHelp                                               View all available global
                                                             flags

  --tokenAddress=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  The address of the token
                                                             that will be withdrawn.
                                                             Defaults to cUSD
```

_See code: [src/commands/identity/withdraw-attestation-rewards.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/withdraw-attestation-rewards.ts)_
