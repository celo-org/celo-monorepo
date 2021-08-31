# Verification

The Celo Wallet leverages the [Lightweight Identity](../../protocol/identity/) protocol to construct mappings of phone number hashes to addresses.

## Phone Number Verification in the Wallet

During the final step of new user onboarding in the Celo Wallet, a user completes phone number verification. Given that the Celo Protocol supports a variable, the Celo Wallet implements this as a binary notion of `verified` \(&gt;= 3 attestations\) or `unverified` \(&lt; 3 attestations\). During the verification process, three attestations are attempted, and the user receives three text messages, upon receipt of which the user is considered verified. Future implementations of the wallet may explore using requested/received verification ratios or variable numbers of attestations to provide a notion of non-binary verification so as to account for variable probabilities of ownership of a phone number.

## Verifications

When verification is in progress, the celo wallet sends a request for three SMS attestations. The process of selecting the senders of each of these three messages is detailed in the [Lightweight Identity](../../protocol/identity/) documentation.

The following diagrams depict the user flows for the celo wallet:

* [General Verification Flow](https://storage.googleapis.com/celo-website/Verification%20Flow.jpg)
* [Detailed Phone Number Hash Flow](https://storage.googleapis.com/celo-website/Get%20Phone%20Number%20Hash%20Details%20Flow.jpg)
* \[Detailed Flow for Receiving SMS Input and Compeleting Verification\]\([https://storage.googleapis.com/celo-website/Wait SMS and Complete Attestation Flow \(1\).jpg](https://storage.googleapis.com/celo-website/Wait%20SMS%20and%20Complete%20Attestation%20Flow%20%281%29.jpg)\)

