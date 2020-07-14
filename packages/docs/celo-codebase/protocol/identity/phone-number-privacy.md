# Phone Number Privacy

Celo's [identity protocol](README.md) allows users to associate their phone number with one or more addresses on the Celo blockchain. This allows users to find eachother on the Celo network via their phone number, rather than cumbersome hexadecimal addresses. The Phone Number Privacy (PNP) protocol helps preserve the privacy of users blockchain addresses by preventing the mass harvesting of the phone numbers of Celo users.

## Understanding the problem

When a user sends a payment to someone in their phone's address book, the mobile client must look up the identifier for that phone number on-chain to find the corresponding Celo blockchain address. This address is needed in order to complete the payment transaction. If the identifier was simply the recipient's phone number, then anyone would be able to associate their phone number with their blockchain account and balance. If instead, the identifier was the hash of the recipient's phone number, attackers would still be able to associate their phone number with their blockchain account and balance via a [rainbow table attack](https://en.wikipedia.org/wiki/Rainbow_table).

## The solution

The basis of the solution is to derive a user's identifier from both their phone number and a secret pepper that is provided by the Phone Number Privacy (PNP) service. In order to associate a phone number with a Celo blockchain address, the mobile wallet first queries the PNP service for the associated pepper, and then uses this pepper to compute the identifier.

### Pepper request quota

The PNP service imposes a quota on requests for peppers in order to limit the feasibility of a rainbow table attack. When PNP receives a request for a pepper, it authenticates the request and ensures the requester has not exceeded their quota. Since blockchain accounts and phone numbers are not naturally Sybil-resistant, PNP bases request quota on the following factors:

- Requester account balance
- Requester transaction history
- Requester phone number attestation count and success rate

The impact that these factors have on the quota are adjusted to make it prohibitively expensive to scrape large quantities of phone numbers while still allowing typical user flows to remain unaffected.

## Decentralized PNP

### Distributed Key Generation

For the sake of user privacy, no single party should have the ability to unilaterally compute the pepper for a given phone number. With this in mind, the PNP service was designed to be decentralized across a small number of reputable participants. Before the PNP service was deployed, a set of operators participated in a Distributed Key Generation (DKG) ceremony to generate a shared secret. You can find the repository for the [DKG setup here](https://github.com/celo-org/celo-threshold-bls-rs). Each instance of the PNP service holds a share of the key which can be used to sign the response to the user. When enough of these signatures are combined, their combination can be used to derive the phone number pepper. The number of key holders (_m_) and threshold of signatures required (_k_) are both configurable at the time of the DKG ceremony.

### Rotating keys

In the case that a key is compromised or a new PNP operator is added, it will be necessary to perform a key rotation. Before going over the key rotation process, let's take a look at the implications of a compromised key. If the number of keys compromised at a time is less than the threshold _k_, the attacker will not be able to reach a sufficient threshold to compute the pepper for all phone numbers. Similarly, as long as _k_ other keys remain uncompromised, good users will still be able to perform the pepper lookup as part of the PNP service. Therefore, in the case that a single key is compromised, user data will remain private and the service operational; however, it's important that we can detect and perform a key rotation before the number of keys compromised exceeds _k_ or _m - k + 1_ (whichever is lower). For example, if there are ten PNP operators and the required threshold is three, then if three of them are compromised an attacker may compute the pepper for all phone numbers. If eight are compromised then an attacker may prevent the rest of the nodes (two in this case) from generating the pepper for users. Note that "compromised" entities in these examples could also be malicious or simply unavailable.

To rotate keys, a new DKG ceremony must be performed with at least _k_ of the _m_ original keys. These newly generated keys will not be compatible with the old keys; however if _k_ of the old keys are used, an attacker may still reach the necessary threshold.Therefore, it's extremely important that all of the old keys are destroyed after a successful key rotation. Note that a DKG ceremony also provides the opportunity to change the values for _k_ and _m_.

### Blinding

When the user queries a phone number, the mobile wallet first blinds the phone number locally. After the application receives the response, it unblinds it to retrieve the pepper. This blinding process preserves the privacy of the mobile number such that the PNP cannot tell which number it's providing a pepper for; reducing risk of targeted censorship and further increasing privacy.

### Combiner

Due to the multi-service communication that needs to happen as part of the K of M signing, participants in the Celo ecosystem may run a combiner service which performs this orchestration for the convenience of wallets and other clients building on Celo. Because the combiner only receives the blinded phone number, the combiner cannot tell which number it's providing orchestrating services for. The combiner additionally validates the response from each signer to ensure a corrupt signer cannot corrupt the resulting pepper. Note that using a combiner merely simplifies using the PNP service, and is in no way required.

Anyone who wishes to participate in the PNP service may run a combiner. Currently, cLabs operates one such combiner that may be used by other projects building on Celo.

## Authentication

In order to measure the quota for a given requester, the PNP must check their account information on the Celo blockchain. To prove ownership over their account, the header of the API request contains the signed message body. When the PNP receives the request, it authenticates the user by recovering the message signer from the header and comparing it to the value in the message body.

## Request Flow Diagram

![request flow diagram](https://storage.googleapis.com/celo-website/docs/pgpnp-flow.svg)

## Architecture

![architecture diagram](https://storage.googleapis.com/celo-website/docs/pgpnp-architecture.jpg)

The hosted architecture is divided into two components, the Combiner and the Signer. Both are hosted as serverless cloud functions with public API endpoints. Both services rely upon a [BLS signing library](https://github.com/celo-org/blind-threshold-bls-wasm#e1e2f8a) which is compiled to a Web Assembly module. The Signer also leverages a hosted PostgreSQL database for tracking quotas and an Azure Key Vault instance for managing the BLS key securely.
