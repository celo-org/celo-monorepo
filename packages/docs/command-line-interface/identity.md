# `celocli identity`

Interact with ODIS and the attestations service

- [`celocli identity:current-attestation-services`](#celocli-identitycurrent-attestation-services)
- [`celocli identity:identifier`](#celocli-identityidentifier)
- [`celocli identity:test-attestation-service`](#celocli-identitytest-attestation-service)
- [`celocli identity:withdraw-attestation-rewards`](#celocli-identitywithdraw-attestation-rewards)

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
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)
```

_See code: [src/commands/identity/current-attestation-services.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/current-attestation-services.ts)_

## `celocli identity:identifier`

Queries ODIS for the on-chain identifier and pepper corresponding to a given phone number.

```
Queries ODIS for the on-chain identifier and pepper corresponding to a given phone number.

USAGE
  $ celocli identity:identifier

OPTIONS
  --context=context                                  mainnet (default), alfajores, or
                                                     alfajoresstaging

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address from which
                                                     to perform the query

  --phoneNumber=+14152223333                         (required) The phone number for
                                                     which to query the identifier.
                                                     Should be in e164 format with
                                                     country code.

EXAMPLE
  identifier --phoneNumber +14151231234 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --context alfajores
```

_See code: [src/commands/identity/identifier.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/identifier.ts)_

## `celocli identity:test-attestation-service`

Tests whether the account has setup the attestation service properly by calling the test endpoint on it

```
Tests whether the account has setup the attestation service properly by calling the test endpoint on it

USAGE
  $ celocli identity:test-attestation-service

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Your validator's signer
                                                     or account address

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

  --tokenAddress=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  The address of the token
                                                             that will be withdrawn.
                                                             Defaults to cUSD
```

_See code: [src/commands/identity/withdraw-attestation-rewards.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/withdraw-attestation-rewards.ts)_
