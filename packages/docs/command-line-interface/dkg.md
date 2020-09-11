---
description: Publish your locally computed DKG results to the blockchain
---

## Commands

### Deploy

Deploys the DKG smart contract

```
USAGE
  $ celocli dkg:deploy

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)      Use a specific gas currency for transaction fees (defaults to
                                                     'auto' which uses whatever feeCurrency is available)

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

_See code: [packages/cli/src/commands/dkg/deploy.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/deploy.ts)_

### Get

Gets data from the contract to run the next phase

```
USAGE
  $ celocli dkg:get

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d                 (required) DKG Contract Address

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)                        Use a specific gas currency for transaction fees
                                                                       (defaults to 'auto' which uses whatever
                                                                       feeCurrency is available)

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

_See code: [packages/cli/src/commands/dkg/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/get.ts)_

### Publish

Publishes data for each phase of the DKG

```
USAGE
  $ celocli dkg:publish

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --data=data                                           (required) Path to the data being published
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)         Use a specific gas currency for transaction fees (defaults to
                                                        'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --useLedger                                           Set it to use a ledger wallet
```

_See code: [packages/cli/src/commands/dkg/publish.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/publish.ts)_

### Register

Register a public key in the DKG

```
USAGE
  $ celocli dkg:register

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --blsKey=blsKey                                       (required)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)         Use a specific gas currency for transaction fees (defaults to
                                                        'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --useLedger                                           Set it to use a ledger wallet
```

_See code: [packages/cli/src/commands/dkg/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/register.ts)_

### Start

Starts the DKG

```
USAGE
  $ celocli dkg:start

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)         Use a specific gas currency for transaction fees (defaults to
                                                        'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --useLedger                                           Set it to use a ledger wallet
```

_See code: [packages/cli/src/commands/dkg/start.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/start.ts)_

### Whitelist

Whitelist an address in the DKG

```
USAGE
  $ celocli dkg:whitelist

OPTIONS
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) DKG Contract Address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the sender

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)         Use a specific gas currency for transaction fees (defaults to
                                                        'auto' which uses whatever feeCurrency is available)

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

_See code: [packages/cli/src/commands/dkg/whitelist.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/dkg/whitelist.ts)_
