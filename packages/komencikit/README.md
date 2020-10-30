# KomenciKit

The KomenciKit library is a wrapper for the Komenci Service API, which is used for fee-less onboarding by allowing 
the consumer to execute fee-less attestations with the help of MetaTransactions.

The main actions that KomenciKit exposes are:
- startSession: Initiate a Komenci session with a solved captcha
- deployWallet: deploy a MTW for Valora's EOA
- requestAttestations: request attestations fee-lessly 
- selectIssuers: wrapper for Attestation.selectIssuers as meta-tx
- completeAttestation: wrapper for Attestations.complete as a meta-tax
- setAccount: wrapper for Accounts.setAccount as a meta-tx
- submitMetaTransaction: submit arbitrary allowed meta transactions via Komenci

## User Guide

KomenciKit requires an instance of `contractKit`, an EOA that's managed by the `contractKit` instance and
options which must at least include the URL of the Komenci API to point to.

```ts
import { newKit } from '@celo/contractkit'
import { KomenciKit } from "@celo/komencikit"

const contractkit = newKit('https://alfajores-forno.celo-testnet.org:8545')

const komenciKit = new KomenciKit(contractkit, "0xaaaa...aaaa", {
    url: 'api.komenci.celo.org' // I made this up
})
```

See [examples/attestation-flow.ts](./examples/attestation-flow.ts) for an example of a full attestation flow executed via KomenciKit
