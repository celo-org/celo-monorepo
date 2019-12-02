# Metadata

Oftentimes, it is necessary to connect on-chain with off-chain identities.

Use cases include:

- Tools want to present public metadata supplied by a validator or validator group as part of a list of candidate groups, or a list of current elected validators.
- Governance Explorer UIs may want to present public metadata about the creators of governance proposals
- The Celo Foundation receives notice of a security vulnerability and wants to contact elected validators to facilitate them to make a decision on applying a patch.
- A DApp makes a request to the Celo Wallet for account information or to sign a transaction. The Celo Wallet should provide information about the DApp to allow the user to make a decision whether to sign the transaction or not.

Furthermore, we want to include user chosen information such as names or profile pictures that would be expensive to store on-chain. For this purpose, we have a mechanism we call `Metadata` to allow accounts to make both verifiable as well as non-verifiable claims (highly inspired by [Keybase](https://keybase.io)). Check out the [CIP3](https://github.com/celo-org/CIPs/pull/4)

On the `Accounts` smart contract, any account can register a URL under which their metadata file is available under. In that metadata file is the list of claims, signed by the account. We currently support the following claims:

**Name Claim**
An account can claim a human-readable name. This claim is not verifiable.

**Attestation Service URL Claim**
For the [lightweight identity layer](../), validators can make a claim under which their attestation service is reachable to provide attestations. This claim is not verifiable.

**Keybase User Claim**
Accounts can make claims on Keybase usernames. This claim is verifiable by signing a message with the account and hosting it on the publicly accessible path of the Keybase file system.

Future Claims we hope to support soon:

**Twitter User Claim**
Accounts can make claims on Keybase usernames. This claim is verifiable by siging a message with the account and posting it as a tweet. Any client can verify the claim with a reference to the tweet in the claim.

**Domain Claim**
Accounts can make claims on domain names. This claim is verifiable by signing a message with the account and embedding it in a TXT record.

### Handling Metadata

You can interact with metadata files easily through the CLI. Most commands require a node being available under http://localhost:8545 to make view calls, and to modify metadata files, you'll need the relevant account to be unlocked to sign the files.

You can create an empty metadata file with:

`$celocli account:create-metadata ./metadata.json --from $ACCOUNT_ADDRESS`

You can add claims with various commands:

`$celocli account:claim-attestation-service-url ./metadata.json --from $ACCOUNT_ADDRESS --url $ATTESTATION_SERVICE_URL`

You can display the claims in your file and their status with:

`$celocli account:show-metadata ./metadata.json`

Once you are satisfied with your claims, you can upload your file to your trusted hoster (something like [https://gist.github.com](https://gist.github.com) works) and then register it with the `Accounts` smart contract by running:

`$celocli account:register-metadata --url $METADATA_URL --from $ACCOUNT_ADDRESS`

Then, anyone can lookup your claims and verify them by running:

`$celocli account:get-metadata $ACCOUNT_ADDRESS`
