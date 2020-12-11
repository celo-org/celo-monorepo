---
description: Publish your locally computed DKG results to the blockchain
---

# DKG

## Deploy

Deploys the DKG smart contract

```text
USAGE
  $ celocli dkg:deploy

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --phaseDuration=phaseDuration                      (required) Duration of each DKG phase in blocks

  --threshold=threshold                              (required) The threshold to use for the DKG

  --useLedger                                        Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/dkg/deploy.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/deploy.ts)

## Get

Gets data from the contract to run the next phase

```text
USAGE
  $ celocli dkg:get

OPTIONS
  -k, --privateKey=privateKey                                          Use a private key to sign local transactions with
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d                 (required) DKG Contract Address

  --ledgerAddresses=ledgerAddresses                                    [default: 1] If --useLedger is set, this will get
                                                                       the first N addresses for local signing

  --ledgerConfirmAddress                                               Set it to ask confirmation for the address of the
                                                                       transaction from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses                        [default: [0]] If --useLedger is set, this will
                                                                       get the array of index addresses for local
                                                                       signing. Example --ledgerCustomAddresses "[4,99]"

  --method=(shares|responses|justifications|participants|phase|group)  (required) Getter method to call

  --useLedger                                                          Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/dkg/get.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/get.ts)

## Publish

Publishes data for each phase of the DKG

```text
USAGE
  $ celocli dkg:publish

OPTIONS
  -k, --privateKey=privateKey                           Use a private key to sign local transactions with
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --data=data                                           (required) Path to the data being published
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --useLedger                                           Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/dkg/publish.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/publish.ts)

## Register

Register a public key in the DKG

```text
USAGE
  $ celocli dkg:register

OPTIONS
  -k, --privateKey=privateKey                           Use a private key to sign local transactions with
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --blsKey=blsKey                                       (required)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --useLedger                                           Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/dkg/register.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/register.ts)

## Start

Starts the DKG

```text
USAGE
  $ celocli dkg:start

OPTIONS
  -k, --privateKey=privateKey                           Use a private key to sign local transactions with
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --useLedger                                           Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/dkg/start.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/start.ts)

## Whitelist

Whitelist an address in the DKG

```text
USAGE
  $ celocli dkg:whitelist

OPTIONS
  -k, --privateKey=privateKey                           Use a private key to sign local transactions with
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --participantAddress=participantAddress               (required) Address of the participant to whitelist

  --useLedger                                           Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/dkg/whitelist.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/whitelist.ts)

