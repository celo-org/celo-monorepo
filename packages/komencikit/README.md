# KomenciKit

The KomenciKit library is a wrapper for the Komenci Service API, which is used for fee-less onboarding by allowing 
the consumer to execute fee-less attestations with the help of MetaTransactions.

The main actions that KomenciKit exposes are:
- startSession: Initiate a Komenci session with a solved captcha
- deployWallet: deploy a MTW for Valora's EOA
- requestAttestations: request attestations fee-lessly 
- submitMetaTransaction: submit arbitrary meta transactions via Komenci
- selectIssuers: wrapper for selectIssuers as meta-tx
- completeAttestation: wrapper for complete attestations as meta-tx

## User Guide

To start working with Komencikit you need a to pass in a ContractKit instance, the external account 

```ts
import { newKit } from '@celo/contractkit'
import { KomenciKit } from "@celo/komencikit"

const contractkit = newKit('https://alfajores-forno.celo-testnet.org:8545')

const komenciKit = new KomenciKit(contractkit, "0xaaaa...aaaa", {
    url: 'api.komenci.celo.org' // I made this up
})
```

See [examples/attestation-flow.ts](./examples/attestation-flow.ts) for an example of a full attestation flow executed via KomenciKit
