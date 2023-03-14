# `celocli identity`

Interact with ODIS and the attestations service


## `celocli identity:get-attestations`

Looks up attestations associated with the provided phone number. If a pepper is not provided, it uses the --from account's balance to query the pepper.

```
Looks up attestations associated with the provided phone number. If a pepper is not provided, it uses the --from account's balance to query the pepper.

USAGE
  $ celocli identity:get-attestations

OPTIONS
  --from=from                Account whose balance to use for querying ODIS for the
                             pepper lookup

  --globalHelp               View all available global flags

  --identifier=identifier    On-chain identifier

  --network=network          The ODIS service to hit: mainnet, alfajores,
                             alfajoresstaging

  --pepper=pepper            ODIS phone number pepper

  --phoneNumber=phoneNumber  Phone number to check attestations for

EXAMPLES
  get-attestations --phoneNumber +15555555555 --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95

  get-attestations --phoneNumber +15555555555 --pepper XgnKVpplZc0p1

  get-attestations --identifier
  0x4952c9db9c283a62721b13f56c4b5e84a438e2569af3de21cb3440efa8840872
```

_See code: [src/commands/identity/get-attestations.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/get-attestations.ts)_

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

  --globalHelp                                       View all available global flags

  --phoneNumber=+14152223333                         (required) The phone number for
                                                     which to query the identifier.
                                                     Should be in e164 format with
                                                     country code.

EXAMPLE
  identifier --phoneNumber +14151231234 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --context alfajores
```

_See code: [src/commands/identity/identifier.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/identifier.ts)_

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
