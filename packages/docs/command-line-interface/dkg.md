# `celocli dkg`

Publish your locally computed DKG results to the blockchain


## `celocli dkg:deploy`

Deploys the DKG smart contract

```
Deploys the DKG smart contract

USAGE
  $ celocli dkg:deploy

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender

  --phaseDuration=phaseDuration                      (required) Duration of each DKG
                                                     phase in blocks

  --threshold=threshold                              (required) The threshold to use for
                                                     the DKG
```

_See code: [src/commands/dkg/deploy.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/deploy.ts)_

## `celocli dkg:get`

Gets data from the contract to run the next phase

```
Gets data from the contract to run the next phase

USAGE
  $ celocli dkg:get

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d                 (required) DKG
                                                                       Contract Address

  --method=(shares|responses|justifications|participants|phase|group)  (required) Getter
                                                                       method to call
```

_See code: [src/commands/dkg/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/get.ts)_

## `celocli dkg:publish`

Publishes data for each phase of the DKG

```
Publishes data for each phase of the DKG

USAGE
  $ celocli dkg:publish

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address

  --data=data                                           (required) Path to the data
                                                        being published

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender
```

_See code: [src/commands/dkg/publish.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/publish.ts)_

## `celocli dkg:register`

Register a public key in the DKG

```
Register a public key in the DKG

USAGE
  $ celocli dkg:register

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --blsKey=blsKey                                       (required)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender
```

_See code: [src/commands/dkg/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/register.ts)_

## `celocli dkg:start`

Starts the DKG

```
Starts the DKG

USAGE
  $ celocli dkg:start

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender
```

_See code: [src/commands/dkg/start.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/start.ts)_

## `celocli dkg:whitelist`

Whitelist an address in the DKG

```
Whitelist an address in the DKG

USAGE
  $ celocli dkg:whitelist

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --participantAddress=participantAddress               (required) Address of the
                                                        participant to whitelist
```

_See code: [src/commands/dkg/whitelist.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/whitelist.ts)_
