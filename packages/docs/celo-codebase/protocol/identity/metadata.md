# Metadata

The Celo protocol's **metadata and claims** feature makes it possible to connect on-chain with off-chain identities.

Use cases include:

* Tools want to present public metadata supplied by a validator or validator group as part of a list of candidate groups, or a list of current elected validators.
* Governance Explorer UIs may want to present public metadata about the creators of governance proposals
* The Celo Foundation receives notice of a security vulnerability and wants to contact elected validators to facilitate them to make a decision on applying a patch.
* A DApp makes a request to the Celo Wallet for account information or to sign a transaction. The Celo Wallet should provide information about the DApp to allow the user to make a decision whether to sign the transaction or not.

Furthermore, these tools may want to include user chosen information such as names or profile pictures that would be expensive to store on-chain. For this purpose, the Celo protocol supports **metadata** that allows accounts to make both verifiable as well as non-verifiable claims. The design is described in [CIP3](https://github.com/celo-org/CIPs/pull/4).

On the `Accounts` smart contract, any account can register a URL under which their metadata file is available. The metadata file contains an unordered list of claims, signed by the account.

## Types of Claim

ContractKit currently supports the following types of claim:

* **Name Claim** - An account can claim a human-readable name. This claim is not verifiable.
* **Attestation Service URL Claim** - For the [lightweight identity layer](../), validators can make a claim under which their Attestation Service is reachable to provide attestations. This claim is not verifiable.
* **Keybase User Claim** - Accounts can make claims on [Keybase](https://keybase.io) usernames. This claim is verifiable by signing a message with the account and hosting it on the publicly accessible path of the Keybase file system.
* **Domain Claim** - Accounts can make claims on domain names. This claim is verifiable by signing a message with the account and embedding it in a [TXT record](https://en.wikipedia.org/wiki/TXT_record).

In the future ContractKit may support other types of claim, including:

* **Twitter User Claim** - Accounts can make claims on [Twitter](https://twitter.com/) usernames. This claim is verifiable by signing a message with the account and posting it as a tweet. Any client can verify the claim with a reference to the tweet in the claim.

## Handling Metadata

You can interact with metadata files easily through the [CLI](../../../command-line-interface/commands/account.md), or in your own scripts, tools or DApps via [ContractKit](../../../developer-guide/contractkit/). Most commands require a node being available under `http://localhost:8545` to make view calls, and to modify metadata files, you'll need the relevant account to be unlocked to sign the files.

You can create an empty metadata file with:

```bash
celocli account:create-metadata ./metadata.json --from $ACCOUNT_ADDRESS
```

You can add claims with various commands:

```bash
celocli account:claim-attestation-service-url ./metadata.json --from $ACCOUNT_ADDRESS --url $ATTESTATION_SERVICE_URL
```

You can display the claims in your file and their status with:

```bash
celocli account:show-metadata ./metadata.json
```

Once you are satisfied with your claims, you can upload your file to your own web site or a site that will host the file \(for example, [https://gist.github.com](https://gist.github.com)\) and then register it with the `Accounts` smart contract by running:

```bash
celocli account:register-metadata --url $METADATA_URL --from $ACCOUNT_ADDRESS
```

Then, anyone can lookup your claims and verify them by running:

```bash
celocli account:get-metadata $ACCOUNT_ADDRESS
```

