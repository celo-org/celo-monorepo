# Key management

> Crypto is a tool for turning a whole swathe of problems into key management problems. Key management problems are way harder than (virtually all) cryptographers think.
>
> [@LeaKissner on Twitter](https://twitter.com/LeaKissner/status/1198595109756887040)

Celo has various mechanisms to reduce the impact of the loss or compromise of keys, mainly through the `Accounts` smart contract. On it, accounts can authorize other keys to perform certain actions on behalf of the account. Keys that need to be accessed frequently (e.g. for signing blocks) are at greater risk of being compromised, and thus have more limited permissions, while keys that need to be accessed infrequently (e.g. for locking Celo Gold) are less onerous to store securely, and thus have more expansive permissions. Below is a summary of the various keys that are used in the Celo network, and a description of their permissions.

| Name of the key        | Purpose                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account key            | This key has the highest level of permissions, and is thus the most sensitive. It can be used to lock and unlock Celo Gold, and authorize vote, validator, and attestation keys. |
| Validator signer key   | This key has permission to participate in BFT consensus, and register and manage a Validator or Validator Group.                                                                                                                                          |
| Vote signer key        | This key can be used to vote in Validator elections and for on-chain governance proposals.                                                                                                                                                                                          |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol.                                                                                                                                                                                        |

{% hint style="info" %}
Each signer key must be unique and may not be reused. Once a signer key is authorized, the only way to deauthorize that key is to authorize a new key that has never been used before.
{% endhint %}

# Key Rotation

Loss of an authorized key is not catastrophic, as the Account key can just authorize another key in its place. It is strongly recommended to regularly rotate keys to limit the impact of an undiscovered compromise.

### Key Rotation for Consensus

Key rotation for Consensus is a bit trickier. As a validator that is currently elected and actively signing consensus messages, you can rotate the Validator key as follows:

- Bring up a new validator node and create a new Validator signer key on it.
- Authorize the new Validator signer key with the Account key to overwrite the old Validator signer key.

```bash
celocli account:authorize --from <ACCOUNT_KEY_ADDRESS> --role validator --signer <NEW_VALIDATOR_ADDRESS> --signature <PROOF_OF_NEW_VALIDATOR_KEY_POSSESSION>
```

{% hint style="info" %}
Your ECDSA public key will be updated automatically from the proof-of-possession.
{% endhint %}

- Update your BLS key used for consensus. Rotating both the ECDSA and BLS keys is recommended.

```bash
celocli validator:update-bls-public-key --from <NEW_VALIDTOR_KEY_ADDRESS> --blsKey <NEW_BLS_KEY> --blsPop <PROOF_OF_NEW_BLS_KEY_POSSESSION>
```

- Your old node will continue to sign consensus messages for the current epoch, but upon the next epoch will find itself no longer authorized.
- Your new node will initially find itself unauthorized, but will be authorized to sign as the next epoch begins.

{% hint style="warning" %}
The newly authorized keys will only take effect in the next epoch, so the node operating with the old key must remain running until the end of the current epoch to avoid downtime.
{% endhint %}

Please see the [Running a Validator](https://docs.celo.org/getting-started/baklava-testnet/running-a-validator) section for details on ECDSA and BLS key generation, authorization, and proof of possession.

# Key Security

It is evident that the Account key is the most sensitive key. As it should be used quite infrequently, it is highly recommended for important Account keys (i.e. Validators or accounts with high balances) to remain as secure as possible. At the minimum, we recommend them to be offline, ideally in cold storage or on a hardware wallet.

<!-- NOTE: Unclear if this is the right place for the following table, or if it should exist based on how difficult it will be to accuratly maintain -->

# Key Usage in Protocol

### Celo Registry Contracts

`Accounts` Entrypoint for users to create an account and authorize _unique_ addresses which correspond to signing keys

- requires user is _not_ a validator if authorizing Validator key and _not_ updating ECDSA public key
- requires user is a validator if authorizing Validator key and updating ECDSA public key

`LockedGold` Expects user to be registered account signing with Account key

`Governance` Expects user to be registered account signing with Vote key (or account key)

`Election` Expects user to be registered account signing with Vote key (or account key)

`Validators` Expects user to be registered account signing with Validator key (or account key)

`Attestations` Expects issuers to be registered accounts; expects completers to be signing with Attestation key (or account key)

### Celo Blockchain Client

`Consensus` Expects participants to be registered accounts and signing with Validator key

`Precompiles` Keeps track of current validator set and proof of possession using authorized Validator key addresses
