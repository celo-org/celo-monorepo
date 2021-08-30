# Identity

Celo’s unique purpose is to make financial tools accessible to anyone with a mobile phone. One barrier for the usage of many other platforms is their required usage of 30+ hexadecimal-character-long strings as addresses. It’s like bank account numbers, but worse. Hard to remember, easy to mess up. They are so hard to use that the predominant way of exchanging addresses is usually via copy-paste over an existing messaging channel or via QR-codes in person. Both approaches are practically interactive protocols and thus do not cover many use cases in which people would like to transact. Celo offers an optional lightweight identity layer that starts with a decentralized mapping of phone numbers to wallet addresses, allowing users to transact with one another via the most common identity scheme everyone is familiar with: their address book.

![](https://storage.googleapis.com/celo-website/docs/attestations-flow.jpg)

## Adding their phone number to the mapping

To allow Bob to find an address mapped to her phone number, Alice can request attestations to their phone number \(technically the hash of their phone number\) from the `Attestations` contract by transferring the attestation request fee to it. The fee per attestation request is set on the contract with [Governance](../governance.md). After a brief waiting time of currently `4` blocks, the `Attestations` contract will use the `Random` contract to do a random selection over the current validator set in the `Validators` contract who will become responsible for these attestation requests.

As part of the expectation to validators, they run the attestation service whose endpoint they register in their [Metadata](metadata.md). Alice can identify the validators responsible for her attestation from the smart contract, determine the validators' attestation service URLs from their [Metadata](metadata.md) and request attestations from them. In turn, the attestation service produces a signed secret message that acts as an attestation by that validator that Alice owns the phone number. The validator sends that message via SMS. Read more under [attestation service](./#attestation-service).

When Alice receives the text message, she can take that signed message to the `Attestations` contract, which can verify that the attestation came from the validator indeed. Upon a successful attestation, the validator can redeem for the attestation request fee to pay them for the cost of sending the SMS. In the end, we have recorded an attestation by the validator to a mapping of Alice’s phone number to her account address.

## Using the mapping for payment

Once Alice has completed attestations for their phone number/address, Bob, who has her phone number in his contact book, can see that Alice has an attested account address with her phone number. He can use that address to send funds to Alice, without her having to specifically communicate her address to Bob.

The `Attestations` contract records all attestations of a phone number to any number of addresses. That for example could happen when a user loses their private key and wants to map a new wallet address. However, it could also happen through the collusion of a validator with Alice. Therefore, it is important that clients of the identity protocol highlight possible conflicting attestations.

Some risk exists for attestations to be added without the permission of the "legitimate" owner of the phone number. One such risk is that the phone service provider or [SIM swap](https://en.wikipedia.org/wiki/SIM_swap_scam) attacker could take control of the phone number and complete a number of attestations. Another risk is that a sufficient number of Attestation Service providers may collude to complete fake attestations. Notably, completing malicious attestations does not lead to a loss of funds, as the private key is still the necessary and sufficient condition for transactions of an account. However, without proper care, future senders may be tricked into sending funds to the newly associated address. In general the number and age of attestations for an address should be taken into account to identify the valid owner of a phone number.

There are additional measures we can take to further secure the integrity of the mapping’s usage. In the future we plan to provide reference implementations in the wallet for some of these. For example, we plan to detect remapping of wallet addresses. Many users are already accustomed to sending small amounts first and verifying the receipt of those funds before attempting to transfer larger amounts.

## Preventing harvesting of phone numbers

To protect user privacy by preventing mass harvesting of phone numbers, the Celo platform includes a service that obfuscates the information saved on the blockchain. The service is enabled by default for all Celo Wallet users. Details of its functionality and architecture are explained in [Phone Number Privacy](phone-number-privacy.md)

## Attestation service

The attestation service is a simple Node.js service that validators run to send signed messages for attestations. It can be configured with SMS providers, as different providers have different characteristics like reliability, trustworthiness and performance in different regions. The attestation service currently supports [Twilio](https://www.twilio.com) and [Nexmo](https://nexmo.com). Celo should widen the number of supported providers over time.

We have been experimenting with a SMS provider that we would like community feedback on. Instead of sending the SMS via conventional providers like Twilio, users of a `Rewards Mobile App` could register themselves with a `Verification Pool` and be made responsible for sending those text messages. It would allow users with cheap or leftover SMS capacity from their cell phone plan to effectively acquire a share of the attestation request fees. It would represent a unique on-ramp for users who do not have access to classic on-ramps like exchanges. Validators could configure their attestation service to use such a SMS provider which could in theory provide better inclusion and performance.

## Future improvements to privacy

Celo is committed to meet the privacy needs of its users. More details about areas for future research can be found in [Privacy Research](https://github.com/celo-org/celo-monorepo/tree/28a278430981d03332111eae1d15a00b88c1dc16/packages/docs/celo-codebase/protocol/identity/privacy-research.md)

