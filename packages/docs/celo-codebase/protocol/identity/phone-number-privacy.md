# Phone Number Privacy

Celo's [identity protocol](./) allows users to associate their phone number with one or more addresses on the Celo blockchain. This allows users to find each other on the Celo network using phone number instead of cumbersome hexadecimal addresses. The Oblivious Decentralized Identifier Service \(ODIS\) was created to help preserve the privacy of phone numbers and addresses.

## Understanding the problem

When a user sends a payment to someone in their phone's address book, the mobile client must look up the identifier for that phone number on-chain to find the corresponding Celo blockchain address. This address is needed in order to create a payment transaction. If cleartext phone numbers were used as network identifiers directly, then anyone would be able to associate all phone numbers with blockchain accounts and balances. If instead, the identifier was the hash of the recipient's phone number, attackers would still be able to associate phone numbers with accounts and balances via a [rainbow table attack](https://en.wikipedia.org/wiki/Rainbow_table).

## The solution

The basis of the solution is to derive a user's identifier from both their phone number and a secret pepper that is provided by the Oblivious Decentralized Identifier Service \(ODIS\). In order to associate a phone number with a Celo blockchain address, the mobile wallet first queries ODIS for the pepper. It then uses the pepper to compute the unique identifier that's used on-chain.

### Pepper request quota

ODIS imposes a quota on requests for peppers in order to limit the feasibility of rainbow table attacks. When ODIS receives a request for a pepper, it authenticates the request and ensures the requester has not exceeded their quota. Since blockchain accounts and phone numbers are not naturally Sybil-resistant, ODIS bases request quota on the following factors:

* Requester transaction history
* Requester phone number attestation count and success rate
* Requester account balance

The requirements for these factors are configured to make it prohibitively expensive to scrape large quantities of phone numbers while still allowing typical user flows to remain unaffected.

## Oblivious Decentralized Identifier Service

### Distributed Key Generation

For the sake of user privacy, no single party should have the ability to unilaterally compute the pepper for a given phone number. To ensure this, ODIS was designed to be decentralized across a set of reputable participants. Before the ODIS was deployed, a set of operators participated in a Distributed Key Generation \(DKG\) ceremony to generate parts of a shared secret. Details of the the DKG setup can be found [in the Celo Threshold BLS repository](https://github.com/celo-org/celo-threshold-bls-rs). Each ODIS node holds a share of the key which can be used to sign the response to the user. When enough of these signatures are combined, their combination can be used to derive a unique, deterministic phone number pepper. The number of key holders \(_m_\) and threshold of signatures required \(_k_\) are both configurable at the time of the DKG ceremony.

### Rotating keys

In the case that a key is compromised or a new ODIS operator is added, it will be necessary to perform a key rotation. Before going over the key rotation process, let's take a look at the implications of a compromised key. If the number of keys compromised at a time is less than the threshold _k_, the attacker will not be able to reach a sufficient threshold to compute the pepper for all phone numbers. Similarly, as long as _k_ other keys remain uncompromised, good users will still be able to perform the pepper lookup as part of the ODIS. Therefore, in the case that a single key is compromised, user data will remain private and the service operational; however, it's important that we can detect and perform a key rotation before the number of keys compromised exceeds _k_ or _m - k + 1_ \(whichever is lower\). For example, if there are ten ODIS operators and the required threshold is three, then if three of them are compromised an attacker may compute the pepper for all phone numbers. If eight are compromised then an attacker may prevent the rest of the nodes \(two in this case\) from generating the pepper for users. Note that "compromised" entities in these examples could also be malicious or simply unavailable.

To rotate keys, a new DKG ceremony must be performed with at least _k_ of the _m_ original keys. These newly generated keys will not be compatible with the old keys; however if _k_ of the old keys are used, an attacker may still reach the necessary threshold.Therefore, it's extremely important that all of the old keys are destroyed after a successful key rotation. Note that a DKG ceremony also provides the opportunity to change the values for _k_ and _m_.

### Blinding

When a client, like the Celo wallet, queries ODIS to retrieve a phone number pepper, the client first blinds the phone number locally. This blinding process preserves the privacy of the mobile number such that ODIS nodes cannot determine what number they're providing a pepper for; reducing risk of targeted censorship and further increasing privacy. After the application receives the response, it unblinds it to compute the pepper.

### Combiner

To facilitate the multi-service communication needed for the K of M signing, ODIS includes a combiner service which performs this orchestration for the convenience of wallets and other clients building on Celo. Like ODIS signer nodes, the combiner only receives the blinded phone number and therefore cannot see what number it's handling. The combiner also validates the response from each signer to ensure a corrupt signer cannot corrupt the resulting pepper.

Anyone who wishes to participate in the ODIS service may run a combiner. Currently, cLabs operates one such combiner that may be used by other projects building on Celo.

## Authentication

In order to measure the quota for a given requester, ODIS must check their account information on the Celo blockchain. To prove ownership over their account, the POST request contains an Authorization header with the signed message body. When ODIS nodes receive the request, it authenticates the user by recovering the message signer from the header and comparing it to the value in the message body.

## Request Flow Diagram

![request flow diagram](https://storage.googleapis.com/celo-website/docs/ODIS-flow-diagram.svg)

## Architecture

![architecture diagram](https://storage.googleapis.com/celo-website/docs/ODIS-architecture-diagram.svg)

The hosted architecture is divided into two components, the Combiner and the Signers. Currently the combiner is a cloud function and the signers are independent NodeJs servers. Both services leverage the [Celo Threshold BLS library](https://github.com/celo-org/celo-threshold-bls-rs) which has been compiled to [a Web Assembly module](https://github.com/celo-org/blind-threshold-bls-wasm).

The combiner and signers maintain some minimal state in a SQL database, mainly related to quota tracking.

For storage of the BLS signing key, the signers currently support three cloud-based keystores: Azure Key Vault, AWS Secret Manager, and Google Secret Manager.

