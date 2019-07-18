# Lightweight Identity

Celo’s unique purpose is to make financial tools accessible to anyone with a mobile phone. One barrier for the usage of many other platforms is their required usage of 30+ hexadecimal-character-long strings as addresses. It’s like bank account numbers, but worse. Hard to remember, easy to mess up. They are so hard to use that the predominant way of exchanging addresses is usually via copy-paste over an existing messaging channel or via QR-codes in person. Both approaches are practically interactive protocols and thus not cover many use cases in which people would like to transact. Celo offers a lightweight identity layer that starts with a decentralized mapping of phone numbers to wallet addresses, allowing users to transact with one another via the most common identity scheme everyone is familiar with: their address book.

![](https://storage.googleapis.com/celo-website/docs/verification-steps.png)

### **Adding their phone number to the mapping**

To allow Bob to find an address mapped to her phone number, Alice can request attestations to their phone number \(technically the hash of their phone number\) from the `Attestations` contract by transferring the attestation request fee to it. The fee per attestation request is set on the contract with Governance. The `Attestations` contract will use the `Random` contract to do a random selection over the current validator set in the `Validators` contract who will become responsible for these attestation requests. In the current version of the `Attestations` contract, Alice will look up the encryption key of those validators \(that they set on the `Attestations` contract itself\), and reveal their phone number to the validator only.

As part of the expectation to validators, they observe those reveals and then produce a signed secret message that acts as an attestation by that validator that Alice owns the phone number. The validator sends that message to the revealed phone number via SMS. Read more under text message sending service.

When Alice receives the text message, she can take that signed message to the `Attestations` contract, which can verify that the attestation came from the validator indeed. Upon a successful attestation, the validator can redeem for the attestation request fee to pay them for the cost of sending the SMS. In the end, we have recorded an attestation by the validator to a mapping of Alice’s phone number to her account address.

### **Using the mapping for payment**

Once Alice has completed attestations for their phone number/address, Bob, who has her phone number in his contact book, can see that Alice has an attested account address with her phone number. He can use that address to send funds to Alice, without her having to specifically communicate her address to Bob.

The `Attestations` contract records all attestations of a phone number to any number of addresses. That for example could happen when a user loses their private key and wants to map a new wallet address. However, it could also happen through the collusion of a validator with Alice. Therefore, it is important that clients of the identity protocol highlight possible conflicting attestations. Attestations can theoretically be attacked, whether by a service provider or collusion with a validator. In general, the more attestations an address has received, the more likely it is to map to the valid owner of a phone number based upon the existing trust assumptions for validators for consensus.

There are additional measures we can take to further secure the integrity of the mapping’s usage. In the future we plan to provide reference implementations in the wallet for some of these. For example, we plan to detect remapping of wallet addresses. Many users are already accustomed to sending small amounts first and verifying the receipt of those funds before attempting to transfer larger amounts.

### **Privacy mode**

One downside to this identity protocol is that knowledge of a phone number can let anyone quickly determine the balance of the associated wallet, which of course may be unacceptable for many use cases. For these circumstances, the contract allows users to use the `Attestations` contract in privacy mode. In this mode, the user does not map their phone number to their wallet address, but to an account that is not meant to be the recipient of transfers. Through a registered encryption key on the user’s account on the contract, schemes can be derived to allow users to selectively reveal their true wallet addresses to authorized participants. Implementing such a scheme is future work.

### **Text messaging service**

We have a service that we built that we currently call the `Verification Pool` that allows validators to make an HTTP POST request to and that service then sends the SMS to Alice via Twilio. We expect that in the future, validators run their own version of a service like the `Verification Pool`. For Alfajores, Celo Labs will be hosting a single instance of the `Verification Pool` that anyone can use.

We have been experimenting with an extension to the `Verification Pool` that we would like community feedback on. Instead of sending the SMS via Twilio, users of a `Rewards Mobile App` could register themselves with the `Verification Pool` and be made responsible for sending those text messages. It would allow users with cheap or leftover SMS capacity from their cell phone plan to effectively acquire a share of the attestation request fees. It would represent a unique on-ramp for users who do not have access to classic on-ramps like exchanges. However, we are currently unsure of the game-theoretical implications of “pooling” the attestation requests to non-validators and thus explicitly labeling it as an experiment.
