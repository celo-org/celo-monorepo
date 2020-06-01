# Phone Number Privacy

An important part of the Celo protocol is the ability to link a phone number to a Celo native address. This improves the user experience for sending/receiving payments to a phone's contacts without having to deal with blockchain native addresses. However, it's also important that the phone number mappings remain private, preventing the mass harvesting of mapped phone numbers. This guide provides an overview of the Celo phone number privacy system.

## Understanding the problem
When you send payment to someone in your phone's address book, the mobile client needs to look up the phone number in the on-chain registry to find the mapping to a Celo native address, which can be used to receive the actual payment. If this mapping were in plain text on the Celo blockchain then anyone would be able to trivially see account balances for all numbers. If instead, the hash of each phone number were used as the on chain identifier, it would still be possible to brute force the mapping via a [rainbow table attack](https://en.wikipedia.org/wiki/Rainbow_table). 

## The "pretty good" solution
The basis of the solution is to use a hashed on-chain identifier that is derived from both the original phone number and a salt that is provided by the Pretty Good Phone Number Privacy (PGPNP) service. When a user initiates a payment to a phone number, the mobile wallet first queries PGPNP for the number's salt and then uses this salt to compute the on-chain identifier. When the PGPNP receives a request, it authenticates the request and ensures the account has not exceeded its quota. Since blockchain accounts and phone numbers are not naturally Sybil-resistant, the PGPNP uses a set of factors to determine the appropriate quota. 

Quota is influenced by:
- Account balance
- Transaction history
- Phone number attestation count and success rate

### Matchmaking
It's important that we tighten down the quota as much as possible to hinder potential data harvesting. To this end, we consider mutual connections between users when evaluating query threshold consumption. If two Celo users both have each other in their respective address book, then we don't count this query against the user's quota since there's a mutual connection already established. By taking into account mutual connections, we can significantly lower the quota that an average user will need.

## Decentralized PGPNP
### Distributed Key Generation
For the sake of user privacy, no single party should have the ability to unilaterally compute the hash for a given number. With this in mind, we've designed the PGPNP service to be decentralized across a handful of reputable participants. Before the PGPNP service is deployed, a set of operators participated in a Distributed Key Generation (DKG) ceremony to generate a shared secret. You can find the repository for the [DKG setup here](https://github.com/celo-org/celo-threshold-bls-rs). Each instance of the PGPNP service holds a share of the key which can be used to sign the response to the user. When enough of these signatures are combined, their combination can be used to derive the phone number salt. The number of key holders and threshold of signatures required are both configurable at the time of the DKG ceremony.

### Blinding
When the user queries the phone number, the mobile application first blinds the phone number locally. After the application receives the response, it unblinds it to retrieve the salt. This blinding process preserves the privacy of the mobile number such that the PGPNP cannot tell which number it's providing a salt for; reducing risk of targeted censorship and further increasing privacy.  

### Combiner
Due to the multi-service communication that needs to happen as part of the K of M signing, we've created a combiner service which performs the orchestration on the user's behalf. This is entirely optional to facilitate the orchestration and a given client can choose to operate their own combiner if desired. Because the combiner only receives the blinded phone number, the combiner cannot tell which number it's providing orchestrating services for. The combiner additionally validates the response from each signer to ensure a corrupt signer cannot corrupt the resulting salt.

## Authentication
In order to measure the quota for a given request, the PGPNP must check the querier's account information on the Celo network. To prove ownership over the account, the header of the API request contains the signed message body. When the PGPNP receives the request, it authenticates the user by recovering the message signer from the header and comparing it to the value in the message body.

## Request Flow Diagram
![request flow diagram](https://storage.googleapis.com/celo-website/docs/pgpnp-flow.svg)

## Architecture
![architecture diagram](https://storage.googleapis.com/celo-website/docs/pgpnp-architecture.jpg)

The hosted architecture is divided into two components, the Combiner and the Signer. Both are hosted as serverless cloud functions with public API endpoints. Both services rely upon a [BLS signing library](https://github.com/celo-org/blind-threshold-bls-wasm#e1e2f8a) which is compiled to a Web Assembly module. The Signer also leverages a hosted PostgreSQL database for tracking quotas and an Azure Key Vault instance for managing the BLS key securely.
