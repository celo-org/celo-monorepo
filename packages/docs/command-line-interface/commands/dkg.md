# DKG

Publish your locally computed DKG results to the blockchain

## `celocli dkg:allowlist`

Allowlist an address in the DKG

```text
Allowlist an address in the DKG

USAGE
  $ celocli dkg:allowlist

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender
  --globalHelp                                          View all available global flags

  --participantAddress=participantAddress               (required) Address of the
                                                        participant to allowlist
```

_See code:_ [_src/commands/dkg/allowlist.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/allowlist.ts)

## `celocli dkg:deploy`

Deploys the DKG smart contract

```text
Deploys the DKG smart contract

USAGE
  $ celocli dkg:deploy

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --globalHelp                                       View all available global flags

  --phaseDuration=phaseDuration                      (required) Duration of each DKG
                                                     phase in blocks

  --threshold=threshold                              (required) The threshold to use for
                                                     the DKG
```

_See code:_ [_src/commands/dkg/deploy.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/deploy.ts)

## `celocli dkg:get`

Gets data from the contract to run the next phase

```text
Gets data from the contract to run the next phase

USAGE
  $ celocli dkg:get

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d                 (required) DKG
                                                                       Contract Address

  --globalHelp                                                         View all
                                                                       available global
                                                                       flags

  --method=(shares|responses|justifications|participants|phase|group)  (required) Getter
                                                                       method to call
```

_See code:_ [_src/commands/dkg/get.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/get.ts)

## `celocli dkg:publish`

Publishes data for each phase of the DKG

```text
Publishes data for each phase of the DKG

USAGE
  $ celocli dkg:publish

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address

  --data=data                                           (required) Path to the data
                                                        being published

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --globalHelp                                          View all available global flags
```

_See code:_ [_src/commands/dkg/publish.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/publish.ts)

## `celocli dkg:register`

Register a public key in the DKG

```text
Register a public key in the DKG

USAGE
  $ celocli dkg:register

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --blsKey=blsKey                                       (required)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender
  --globalHelp                                          View all available global flags
```

_See code:_ [_src/commands/dkg/register.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/register.ts)

## `celocli dkg:start`

Starts the DKG

```text
Starts the DKG

USAGE
  $ celocli dkg:start

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender
  --globalHelp                                          View all available global flags
```

_See code:_ [_src/commands/dkg/start.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/start.ts)

